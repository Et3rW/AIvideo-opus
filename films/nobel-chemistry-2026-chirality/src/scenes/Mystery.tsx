import React from 'react';
import {C, H, SANS, W} from '../theme';
import {ease, keys, prog, rand, useT} from '../anim';
import {Caption, Check, Draw, GridLines, Hud, Note, Paper, Pinwheel, T} from '../ui';

/* 02 百年谜题：一条横向时间轴，镜头逐页平移（每页 = 一屏 = 16 个模数） */
const PAGES = [0, 11, 17, 24, 31];

/** 酒石酸盐晶体（示意）：六边柱，单侧多一个小晶面；hand=-1 为镜像 */
const Crystal: React.FC<{x: number; y: number; hand: 1 | -1; p: number; color: string}> = ({x, y, hand, p, color}) => {
  const pts = [
    [-90, -150],
    [90, -150],
    [130, -60],
    [130, 120],
    [70, 180],
    [-70, 180],
    [-130, 120],
    [-130, -60],
  ];
  const d = 'M' + pts.map(([a, b]) => `${a * hand},${b}`).join(' L') + ' Z';
  // 只在一侧的小斜面：晶体“左右手”的标志
  const facet = `M${90 * hand},-150 L${130 * hand},-60 L${60 * hand},-70 Z`;
  return (
    <g transform={`translate(${x},${y})`}>
      <path d={d} fill={color} opacity={prog(p, 0.6, 0.4)} />
      <path d={facet} fill={C.ink} opacity={prog(p, 0.7, 0.3) * 0.85} />
      <Draw d={d} p={Math.min(1, p * 1.4)} width={5} />
      <line x1={-130 * hand} y1={-60} x2={130 * hand} y2={-60} stroke={C.ink} strokeWidth={3} opacity={prog(p, 0.7, 0.3) * 0.6} />
    </g>
  );
};

/** 偏振光：圆框里的偏振方向从竖直转过一个角度 */
const Polar: React.FC<{x: number; y: number; ang: number; o: number; label: string; color: string}> = ({x, y, ang, o, label, color}) =>
  o <= 0 ? null : (
    <g transform={`translate(${x},${y})`} opacity={o}>
      <circle r={70} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <line x1={0} y1={-56} x2={0} y2={56} stroke={C.grey} strokeWidth={4} strokeDasharray="8 8" />
      <g transform={`rotate(${ang})`}>
        <line x1={0} y1={-56} x2={0} y2={56} stroke={color} strokeWidth={10} />
      </g>
      <text x={0} y={120} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={34} fill={color}>
        {label}
      </text>
    </g>
  );

const flaskD = 'M-60,-200 L-60,-90 L-200,170 Q-210,200 -175,200 L175,200 Q210,200 200,170 L60,-90 L60,-200';

/** 烧瓶里逐个冒出的分子（确定性伪随机位置） */
const Brew: React.FC<{cx: number; cy: number; t: number; at: number; nL: number; nR: number; dur: number}> = ({cx, cy, t, at, nL, nR, dur}) => {
  const n = nL + nR;
  const out: React.ReactNode[] = [];
  // 交错排列左右手，保证任意时刻数量接近给定比例
  const order: (1 | -1)[] = [];
  let l = 0;
  let r = 0;
  for (let i = 0; i < n; i++) {
    if (l / nL <= r / nR) {
      order.push(-1);
      l++;
    } else {
      order.push(1);
      r++;
    }
  }
  let shownL = 0;
  let shownR = 0;
  // 从瓶底往上逐行排：每行的宽度跟着瓶身收窄
  const slots: [number, number][] = [];
  for (let row = 0; slots.length < n; row++) {
    const y = 160 - row * 52;
    const half = 60 + ((y + 90) / 260) * 140 - 34;
    const k = Math.max(1, Math.floor((2 * half) / 54) + 1);
    for (let j = 0; j < k; j++) slots.push([k === 1 ? 0 : -half + (2 * half * j) / (k - 1), y]);
  }
  for (let i = 0; i < n; i++) {
    const s = prog(t, at + (i / n) * dur, 0.25, ease.inOutQuad);
    if (s <= 0) continue;
    const x = cx + slots[i][0] + (rand(i, 3) - 0.5) * 8;
    const y = cy + slots[i][1] + (rand(i, 5) - 0.5) * 8;
    if (order[i] === -1) shownL++;
    else shownR++;
    out.push(<Pinwheel key={i} x={x} y={y} r={22} hand={order[i]} scale={s} rot={t * 40 * order[i]} />);
  }
  return (
    <g>
      {out}
      <text x={cx} y={cy + 290} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={44}>
        <tspan fill={C.red}>左 {shownL}</tspan>
        <tspan fill={C.ink}> : </tspan>
        <tspan fill={C.blue}>右 {shownR}</tspan>
      </text>
    </g>
  );
};

export const Mystery: React.FC = () => {
  const t = useT();
  const camX = keys(
    t,
    PAGES.slice(1).flatMap((p, i) => [
      [p - 0.9, i * W],
      [p, (i + 1) * W],
    ]) as [number, number][],
    ease.inOutQuart,
  );
  const P = (i: number) => i * W;
  // 1848 晶体与偏振
  const cr = prog(t, 2.6, 1.2, ease.inOutQuad);
  const split = keys(t, [[6.4, 0], [7.2, 1]], ease.inOutQuad);
  const rot = prog(t, 7.6, 1.2, ease.inOutQuad) * 32;
  const mix = prog(t, 9.4, 0.6, ease.inOutQuad);
  // 1857 细菌
  const bx = keys(t, [[12.0, 520], [13.0, 760], [14.0, 1000], [15.0, 1240], [16.0, 1360]], ease.inOutQuad);
  return (
    <Paper>
      <GridLines p={1} />
      <div style={{position: 'absolute', left: 0, top: 0, width: W * 5, height: H, transform: `translateX(${-camX}px)`}}>
        <svg width={W * 5} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {/* 时间轴 */}
          <rect x={0} y={1004} width={W * 5} height={8} fill={C.ink} />
          {PAGES.map((_, i) => (
            <rect key={i} x={P(i) + 120} y={984} width={8} height={48} fill={C.ink} />
          ))}

          {/* ---- 1848 ---- */}
          <line x1={960} y1={250} x2={960} y2={640} stroke={C.ink} strokeWidth={4} strokeDasharray="12 12" opacity={cr * (1 - split)} />
          <Crystal x={960 - 220 - split * 120} y={420} hand={-1} p={cr} color={C.red} />
          <Crystal x={960 + 220 + split * 120} y={420} hand={1} p={cr} color={C.blue} />
          <Polar x={960 - 340} y={720} ang={-rot * (1 - mix)} o={prog(t, 7.2, 0.4) * (1 - mix)} label="向左偏" color={C.red} />
          <Polar x={960 + 340} y={720} ang={rot * (1 - mix)} o={prog(t, 7.2, 0.4) * (1 - mix)} label="向右偏" color={C.blue} />
          <Polar x={960} y={720} ang={0} o={mix} label="混合：不偏" color={C.ink} />

          {/* ---- 1857 ---- */}
          {Array.from({length: 12}, (_, i) => {
            const hand: 1 | -1 = i % 2 ? 1 : -1;
            const x = P(1) + 480 + (i % 6) * 190 + (i >= 6 ? 95 : 0);
            const y = i < 6 ? 470 : 690;
            // 细菌经过时，右手型被吃掉
            const eaten = hand === 1 ? prog(t, 12.2 + ((x - P(1) - 480) / 1000) * 3.8, 0.3) : 0;
            return <Pinwheel key={i} x={x} y={y} r={44} hand={hand} scale={(1 - eaten) * prog(t, 11.2 + i * 0.05, 0.3)} rot={t * 30 * hand} />;
          })}
          <g transform={`translate(${P(1) + bx},580)`} opacity={prog(t, 11.6, 0.4)}>
            {Array.from({length: 10}, (_, k) => {
              const a = (k / 10) * Math.PI * 2;
              const wig = Math.sin(t * 9 + k) * 8;
              return (
                <line
                  key={k}
                  x1={Math.cos(a) * 110}
                  y1={Math.sin(a) * 62}
                  x2={Math.cos(a) * (150 + wig)}
                  y2={Math.sin(a) * (92 + wig)}
                  stroke={C.ink}
                  strokeWidth={5}
                />
              );
            })}
            <rect x={-120} y={-66} width={240} height={132} rx={66} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
            <circle cx={-40} cy={0} r={16} fill={C.ink} />
          </g>

          {/* ---- 实验室：一半一半 ---- */}
          <g transform={`translate(${P(2) + 960},520)`}>
            <Draw d={flaskD} p={prog(t, 17.2, 1.0, ease.inOutQuad)} width={6} />
          </g>
          <Brew cx={P(2) + 960} cy={520} t={t} at={18.2} nL={20} nR={20} dur={3.6} />

          {/* ---- 20 世纪初：略多一点 ---- */}
          <g transform={`translate(${P(3) + 960},520)`}>
            <Draw d={flaskD} p={prog(t, 24.2, 1.0, ease.inOutQuad)} width={6} />
          </g>
          <g transform={`translate(${P(3) + 1400},360)`} opacity={prog(t, 24.8, 0.4)}>
            <circle r={78} fill={C.yellow} stroke={C.ink} strokeWidth={4} />
            <Pinwheel x={0} y={0} r={46} hand={-1} rot={-t * 40} />
            <text x={0} y={130} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={30} fill={C.ink}>
              手性催化剂
            </text>
          </g>
          <Brew cx={P(3) + 960} cy={520} t={t} at={25.4} nL={22} nR={18} dur={3.4} />

          {/* ---- 1953 弗兰克的三个条件 ---- */}
          {[
            ['①', '有手性的催化剂', '驱动不对称反应', C.yellow],
            ['②', '放大一种镜像', '压制另一种', C.red],
            ['③', '产物就是催化剂', '自己复制自己', C.blue],
          ].map(([n, a, b, col], i) => {
            const at = 32.4 + i * 0.5;
            const y = keys(t, [[at, 1180], [at + 0.6, 400]], ease.inOutQuart);
            const x = P(4) + 120 + i * 600;
            return (
              <g key={n} transform={`translate(${x},${y})`}>
                <rect width={480} height={420} fill={C.white} stroke={C.ink} strokeWidth={5} />
                <rect width={480} height={24} fill={col} />
                <text x={40} y={150} fontFamily={SANS} fontWeight={900} fontSize={110} fill={C.ink}>
                  {n}
                </text>
                <text x={40} y={250} fontFamily={SANS} fontWeight={900} fontSize={44} fill={C.ink}>
                  {a}
                </text>
                <text x={40} y={312} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.ink2}>
                  {b}
                </text>
              </g>
            );
          })}
          <g transform={`translate(${P(4) + 120 + 400},${510})`} opacity={prog(t, 36.0, 0.3)}>
            <Check x={0} y={0} p={prog(t, 36.1, 0.4)} size={70} />
          </g>
          {[1, 2].map((i) => (
            <text
              key={i}
              x={P(4) + 120 + i * 600 + 400}
              y={535}
              textAnchor="middle"
              fontFamily={SANS}
              fontWeight={900}
              fontSize={84}
              fill={i === 1 ? C.red : C.blue}
              opacity={prog(t, 36.6 + i * 0.3, 0.3)}
            >
              ？
            </text>
          ))}
        </svg>

        {/* ---- 文字 ---- */}
        <T x={120} y={96} at={2.2} out={10.6} size={150} weight={900} lh={1} ls={-4}>
          1848
        </T>
        <T x={560} y={150} at={2.6} out={10.6} size={44} weight={900}>
          巴斯德 · 酒石酸盐晶体
        </T>
        <T x={P(1) + 120} y={96} at={11.2} out={16.6} size={150} weight={900} lh={1} ls={-4}>
          1857
        </T>
        <T x={P(1) + 560} y={150} at={11.4} out={16.6} size={44} weight={900}>
          巴斯德 · 细菌与发酵
        </T>
        <T x={P(2) + 120} y={110} at={17.2} out={23.6} size={110} weight={900} lh={1}>
          实验室里
        </T>
        <T x={P(3) + 120} y={110} at={24.2} out={30.6} size={110} weight={900} lh={1}>
          20 世纪初
        </T>
        <T x={P(3) + 120} y={246} at={24.6} out={30.6} size={44} weight={900}>
          马克瓦尔德 · 第一个不对称反应
        </T>
        <T x={P(4) + 120} y={96} at={31.2} out={41.6} size={150} weight={900} lh={1} ls={-4}>
          1953
        </T>
        <T x={P(4) + 560} y={150} at={31.4} out={41.6} size={44} weight={900}>
          弗兰克（理论物理学家）的「配方」
        </T>
        <T x={P(4) + 120 + 40} y={724} at={36.4} out={41.6} size={24} weight={500} color={C.ink2} width={420} lh={1.4}>
          20 世纪逐步实现
          <br />
          （2001、2021 年诺奖）
        </T>
      </div>
      {/* 解说 */}
      <Caption at={3.4} out={6.6} size={40}>
        显微镜下，酒石酸盐晶体有两种，互为镜像
      </Caption>
      <Caption at={6.8} out={10.6} size={38}>
        他用镊子一颗颗分开、分别溶解：一种让偏振光向左偏，一种向右；混在一起，互相抵消
      </Caption>
      <Caption at={12.0} out={16.6} size={40}>
        细菌发酵酒石酸时，只吃其中一种——生命会「挑手」
      </Caption>
      <Caption at={18.4} out={23.6} size={40}>
        可在实验室里，化学家每次做出来的，都是左右各半
      </Caption>
      <Caption at={25.6} out={30.6} size={40}>
        借助有手性的催化剂，第一次让一种镜像多出来一点点
      </Caption>
      <Caption at={33.6} out={37.8} size={40}>
        三个条件同时满足，反应就能自发走向单一手性
      </Caption>
      <Caption at={38.0} out={41.8} size={40}>
        ②、③ 两条怎么在试管里实现？——这正是今年的诺奖
      </Caption>
      <Note x={1800} y={250} at={25.0} out={30.6} align="right">
        示意：比例非实测
      </Note>
      <Hud chapter="02 百年谜题" at={2.0} />
    </Paper>
  );
};
