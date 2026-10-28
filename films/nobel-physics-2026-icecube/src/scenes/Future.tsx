import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, SANS, W, H} from '../theme';
import {ease, pop, prog, rand, useT} from '../anim';
import {Camera, CamKey, Chip, DotGrid, Draw, Hud, Layer, Txt} from '../ui';
import {IsoCube, STRINGS} from './IceCube';

/* ================= 05 新的眼睛 + 片尾 ================= */
const CAM: CamKey[] = [
  [0, 960, 540, 1.04],
  [8.4, 960, 540, 1.0],
  [9.4, 2880, 540, 1.0],
  [14.6, 2880, 540, 1.0],
  [15.6, 4800, 540, 1.0],
  [22, 4800, 540, 1.06],
];

const Messenger: React.FC<{x: number; y: number; at: number; color: string; label: string; kind: 'light' | 'gw' | 'nu'}> = ({x, y, at, color, label, kind}) => {
  const t = useT();
  const s = pop(t, at);
  return (
    <div style={{position: 'absolute', left: x - 140, top: y - 140, width: 280, height: 280, transform: `scale(${s})`}}>
      <svg width={280} height={280} style={{overflow: 'visible'}}>
        <g filter="url(#sticker)">
          <circle cx={140} cy={140} r={130} fill={color} />
        </g>
        {kind === 'light' ? (
          <g fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round">
            <circle cx={140} cy={140} r={34} fill="#fff" />
            {Array.from({length: 8}, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return <line key={i} x1={140 + Math.cos(a) * 56} y1={140 + Math.sin(a) * 56} x2={140 + Math.cos(a) * 84} y2={140 + Math.sin(a) * 84} />;
            })}
          </g>
        ) : kind === 'gw' ? (
          <path
            d={`M50 140 ${Array.from({length: 36}, (_, i) => {
              const xx = 50 + i * 5;
              const amp = 10 + i * 1.4;
              return `L${xx} ${140 + Math.sin(i * 0.9 + t * 6) * amp * (i < 34 ? 1 : 0.3)}`;
            }).join(' ')}`}
            fill="none"
            stroke="#fff"
            strokeWidth={10}
            strokeLinejoin="round"
          />
        ) : (
          <text x={140} y={190} textAnchor="middle" fontFamily='"Times New Roman", serif' fontStyle="italic" fontWeight={700} fontSize={150} fill="#fff">
            ν
          </text>
        )}
      </svg>
      <div style={{position: 'absolute', top: 300, width: 280, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 40, color: C.ink}}>{label}</div>
    </div>
  );
};

/** 片尾：发光的冰立方阵列（二维投影） */
const GlowArray: React.FC<{t: number}> = ({t}) => {
  const az = 0.5 + t * 0.06;
  const pts = [];
  for (let i = 0; i < STRINGS.length; i++) {
    const s = STRINGS[i];
    const x0 = s.x * 0.125;
    const z0 = s.y * 0.125;
    const x = x0 * Math.cos(az) - z0 * Math.sin(az);
    const z = x0 * Math.sin(az) + z0 * Math.cos(az);
    for (let j = 0; j < 60; j += 3) {
      const y = 0.5 - j / 59;
      const sx = 960 + x * 520;
      const sy = 560 - y * 520 + z * 150;
      const tw = 0.5 + 0.5 * Math.sin(t * 2.2 + rand(i * 60 + j, 5) * 6.28);
      const lit = rand(i * 60 + j, 6) > 0.93;
      pts.push(
        <circle
          key={`${i}-${j}`}
          cx={sx}
          cy={sy}
          r={lit ? 3 + tw * 3 : 2}
          fill={lit ? C.cyan : '#3F6C9E'}
          opacity={lit ? 0.5 + 0.5 * tw : 0.45 + z * 0.3}
        />,
      );
    }
  }
  return <g filter="url(#softglow)">{pts}</g>;
};

export const Future: React.FC = () => {
  const t = useT();
  const dark = prog(t, 20.4, 1.2, ease.inOutCubic);
  const endFade = prog(t, 27.0, 1.0, ease.inCubic);
  return (
    <AbsoluteFill>
      <Camera k={CAM}>
        <DotGrid x={-400} y={-400} w={6600} h={1900} />
        {/* ---------- P1 多信使 ---------- */}
        <Txt x={960} y={120} at={1.9} size={58} weight={900} align="center" width={1700}>
          天文学有了新的“眼睛”
        </Txt>
        <Layer w={1920} h={1080}>
          <Draw d="M520 520 L960 520 L1400 520" p={prog(t, 3.4, 1.0, ease.inOutCubic)} stroke={C.line} width={8} />
        </Layer>
        <Messenger x={520} y={500} at={2.4} color={C.gold} label="光" kind="light" />
        <Messenger x={960} y={500} at={2.9} color="#7F91A3" label="引力波" kind="gw" />
        <Messenger x={1400} y={500} at={3.4} color={C.blue} label="中微子" kind="nu" />
        <Txt x={960} y={900} at={4.6} size={36} weight={700} align="center" width={1700}>
          用不同的“信使”观察同一个宇宙事件——<span style={{color: C.blue}}>多信使天文学</span>
        </Txt>

        {/* ---------- P2 未来 ---------- */}
        <Txt x={2080} y={140} at={9.0} size={58} weight={900} width={1700}>
          冰立方还在长大
        </Txt>
        <Chip x={2080} y={260} at={9.6} color={C.red}>
          2026 年 2 月
        </Chip>
        <Txt x={2330} y={256} at={9.8} size={34} weight={700} width={1400}>
          完成升级：在阵列中心加装更密集的线缆和新一代传感器
        </Txt>
        <Layer w={4000} h={1080}>
          <IsoCube cx={2400} cy={660} a={110} p={prog(t, 11.0, 0.6)} />
          <IsoCube cx={3100} cy={680} a={220} p={prog(t, 11.8, 0.8)} fill="#D7E6F7" stroke={C.ink} />
        </Layer>
        <Txt x={2400} y={800} at={11.2} size={28} weight={700} color={C.slate} align="center" width={400}>
          冰立方
        </Txt>
        <Txt x={3100} y={930} at={12.0} size={28} weight={700} color={C.slate} align="center" width={500}>
          IceCube-Gen2（规划中）
        </Txt>
        <Txt x={3420} y={520} at={12.6} size={84} weight={900} color={C.ink} width={600}>
          ≈ 8 倍
        </Txt>
        <Txt x={3420} y={630} at={13.0} size={28} weight={500} color={C.slate} width={400}>
          设计中的下一代探测器体积
        </Txt>

        {/* ---------- P3 引语 ---------- */}
        <div style={{position: 'absolute', left: 4060, top: 170, fontFamily: 'Georgia, serif', fontSize: 380, lineHeight: 1, color: C.blue, opacity: 0.16 * prog(t, 15.6, 0.6)}}>“</div>
        <Txt x={4100} y={330} at={16.0} size={66} weight={900} width={1600} lh={1.35}>
          希望这份荣誉，也属于当初
          <br />
          那些勇敢加入这个项目的人。
        </Txt>
        <Txt x={4104} y={560} at={17.4} size={32} weight={700} color={C.slate} width={1400}>
          —— 弗朗西斯·哈尔岑，获奖当天（大意）
        </Txt>
        <Txt x={4104} y={680} at={18.4} size={30} weight={500} color={C.slate} width={1500} lh={1.55}>
          冰立方由一个国际合作组共同建设和运行，参与者来自世界各地的大学和研究机构。
        </Txt>
      </Camera>

      {/* ---------- 片尾 ---------- */}
      {dark > 0 ? (
        <AbsoluteFill style={{background: C.dark, opacity: dark}}>
          <svg width={W} height={H} style={{position: 'absolute', opacity: 0.85}}>
            <GlowArray t={t} />
          </svg>
          <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 55%, rgba(5,14,28,0) 0%, rgba(5,14,28,0.75) 70%)'}} />
          <Txt x={960} y={380} at={21.2} size={84} weight={900} color="#fff" align="center" width={1800} ls={4}>
            在一立方公里的冰里，看见宇宙。
          </Txt>
          <Txt x={960} y={520} at={22.4} size={32} weight={700} color={C.ice} align="center" width={1800} ls={2}>
            2026 诺贝尔物理学奖 · 弗朗西斯·哈尔岑 · 冰立方中微子天文台
          </Txt>
          <Txt x={960} y={960} at={23.6} size={20} weight={400} color="rgba(191,230,255,0.6)" align="center" width={1800}>
            资料：NobelPrize.org · 美国国家科学基金会（NSF）· 威斯康星大学麦迪逊分校 / WIPAC · Scientific American · Wikipedia
          </Txt>
          <Txt x={960} y={992} at={24.0} size={20} weight={400} color="rgba(191,230,255,0.6)" align="center" width={1800}>
            图形均为示意，由代码绘制
          </Txt>
        </AbsoluteFill>
      ) : null}
      <div style={{opacity: 1 - dark}}>
        <Hud chapter="05 新的眼睛" at={1.8} />
      </div>
      <AbsoluteFill style={{background: '#000', opacity: endFade}} />
    </AbsoluteFill>
  );
};
