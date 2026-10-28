import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {C, MONO, SANS} from '../theme';
import {clamp, ease, fmtInt, life, prog, rand, typed, useT} from '../anim';
import {Hud, Txt} from '../ui';
import {STRINGS} from './IceCube';

/* ================= 三维事件显示：5160 个光学模块 ================= */
const SPACING = 0.125; // km
const TAN_C = Math.tan((41 * Math.PI) / 180);
const EVENT_T0 = 2.6;
const EVENT_DUR = 6.4;

const ENTRY = new THREE.Vector3(-0.72, -0.64, 0.3);
const EXIT = new THREE.Vector3(0.68, 0.62, -0.28);
const DIR = EXIT.clone().sub(ENTRY);
const LEN = DIR.length();
DIR.normalize();

type Dom = {p: THREE.Vector3; s: number; d: number; sHit: number; q: number};

const DOMS: Dom[] = (() => {
  const out: Dom[] = [];
  STRINGS.forEach((st, i) => {
    const x = st.x * SPACING;
    const z = st.y * SPACING;
    for (let j = 0; j < 60; j++) {
      // DeepCore 的模块集中在下部；这里统一按 1450–2450 m 等距排布（示意）
      const y = 0.5 - j / 59;
      const p = new THREE.Vector3(x, y, z);
      const rel = p.clone().sub(ENTRY);
      const s = rel.dot(DIR);
      const d = rel.clone().sub(DIR.clone().multiplyScalar(s)).length();
      const q = Math.exp(-d / 0.045) * (0.55 + 0.45 * rand(i * 60 + j, 3));
      out.push({p, s, d, sHit: s + d * TAN_C, q});
    }
  });
  return out;
})();

const hueColor = (u: number) => new THREE.Color().setHSL((clamp(u) * 230) / 360, 0.95, 0.58);

const vert = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  attribute float alpha;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = color;
    vAlpha = alpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (1500.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const frag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c) * 2.0;
    if (r > 1.0) discard;
    float core = smoothstep(0.42, 0.30, r);
    float halo = pow(1.0 - r, 2.2) * 0.55;
    float a = (core + halo) * vAlpha;
    gl_FragColor = vec4(vColor * (0.6 + core), a);
  }
`;

const Detector: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const {camera} = useThree();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(DOMS.length * 3);
    DOMS.forEach((d, i) => d.p.toArray(pos, i * 3));
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(DOMS.length * 3), 3));
    g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(DOMS.length), 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(DOMS.length), 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const strings = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos: number[] = [];
    STRINGS.forEach((st) => {
      const x = st.x * SPACING;
      const z = st.y * SPACING;
      pos.push(x, 0.62, z, x, -0.52, z);
    });
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);
  const box = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.25, 1.1, 1.25)), []);
  const trackRef = useRef<THREE.Mesh>(null);
  const backRef = useRef<THREE.Mesh>(null);

  // 镜头：缓慢环绕
  const az = 0.35 + t * 0.075;
  const el = 0.32 - prog(t, 0, 16, ease.inOutCubic) * 0.12;
  const rad = 2.75 - prog(t, 0, 9, ease.inOutCubic) * 0.45 + prog(t, 10, 6, ease.inOutCubic) * 0.35;
  camera.position.set(Math.cos(az) * Math.cos(el) * rad, Math.sin(el) * rad, Math.sin(az) * Math.cos(el) * rad);
  camera.lookAt(0, -0.02, 0);

  const sTip = prog(t, EVENT_T0, EVENT_DUR, ease.linear) * (LEN + 0.6) - 0.1;
  const appear = prog(t, 0.0, 1.6, ease.outCubic);

  useLayoutEffect(() => {
    const col = geo.getAttribute('color') as THREE.BufferAttribute;
    const size = geo.getAttribute('size') as THREE.BufferAttribute;
    const alpha = geo.getAttribute('alpha') as THREE.BufferAttribute;
    const dim = new THREE.Color('#7FA6D6');
    DOMS.forEach((d, i) => {
      const lit = d.q > 0.035 && sTip >= d.sHit && d.s > -0.05 && d.s < LEN + 0.05;
      // 自上而下逐层出现
      const a = clamp(appear * 1.6 - (0.5 - d.p.y) * 0.5);
      if (lit) {
        const since = clamp((sTip - d.sHit) / 0.25);
        const c = hueColor(d.s / LEN);
        col.setXYZ(i, c.r, c.g, c.b);
        size.setX(i, 0.01 + Math.pow(d.q, 0.6) * 0.09 * (0.5 + 0.5 * since));
        alpha.setX(i, 0.9);
      } else {
        col.setXYZ(i, dim.r, dim.g, dim.b);
        size.setX(i, 0.0075);
        alpha.setX(i, 0.75 * a);
      }
    });
    col.needsUpdate = true;
    size.needsUpdate = true;
    alpha.needsUpdate = true;
    // 径迹
    const m = trackRef.current;
    if (m) {
      const L = clamp(sTip, 0, LEN);
      m.visible = sTip > 0;
      m.scale.set(1, Math.max(L, 1e-4), 1);
      m.position.copy(ENTRY.clone().add(DIR.clone().multiplyScalar(L / 2)));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), DIR);
    }
    // 重建方向：沿来向反推
    const b = backRef.current;
    if (b) {
      const k = prog(t, 10.2, 2.0, ease.inOutCubic) * 1.6;
      b.visible = k > 0.001;
      b.scale.set(1, Math.max(k, 1e-4), 1);
      b.position.copy(ENTRY.clone().sub(DIR.clone().multiplyScalar(k / 2)));
      b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), DIR);
    }
  });

  return (
    <>
      <color attach="background" args={['#040B17']} />
      <fog attach="fog" args={['#040B17', 2.2, 4.6]} />
      <lineSegments geometry={strings}>
        <lineBasicMaterial color="#2B5788" transparent opacity={0.8 * appear} />
      </lineSegments>
      <lineSegments geometry={box}>
        <lineBasicMaterial color="#2E5C8F" transparent opacity={0.35 * appear} />
      </lineSegments>
      <points geometry={geo} material={mat} />
      <mesh ref={trackRef}>
        <cylinderGeometry args={[0.007, 0.007, 1, 8]} />
        <meshBasicMaterial color="#ffffff" fog={false} />
      </mesh>
      <mesh ref={backRef}>
        <cylinderGeometry args={[0.006, 0.006, 1, 8]} />
        <meshBasicMaterial color={C.red} fog={false} />
      </mesh>
      {/* 冰面 */}
      <mesh position={[0, 0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial color="#9CC8EE" transparent opacity={0.07 * appear} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
};

export const Event3D: React.FC = () => {
  const t = useT();
  const {width, height} = useVideoConfig();
  const sTip = prog(t, EVENT_T0, EVENT_DUR, ease.linear) * (LEN + 0.6) - 0.1;
  const hits = DOMS.filter((d) => d.q > 0.035 && sTip >= d.sHit && d.s > -0.05 && d.s < LEN + 0.05).length;
  const head = typed('EVENT DISPLAY  ·  UP-GOING TRACK', t, 0.6, 30);
  return (
    <AbsoluteFill style={{background: '#040B17'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 34, near: 0.01, far: 50}} gl={{antialias: true}}>
        <Detector />
      </ThreeCanvas>
      {/* HUD 叠加 */}
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div style={{position: 'absolute', left: 64, top: 110, fontFamily: MONO, fontSize: 24, color: C.cyan, letterSpacing: 2}}>
          {head}
          <span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0}}>▌</span>
        </div>
        <div style={{position: 'absolute', left: 64, top: 150, fontFamily: MONO, fontSize: 22, color: 'rgba(191,230,255,0.75)', lineHeight: 1.7, opacity: prog(t, 1.4, 0.5)}}>
          STRINGS 86 · DOMS 5,160
          <br />
          HIT DOMS <span style={{color: '#fff', fontWeight: 700}}>{fmtInt(hits)}</span>
        </div>
        {/* 时间色标 */}
        <div style={{position: 'absolute', right: 64, top: 118, width: 300, opacity: prog(t, EVENT_T0, 0.6)}}>
          <div style={{height: 10, borderRadius: 5, background: 'linear-gradient(90deg, hsl(0,95%,58%), hsl(60,95%,58%), hsl(130,95%,58%), hsl(230,95%,58%))'}} />
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontSize: 22, color: C.ice, marginTop: 8}}>
            <span>早</span>
            <span>命中时间</span>
            <span>晚</span>
          </div>
        </div>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(4,11,23,0.9) 0%, rgba(4,11,23,0) 30%)'}} />
        <Txt x={960} y={850} at={3.4} out={9.8} size={42} weight={900} color="#fff" align="center" width={1700}>
          5160 只“眼睛”，记下每一束光到达的时间和亮度
        </Txt>
        <Txt x={960} y={850} at={10.2} out={16.5} size={42} weight={900} color="#fff" align="center" width={1700}>
          由此反推出中微子的<span style={{color: '#FF7A5C'}}>来向</span>——顺着它，就能找到天上的源头
        </Txt>
        <Txt x={960} y={930} at={11.2} out={16.5} size={26} weight={500} color={C.ice} align="center" width={1700}>
          （示意：根据冰立方的真实布局与切伦科夫几何绘制，并非某一次真实事件）
        </Txt>
      </AbsoluteFill>
      <div style={{opacity: life(t, 0, 16, 0.4, 0.01)}}>
        <Hud chapter="03 南极冰下的望远镜" dark />
      </div>
    </AbsoluteFill>
  );
};
