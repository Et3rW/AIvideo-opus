import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, MONO, SANS} from '../theme';
import {countUp, ease, fmtInt, life, prog, rand, typed, useT} from '../anim';
import {Camera, CamKey, camAt, Chip, DotGrid, Hud, Layer, Nu, Sticker, Txt} from '../ui';

/* ================= 开场：每秒 650 亿 ================= */
const HOOK_CAM: CamKey[] = [
  [0, 1350, 1080, 1.0],
  [5.4, 1380, 1080, 1.08],
  [8.2, 2350, 1160, 0.46],
  [15, 2350, 1160, 0.43],
];

const Person: React.FC = () => (
  <g>
    <circle cx={1920} cy={430} r={140} fill="#AEBBC7" />
    <rect x={1660} y={600} width={520} height={820} rx={150} fill="#AEBBC7" />
    <rect x={1540} y={640} width={130} height={640} rx={65} fill="#AEBBC7" transform="rotate(8 1605 640)" />
    <rect x={2170} y={640} width={130} height={640} rx={65} fill="#AEBBC7" transform="rotate(-8 2235 640)" />
    <rect x={1700} y={1360} width={190} height={720} rx={90} fill="#AEBBC7" />
    <rect x={1950} y={1360} width={190} height={720} rx={90} fill="#AEBBC7" />
  </g>
);

export const Hook: React.FC = () => {
  const t = useT();
  const {s} = camAt(t, HOOK_CAM);
  const personIn = prog(t, 5.6, 1.4);
  const sqDraw = prog(t, 0.05, 0.6, ease.inOutCubic);
  const r = 3.2 / Math.pow(s, 0.8);
  const N = 460;
  const ang = (11 * Math.PI) / 180;
  const vx = Math.cos(ang) * 2600;
  const vy = Math.sin(ang) * 2600;
  const dots = [];
  for (let i = 0; i < N; i++) {
    const x0 = rand(i, 1) * 5200 - 700;
    const y0 = rand(i, 2) * 3200 - 520;
    const sp = 0.7 + rand(i, 3) * 0.6;
    const x = ((x0 + vx * sp * t + 700) % 5200) - 700;
    const y = ((y0 + vy * sp * t + 520) % 3200) - 520;
    const inSq = x > 1770 && x < 2070 && y > 930 && y < 1230;
    const len = 26 * sp / Math.pow(s, 0.6);
    dots.push(
      <line
        key={i}
        x1={x - Math.cos(ang) * len}
        y1={y - Math.sin(ang) * len}
        x2={x}
        y2={y}
        stroke={inSq ? C.blue : '#6E9BEF'}
        strokeOpacity={inSq ? 1 : 0.55}
        strokeWidth={r * (inSq ? 1.6 : 1)}
        strokeLinecap="round"
      />,
    );
  }
  const n = countUp(t, 1.0, 2.2, 65_000_000_000);
  const fadeAll = 1 - prog(t, 10.6, 0.6, ease.inCubic);
  const nuP = prog(t, 11.0, 0.7, ease.outQuint);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: 1 - 0.75 * prog(t, 10.6, 0.8)}}>
      <Camera k={HOOK_CAM}>
        <DotGrid x={-1200} y={-800} w={6240} h={3760} gap={64} />
        <Layer w={3840} h={2160}>
          <g opacity={personIn} transform={`translate(0 ${(1 - personIn) * 80})`} filter="url(#sticker)">
            <Person />
          </g>
          {dots}
          <rect
            x={1770}
            y={930}
            width={300}
            height={300}
            pathLength={1}
            fill="rgba(31,111,255,0.06)"
            stroke={C.red}
            strokeWidth={6 / Math.pow(s, 0.7)}
            strokeDasharray="1 1"
            strokeDashoffset={1 - sqDraw}
          />
          {/* 尺寸标注 */}
          <g opacity={prog(t, 0.4, 0.4) * (1 - personIn * 0.6)}>
            <line x1={1770} y1={1270} x2={2070} y2={1270} stroke={C.slate} strokeWidth={2} />
            <line x1={1770} y1={1260} x2={1770} y2={1280} stroke={C.slate} strokeWidth={2} />
            <line x1={2070} y1={1260} x2={2070} y2={1280} stroke={C.slate} strokeWidth={2} />
            <text x={1920} y={1310} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={C.slate}>
              1 cm
            </text>
          </g>
        </Layer>
      </Camera>
      </AbsoluteFill>

      <AbsoluteFill style={{opacity: fadeAll}}>
        <Txt x={140} y={290} at={0.5} out={5.6} size={46} weight={700} color={C.slate}>
          每一秒，穿过这 1 平方厘米的中微子
        </Txt>
        <div
          style={{
            position: 'absolute',
            left: 140,
            top: 370,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 132,
            color: C.ink,
            opacity: life(t, 1.0, 5.6, 0.2, 0.35),
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: -2,
          }}
        >
          {fmtInt(n)}
        </div>
        <Txt x={140} y={540} at={3.1} out={5.6} size={54} weight={900} color={C.blue}>
          约 650 亿个
        </Txt>
        <Txt x={140} y={630} at={3.6} out={5.6} size={34} weight={500} color={C.slate}>
          主要来自太阳内部的核聚变
        </Txt>
        <Txt x={1780} y={190} at={6.6} out={11} size={56} weight={900} align="right" width={900}>
          它们穿过你的身体、穿过整个地球
        </Txt>
        <Txt x={1780} y={280} at={8.4} out={11} size={56} weight={900} align="right" width={900} color={C.red}>
          却几乎从不留下任何痕迹
        </Txt>
      </AbsoluteFill>

      {/* 中微子标题 */}
      {t > 10.9 ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div
            style={{
              position: 'absolute',
              width: 760,
              height: 760,
              borderRadius: 380,
              background: C.bg,
              transform: `scale(${nuP})`,
              boxShadow: '0 0 0 14px #fff, 0 30px 60px rgba(30,50,70,0.18)',
            }}
          />
          <div style={{position: 'relative', textAlign: 'center', transform: `scale(${0.85 + 0.15 * nuP})`, opacity: nuP}}>
            <div style={{fontSize: 230, lineHeight: 1}}>
              <Nu />
            </div>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 104, color: C.ink, marginTop: 6, letterSpacing: 8}}>中微子</div>
            <div style={{fontFamily: MONO, fontSize: 30, color: C.slate, marginTop: 10, letterSpacing: 6}}>NEUTRINO</div>
          </div>
          <Txt x={960} y={950} at={12.2} out={15.2} size={40} weight={700} align="center" width={1400} color={C.slate}>
            宇宙中最难捉摸的粒子之一
          </Txt>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/* ================= 诺奖揭晓 ================= */
const NOBEL_CAM: CamKey[] = [
  [0, 960, 540, 1.06],
  [3.6, 960, 540, 1.0],
  [4.4, 960, 1640, 1.0],
  [8.6, 960, 1640, 1.0],
  [9.4, 960, 2620, 1.0],
  [13.6, 960, 2620, 1.0],
  [14.4, 960, 3760, 1.0],
  [21, 960, 3780, 1.0],
];

const Medal: React.FC = () => (
  <g>
    <path d="M70 0 L120 120 L160 120 L110 0 Z" fill={C.blue} />
    <path d="M190 0 L140 120 L100 120 L150 0 Z" fill={C.red} />
    <circle cx={130} cy={210} r={110} fill={C.gold} />
    <circle cx={130} cy={210} r={86} fill="none" stroke="#F6D27E" strokeWidth={8} />
    <text x={130} y={248} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={104} fill="#fff">
      ★
    </text>
  </g>
);

export const Nobel: React.FC = () => {
  const t = useT();
  const wipe = prog(t, 0, 0.55, ease.inOutQuint);
  const stamp = typed('2026.10.06  ·  STOCKHOLM  ·  斯德哥尔摩', t, 0.35, 40);
  const money = countUp(t, 15.0, 1.4, 1200);
  const yr = Math.round(countUp(t, 15.4, 1.4, 1992 - 1901) + 1901);
  const age = countUp(t, 15.8, 1.4, 82);
  return (
    <AbsoluteFill>
      <Camera k={NOBEL_CAM}>
        <DotGrid x={-400} y={-400} w={2720} h={5200} />
        {/* P1 标题 */}
        <Sticker x={230} y={260} w={260} h={340} at={0.5}>
          <Medal />
        </Sticker>
        <div style={{position: 'absolute', left: 580, top: 300, fontFamily: MONO, fontSize: 30, color: C.slate, letterSpacing: 2}}>
          {stamp}
          <span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0}}>▌</span>
        </div>
        <Txt x={576} y={360} at={0.9} size={132} weight={900} width={1300}>
          2026 诺贝尔物理学奖
        </Txt>
        <Txt x={582} y={560} at={1.4} size={34} weight={500} color={C.slate} mono>
          The Nobel Prize in Physics 2026
        </Txt>
        <Chip x={582} y={640} at={2.0} color={C.red}>
          今年只颁给一个人
        </Chip>

        {/* P2 得主 */}
        <div style={{position: 'absolute', left: 220, top: 1300, width: 10, height: 600 * prog(t, 4.3, 0.7), background: C.blue}} />
        <Txt x={280} y={1310} at={4.5} size={30} weight={700} color={C.blue} ls={4}>
          获奖者
        </Txt>
        <Txt x={276} y={1360} at={4.7} size={150} weight={900} width={1500} ls={4}>
          弗朗西斯·哈尔岑
        </Txt>
        <Txt x={282} y={1560} at={5.1} size={52} weight={500} color={C.slate} mono>
          Francis Halzen
        </Txt>
        {[
          ['1944', '生于比利时蒂嫩'],
          ['1972', '起任教于美国威斯康星大学麦迪逊分校'],
          ['PI', '冰立方中微子天文台首席研究员'],
        ].map(([k, v], i) => (
          <React.Fragment key={k}>
            <Chip x={282} y={1680 + i * 72} at={5.8 + i * 0.45} color={C.ink} size={26}>
              {k}
            </Chip>
            <Txt x={420} y={1680 + i * 72} at={5.9 + i * 0.45} size={36} weight={500} color={C.ink} width={1200}>
              {v}
            </Txt>
          </React.Fragment>
        ))}

        {/* P3 获奖理由 */}
        <Chip x={220} y={2390} at={9.3} color={C.red}>
          获奖理由
        </Chip>
        <div
          style={{
            position: 'absolute',
            left: 180,
            top: 2430,
            fontFamily: 'Georgia, serif',
            fontSize: 360,
            color: C.blue,
            opacity: 0.16 * prog(t, 9.4, 0.6),
            lineHeight: 1,
          }}
        >
          “
        </div>
        <Txt x={222} y={2500} at={9.7} size={74} weight={900} width={1600} lh={1.3}>
          表彰他对冰立方中微子天文台的决定性贡献，
        </Txt>
        <Txt x={222} y={2600} at={10.3} size={74} weight={900} width={1600} lh={1.3}>
          以及<span style={{color: C.blue}}>发现天体物理起源的高能中微子</span>。
        </Txt>
        <Txt x={226} y={2750} at={11.2} size={25} weight={400} color={C.slate} mono width={1500}>
          "for decisive contributions to the IceCube Neutrino Observatory and the discovery of high-energy neutrinos of
          astrophysical origin"
        </Txt>

        {/* P4 数字 */}
        {[
          {x: 220, n: `${Math.round(money).toLocaleString('en-US')}万`, l: '瑞典克朗奖金，一人独享', at: 14.8},
          {x: 820, n: `${yr}`, l: '年以来首次由一人独得物理学奖', at: 15.2},
          {x: 1420, n: `${Math.round(age)}`, l: '岁，获奖时的年龄', at: 15.6},
        ].map((b) => (
          <React.Fragment key={b.x}>
            <div
              style={{
                position: 'absolute',
                left: b.x,
                top: 3560,
                width: 480 * prog(t, b.at, 0.6, ease.outQuint),
                height: 4,
                background: C.ink,
              }}
            />
            <Txt x={b.x} y={3590} at={b.at} size={128} weight={900} width={560} style={{fontVariantNumeric: 'tabular-nums'}}>
              {b.n}
            </Txt>
            <Txt x={b.x} y={3760} at={b.at + 0.3} size={34} weight={500} color={C.slate} width={480}>
              {b.l}
            </Txt>
          </React.Fragment>
        ))}
        <Txt x={220} y={3900} at={17.6} size={50} weight={900} width={1600}>
          他的成就：在南极冰层下，建起一台<span style={{color: C.blue}}>一立方公里</span>的“望远镜”。
        </Txt>
      </Camera>
      {/* 金色圆形擦除入场 */}
      {wipe < 1 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <div style={{position: 'absolute', inset: 0, background: C.gold, clipPath: `circle(${(1 - wipe) * 1200}px at 50% 50%)`}} />
        </AbsoluteFill>
      ) : null}
      <Hud chapter="" at={0.6} />
    </AbsoluteFill>
  );
};

