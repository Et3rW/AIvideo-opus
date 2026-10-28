import React from 'react';
import {C, SANS} from '../theme';
import {ease, prog, rand, useT} from '../anim';
import {Caption, Check, Draw, GridLines, Hud, Layer, Mark, Note, Paper, Pinwheel, T, fade} from '../ui';

/* ---- 嘧啶环（线描）：C5 朝右，N1/N3 标出 ---- */
const RING = [180, 240, 300, 0, 60, 120].map((d) => (d * Math.PI) / 180); // C2 N3 C4 C5 C6 N1
const Ring: React.FC<{x: number; y: number; p: number; r?: number}> = ({x, y, p, r = 76}) => {
  const pts = RING.map((a) => [Math.cos(a) * r, Math.sin(a) * r]);
  const d = 'M' + pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' L') + ' Z';
  // 内侧双键（示意凯库勒式）
  const inner = [0, 2, 4]
    .map((i) => {
      const [a, b] = pts[i].map((v) => v * 0.78);
      const [c, e] = pts[(i + 1) % 6].map((v) => v * 0.78);
      return `M${a},${b} L${c},${e}`;
    })
    .join(' ');
  return (
    <g transform={`translate(${x},${y})`}>
      <Draw d={d} p={p} width={6} />
      <Draw d={inner} p={prog(p, 0.6, 0.4)} width={5} />
      {[1, 5].map((i) => (
        <g key={i} opacity={prog(p, 0.7, 0.3)}>
          <circle cx={pts[i][0]} cy={pts[i][1]} r={22} fill={C.paper} />
          <text x={pts[i][0]} y={pts[i][1] + 13} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={36} fill={C.ink}>
            N
          </text>
        </g>
      ))}
    </g>
  );
};

/* ---- 产物比例网格：32 × 16 个小格（1/4 模数） ---- */
const GX = 840;
const GY = 300;
const COLS = 32;
const ROWS = 16;
const CELL = 30;
const N = COLS * ROWS;
const R = Array.from({length: N}, (_, i) => rand(i, 11));

/** 1995：起始 2%，自我放大到 87%（逻辑斯谛形状，示意） */
const ee1995 = (t: number) => {
  const u = prog(t, 12.6, 6.0, ease.linear);
  if (u <= 0) return 0.02;
  const a = Math.log(49 / (1 / 0.87 - 1));
  return 1 / (1 + 49 * Math.exp(-a * u));
};

/** 2003：随机涨落 → 左手型偶然领先 → 雪崩 */
const SEEDS = [
  [9, 5],
  [22, 11],
  [27, 3],
];
const cell2003 = (i: number, t: number): number => {
  // 返回 0 = 原料（无手性），-1 = 左手型，1 = 右手型
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  // 涨落：少量格子随机冒出左右手，各半
  const born = 28.4 + R[i] * 3.2 + (rand(i, 21) > 0.96 ? 0 : 99);
  let s: number = t > born ? (rand(i, 31) > 0.5 ? 1 : -1) : 0;
  // 雪崩：从三个偶然领先的左手型种子扩散；已经生成的右手型分子留在原地
  const dist = Math.min(...SEEDS.map(([sc, sr]) => Math.hypot(c - sc, (r - sr) * 1.2)));
  const flip = 31.6 + dist * 0.13 + rand(i, 41) * 0.35;
  if (t > flip && s === 0) s = -1;
  return s;
};

const REPLICA: (1 | -1)[] = [-1, 1, -1, -1, 1, -1, 1, 1];

export const Soai: React.FC = () => {
  const t = useT();
  const aO = fade(t, 2.0, 9.8);
  const gridO = fade(t, 10.2, 36.8, 0.4, 0.5);
  const eO = fade(t, 42.0, 50.4, 0.4, 0.01);
  const in95 = t < 21.9;
  const e95 = ee1995(t);
  const fracL = (1 + e95) / 2;
  const reset = prog(t, 26.6, 0.6, ease.inOutQuad);

  // 网格颜色
  const cells: React.ReactNode[] = [];
  let nL = 0;
  let nR = 0;
  for (let i = 0; i < N; i++) {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    let fill: string = C.paper2;
    if (t < 26.6) {
      // 1995 段：按比例着色；出场时逐列扫入
      const appear = prog(t, 10.4 + c * 0.025, 0.25);
      if (appear <= 0) continue;
      const left = R[i] < fracL;
      fill = left ? C.red : C.blue;
      // 重置：从左到右扫回原料色
      if (t > 22 && prog(t, 22 + c * 0.02, 0.1) > 0) fill = C.paper2;
    } else {
      const s = cell2003(i, t);
      fill = s === -1 ? C.red : s === 1 ? C.blue : C.paper2;
      if (s === -1) nL++;
      if (s === 1) nR++;
    }
    cells.push(<rect key={i} x={GX + c * CELL + 2} y={GY + r * CELL + 2} width={CELL - 4} height={CELL - 4} fill={fill} />);
  }

  return (
    <Paper>
      <GridLines p={1} />
      {/* A 设想：产物 = 催化剂 */}
      <Layer opacity={aO}>
        <Ring x={360} y={560} p={prog(t, 2.6, 1.2, ease.inOutQuad)} />
        <Draw d="M436,560 L520,560" p={prog(t, 3.6, 0.3)} width={6} />
        <text x={530} y={574} fontFamily={SANS} fontWeight={900} fontSize={40} opacity={prog(t, 3.8, 0.3)}>
          CHO
        </text>
        <text x={700} y={580} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={60} opacity={prog(t, 4.0, 0.3)}>
          +
        </text>
        <text x={850} y={576} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={44} opacity={prog(t, 4.2, 0.3)}>
          iPr₂Zn
        </text>
        <Draw d="M990,560 L1200,560 M1170,530 L1200,560 L1170,590" p={prog(t, 4.6, 0.5)} width={8} cap="butt" />
        <Ring x={1380} y={560} p={prog(t, 5.0, 1.0, ease.inOutQuad)} />
        <Draw d="M1456,560 L1560,560 M1560,560 L1560,470 M1560,560 L1640,620" p={prog(t, 5.8, 0.5)} width={6} />
        <g opacity={prog(t, 6.1, 0.3)}>
          <text x={1560} y={450} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={40}>
            OH
          </text>
          <text x={1650} y={660} fontFamily={SANS} fontWeight={900} fontSize={40}>
            iPr
          </text>
          <Pinwheel x={1560} y={560} r={30} hand={-1} rot={-t * 40} />
        </g>
        {/* 回环箭头：产物催化自己的生成 */}
        <Draw d="M1560,410 C1560,250 1095,250 1095,520" p={prog(t, 6.8, 1.0, ease.inOutQuad)} stroke={C.red} width={8} />
        <path d="M1075,490 L1095,525 L1115,490" fill="none" stroke={C.red} strokeWidth={8} opacity={prog(t, 7.7, 0.1)} />
        <g fontFamily={SANS} fontWeight={700} fontSize={28} fill={C.ink2} opacity={prog(t, 4.4, 0.4)}>
          <text x={380} y={720} textAnchor="middle">
            嘧啶甲醛
          </text>
          <text x={850} y={720} textAnchor="middle">
            二异丙基锌
          </text>
          <text x={1480} y={760} textAnchor="middle">
            嘧啶基醇（有手性）
          </text>
        </g>
      </Layer>
      <T x={1330} y={252} at={7.6} out={9.8} size={36} weight={900} align="center" width={600} color={C.red}>
        产物 = 催化剂
      </T>
      <T x={960} y={96} at={2.4} out={5.9} size={56} weight={900} align="center">
        硖合宪三注意到：催化剂和产物，长得很像
      </T>
      <T x={960} y={96} at={6.1} out={9.8} size={56} weight={900} align="center">
        能不能让产物，催化生成它自己？
      </T>

      {/* B/C/D 比例网格 */}
      <Layer opacity={gridO}>
        <rect x={GX - 6} y={GY - 6} width={COLS * CELL + 12} height={ROWS * CELL + 12} fill="none" stroke={C.ink} strokeWidth={4} />
        {cells}
      </Layer>
      {/* 1995 左侧读数 */}
      {in95 ? (
        <>
          <T x={120} y={150} at={10.4} out={21.6} size={150} weight={900} lh={1} ls={-4}>
            1995
          </T>
          <T x={120} y={340} at={10.8} out={21.6} size={34} weight={700}>
            左手型比右手型多出
          </T>
          {t > 11.0 && t < 21.9 ? (
            <div
              style={{
                position: 'absolute',
                left: 112,
                top: 390,
                fontFamily: SANS,
                fontWeight: 900,
                fontSize: 210,
                lineHeight: 1,
                color: C.red,
                fontVariantNumeric: 'tabular-nums',
                opacity: prog(t, 11.0, 0.4) * (1 - prog(t, 21.4, 0.4)),
              }}
            >
              {Math.round(e95 * 100)}%
            </div>
          ) : null}
          <T x={120} y={640} at={18.8} out={21.6} size={34} weight={700} width={680}>
            起始 2% → 放大到 <span style={{color: C.red}}>87%</span>
          </T>
          <T x={120} y={700} at={19.2} out={21.6} size={26} weight={500} width={680} color={C.ink2}>
            Nature 1995, 378, 767 · 动画为示意
          </T>
        </>
      ) : null}
      <Caption at={12.4} out={18.4}>
        每个左手型产物，都去催化出更多左手型——强者越强
      </Caption>
      <Caption at={18.8} out={21.8}>
第一个能自我放大手性的自催化反应——弗兰克的第 ③ 条
      </Caption>
      {/* C 还差一步 */}
      <T x={960} y={96} at={22.2} out={26.4} size={52} weight={900} align="center">
        可那起始的 2%，是人为加进去的
      </T>
      <Caption at={23.4} out={26.6} y={880} size={60}>
        能不能，从零开始？
      </Caption>
      {/* D 2003：从零开始 */}
      {t > 26.6 && t < 37.0 ? (
        <>
          <T x={120} y={150} at={26.8} out={36.6} size={150} weight={900} lh={1} ls={-4}>
            2003
          </T>
          <T x={120} y={340} at={27.2} out={36.6} size={34} weight={700} width={680} lh={1.5}>
            起点：没有加入
            <br />
            任何手性物质
          </T>
          {t > 28.4 ? (
            <div style={{position: 'absolute', left: 120, top: 500, fontFamily: SANS, fontWeight: 900, fontSize: 48, opacity: prog(t, 28.4, 0.3) * (1 - prog(t, 31.6, 0.4))}}>
              <span style={{color: C.red}}>左 {nL}</span>
              <span style={{color: C.ink}}> : </span>
              <span style={{color: C.blue}}>右 {nR}</span>
            </div>
          ) : null}
          <T x={120} y={520} at={34.4} out={36.6} size={30} weight={700} width={680}>
            实验中，胜出的一方最终可占产物
          </T>
          <T x={112} y={570} at={34.7} out={36.6} size={150} weight={900} lh={1.1} color={C.red} width={700}>
            99.99%
          </T>
        </>
      ) : null}
      <Note x={GX + COLS * CELL} y={GY + ROWS * CELL + 18} at={27.0} out={36.6} align="right">
        示意
      </Note>
      <Caption at={28.6} out={31.4}>
        随机的涨落：左右手零星冒出，几乎各半
      </Caption>
      <Caption at={31.8} out={36.6}>
        偶然多出的一点点，就接管了整个反应
      </Caption>

      {/* 重复实验：赢家随机 */}
      <Layer opacity={fade(t, 37.0, 41.8)}>
        {REPLICA.map((h, k) => {
          const x = 240 + k * 180;
          const fill = prog(t, 38.0 + k * 0.25, 0.4, ease.inOutQuad);
          return (
            <g key={k}>
              <rect x={x} y={460} width={120} height={120} fill={C.paper2} stroke={C.ink} strokeWidth={4} />
              <rect x={x} y={460 + 120 * (1 - fill)} width={120} height={120 * fill} fill={h === -1 ? C.red : C.blue} />
              <Pinwheel x={x + 60} y={520} r={36} hand={h} color={C.paper} hub={C.ink} scale={prog(t, 38.3 + k * 0.25, 0.3)} rot={t * 40 * h} />
              <text x={x + 60} y={630} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={C.ink2}>
                第 {k + 1} 次
              </text>
            </g>
          );
        })}
      </Layer>
      <T x={960} y={96} at={37.2} out={41.6} size={56} weight={900} align="center">
        同样的实验，重复做
      </T>
      <Caption at={38.6} out={41.8}>
        赢的可能是另一只手——全看开头的偶然
      </Caption>

      {/* E 收束 */}
      <Layer opacity={eO}>
        {[
          ['①', C.yellow],
          ['②', C.red],
          ['③', C.blue],
        ].map(([n, col], i) => {
          const x = 480 + i * 360;
          const s = prog(t, 44.6 + i * 0.25, 0.4, ease.inOutQuad);
          return (
            <g key={n} opacity={s}>
              <rect x={x} y={620} width={240} height={240} fill={C.white} stroke={C.ink} strokeWidth={5} />
              <rect x={x} y={620} width={240} height={18} fill={col} />
              <text x={x + 30} y={760} fontFamily={SANS} fontWeight={900} fontSize={96} fill={C.ink}>
                {n}
              </text>
              <Check x={x + 180} y={800} p={prog(t, 45.4 + i * 0.3, 0.35)} size={56} color={i === 0 ? C.ink : col} />
            </g>
          );
        })}
      </Layer>
      <T x={960} y={220} at={42.2} out={50.4} size={92} weight={900} align="center" ls={4}>
        除了生命本身，这是<Mark p={prog(t, 42.9, 0.5, ease.inOutQuad)}>第一次</Mark>
      </T>
      <T x={960} y={380} at={43.2} out={50.4} size={36} weight={500} align="center" color={C.ink2}>
        有人让化学反应，从没有手性的原料里，自发长出单一手性
      </T>
      <T x={960} y={900} at={46.4} out={50.4} size={36} weight={700} align="center">
        弗兰克 1953 年的三个条件，全部实现
      </T>
      <Hud chapter="04 硖合宪三：自催化" at={2.0} />
    </Paper>
  );
};
