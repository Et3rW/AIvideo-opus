import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, MONO, SANS, W, H} from './theme';
import {clamp, ease, keys, life, pop, prog, useT} from './anim';

/* ---------- 全局 SVG 滤镜：贴纸白描边 + 投影、辉光 ---------- */
export const FilterDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <filter id="sticker" x="-20%" y="-20%" width="140%" height="140%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="9" result="d" />
        <feFlood floodColor="#fff" />
        <feComposite in2="d" operator="in" result="outline" />
        <feGaussianBlur in="d" stdDeviation="10" result="b" />
        <feOffset in="b" dy="8" result="bo" />
        <feFlood floodColor="#2B3B4C" floodOpacity="0.22" />
        <feComposite in2="bo" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="outline" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="b1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="b2" />
        <feMerge>
          <feMergeNode in="b2" />
          <feMergeNode in="b1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="softglow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="b1" />
        <feMerge>
          <feMergeNode in="b1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

/* ---------- 大画布 + 摄像机 ---------- */
export type CamKey = [t: number, x: number, y: number, s: number];

export const camAt = (t: number, k: CamKey[]) => {
  const x = keys(t, k.map((q) => [q[0], q[1]] as [number, number]), ease.inOutQuint);
  const y = keys(t, k.map((q) => [q[0], q[2]] as [number, number]), ease.inOutQuint);
  // 缩放在对数空间插值，推拉更均匀
  const s = Math.exp(keys(t, k.map((q) => [q[0], Math.log(q[3])] as [number, number]), ease.inOutQuint));
  return {x, y, s};
};

export const Camera: React.FC<{k: CamKey[]; children: React.ReactNode; bg?: string}> = ({k, children, bg}) => {
  const t = useT();
  const {x, y, s} = camAt(t, k);
  return (
    <AbsoluteFill style={{background: bg ?? C.bg, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 20000,
          height: 20000,
          transformOrigin: '0 0',
          transform: `translate(${W / 2 - x * s}px, ${H / 2 - y * s}px) scale(${s})`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** 画布上的点阵底纹 */
export const DotGrid: React.FC<{x: number; y: number; w: number; h: number; gap?: number; color?: string}> = ({
  x,
  y,
  w,
  h,
  gap = 48,
  color = C.line,
}) => (
  <svg style={{position: 'absolute', left: x, top: y}} width={w} height={h}>
    <defs>
      <pattern id={`dg${gap}${color}`} width={gap} height={gap} patternUnits="userSpaceOnUse">
        <circle cx={gap / 2} cy={gap / 2} r={1.6} fill={color} />
      </pattern>
    </defs>
    <rect width={w} height={h} fill={`url(#dg${gap}${color})`} />
  </svg>
);

/* ---------- 文字 ---------- */
type TxtProps = {
  x: number;
  y: number;
  at: number;
  out?: number;
  size?: number;
  weight?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
  mono?: boolean;
  lh?: number;
  ls?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

/** 行遮罩上推入场，干净利落。 */
export const Txt: React.FC<TxtProps> = ({
  x,
  y,
  at,
  out = 1e9,
  size = 44,
  weight = 700,
  color = C.ink,
  align = 'left',
  width = 1400,
  mono,
  lh = 1.35,
  ls = 0,
  children,
  style,
}) => {
  const t = useT();
  const p = prog(t, at, 0.5, ease.outQuint);
  const o = 1 - prog(t, out - 0.3, 0.3, ease.inCubic);
  if (p <= 0 || o <= 0) return null;
  const left = align === 'left' ? x : align === 'center' ? x - width / 2 : x - width;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top: y,
        width,
        overflow: 'hidden',
        paddingBottom: size * 0.18,
        textAlign: align,
        opacity: o,
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - p) * 110}%)`,
          fontFamily: mono ? MONO : SANS,
          fontSize: size,
          fontWeight: weight,
          color,
          lineHeight: lh,
          letterSpacing: ls,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** 圆角标签 */
export const Chip: React.FC<{
  x: number;
  y: number;
  at: number;
  out?: number;
  color?: string;
  fg?: string;
  size?: number;
  children: React.ReactNode;
}> = ({x, y, at, out = 1e9, color = C.ink, fg = C.white, size = 30, children}) => {
  const t = useT();
  const s = pop(t, at);
  const o = 1 - prog(t, out - 0.3, 0.3, ease.inCubic);
  if (s <= 0 || o <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${s})`,
        transformOrigin: '0 50%',
        opacity: o,
        background: color,
        color: fg,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: size,
        padding: `${size * 0.32}px ${size * 0.62}px`,
        borderRadius: size * 0.3,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
};

/** 贴纸：任意 SVG 内容 + 白描边投影，弹性入场 */
export const Sticker: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  at: number;
  out?: number;
  rot?: number;
  vb?: string;
  children: React.ReactNode;
  plain?: boolean;
}> = ({x, y, w, h, at, out = 1e9, rot = 0, vb, children, plain}) => {
  const t = useT();
  const s = pop(t, at, 0.6);
  const o = 1 - prog(t, out - 0.3, 0.3, ease.inCubic);
  if (s <= 0 || o <= 0) return null;
  return (
    <svg
      width={w}
      height={h}
      viewBox={vb ?? `0 0 ${w} ${h}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        overflow: 'visible',
        transform: `scale(${s}) rotate(${rot * (2 - s)}deg)`,
        transformOrigin: '50% 50%',
        opacity: o,
      }}
    >
      <g filter={plain ? undefined : 'url(#sticker)'}>{children}</g>
    </svg>
  );
};

/** 路径描边生长 */
export const Draw: React.FC<{
  d: string;
  p: number;
  stroke?: string;
  width?: number;
  dash?: string;
  cap?: 'round' | 'butt';
  opacity?: number;
  filter?: string;
}> = ({d, p, stroke = C.ink, width = 4, dash, cap = 'round', opacity = 1, filter}) => {
  if (p <= 0) return null;
  if (dash) {
    // 虚线：用遮罩路径控制可见长度
    const id = `m${Math.abs(hash(d))}`;
    return (
      <g opacity={opacity} filter={filter}>
        <defs>
          <mask id={id} maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="20000" height="20000">
            <path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth={width + 6} strokeDasharray="1 1" strokeDashoffset={1 - p} />
          </mask>
        </defs>
        <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeDasharray={dash} strokeLinecap={cap} mask={`url(#${id})`} />
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
      filter={filter}
    />
  );
};

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
};

/** 全屏 SVG 图层（画布坐标） */
export const Layer: React.FC<{x?: number; y?: number; w: number; h: number; children: React.ReactNode; opacity?: number}> = ({
  x = 0,
  y = 0,
  w,
  h,
  children,
  opacity = 1,
}) => (
  <svg width={w} height={h} style={{position: 'absolute', left: x, top: y, overflow: 'visible', opacity}}>
    {children}
  </svg>
);

/* ---------- 章节卡：色块擦除 ---------- */
export const ChapterCard: React.FC<{num: string; title: string; dark?: boolean}> = ({num, title}) => {
  const t = useT();
  // 0 → 0.45 色块推入；0.45 → 1.35 停留；1.35 → 1.8 推出
  const inP = prog(t, 0, 0.45, ease.inOutQuint);
  const outP = prog(t, 1.35, 0.45, ease.inOutQuint);
  if (outP >= 1) return null;
  const x0 = (1 - inP) * W; // 左边缘
  const x1 = W - outP * W; // 右边缘向左收
  const left = Math.min(x0, W);
  const right = x1;
  const numP = prog(t, 0.25, 0.5, ease.outQuint);
  const titleP = prog(t, 0.35, 0.5, ease.outQuint);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: `inset(0 ${W - right}px 0 ${left}px)`}}>
        <div style={{position: 'absolute', inset: 0, background: C.ink}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: W * 0.012, height: H, background: C.red, transform: `translateX(${left}px)`}} />
        <div
          style={{
            position: 'absolute',
            left: 230,
            top: 330,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 260,
            color: C.red,
            lineHeight: 1,
            opacity: numP,
            transform: `translateX(${(1 - numP) * 120}px)`,
          }}
        >
          {num}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 640,
            top: 400,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 120,
            color: C.white,
            lineHeight: 1,
            letterSpacing: 4,
            opacity: titleP,
            transform: `translateX(${(1 - titleP) * 160}px)`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 646,
            top: 560,
            width: 900 * titleP,
            height: 6,
            background: C.white,
            opacity: 0.25,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 常驻角标 ---------- */
export const Hud: React.FC<{chapter: string; dark?: boolean; at?: number}> = ({chapter, dark, at = 0}) => {
  const t = useT();
  const o = prog(t, at, 0.6);
  const fg = dark ? 'rgba(220,235,255,0.75)' : C.slate;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: o}}>
      <div style={{position: 'absolute', left: 64, top: 48, display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{width: 14, height: 14, borderRadius: 7, background: C.blue}} />
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 24, color: fg, letterSpacing: 2}}>
          2026 诺贝尔物理学奖 · 冰立方
        </div>
      </div>
      {chapter ? (
        <div style={{position: 'absolute', right: 64, top: 48, fontFamily: SANS, fontWeight: 500, fontSize: 24, color: fg, letterSpacing: 2}}>
          {chapter}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** 底部说明条（无旁白时的“解说词”） */
export const Caption: React.FC<{at: number; out: number; children: React.ReactNode; dark?: boolean}> = ({
  at,
  out,
  children,
  dark,
}) => {
  const t = useT();
  const o = life(t, at, out, 0.3, 0.3);
  if (o <= 0) return null;
  const y = (1 - prog(t, at, 0.4, ease.outQuint)) * 24;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: W,
        top: 930 + y,
        textAlign: 'center',
        opacity: o,
      }}
    >
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 40,
          color: dark ? C.white : C.ink,
          background: dark ? 'rgba(5,14,28,0.55)' : 'rgba(255,255,255,0.88)',
          padding: '10px 26px',
          borderRadius: 10,
          letterSpacing: 1,
        }}
      >
        {children}
      </span>
    </div>
  );
};

/** 中微子符号 */
export const Nu: React.FC<{size?: number; color?: string}> = ({size = 1, color = C.blue}) => (
  <span style={{fontFamily: '"Times New Roman", serif', fontStyle: 'italic', fontWeight: 700, color, fontSize: `${size}em`}}>ν</span>
);

export const fade = (t: number, a: number, b: number) => clamp(life(t, a, b));
