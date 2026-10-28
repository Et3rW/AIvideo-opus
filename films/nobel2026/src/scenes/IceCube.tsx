import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, MONO, SANS} from '../theme';
import {clamp, countUp, ease, fmtInt, pop, prog, useT} from '../anim';
import {Camera, CamKey, Chip, DotGrid, Draw, Hud, Layer, Sticker, Txt} from '../ui';

/* ================= 03 南极冰下的望远镜 ================= */
const CAM: CamKey[] = [
  [0, 960, 540, 1.04],
  [10.4, 960, 540, 1.0],
  [11.4, 2880, 540, 1.0],
  [18.4, 2880, 540, 1.0],
  [19.4, 4800, 540, 1.0],
  [26.4, 4800, 540, 1.0],
  [27.4, 6720, 540, 1.0],
  [40, 6720, 540, 1.04],
];

/** 等轴测立方体 */
export const IsoCube: React.FC<{cx: number; cy: number; a: number; p: number; fill?: string; stroke?: string}> = ({cx, cy, a, p, fill = '#CFE3F5', stroke = C.blue}) => {
  const dx = a * 0.866;
  const dy = a * 0.5;
  const top = `M${cx} ${cy - a} L${cx + dx} ${cy - a + dy} L${cx} ${cy} L${cx - dx} ${cy - a + dy} Z`;
  const left = `M${cx - dx} ${cy - a + dy} L${cx} ${cy} L${cx} ${cy + a} L${cx - dx} ${cy + dy} Z`;
  const right = `M${cx + dx} ${cy - a + dy} L${cx} ${cy} L${cx} ${cy + a} L${cx + dx} ${cy + dy} Z`;
  return (
    <g opacity={clamp(p * 2)} transform={`translate(${cx} ${cy}) scale(${0.6 + 0.4 * ease.outBack(clamp(p))}) translate(${-cx} ${-cy})`}>
      <path d={left} fill={fill} />
      <path d={right} fill="#B4D2EE" />
      <path d={top} fill="#E8F3FC" />
      <path d={`${top} ${left} ${right}`} fill="none" stroke={stroke} strokeWidth={Math.max(2, a / 60)} strokeLinejoin="round" />
    </g>
  );
};

/** 冰立方顶视图：78 根标准线缆（三角网格）+ 8 根 DeepCore（示意） */
export const STRINGS: {x: number; y: number; deep: boolean}[] = (() => {
  const pts: {x: number; y: number; d: number}[] = [];
  for (let i = -7; i <= 7; i++)
    for (let j = -7; j <= 7; j++) {
      const x = i + j * 0.5;
      const y = j * 0.866;
      pts.push({x, y, d: Math.hypot(x * 1.0, y * 1.12)});
    }
  pts.sort((a, b) => a.d - b.d || Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
  const main = pts.slice(0, 78).map((p) => ({x: p.x, y: p.y, deep: false}));
  const deep = Array.from({length: 8}, (_, k) => {
    const a = (k / 7) * Math.PI * 2;
    return k === 7 ? {x: 0.25, y: 0.15, deep: true} : {x: Math.cos(a) * 0.42, y: Math.sin(a) * 0.42, deep: true};
  });
  return [...main, ...deep];
})();

const Snowflake: React.FC<{cx: number; cy: number; r: number}> = ({cx, cy, r}) => (
  <g stroke={C.blue} strokeWidth={r * 0.12} strokeLinecap="round">
    {[0, 60, 120].map((a) => (
      <line key={a} x1={cx - r * Math.cos((a * Math.PI) / 180)} y1={cy - r * Math.sin((a * Math.PI) / 180)} x2={cx + r * Math.cos((a * Math.PI) / 180)} y2={cy + r * Math.sin((a * Math.PI) / 180)} />
    ))}
  </g>
);

const Antarctica: React.FC = () => (
  <g>
    <circle cx={160} cy={160} r={158} fill="#3E8EDE" />
    <path
      d="M70 120 C90 70 150 50 200 70 C250 80 280 120 270 160 C285 190 260 240 210 245 C180 270 130 260 110 230 C80 225 55 200 65 170 C50 150 55 135 70 120 Z M190 70 C200 40 225 30 240 45 C230 60 215 70 190 70 Z"
      fill="#F4F8FB"
    />
    <circle cx={165} cy={160} r={12} fill={C.red} stroke="#fff" strokeWidth={4} />
  </g>
);

const Dom: React.FC = () => (
  <g>
    <path d="M150 40 L150 0" stroke={C.ink} strokeWidth={8} />
    <circle cx={150} cy={170} r={130} fill="#DDEBF5" stroke="#9FB3C4" strokeWidth={6} />
    <path d="M20 170 A130 130 0 0 0 280 170 Z" fill="#2A3A4A" opacity={0.9} />
    <ellipse cx={150} cy={190} rx={100} ry={70} fill="#C99A3B" opacity={0.85} />
    <rect x={100} y={70} width={100} height={60} rx={8} fill="#2F7D52" />
    <path d="M70 110 Q100 70 140 62" stroke="#fff" strokeWidth={10} fill="none" opacity={0.6} strokeLinecap="round" />
  </g>
);

export const IceCube: React.FC = () => {
  const t = useT();
  // 剖面：深度比例尺 0.30 px/m，地表 y=240
  const Y0 = 240;
  const k = 0.3;
  const dy = (m: number) => Y0 + m * k;
  const drill = prog(t, 20.2, 2.8, ease.inOutCubic);
  const depth = drill * 2450;
  const strX = [4480, 4560, 4640, 4720, 4800, 4880, 4960, 5040, 5120];
  const nDom = Math.round(countUp(t, 29.6, 1.6, 5160));
  return (
    <AbsoluteFill>
      <Camera k={CAM}>
        <DotGrid x={-400} y={-400} w={8600} h={1900} />
        {/* ---------- P1 体积 ---------- */}
        <Txt x={150} y={140} at={1.8} size={58} weight={900} width={1600}>
          高能中微子极其稀少，又几乎从不“撞”上东西
        </Txt>
        <Txt x={150} y={230} at={2.6} size={34} weight={500} color={C.slate} width={1600}>
          想抓住它们，探测器必须大得惊人。
        </Txt>
        <Layer w={1920} h={1080}>
          <IsoCube cx={420} cy={720} a={36} p={prog(t, 3.6, 0.6)} />
          <IsoCube cx={1180} cy={700} a={250} p={prog(t, 4.6, 0.8)} />
        </Layer>
        <Txt x={420} y={800} at={3.9} size={30} weight={700} color={C.slate} align="center" width={300}>
          1 立方米
        </Txt>
        <Txt x={1500} y={480} at={5.4} size={72} weight={900} color={C.blue} width={360}>
          1 km³
        </Txt>
        <Txt x={1500} y={580} at={6.0} size={30} weight={700} color={C.ink} width={360} lh={1.5}>
          = 10 亿立方米
          <br />
          ≈ 10 亿吨冰
        </Txt>
        <Txt x={150} y={960} at={8.0} size={34} weight={700} color={C.ink} width={1700}>
          哪里有这么大块、又足够纯净透明的探测介质？
        </Txt>

        {/* ---------- P2 从想法到天文台 ---------- */}
        <Txt x={2080} y={140} at={11.0} size={58} weight={900} width={1600}>
          从一个想法，到一座天文台
        </Txt>
        <Layer w={4000} h={1080}>
          <Draw d="M2300 520 L3460 520" p={prog(t, 11.4, 3.6, ease.inOutCubic)} stroke={C.line} width={6} />
        </Layer>
        {[
          {x: 2300, at: 11.6, y: '1960', h: '马尔科夫', d: '设想：用湖水、海水这样的天然水体探测中微子', icon: 'water'},
          {x: 2880, at: 13.2, y: '1987', h: '哈尔岑', d: '转向南极冰：启动 AMANDA 先导实验，证明冰可行', icon: 'ice'},
          {x: 3460, at: 14.8, y: '2005', h: '冰立方开建', d: '2010 年 12 月完工，2011 年全面运行', icon: 'cube'},
        ].map((n) => {
          const s = pop(t, n.at);
          return (
            <React.Fragment key={n.x}>
              <svg width={200} height={200} style={{position: 'absolute', left: n.x - 100, top: 300, overflow: 'visible', transform: `scale(${s})`}}>
                <g filter="url(#sticker)">
                  <circle cx={100} cy={100} r={84} fill="#fff" />
                  {n.icon === 'water' ? (
                    <g stroke={C.blue} strokeWidth={10} fill="none" strokeLinecap="round">
                      <path d="M45 80 q14 -14 28 0 t28 0 t28 0 t28 0" />
                      <path d="M45 110 q14 -14 28 0 t28 0 t28 0 t28 0" />
                      <path d="M45 140 q14 -14 28 0 t28 0 t28 0 t28 0" />
                    </g>
                  ) : n.icon === 'ice' ? (
                    <Snowflake cx={100} cy={100} r={52} />
                  ) : (
                    <IsoCube cx={100} cy={112} a={52} p={1} />
                  )}
                </g>
              </svg>
              <div style={{position: 'absolute', left: n.x - 18, top: 502, width: 36, height: 36, borderRadius: 18, background: n.y === '1987' ? C.red : C.ink, transform: `scale(${s})`}} />
              <Txt x={n.x} y={560} at={n.at + 0.1} size={52} weight={900} align="center" width={600} mono>
                {n.y}
              </Txt>
              <Txt x={n.x} y={640} at={n.at + 0.25} size={40} weight={900} align="center" width={600} color={n.y === '1987' ? C.red : C.ink}>
                {n.h}
              </Txt>
              <Txt x={n.x} y={706} at={n.at + 0.4} size={28} weight={500} align="center" width={480} color={C.slate} lh={1.45}>
                {n.d}
              </Txt>
            </React.Fragment>
          );
        })}
        <Txt x={2080} y={900} at={16.2} size={36} weight={700} width={1700}>
          南极冰盖深处的冰：<span style={{color: C.blue}}>极其纯净、透明、黑暗</span>——天然的探测介质。
        </Txt>

        {/* ---------- P3 剖面：热水钻 ---------- */}
        <Layer w={8000} h={1300}>
          {/* 冰层 */}
          <defs>
            <linearGradient id="iceg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F7FBFE" />
              <stop offset="1" stopColor="#9CC4E4" />
            </linearGradient>
          </defs>
          <rect x={3960} y={Y0} width={1240} height={1000} fill="url(#iceg)" opacity={prog(t, 18.9, 0.6)} />
          <rect x={3960} y={Y0 - 8} width={1240} height={16} fill="#fff" opacity={prog(t, 18.9, 0.6)} />
          {/* 深度刻度 */}
          {[0, 500, 1000, 1500, 2000, 2500].map((m, i) => (
            <g key={m} opacity={prog(t, 19.2 + i * 0.06, 0.3)}>
              <line x1={4060} x2={4090} y1={dy(m)} y2={dy(m)} stroke={C.slate} strokeWidth={3} />
              <text x={4050} y={dy(m) + 8} textAnchor="end" fontFamily={MONO} fontSize={22} fill={C.slate}>
                {m} m
              </text>
            </g>
          ))}
          {/* 哈利法塔对比 */}
          <g opacity={prog(t, 24.2, 0.5)}>
            <line x1={4220} x2={4220} y1={dy(0)} y2={dy(828)} stroke={C.slate} strokeWidth={6} />
            <line x1={4205} x2={4235} y1={dy(828)} y2={dy(828)} stroke={C.slate} strokeWidth={6} />
            <text x={4240} y={dy(414)} fontFamily={SANS} fontWeight={700} fontSize={24} fill={C.slate}>
              哈利法塔
            </text>
            <text x={4240} y={dy(414) + 30} fontFamily={MONO} fontSize={22} fill={C.slate}>
              828 m
            </text>
          </g>
          {/* 探测区 */}
          <g opacity={prog(t, 24.8, 0.5)}>
            <rect x={4440} y={dy(1450)} width={720} height={(2450 - 1450) * k} fill={C.blue} opacity={0.08} />
            <line x1={4400} x2={4400} y1={dy(1450)} y2={dy(2450)} stroke={C.blue} strokeWidth={6} />
          </g>
          {/* 第一根：钻孔动画 */}
          <line x1={strX[0]} x2={strX[0]} y1={Y0} y2={dy(depth)} stroke="#5DA9E9" strokeWidth={14} strokeLinecap="round" />
          {drill > 0 && drill < 1 ? <circle cx={strX[0]} cy={dy(depth)} r={14} fill={C.red} /> : null}
          {/* 线缆和 DOM */}
          {strX.map((x, i) => {
            const a = prog(t, 23.0 + i * 0.22, 1.0, ease.inOutCubic);
            if (a <= 0) return null;
            const doms = [];
            for (let j = 0; j < 60; j += 2) {
              const m = 1450 + (j / 59) * 1000;
              if (m > 1450 + a * 1000 + 200) break;
              doms.push(<circle key={j} cx={x} cy={dy(m) - (1 - a) * 300} r={4.5} fill={C.ink} />);
            }
            return (
              <g key={x}>
                <line x1={x} x2={x} y1={Y0} y2={dy(2450) - (1 - a) * 300} stroke={C.ink} strokeWidth={2} />
                {doms}
              </g>
            );
          })}
        </Layer>
        <Sticker x={4410} y={60} w={140} h={180} at={19.4} vb="0 0 140 180">
          <g>
            <path d="M20 180 L60 20 L80 20 L120 180" fill="none" stroke={C.ink} strokeWidth={10} />
            <path d="M35 120 L105 120 M45 80 L95 80" stroke={C.ink} strokeWidth={8} />
            <rect x={50} y={0} width={40} height={26} fill={C.red} />
          </g>
        </Sticker>
        <Txt x={5270} y={230} at={19.4} size={44} weight={900} width={470} lh={1.3}>
          热水钻：在冰里
          <br />
          融出 2.5 公里深的孔
        </Txt>
        <div style={{position: 'absolute', left: strX[0] + 30, top: dy(depth) - 20, fontFamily: MONO, fontSize: 26, fontWeight: 700, color: C.red, opacity: drill > 0 && t < 24 ? 1 : 0, whiteSpace: 'nowrap'}}>
          ↓ {fmtInt(depth)} m
        </div>
        <Txt x={5270} y={dy(1450) - 4} at={25.0} size={28} weight={900} color={C.blue} width={380}>
          探测区
          <br />
          1450–2450 m
        </Txt>
        <Txt x={5270} y={400} at={23.2} size={30} weight={500} color={C.slate} width={460} lh={1.5}>
          放入串满光学模块的线缆，冰重新冻结，把它们永久封存。
        </Txt>
        <Sticker x={5270} y={830} w={180} h={180} at={19.8}>
          <g transform="scale(0.56)">
            <Antarctica />
          </g>
        </Sticker>
        <Txt x={5480} y={880} at={20.1} size={24} weight={700} color={C.slate} width={300}>
          南极点
          <br />
          阿蒙森-斯科特站
        </Txt>

        {/* ---------- P4 数字 ---------- */}
        <Sticker x={5980} y={170} w={300} h={310} at={27.2}>
          <Dom />
        </Sticker>
        <Txt x={5960} y={520} at={27.6} size={36} weight={900} width={420}>
          数字光学模块 DOM
        </Txt>
        <Txt x={5960} y={580} at={27.9} size={26} weight={500} color={C.slate} width={400} lh={1.5}>
          直径约 33 厘米的玻璃球，里面的光电倍增管能感知单个光子。
        </Txt>
        <Layer w={8000} h={1080}>
          {STRINGS.map((s, i) => {
            const a = prog(t, 28.6 + i * 0.022, 0.4, ease.outBack);
            if (a <= 0) return null;
            return <circle key={i} cx={7000 + s.x * 56} cy={330 + s.y * 56} r={(s.deep ? 9 : 13) * a} fill={s.deep ? C.red : C.blue} />;
          })}
        </Layer>
        <Txt x={7000} y={620} at={29.0} size={24} weight={700} color={C.slate} align="center" width={600}>
          俯视图：86 根线缆，间距约 125 米（示意）
        </Txt>
        <div
          style={{
            position: 'absolute',
            left: 6560,
            top: 680,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 64,
            color: C.ink,
            whiteSpace: 'nowrap',
            opacity: prog(t, 29.4, 0.3),
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          86 × 60 = <span style={{color: C.blue}}>{fmtInt(nDom)}</span> 个光学模块
        </div>
        <Chip x={5980} y={820} at={31.6} color={C.ink} size={28}>
          只能在南极夏季施工：11 月至次年 2 月
        </Chip>
        <Chip x={6700} y={890} at={32.2} color={C.ink} size={28}>
          造价约 2.79 亿美元
        </Chip>
        <Chip x={7120} y={820} at={32.8} color={C.red} size={28}>
          世界最大的中微子望远镜
        </Chip>
        <Txt x={5980} y={970} at={34.6} size={40} weight={900} width={1700}>
          这台“望远镜”不朝天上看——<span style={{color: C.blue}}>它盯着脚下的冰</span>。
        </Txt>
      </Camera>
      <Hud chapter="03 南极冰下的望远镜" at={1.8} />
    </AbsoluteFill>
  );
};
