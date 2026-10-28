import React, {useMemo} from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {C, SANS} from '../theme';
import {ease, prog, useT} from '../anim';
import {Caption, GridLines, Hud, Layer, Mark, Paper, Pinwheel, T, fade} from '../ui';

/* ================= 丙氨酸三维模型（球棍） ================= */
type El = 'C' | 'N' | 'O' | 'H';
type Atom = {el: El; p: THREE.Vector3};
type Bond = [number, number];

const RADIUS: Record<El, number> = {C: 0.3, N: 0.29, O: 0.28, H: 0.18};
const COLOR: Record<El, string> = {C: '#1A1A1A', N: C.yellow, O: '#8A8173', H: '#FBF7EF'};

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const tet = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return V(Math.cos(a) * 0.943, Math.sin(a) * 0.943, 1 / 3);
};
const basis = (u: THREE.Vector3) => {
  const a = Math.abs(u.z) < 0.9 ? V(0, 0, 1) : V(1, 0, 0);
  const e1 = a.clone().cross(u).normalize();
  const e2 = u.clone().cross(e1).normalize();
  return [e1, e2];
};
/** 在 u 方向的原子上再接 n 个原子：sp3 取 109.5°，sp2 取 120° */
const spread = (u: THREE.Vector3, n: number, sp2: boolean, phase = 0) => {
  const [e1, e2] = basis(u);
  const [ca, sa] = sp2 ? [0.5, 0.866] : [0.334, 0.943];
  return Array.from({length: n}, (_, k) => {
    const f = phase + (k * 2 * Math.PI) / n;
    return u.clone().multiplyScalar(ca).add(e1.clone().multiplyScalar(Math.cos(f) * sa)).add(e2.clone().multiplyScalar(Math.sin(f) * sa));
  });
};

/** L-丙氨酸（S 构型）：H 朝后时，NH2 → COOH → CH3 逆时针。 */
const buildAla = () => {
  const atoms: Atom[] = [{el: 'C', p: V(0, 0, 0)}];
  const bonds: Bond[] = [];
  const add = (el: El, p: THREE.Vector3, parent: number) => {
    atoms.push({el, p});
    bonds.push([parent, atoms.length - 1]);
    return atoms.length - 1;
  };
  const dH = V(0, 0, -1);
  const dN = tet(90);
  const dCOOH = tet(210);
  const dCH3 = tet(330);
  const iH = add('H', dH.clone().multiplyScalar(0.62), 0);
  const iN = add('N', dN.clone().multiplyScalar(0.85), 0);
  spread(dN, 2, false, 0.8).forEach((d) => add('H', atoms[iN].p.clone().add(d.multiplyScalar(0.5)), iN));
  const iC1 = add('C', dCOOH.clone().multiplyScalar(0.9), 0);
  const [o1, o2] = spread(dCOOH, 2, true, 0.3);
  add('O', atoms[iC1].p.clone().add(o1.multiplyScalar(0.62)), iC1);
  const iO2 = add('O', atoms[iC1].p.clone().add(o2.clone().multiplyScalar(0.64)), iC1);
  add('H', atoms[iO2].p.clone().add(spread(o2, 1, false, 1.2)[0].multiplyScalar(0.45)), iO2);
  const iC3 = add('C', dCH3.clone().multiplyScalar(0.9), 0);
  spread(dCH3, 3, false, 0.4).forEach((d) => add('H', atoms[iC3].p.clone().add(d.multiplyScalar(0.5)), iC3));
  return {atoms, bonds, groups: {H: iH, N: iN, COOH: iC1, CH3: iC3}};
};

/** 基团包含的全部原子：基团原子本身 + 它后面接的原子 */
const groupAtoms = (bonds: Bond[], root: number) => {
  const out = [root];
  for (let k = 0; k < out.length; k++) bonds.forEach(([a, b]) => a === out[k] && out.push(b));
  return out;
};

const ALA = buildAla();
const TILT = -0.95; // 让朝后的 H 翘到上方，四个基团都看得见
const SEP = 1.55;
const CAM = {pos: V(0, 0.75, 9.8), look: V(0, 0.08, 0), fov: 30};

/** 当前时刻两个分子的位姿 */
const poseAt = (t: number) => {
  // 标注基团时先停在四个基团都分得开的角度（0.56 rad），之后再转
  const theta = 0.56 + Math.max(0, t - 8.4) * 0.32;
  const freeze = 0.56 + (10.6 - 8.4) * 0.32;
  // 叠合尝试：右边的分子搬到左边，并独自旋转一圈
  const move = prog(t, 9.0, 1.4, ease.inOutQuad) * (1 - prog(t, 14.2, 1.2, ease.inOutQuad));
  const extra = prog(t, 10.6, 3.2, ease.inOutQuad) * Math.PI * 2;
  const overlapping = t > 10.6 && t < 14.2;
  const thL = overlapping ? freeze : t >= 14.2 ? theta - (theta - freeze) * (1 - prog(t, 14.2, 1.2)) : theta;
  return {
    L: {x: -SEP, th: thL},
    D: {x: SEP - 2 * SEP * move, th: -(overlapping ? freeze : thL) + (overlapping ? extra : 0)},
    move,
  };
};

const worldPos = (local: THREE.Vector3, x: number, th: number, mirror: boolean) => {
  const p = local.clone();
  if (mirror) p.x = -p.x;
  p.applyAxisAngle(V(0, 1, 0), th);
  p.applyAxisAngle(V(1, 0, 0), TILT);
  return p.add(V(x, 0.15, 0));
};

const Molecule: React.FC<{x: number; th: number; mirror: boolean; scale: number; opacity: number}> = ({x, th, mirror, scale, opacity}) => {
  const atoms = ALA.atoms.map((a) => (mirror ? V(-a.p.x, a.p.y, a.p.z) : a.p));
  const up = V(0, 1, 0);
  return (
    <group position={[x, 0.15, 0]} scale={scale}>
      <group rotation={[TILT, 0, 0]}>
        <group rotation={[0, th, 0]}>
          {ALA.atoms.map((a, i) => (
            <mesh key={i} position={atoms[i]}>
              <sphereGeometry args={[RADIUS[a.el], 40, 28]} />
              <meshStandardMaterial color={COLOR[a.el]} roughness={0.42} metalness={0.02} transparent={opacity < 1} opacity={opacity} />
            </mesh>
          ))}
          {ALA.bonds.map(([i, j], k) => {
            const a = atoms[i];
            const b = atoms[j];
            const mid = a.clone().add(b).multiplyScalar(0.5);
            const dir = b.clone().sub(a);
            const q = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
            return (
              <mesh key={`b${k}`} position={mid} quaternion={q}>
                <cylinderGeometry args={[0.055, 0.055, dir.length(), 16]} />
                <meshStandardMaterial color="#5A554D" roughness={0.6} transparent={opacity < 1} opacity={opacity} />
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
};

export const Stage: React.FC<{t: number}> = ({t}) => {
  const {camera} = useThree();
  camera.position.copy(CAM.pos);
  camera.lookAt(CAM.look);
  const pose = poseAt(t);
  const inL = prog(t, 2.2, 0.6, ease.inOutQuad);
  const inD = prog(t, 2.6, 0.6, ease.inOutQuad);
  const mirrorO = fade(t, 2.0, 9.0, 0.6, 0.4) + fade(t, 15.0, 23.6, 0.6, 0.4);
  const ghost = 1 - 0.45 * prog(t, 9.0, 0.6) * (1 - prog(t, 14.6, 0.6));
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 5, 6]} intensity={2.2} />
      <directionalLight position={[-4, 2, 3]} intensity={0.7} />
      <Molecule x={pose.L.x} th={pose.L.th} mirror={false} scale={inL} opacity={1} />
      <Molecule x={pose.D.x} th={pose.D.th} mirror scale={inD} opacity={ghost} />
      {/* 底座：红 = 左手型，蓝 = 右手型 */}
      <mesh position={[-SEP, -1.55, 0]} scale={[inL, 1, inL]}>
        <cylinderGeometry args={[1.0, 1.0, 0.08, 64]} />
        <meshStandardMaterial color={C.red} roughness={0.8} />
      </mesh>
      <mesh position={[SEP, -1.55, 0]} scale={[inD, 1, inD]}>
        <cylinderGeometry args={[1.0, 1.0, 0.08, 64]} />
        <meshStandardMaterial color={C.blue} roughness={0.8} />
      </mesh>
      {/* 镜面 */}
      {mirrorO > 0.001 ? (
        <group>
          <mesh position={[0, -0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[2.6, 2.8]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.28 * mirrorO} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <boxGeometry args={[0.025, 2.8, 0.025]} />
            <meshBasicMaterial color={C.ink} transparent opacity={mirrorO} />
          </mesh>
        </group>
      ) : null}
    </>
  );
};

/** 画面坐标投影，用来放 HTML 标签 */
const useProjector = (width: number, height: number) =>
  useMemo(() => {
    const cam = new THREE.PerspectiveCamera(CAM.fov, width / height, 0.1, 100);
    cam.position.copy(CAM.pos);
    cam.lookAt(CAM.look);
    cam.updateMatrixWorld();
    return (p: THREE.Vector3) => {
      const v = p.clone().project(cam);
      return [(v.x * 0.5 + 0.5) * width, (-v.y * 0.5 + 0.5) * height] as const;
    };
  }, [width, height]);

/** left / right / down：放在整个基团的外侧；lowRight：放在基团最低那个原子的右边（避开镜面和底座） */
type Side = 'left' | 'right' | 'down' | 'lowRight';
const ANCHOR: Record<Side, [string, 'left' | 'right' | 'center']> = {
  left: ['translate(-100%,-50%)', 'right'],
  right: ['translate(0,-50%)', 'left'],
  down: ['translate(-50%,0)', 'center'],
  lowRight: ['translate(0,-50%)', 'left'],
};

const GroupLabel: React.FC<{x: number; y: number; side: Side; o: number; main: string; sub: string}> = ({x, y, side, o, main, sub}) =>
  o <= 0 ? null : (
    <div style={{position: 'absolute', left: x, top: y, transform: ANCHOR[side][0], opacity: o, textAlign: ANCHOR[side][1], whiteSpace: 'nowrap'}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 34, color: C.ink}}>{main}</div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 24, color: C.ink2}}>{sub}</div>
    </div>
  );

/* ================= 二维：生命的同手性 ================= */
const AA = 'ARNDCQEGHILKMFPSTWYV'.split('');

const Homochiral: React.FC<{t: number}> = ({t}) => {
  const dim = 1 - 0.93 * prog(t, 31.0, 0.6);
  return (
    <>
      <Layer opacity={dim}>
        {AA.map((a, i) => {
          const at = 24.9 + i * 0.1;
          const s = prog(t, at, 0.3, ease.inOutQuad);
          const col = i % 10;
          const row = Math.floor(i / 10);
          const x = 360 + col * 120 + 60;
          const y = 300 + row * 120 + 60;
          const gly = a === 'G';
          return s > 0 ? (
            <g key={a}>
              <rect x={x - 54} y={y - 54} width={108} height={108} fill={gly ? C.paper2 : C.white} stroke={C.ink} strokeWidth={2} transform={`translate(${x},${y}) scale(${s}) translate(${-x},${-y})`} />
              {gly ? (
                <circle cx={x - 20} cy={y + 14} r={16 * s} fill={C.grey} />
              ) : (
                <Pinwheel x={x - 18} y={y + 14} r={26} hand={-1} scale={s} rot={-t * 25} />
              )}
              <text x={x + 34} y={y - 16} textAnchor="end" fontFamily={SANS} fontWeight={900} fontSize={34} fill={C.ink} opacity={s}>
                {a}
              </text>
            </g>
          ) : null;
        })}
        {Array.from({length: 10}, (_, i) => {
          const s = prog(t, 28.9 + i * 0.1, 0.3, ease.inOutQuad);
          const x = 360 + i * 120 + 60;
          const y = 780;
          return s > 0 ? (
            <g key={i}>
              <rect x={x - 54} y={y - 54} width={108} height={108} fill={C.white} stroke={C.ink} strokeWidth={2} transform={`translate(${x},${y}) scale(${s}) translate(${-x},${-y})`} />
              <Pinwheel x={x} y={y} r={34} hand={1} scale={s} rot={t * 25} />
            </g>
          ) : null;
        })}
      </Layer>
      <div style={{opacity: dim}}>
        <T x={360} y={170} at={24.5} out={35.6} size={48} weight={900}>
          蛋白质：只用<span style={{color: C.red}}>左手型</span>（L 型）氨基酸
        </T>
        <T x={360} y={548} at={27.2} out={35.6} size={28} weight={500} color={C.ink2}>
          20 种常见氨基酸里，只有甘氨酸 G 没有手性
        </T>
        <T x={360} y={634} at={28.5} out={35.6} size={48} weight={900}>
          DNA：只用<span style={{color: C.blue}}>右手型</span>（D 型）脱氧核糖
        </T>
      </div>
      <T x={960} y={372} at={31.6} out={35.6} size={128} weight={900} align="center" ls={6}>
        生命是<Mark p={prog(t, 32.2, 0.6, ease.inOutQuad)}>「同手性」</Mark>的
      </T>
      <T x={960} y={560} at={32.4} out={35.6} size={36} weight={500} align="center" color={C.ink2}>
        homochiral：同一种分子，只用同一只手
      </T>
    </>
  );
};

/* 01 分子的左右手 */
export const Chiral: React.FC = () => {
  const t = useT();
  const {width, height} = useVideoConfig();
  const project = useProjector(width, height);
  const pose = poseAt(t);
  const show3d = t < 24.6;
  const o3d = 1 - prog(t, 23.8, 0.7, ease.inOutQuad);
  const lab = fade(t, 3.4, 8.4);
  const g = ALA.groups;
  // 左边分子各原子在画面上的圆（圆心 + 半径），标签放到整个基团的外侧
  const disc = (i: number) => {
    const p = worldPos(ALA.atoms[i].p, pose.L.x, pose.L.th, false);
    const [x, y] = project(p);
    const [x2] = project(p.clone().add(V(RADIUS[ALA.atoms[i].el], 0, 0)));
    return {x, y, r: Math.abs(x2 - x)};
  };
  const labels: [number, Side, string, string][] = [
    [g.N, 'right', 'NH₂', '氨基'],
    [g.COOH, 'left', 'COOH', '羧基'],
    [g.CH3, 'lowRight', 'CH₃', '甲基'],
    [g.H, 'down', 'H', '氢'],
  ];
  const pedL = project(V(-SEP, -1.55, 1.0));
  const pedR = project(V(SEP, -1.55, 1.0));
  const pedO = fade(t, 3.0, 23.6) * (1 - prog(t, 8.8, 0.3) * (1 - prog(t, 15.0, 0.4)));
  return (
    <Paper>
      <GridLines p={1} opacity={0.6} />
      {show3d ? (
        <AbsoluteFill style={{opacity: o3d}}>
          <ThreeCanvas width={width} height={height} camera={{fov: CAM.fov, near: 0.1, far: 100}} gl={{antialias: true, alpha: true}}>
            <Stage t={t} />
          </ThreeCanvas>
          {labels.map(([i, side, m, s]) => {
            const ds = groupAtoms(ALA.bonds, i).map(disc);
            const cx = ds.reduce((a, d) => a + d.x, 0) / ds.length;
            const cy = ds.reduce((a, d) => a + d.y, 0) / ds.length;
            const low = ds.reduce((a, d) => (d.y > a.y ? d : a));
            const gap = 20;
            const x = {left: Math.min(...ds.map((d) => d.x - d.r)) - gap, right: Math.max(...ds.map((d) => d.x + d.r)) + gap, down: cx, lowRight: low.x + low.r + gap}[side];
            const y = {left: cy, right: cy, down: Math.max(...ds.map((d) => d.y + d.r)) + gap, lowRight: low.y}[side];
            return <GroupLabel key={m} x={x} y={y} side={side} o={lab} main={m} sub={s} />;
          })}
          {pedO > 0 ? (
            <>
              <div style={{position: 'absolute', left: pedL[0] - 200, top: pedL[1] + 4, width: 400, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 34, color: C.red, opacity: pedO}}>
                左手型 · L-丙氨酸
              </div>
              <div style={{position: 'absolute', left: pedR[0] - 200, top: pedR[1] + 4, width: 400, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 34, color: C.blue, opacity: pedO}}>
                右手型 · D-丙氨酸
              </div>
            </>
          ) : null}
          <T x={960} y={70} at={2.4} out={8.4} size={52} weight={900} align="center">
            丙氨酸：组成蛋白质的氨基酸之一
          </T>
          <Caption at={4.4} out={8.4} y={150}>
            中心的碳原子，连着四个各不相同的基团
          </Caption>
          <Caption at={8.6} out={11.4} y={150}>
            把右边这个搬过来，试着叠上去……
          </Caption>
          <Caption at={11.6} out={14.6} y={150}>
            怎么转，都无法完全重合
          </Caption>
          <T x={960} y={56} at={15.4} out={20.4} size={80} weight={900} align="center" ls={4}>
            这种性质叫<Mark p={prog(t, 15.9, 0.5, ease.inOutQuad)}>「手性」</Mark>
          </T>
          <T x={960} y={170} at={16.2} out={20.4} size={32} weight={500} align="center" color={C.ink2}>
            chirality，源自希腊语「手」；互为镜像的这一对分子，叫做「对映体」
          </T>
          <Caption at={20.6} out={23.6} size={38} y={150}>
            熔点、沸点都一样；只有遇到同样有手性的东西——偏振光、体内的蛋白质——才分出左右
          </Caption>
        </AbsoluteFill>
      ) : null}
      {t > 24 ? <Homochiral t={t} /> : null}
      <Hud chapter="01 分子的左右手" at={2.0} />
    </Paper>
  );
};

