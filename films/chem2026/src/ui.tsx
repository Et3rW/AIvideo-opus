import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, G, H, SANS, W} from './theme';
import {clamp, ease, keys, life, prog, useT} from './anim';

/** 包豪斯式关键帧：段内 inOutQuad，不过冲 */
export const mv = (t: number, k: [number, number][]) => keys(t, k, ease.inOutQuad);

/* ---------- 纸张：底色 + 静态纸纹 ---------- */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none', opacity}}>
    <filter id="paperGrain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} />
      {/* 只用噪声的 R 通道做透明度，颜色为墨色：纸面细小斑点 */}
      <feColorMatrix type="matrix" values="0 0 0 0 0.24  0 0 0 0 0.2  0 0 0 0 0.14  0.16 0 0 0 0" />
    </filter>
    <rect width={W} height={H} filter="url(#paperGrain)" />
    {/* 四角略压暗，像印刷品 */}
    <radialGradient id="vign" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor="#7A6A50" stopOpacity={0} />
      <stop offset="100%" stopColor="#7A6A50" stopOpacity={0.16} />
    </radialGradient>
    <rect width={W} height={H} fill="url(#vign)" />
  </svg>
);

export const Paper: React.FC<{children?: React.ReactNode; bg?: string}> = ({children, bg = C.paper}) => (
  <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
    {children}
    <Grain />
  </AbsoluteFill>
);

/** 网格线：从中心向外描出 */
export const GridLines: React.FC<{p: number; opacity?: number; color?: string; x0?: number; w?: number}> = ({
  p,
  opacity = 1,
  color = C.line,
  x0 = 0,
  w = W,
}) => {
  if (p <= 0) return null;
  const cols = Math.round(w / G);
  const rows = Math.round(H / G);
  const lines: React.ReactNode[] = [];
  for (let i = 1; i < cols; i++) {
    const x = x0 + i * G;
    const d = Math.abs(i - cols / 2) / (cols / 2);
    const q = clamp(p * 1.6 - d * 0.6);
    const len = H * ease.inOutQuad(q);
    lines.push(<line key={`v${i}`} x1={x} x2={x} y1={H / 2 - len / 2} y2={H / 2 + len / 2} stroke={color} strokeWidth={1.5} />);
  }
  for (let j = 1; j < rows; j++) {
    const y = j * G;
    const d = Math.abs(j - rows / 2) / (rows / 2);
    const q = clamp(p * 1.6 - d * 0.6);
    const len = w * ease.inOutQuad(q);
    lines.push(<line key={`h${j}`} y1={y} y2={y} x1={x0 + w / 2 - len / 2} x2={x0 + w / 2 + len / 2} stroke={color} strokeWidth={1.5} />);
  }
  return (
    <svg width={x0 + w} height={H} style={{position: 'absolute', left: 0, top: 0, opacity, overflow: 'visible'}}>
      {lines}
    </svg>
  );
};

/* ---------- 文字：遮罩内推入，机械匀速收尾 ---------- */
type TProps = {
  x: number;
  y: number;
  at: number;
  out?: number;
  size?: number;
  weight?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
  lh?: number;
  ls?: number;
  from?: 'up' | 'left';
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export const T: React.FC<TProps> = ({
  x,
  y,
  at,
  out = 1e9,
  size = 44,
  weight = 700,
  color = C.ink,
  align = 'left',
  width = 1600,
  lh = 1.35,
  ls = 0,
  from = 'up',
  children,
  style,
}) => {
  const t = useT();
  const p = prog(t, at, 0.45, ease.inOutQuart);
  const o = prog(t, out, 0.4, ease.inOutQuart);
  if (p <= 0 || o >= 1) return null;
  const left = align === 'left' ? x : align === 'center' ? x - width / 2 : x - width;
  const tr = from === 'up' ? `translateY(${(1 - p) * 105 - o * 105}%)` : `translateX(${(p - 1) * 100 + o * 100}%)`;
  return (
    <div style={{position: 'absolute', left, top: y, width, overflow: 'hidden', paddingBottom: size * 0.2, textAlign: align}}>
      <div style={{transform: tr, fontFamily: SANS, fontSize: size, fontWeight: weight, color, lineHeight: lh, letterSpacing: ls, ...style}}>
        {children}
      </div>
    </div>
  );
};

/** 强调色块：文字后面的色条从左扫出 */
export const Mark: React.FC<{p: number; color?: string; children: React.ReactNode; fg?: string}> = ({p, color = C.yellow, children, fg}) => (
  <span style={{position: 'relative', display: 'inline-block', color: fg}}>
    <span
      style={{
        position: 'absolute',
        left: -6,
        right: -6,
        bottom: '0.08em',
        height: '0.42em',
        background: color,
        transformOrigin: '0 50%',
        transform: `scaleX(${clamp(p)})`,
        zIndex: 0,
      }}
    />
    <span style={{position: 'relative'}}>{children}</span>
  </span>
);

/* ---------- 手性符号：三叶风车（二维里也有手性） ---------- */
export const bladePath = (r: number, hand: 1 | -1) => {
  const pts: string[] = [];
  for (let k = 0; k < 3; k++) {
    const a = (k * 120 - 90) * (Math.PI / 180);
    const b = a + hand * (100 * Math.PI) / 180;
    const p0 = [Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16];
    const p1 = [Math.cos(a) * r, Math.sin(a) * r];
    const p2 = [Math.cos(b) * r * 0.3, Math.sin(b) * r * 0.3];
    const sweep = hand === 1 ? 1 : 0;
    pts.push(`M${p0[0]},${p0[1]} L${p1[0]},${p1[1]} A${r * 0.62},${r * 0.62} 0 0 ${sweep} ${p2[0]},${p2[1]} Z`);
  }
  return pts.join(' ');
};

/** hand = -1 左手型（红），1 右手型（蓝） */
export const Pinwheel: React.FC<{
  x: number;
  y: number;
  r: number;
  hand: 1 | -1;
  color?: string;
  rot?: number;
  scale?: number;
  opacity?: number;
  hub?: string;
}> = ({x, y, r, hand, color, rot = 0, scale = 1, opacity = 1, hub = C.ink}) => {
  if (scale <= 0 || opacity <= 0) return null;
  const col = color ?? (hand === -1 ? C.red : C.blue);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
      <path d={bladePath(r, hand)} fill={col} />
      <circle r={r * 0.2} fill={hub} />
    </g>
  );
};

/* ---------- 几何化的手（手掌朝向观众）：flip=false 为左手，拇指在左 ---------- */
export const Hand: React.FC<{x: number; y: number; s?: number; flip?: boolean; color: string; opacity?: number; blend?: boolean}> = ({
  x,
  y,
  s = 1,
  flip,
  color,
  opacity = 1,
  blend,
}) => {
  const fingers: [number, number][] = [
    [-72, 170],
    [-24, 196],
    [24, 180],
    [72, 140],
  ];
  return (
    <g
      transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}
      opacity={opacity}
      style={blend ? {mixBlendMode: 'multiply'} : undefined}
    >
      {fingers.map(([fx, h], i) => (
        <rect key={i} x={fx - 22} y={-40 - h + 40} width={44} height={h + 30} rx={22} fill={color} />
      ))}
      <rect x={-100} y={-40} width={200} height={210} rx={46} fill={color} />
      <rect x={-22} y={-150} width={48} height={170} rx={24} fill={color} transform="translate(-96,96) rotate(-42)" />
    </g>
  );
};

/** 路径描边生长（线描风格的分子式、曲线） */
export const Draw: React.FC<{
  d: string;
  p: number;
  stroke?: string;
  width?: number;
  cap?: 'round' | 'butt';
  opacity?: number;
  dash?: string;
}> = ({d, p, stroke = C.ink, width = 4, cap = 'round', opacity = 1, dash}) => {
  if (p <= 0) return null;
  if (dash) {
    // 虚线：用遮罩控制可见长度
    const id = `m${Math.abs(hash(d))}`;
    return (
      <g opacity={opacity}>
        <defs>
          <mask id={id} maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="20000" height="20000">
            <path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth={width + 6} strokeDasharray="1 1" strokeDashoffset={1 - p} />
          </mask>
        </defs>
        <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeDasharray={dash} strokeLinecap="butt" mask={`url(#${id})`} />
      </g>
    );
  }
  return (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap={cap}
      strokeLinejoin="round"
      strokeDasharray="1 1"
      strokeDashoffset={1 - p}
      opacity={opacity}
    />
  );
};

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
};

/** 全屏 SVG 图层 */
export const Layer: React.FC<{children: React.ReactNode; opacity?: number; style?: React.CSSProperties}> = ({children, opacity = 1, style}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity, ...style}}>
    {children}
  </svg>
);

/* ---------- 章节卡：16 列黑块逐列落下，红圆滚入，再逐列升起 ---------- */
export const ChapterCard: React.FC<{num: string; title: string}> = ({num, title}) => {
  const t = useT();
  if (t > 2.05) return null;
  const cols = W / G;
  const roll = prog(t, 0.3, 0.55, ease.inOutQuad);
  const cx = 240 + G * 2 * roll; // 两个模数
  const tp = prog(t, 0.55, 0.45, ease.inOutQuart);
  const outA = prog(t, 1.45, 0.3, ease.inOutQuart);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {Array.from({length: cols}, (_, i) => {
          const a = prog(t, i * 0.018, 0.32, ease.inOutQuad);
          const b = prog(t, 1.5 + i * 0.018, 0.32, ease.inOutQuad);
          const top = -H + H * a - H * b;
          return <rect key={i} x={i * G} y={top} width={G + 1} height={H} fill={C.ink} />;
        })}
        <g opacity={1 - outA}>
          <g transform={`translate(${cx},${540}) rotate(${roll * 180})`}>
            <circle r={180} fill={C.red} />
            <rect x={-180} y={-3} width={360} height={6} fill={C.ink} opacity={0.0} />
          </g>
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: cx - 180,
          top: 540 - 110,
          width: 360,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: 190,
          lineHeight: 1,
          color: C.paper,
          opacity: roll * (1 - outA),
        }}
      >
        {num}
      </div>
      <div style={{position: 'absolute', left: 840, top: 540 - 80, height: 160, overflow: 'hidden', opacity: 1 - outA}}>
        <div
          style={{
            transform: `translateY(${(1 - tp) * 105}%)`,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 112,
            lineHeight: 1.3,
            color: C.paper,
            letterSpacing: 6,
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
      </div>
      <div style={{position: 'absolute', left: 846, top: 540 + 96, width: 720 * tp, height: 10, background: C.yellow, opacity: 1 - outA}} />
    </AbsoluteFill>
  );
};

/* ---------- 常驻角标 ---------- */
export const Hud: React.FC<{chapter?: string; at?: number; out?: number}> = ({chapter, at = 0, out = 1e9}) => {
  const t = useT();
  const o = life(t, at, out, 0.5, 0.4);
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: o}}>
      <div style={{position: 'absolute', left: 60, top: 44, display: 'flex', alignItems: 'center', gap: 12}}>
        <svg width={44} height={22}>
          <circle cx={11} cy={11} r={10} fill={C.red} />
          <circle cx={33} cy={11} r={10} fill={C.blue} />
        </svg>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 24, color: C.ink2, letterSpacing: 3}}>2026 诺贝尔化学奖</div>
      </div>
      {chapter ? (
        <div style={{position: 'absolute', right: 60, top: 44, fontFamily: SANS, fontWeight: 500, fontSize: 24, color: C.ink2, letterSpacing: 3}}>
          {chapter}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** 底部说明（无旁白的“解说词”），米色底条保证可读 */
export const Caption: React.FC<{at: number; out: number; children: React.ReactNode; y?: number; size?: number}> = ({
  at,
  out,
  children,
  y = 912,
  size = 42,
}) => {
  const t = useT();
  const o = life(t, at, out, 0.3, 0.3);
  if (o <= 0) return null;
  const dy = (1 - prog(t, at, 0.4, ease.inOutQuart)) * 20;
  return (
    <div style={{position: 'absolute', left: 0, width: W, top: y + dy, textAlign: 'center', opacity: o}}>
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: size,
          color: C.ink,
          background: 'rgba(241,233,218,0.92)',
          padding: '8px 24px',
          letterSpacing: 1,
          boxDecorationBreak: 'clone',
        }}
      >
        {children}
      </span>
    </div>
  );
};

/** “示意”角注 */
export const Note: React.FC<{x: number; y: number; at: number; out?: number; children?: React.ReactNode; align?: 'left' | 'right'}> = ({
  x,
  y,
  at,
  out = 1e9,
  children = '示意',
  align = 'left',
}) => {
  const t = useT();
  const o = life(t, at, out, 0.3, 0.3);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        ...(align === 'left' ? {left: x} : {right: W - x}),
        opacity: o,
        fontFamily: SANS,
        fontSize: 22,
        fontWeight: 500,
        color: C.ink2,
        border: `2px solid ${C.ink2}`,
        padding: '2px 10px',
        letterSpacing: 2,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
};

/** 勾选印章：方框里画勾 */
export const Check: React.FC<{x: number; y: number; p: number; size?: number; color?: string}> = ({x, y, p, size = 64, color = C.ink}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-size / 2} y={-size / 2} width={size} height={size} fill="none" stroke={C.ink} strokeWidth={5} />
    <Draw d={`M${-size * 0.28},${0} L${-size * 0.06},${size * 0.24} L${size * 0.32},${-size * 0.26}`} p={p} stroke={color} width={size * 0.13} cap="butt" />
  </g>
);

export const fade = (t: number, a: number, b: number, fin = 0.4, fout = 0.4) => clamp(life(t, a, b, fin, fout));
