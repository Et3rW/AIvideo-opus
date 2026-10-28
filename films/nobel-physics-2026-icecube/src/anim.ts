import {useCurrentFrame, useVideoConfig} from 'remotion';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const ease = {
  linear: (t: number) => t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inCubic: (t: number) => t * t * t,
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t: number) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  // 预备-冲出-回弹：cubic-bezier(0.34,1.56,0.64,1) 的近似
  outBack: (t: number) => {
    const c1 = 1.70158 * 1.15;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/** 场景内时间（秒），Sequence 会把 frame 归零。 */
export const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};

/** t 在 [a, a+d] 内的缓动进度。 */
export const prog = (t: number, a: number, d: number, fn: (x: number) => number = ease.outCubic) =>
  fn(clamp((t - a) / d));

/** 阻尼弹簧入场：0 → 1，带一次过冲。 */
export const pop = (t: number, at: number, dur = 0.55) => {
  const x = clamp((t - at) / dur);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - Math.exp(-6.5 * x) * Math.cos(9.5 * x) * (1 - x * 0.15);
};

/** 入场 + 退场的透明度。 */
export const life = (t: number, a: number, b: number, fin = 0.35, fout = 0.35) =>
  Math.min(prog(t, a, fin), 1 - prog(t, b - fout, fout, ease.inCubic));

/** 关键帧插值：[[t, value], ...]，段内 inOutCubic。 */
export const keys = (t: number, k: [number, number][], fn = ease.inOutCubic) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [t0, v0] = k[i];
    const [t1, v1] = k[i + 1];
    if (t <= t1) return lerp(v0, v1, fn(clamp((t - t0) / (t1 - t0))));
  }
  return k[k.length - 1][1];
};

/** 确定性伪随机。 */
export const rand = (i: number, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 数字滚动：先快速跳变，再落定。 */
export const countUp = (t: number, at: number, dur: number, target: number) =>
  target * ease.outExpo(clamp((t - at) / dur));

export const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');

/** 打字机：按字符逐个出现。 */
export const typed = (s: string, t: number, at: number, cps = 28) => {
  const n = Math.floor(clamp((t - at) * cps, 0, s.length));
  return Array.from(s).slice(0, n).join('');
};
