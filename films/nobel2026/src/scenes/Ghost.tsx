import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, MONO, SANS} from '../theme';
import {clamp, ease, prog, rand, useT} from '../anim';
import {Camera, CamKey, Chip, DotGrid, Draw, Hud, Layer, Sticker, Txt} from '../ui';

/* ================= 01 幽灵粒子 ================= */
const CAM: CamKey[] = [
  [0, 960, 540, 1.04],
  [11.4, 960, 540, 1.0],
  [12.4, 2880, 540, 1.0],
  [18.4, 2880, 540, 1.0],
  [19.4, 4800, 540, 1.0],
  [25.4, 4800, 540, 1.0],
  [26.4, 6720, 540, 1.0],
  [38, 6720, 540, 1.02],
];

export const Nucleus: React.FC<{cx: number; cy: number; r?: number}> = ({cx, cy, r = 30}) => {
  const out = [];
  for (let i = 0; i < 15; i++) {
    const a = i * 2.39996;
    const d = Math.sqrt(i) * r * 0.95;
    out.push(<circle key={i} cx={cx + Math.cos(a) * d} cy={cy + Math.sin(a) * d} r={r} fill={i % 2 ? C.red : '#8A9AAA'} stroke="#fff" strokeWidth={3} />);
  }
  return <g>{out}</g>;
};

export const Earth: React.FC<{cx: number; cy: number; r: number}> = ({cx, cy, r}) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#3E8EDE" />
    <clipPath id={`ec${cx}`}>
      <circle cx={cx} cy={cy} r={r} />
    </clipPath>
    <g clipPath={`url(#ec${cx})`} fill="#46B07A">
      <path d={`M${cx - r * 0.7} ${cy - r * 0.5} q${r * 0.3} ${-r * 0.35} ${r * 0.62} ${-r * 0.1} q${r * 0.1} ${r * 0.3} ${-r * 0.12} ${r * 0.5} q${-r * 0.3} ${r * 0.25} ${-r * 0.5} ${r * 0.02} z`} />
      <path d={`M${cx + r * 0.05} ${cy - r * 0.2} q${r * 0.4} ${-r * 0.2} ${r * 0.7} ${r * 0.05} q${r * 0.1} ${r * 0.45} ${-r * 0.2} ${r * 0.75} q${-r * 0.35} ${-r * 0.1} ${-r * 0.5} ${-r * 0.8} z`} />
      <path d={`M${cx - r * 0.55} ${cy + r * 0.35} q${r * 0.25} ${-r * 0.05} ${r * 0.3} ${r * 0.3} q${-r * 0.1} ${r * 0.3} ${-r * 0.35} ${r * 0.2} z`} />
    </g>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={r * 0.05} />
  </g>
);

const Reactor: React.FC = () => (
  <g>
    <path d="M40 300 Q70 160 40 30 L200 30 Q170 160 200 300 Z" fill="#9FB0C0" />
    <path d="M40 30 L200 30" stroke="#7F91A3" strokeWidth={10} />
    <path d="M80 30 Q60 -30 110 -50 Q160 -70 140 -120" fill="none" stroke="#D5DEE6" strokeWidth={26} strokeLinecap="round" />
    <rect x={220} y={150} width={200} height={150} fill="#7F91A3" />
    <path d="M220 150 Q320 40 420 150 Z" fill="#B6C3CF" />
    <text x={320} y={250} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={42} fill="#fff">
      ☢
    </text>
  </g>
);

const Tank: React.FC<{flash: number}> = ({flash}) => (
  <g>
    <rect x={0} y={0} width={260} height={220} rx={18} fill="#5D6F82" />
    <rect x={16} y={40} width={228} height={164} rx={10} fill="#9FD3F5" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <circle key={i} cx={40 + i * 36} cy={22} r={12} fill="#2C3B4A" />
    ))}
    <circle cx={130} cy={120} r={20 + flash * 26} fill="#fff" opacity={flash} />
  </g>
);

export const Ghost: React.FC = () => {
  const t = useT();
  // β 衰变：电子飞出
  const eP = prog(t, 3.0, 0.8, ease.outCubic);
  const nuP = prog(t, 8.0, 1.0, ease.outCubic);
  // 反应堆 → 探测器的中微子流
  const flow = [];
  for (let i = 0; i < 16; i++) {
    const ph = ((t - 13.6) * 0.9 + rand(i, 7)) % 1;
    if (t < 13.6) break;
    const x = 2560 + ph * 440;
    const y = 640 + Math.sin(i * 1.7) * 60;
    flow.push(<circle key={i} cx={x} cy={y} r={7} fill={C.blue} opacity={Math.sin(ph * Math.PI)} />);
  }
  const flash = t > 14.5 ? Math.max(0, 1 - ((t - 14.5) % 1.3) / 0.5) : 0;
  // 穿过地球的直线
  const thru = prog(t, 27.2, 1.4, ease.inOutCubic);
  const thruDots = [];
  if (t > 28.4) {
    for (let i = 0; i < 8; i++) {
      const ph = ((t - 28.4) * 0.45 + i / 8) % 1;
      thruDots.push(<circle key={i} cx={6080 + ph * 960} cy={170 + ph * 760} r={9} fill={C.blue} />);
    }
  }
  return (
    <AbsoluteFill>
      <Camera k={CAM}>
        <DotGrid x={-400} y={-400} w={8600} h={1900} />
        {/* ---------- P1 1930 消失的能量 ---------- */}
        <Chip x={150} y={130} at={1.8} color={C.red}>
          1930
        </Chip>
        <Txt x={300} y={124} at={2.0} size={58} weight={900}>
          消失的能量
        </Txt>
        <Sticker x={330} y={360} w={380} h={380} at={2.4}>
          <Nucleus cx={190} cy={190} r={34} />
        </Sticker>
        <Txt x={340} y={760} at={2.8} size={30} weight={700} color={C.slate} width={360} align="left">
          放射性原子核（β 衰变）
        </Txt>
        <Layer w={1920} h={1080}>
          <Draw d="M720 550 L1010 550" p={eP} stroke={C.ink} width={4} />
          {eP > 0 ? (
            <g transform={`translate(${720 + eP * 300} 550)`}>
              <circle r={26} fill={C.ink} />
              <text y={10} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={28} fill="#fff">
                e⁻
              </text>
            </g>
          ) : null}
          {nuP > 0 ? (
            <g transform={`translate(${520 - nuP * 300} ${550 - nuP * 250})`} opacity={0.4 + 0.6 * nuP}>
              <circle r={28} fill="none" stroke={C.blue} strokeWidth={4} strokeDasharray="8 7" />
              <text y={12} textAnchor="middle" fontFamily='"Times New Roman", serif' fontStyle="italic" fontWeight={700} fontSize={38} fill={C.blue}>
                ν
              </text>
            </g>
          ) : null}
        </Layer>
        {/* 能量条 */}
        <div style={{position: 'absolute', left: 1120, top: 400, fontFamily: SANS, fontSize: 28, fontWeight: 700, color: C.slate, opacity: prog(t, 3.6, 0.4)}}>
          衰变释放的总能量
        </div>
        <div style={{position: 'absolute', left: 1120, top: 444, height: 46, width: 640 * prog(t, 3.7, 0.7, ease.outQuint), background: C.ink, borderRadius: 6}} />
        <div style={{position: 'absolute', left: 1120, top: 530, fontFamily: SANS, fontSize: 28, fontWeight: 700, color: C.blue, opacity: prog(t, 4.4, 0.4)}}>
          电子带走的能量
        </div>
        <div
          style={{
            position: 'absolute',
            left: 1120,
            top: 574,
            height: 46,
            width: (360 + Math.sin(Math.floor(t * 2.5) * 2.1) * 90 * prog(t, 5.0, 0.5)) * prog(t, 4.5, 0.7, ease.outQuint),
            background: C.blue,
            borderRadius: 6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 1560,
            top: 566,
            width: 200,
            height: 62,
            border: `4px dashed ${C.red}`,
            borderRadius: 8,
            opacity: prog(t, 5.3, 0.4),
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 44,
            color: C.red,
            textAlign: 'center',
            lineHeight: '54px',
          }}
        >
          ?
        </div>
        <Txt x={1120} y={660} at={5.7} size={30} weight={500} color={C.slate} width={700} lh={1.5}>
          每次测量，电子带走的能量都不同，
          <br />
          总有一部分不知去向。
        </Txt>
        <Txt x={150} y={860} at={7.6} size={44} weight={900} width={1700}>
          泡利提出：一定有一个<span style={{color: C.blue}}>看不见的中性粒子</span>，悄悄带走了它。
        </Txt>
        <Txt x={150} y={940} at={9.4} size={30} weight={500} color={C.slate} width={1700}>
          他自己都觉得这是一个“绝望的补救”——因为这样的粒子，几乎不可能被探测到。
        </Txt>

        {/* ---------- P2 1956 首次捕获 ---------- */}
        <Layer w={4000} h={1080}>
          <Draw d="M2030 230 L3700 230" p={prog(t, 12.3, 1.0, ease.inOutCubic)} stroke={C.line} width={6} />
          <circle cx={2030} cy={230} r={14} fill={C.ink} opacity={prog(t, 12.3, 0.3)} />
          <circle cx={3700} cy={230} r={14} fill={C.red} opacity={prog(t, 13.2, 0.3)} />
          {flow}
        </Layer>
        <Txt x={2030} y={160} at={12.4} size={26} weight={700} color={C.slate} mono>
          1930
        </Txt>
        <Txt x={3700} y={160} at={13.2} size={26} weight={700} color={C.red} mono width={200}>
          1956
        </Txt>
        <Txt x={2865} y={170} at={12.9} size={30} weight={900} color={C.ink} align="center" width={300}>
          26 年
        </Txt>
        <Sticker x={2120} y={470} w={430} h={310} at={13.0} vb="0 -130 430 440">
          <Reactor />
        </Sticker>
        <Txt x={2130} y={810} at={13.4} size={28} weight={700} color={C.slate}>
          核反应堆：海量中微子源
        </Txt>
        <Sticker x={3020} y={540} w={260} h={220} at={13.8}>
          <Tank flash={flash} />
        </Sticker>
        <Txt x={3020} y={790} at={14.2} size={28} weight={700} color={C.slate}>
          液体探测器
        </Txt>
        <Txt x={2030} y={290} at={14.8} size={50} weight={900} width={1800}>
          1956 年，莱因斯与柯万在核反应堆旁首次捕获中微子
        </Txt>
        <Txt x={2030} y={370} at={15.8} size={30} weight={500} color={C.slate} width={1800}>
          “幽灵”在预言 26 年后终于现身（莱因斯因此获 1995 年诺贝尔物理学奖）
        </Txt>

        {/* ---------- P3 有多幽灵 ---------- */}
        <Txt x={4080} y={150} at={18.9} size={62} weight={900} width={1500}>
          中微子有多“幽灵”？
        </Txt>
        {[
          {x: 4080, at: 19.6, t1: '不带电', t2: '电磁场拉不住、偏不动它', icon: 'charge'},
          {x: 4580, at: 20.1, t1: '质量极小', t2: '不到电子的百万分之一', icon: 'mass'},
          {x: 5080, at: 20.6, t1: '几乎不与物质作用', t2: '只通过“弱相互作用”偶尔现身', icon: 'wall'},
        ].map((c) => {
          const s = prog(t, c.at, 0.6, ease.outBack);
          return (
            <div
              key={c.x}
              style={{
                position: 'absolute',
                left: c.x,
                top: 330,
                width: 440,
                height: 520,
                background: '#fff',
                borderRadius: 26,
                boxShadow: '0 18px 40px rgba(30,50,70,0.12)',
                transform: `translateY(${(1 - s) * 60}px) scale(${0.9 + 0.1 * s})`,
                opacity: clamp(s * 1.5),
              }}
            >
              <svg width={440} height={280} style={{position: 'absolute', left: 0, top: 10}}>
                {c.icon === 'charge' ? (
                  <g>
                    <circle cx={220} cy={140} r={80} fill="none" stroke={C.blue} strokeWidth={10} />
                    <text x={220} y={170} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={96} fill={C.blue}>
                      0
                    </text>
                    <Draw d="M150 210 L290 70" p={prog(t, c.at + 0.5, 0.4)} stroke={C.red} width={10} />
                  </g>
                ) : c.icon === 'mass' ? (
                  <g>
                    <circle cx={160} cy={150} r={80} fill={C.ink} />
                    <text x={160} y={165} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={44} fill="#fff">
                      e⁻
                    </text>
                    <circle cx={320} cy={210} r={5} fill={C.blue} />
                    <text x={320} y={180} textAnchor="middle" fontFamily='"Times New Roman", serif' fontStyle="italic" fontWeight={700} fontSize={40} fill={C.blue}>
                      ν
                    </text>
                  </g>
                ) : (
                  <g>
                    {[0, 1, 2].map((k) => (
                      <rect key={k} x={150 + k * 60} y={50} width={36} height={180} rx={6} fill="#B9C6D2" />
                    ))}
                    <Draw d="M40 140 L400 140" p={prog(t, c.at + 0.4, 0.9, ease.inOutCubic)} stroke={C.blue} width={8} />
                  </g>
                )}
              </svg>
              <div style={{position: 'absolute', left: 36, top: 310, fontFamily: SANS, fontWeight: 900, fontSize: 46, color: C.ink}}>{c.t1}</div>
              <div style={{position: 'absolute', left: 36, top: 384, width: 380, fontFamily: SANS, fontWeight: 500, fontSize: 30, lineHeight: 1.4, color: C.slate}}>
                {c.t2}
              </div>
            </div>
          );
        })}

        {/* ---------- P4 穿过地球 ---------- */}
        <Sticker x={6200} y={180} w={720} h={720} at={25.9}>
          <Earth cx={360} cy={360} r={340} />
        </Sticker>
        <Layer w={8000} h={1080}>
          <Draw d="M6080 170 L7040 930" p={thru} stroke={C.blue} width={6} />
          {thruDots}
        </Layer>
        <Txt x={5850} y={130} at={26.2} size={64} weight={900} width={560} lh={1.25}>
          能径直
          <br />
          穿过整个地球
        </Txt>
        <Txt x={7020} y={330} at={29.6} size={48} weight={900} width={620}>
          极难捕捉——
        </Txt>
        <Txt x={7020} y={410} at={30.8} size={48} weight={900} width={620} color={C.blue} lh={1.3}>
          却也因此成为
          <br />
          最可靠的宇宙信使
        </Txt>
        <Txt x={7020} y={560} at={32.2} size={30} weight={500} width={600} color={C.slate} lh={1.5}>
          它从遥远的天体出发，一路不偏不倚、不被阻挡，带着源头的信息抵达地球。
        </Txt>
      </Camera>
      <Hud chapter="01 幽灵粒子" at={1.8} />
      <div style={{position: 'absolute', right: 64, bottom: 48, fontFamily: MONO, fontSize: 20, color: C.mute, opacity: prog(t, 2, 0.5)}}>
        NEUTRINO · 1930 → 1956
      </div>
    </AbsoluteFill>
  );
};
