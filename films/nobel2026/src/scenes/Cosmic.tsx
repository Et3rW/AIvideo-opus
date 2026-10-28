import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, MONO, SANS} from '../theme';
import {ease, prog, useT} from '../anim';
import {Camera, CamKey, Chip, DotGrid, Draw, Hud, Layer, Sticker, Txt} from '../ui';
import {Earth} from './Ghost';

/* ================= 02 宇宙射线之谜 ================= */
const CAM: CamKey[] = [
  [0, 960, 540, 1.04],
  [10.4, 960, 540, 1.0],
  [11.4, 2880, 540, 1.0],
  [15.4, 2880, 540, 1.0],
  [16.4, 4800, 540, 1.0],
  [25.6, 4800, 540, 1.0],
  [26.6, 6720, 540, 1.0],
  [36, 6720, 540, 1.04],
];

export const Balloon: React.FC = () => (
  <g>
    <path d="M90 0 C190 0 200 110 140 170 L120 200 L60 200 L40 170 C-20 110 -10 0 90 0 Z" fill={C.red} />
    <path d="M90 0 C120 40 125 140 108 200 L72 200 C55 140 60 40 90 0 Z" fill="#FF8A6E" />
    <path d="M62 200 L70 250 M118 200 L110 250" stroke={C.ink} strokeWidth={4} />
    <rect x={64} y={250} width={52} height={40} rx={6} fill="#8B5E3C" />
  </g>
);

export const BlackHole: React.FC = () => (
  <g>
    <path d="M200 200 L200 -10" stroke={C.cyan} strokeWidth={22} strokeLinecap="round" opacity={0.7} />
    <path d="M200 200 L200 410" stroke={C.cyan} strokeWidth={22} strokeLinecap="round" opacity={0.7} />
    <ellipse cx={200} cy={200} rx={190} ry={58} fill={C.gold} />
    <ellipse cx={200} cy={200} rx={130} ry={36} fill="#FFD27A" />
    <circle cx={200} cy={200} r={70} fill="#0B0F14" />
    <path d="M10 200 A190 58 0 0 0 390 200" fill="none" stroke={C.gold} strokeWidth={24} />
  </g>
);

const Cloud: React.FC = () => (
  <g fill="#9AA8B5">
    <circle cx={60} cy={110} r={60} />
    <circle cx={130} cy={70} r={70} />
    <circle cx={200} cy={110} r={60} />
    <circle cx={120} cy={140} r={60} />
  </g>
);

const Box: React.FC<{x: number; y: number; at: number; color: string; label: string; sub: string}> = ({x, y, at, color, label, sub}) => {
  const t = useT();
  const s = prog(t, at, 0.6, ease.outBack);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 260,
        height: 260,
        borderRadius: 130,
        background: color,
        color: '#fff',
        transform: `scale(${s})`,
        textAlign: 'center',
        boxShadow: '0 0 0 12px #fff, 0 18px 40px rgba(30,50,70,0.18)',
      }}
    >
      <div style={{fontFamily: '"Times New Roman", serif', fontStyle: 'italic', fontWeight: 700, fontSize: 120, lineHeight: '190px'}}>{label}</div>
      <div style={{position: 'absolute', top: 290, left: -70, width: 400, fontFamily: SANS, fontWeight: 700, fontSize: 34, color: C.ink}}>{sub}</div>
    </div>
  );
};

export const Cosmic: React.FC = () => {
  const t = useT();
  // 赫斯曲线：电离度随高度
  const chartP = prog(t, 3.0, 2.4, ease.inOutCubic);
  const balloonY = 830 - chartP * 560;
  // 三个信使
  const srcX = 4180;
  const dstX = 5440;
  const pP = prog(t, 17.4, 2.0, ease.inOutCubic);
  const gP = prog(t, 19.8, 1.2, ease.inOutCubic);
  const nP = prog(t, 22.2, 1.4, ease.inOutCubic);
  return (
    <AbsoluteFill>
      <Camera k={CAM}>
        <DotGrid x={-400} y={-400} w={8600} h={1900} />
        {/* ---------- P1 1912 ---------- */}
        <Chip x={150} y={130} at={1.8} color={C.red}>
          1912
        </Chip>
        <Txt x={300} y={124} at={2.0} size={58} weight={900}>
          赫斯的气球
        </Txt>
        <Layer w={1920} h={1080}>
          {/* 坐标轴 */}
          <Draw d="M980 880 L980 240" p={prog(t, 2.4, 0.5)} stroke={C.slate} width={3} />
          <Draw d="M980 880 L1720 880" p={prog(t, 2.5, 0.5)} stroke={C.slate} width={3} />
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <g key={k} opacity={prog(t, 2.6 + k * 0.05, 0.3)}>
              <line x1={970} x2={990} y1={880 - k * 120} y2={880 - k * 120} stroke={C.slate} strokeWidth={3} />
              <text x={955} y={890 - k * 120} textAnchor="end" fontFamily={MONO} fontSize={22} fill={C.slate}>
                {k} km
              </text>
            </g>
          ))}
          {/* 数据：先略降，1 km 以上急剧上升（示意） */}
          <Draw
            d="M1060 880 C1040 800 1035 760 1050 720 C1090 620 1180 520 1300 420 C1420 330 1540 290 1690 250"
            p={chartP}
            stroke={C.red}
            width={7}
          />
        </Layer>
        <div style={{position: 'absolute', left: 1440, top: 900, fontFamily: SANS, fontSize: 26, fontWeight: 700, color: C.slate, opacity: prog(t, 2.6, 0.4), whiteSpace: 'nowrap'}}>
          辐射强度 →
        </div>
        <div style={{position: 'absolute', left: 1500, top: 200, fontFamily: MONO, fontSize: 20, color: C.mute, opacity: prog(t, 3, 0.4), whiteSpace: 'nowrap'}}>
          示意图
        </div>
        <div style={{position: 'absolute', left: 900, top: 196, fontFamily: SANS, fontSize: 26, fontWeight: 700, color: C.slate, opacity: prog(t, 2.6, 0.4), whiteSpace: 'nowrap'}}>
          高度
        </div>
        <Sticker x={1660} y={balloonY - 150} w={180} h={290} at={2.2} rot={-6}>
          <Balloon />
        </Sticker>
        <Txt x={150} y={300} at={5.4} size={44} weight={900} width={720} lh={1.3}>
          越往高处，辐射越强——
          <br />
          <span style={{color: C.red}}>它来自太空</span>
        </Txt>
        <Txt x={150} y={940} at={7.0} size={30} weight={500} color={C.slate} width={1700}>
          这就是“宇宙射线”：从太空高速飞来的带电粒子，主要是质子。赫斯因此获 1936 年诺贝尔物理学奖。
        </Txt>

        {/* ---------- P2 问题 ---------- */}
        <Txt x={2080} y={260} at={10.9} size={50} weight={700} color={C.slate} width={1600}>
          一百多年过去了，最基本的问题仍没有答案：
        </Txt>
        <Txt x={2080} y={370} at={11.6} size={170} weight={900} width={1700} ls={4}>
          它们从哪里来<span style={{color: C.red}}>？</span>
        </Txt>
        <Txt x={2080} y={640} at={13.0} size={34} weight={500} color={C.slate} width={1500} lh={1.5}>
          宇宙射线的能量可以比人类最强的加速器高出千万倍。
          <br />
          是什么样的“天然加速器”，把粒子推到这样的能量？
        </Txt>

        {/* ---------- P3 三个信使 ---------- */}
        <Sticker x={srcX - 260} y={340} w={400} h={400} at={16.0} vb="0 -10 400 420">
          <BlackHole />
        </Sticker>
        <Txt x={srcX - 260} y={790} at={16.4} size={28} weight={700} color={C.slate} width={400} align="left">
          遥远的宇宙加速器
        </Txt>
        <Sticker x={dstX - 20} y={420} w={240} h={240} at={16.2}>
          <Earth cx={120} cy={120} r={110} />
        </Sticker>
        <Txt x={dstX - 20} y={680} at={16.6} size={28} weight={700} color={C.slate} width={240} align="left">
          地球
        </Txt>
        <Sticker x={4640} y={330} w={260} h={200} at={19.6} plain>
          <Cloud />
        </Sticker>
        <Layer w={8000} h={1080}>
          {/* 质子：被磁场偏折 */}
          <Draw
            d={`M${srcX - 20} 620 C 4250 900, 4420 640, 4560 820 S 4820 960, 4980 760 S 5260 700, 5330 900 S 5560 860, ${dstX + 70} 640`}
            p={pP}
            stroke={C.red}
            width={6}
          />
          {/* 光子：被吸收 */}
          <Draw d={`M${srcX + 60} 440 L 4720 440`} p={gP} stroke={C.gold} width={8} />
          {gP >= 1 ? (
            <g opacity={prog(t, 21.0, 0.3)}>
              <line x1={4704} y1={412} x2={4744} y2={468} stroke={C.ink} strokeWidth={8} />
              <line x1={4744} y1={412} x2={4704} y2={468} stroke={C.ink} strokeWidth={8} />
            </g>
          ) : null}
          {/* 中微子：笔直 */}
          <Draw d={`M${srcX + 60} 540 L ${dstX + 10} 540`} p={nP} stroke={C.blue} width={8} />
        </Layer>
        <div style={{position: 'absolute', left: 4360, top: 940, opacity: prog(t, 17.6, 0.4), whiteSpace: 'nowrap', fontFamily: SANS}}>
          <span style={{fontWeight: 900, fontSize: 36, color: C.red}}>质子 </span>
          <span style={{fontWeight: 500, fontSize: 30, color: C.ink}}>带电，被星际磁场一路偏折，到达时早已“迷路”</span>
        </div>
        <div style={{position: 'absolute', left: 4360, top: 250, opacity: prog(t, 20.4, 0.4), whiteSpace: 'nowrap', fontFamily: SANS}}>
          <span style={{fontWeight: 900, fontSize: 36, color: '#B87A16'}}>高能光子 </span>
          <span style={{fontWeight: 500, fontSize: 30, color: C.ink}}>会被途中的尘埃和背景光吸收</span>
        </div>
        <div style={{position: 'absolute', left: 4360, top: 566, opacity: prog(t, 22.8, 0.4), whiteSpace: 'nowrap', fontFamily: SANS}}>
          <span style={{fontWeight: 900, fontSize: 36, color: C.blue}}>中微子 </span>
          <span style={{fontWeight: 700, fontSize: 30, color: C.ink}}>不带电、几乎不被吸收——一路直线，指回源头</span>
        </div>

        {/* ---------- P4 同一个工厂 ---------- */}
        <Txt x={5900} y={170} at={26.2} size={56} weight={900} width={1700}>
          宇宙射线与高能中微子，出自“同一座工厂”
        </Txt>
        <Box x={5940} y={380} at={27.2} color={C.red} label="p" sub="高能质子" />
        <Box x={6600} y={380} at={28.0} color="#7F91A3" label="π" sub="撞击产生 π 介子" />
        <Box x={7260} y={380} at={28.8} color={C.blue} label="ν" sub="衰变放出中微子" />
        <Layer w={8000} h={1080}>
          <Draw d="M6230 510 L6570 510" p={prog(t, 27.6, 0.5)} stroke={C.ink} width={6} />
          <path d="M6555 495 L6580 510 L6555 525" fill="none" stroke={C.ink} strokeWidth={6} opacity={prog(t, 28.0, 0.2)} />
          <Draw d="M6890 510 L7230 510" p={prog(t, 28.4, 0.5)} stroke={C.ink} width={6} />
          <path d="M7215 495 L7240 510 L7215 525" fill="none" stroke={C.ink} strokeWidth={6} opacity={prog(t, 28.8, 0.2)} />
        </Layer>
        <Txt x={5900} y={800} at={30.4} size={46} weight={900} width={1700} lh={1.35}>
          找到高能中微子的来源，
          <span style={{color: C.blue}}>就找到了宇宙射线的加速器。</span>
        </Txt>
      </Camera>
      <Hud chapter="02 宇宙射线之谜" at={1.8} />
    </AbsoluteFill>
  );
};
