import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, MONO, SANS} from '../theme';
import {clamp, ease, pop, prog, rand, typed, useT} from '../anim';
import {Camera, CamKey, Chip, DotGrid, Draw, Hud, Layer, Sticker, Txt} from '../ui';
import {BlackHole} from './Cosmic';
import {Earth} from './Ghost';

/* ================= 04 来自宇宙深处：时间轴 ================= */
const CAM: CamKey[] = [
  [0, 960, 540, 1.04],
  [10.6, 960, 540, 1.0],
  [11.6, 2880, 540, 1.0],
  [22.6, 2880, 540, 1.0],
  [23.6, 4800, 540, 1.0],
  [31.0, 4800, 540, 1.0],
  [32.0, 6720, 540, 1.0],
  [42, 6720, 540, 1.04],
];

/** 迷你事件图：一团按时间着色的光点 */
const MiniEvent: React.FC<{seed: number; p: number; r?: number}> = ({seed, p, r = 120}) => {
  const out = [];
  for (let i = 0; i < 70; i++) {
    const a = rand(i, seed) * Math.PI * 2;
    const d = Math.pow(rand(i, seed + 1), 0.7) * r;
    const u = d / r;
    if (u > p * 1.1) continue;
    const size = 4 + (1 - u) * 16 * rand(i, seed + 2);
    out.push(<circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d * 0.9} r={size} fill={`hsl(${u * 230}, 95%, 58%)`} opacity={0.9} />);
  }
  return <g>{out}</g>;
};

const Galaxy: React.FC<{tilt?: number}> = ({tilt = -20}) => (
  <g transform={`rotate(${tilt} 160 160)`}>
    <ellipse cx={160} cy={160} rx={150} ry={62} fill="#2B3F6B" />
    <ellipse cx={160} cy={160} rx={110} ry={42} fill="#4D6FB0" />
    <ellipse cx={160} cy={160} rx={60} ry={24} fill="#C9D8FF" />
    <circle cx={160} cy={160} r={16} fill="#fff" />
  </g>
);

const Telescope: React.FC = () => (
  <g>
    <rect x={40} y={60} width={160} height={110} rx={10} fill="#C9A24A" />
    <rect x={60} y={20} width={120} height={40} rx={6} fill="#7F91A3" />
    <path d="M0 115 L40 95 L40 135 Z M240 115 L200 95 L200 135 Z" fill="#7F91A3" />
    <rect x={-60} y={100} width={60} height={30} fill="#3E6FB0" />
    <rect x={240} y={100} width={60} height={30} fill="#3E6FB0" />
  </g>
);

export const Discover: React.FC = () => {
  const t = useT();
  const alert = typed('ICECUBE-EHE  ·  IceCube-170922A', t, 12.2, 30);
  return (
    <AbsoluteFill>
      <Camera k={CAM}>
        <DotGrid x={-400} y={-400} w={8600} h={1900} />
        {/* 时间轴主线 */}
        <Layer w={8000} h={1080}>
          <Draw d="M150 300 L7600 300" p={prog(t, 1.6, 40, ease.linear)} stroke={C.line} width={6} />
        </Layer>

        {/* ---------- 2013 ---------- */}
        <Chip x={150} y={270} at={1.9} color={C.red} size={34}>
          2013
        </Chip>
        <Txt x={150} y={130} at={2.2} size={56} weight={900} width={1600}>
          第一批“天外来客”
        </Txt>
        {[
          {x: 360, n: 'Bert', at: 3.0},
          {x: 760, n: 'Ernie', at: 3.4},
        ].map((e, i) => (
          <React.Fragment key={e.n}>
            <svg width={340} height={340} style={{position: 'absolute', left: e.x - 170, top: 400, overflow: 'visible', transform: `scale(${pop(t, e.at)})`}}>
              <g filter="url(#sticker)">
                <circle cx={170} cy={170} r={160} fill={C.dark} />
              </g>
              <g transform="translate(170 170)">
                <MiniEvent seed={i * 7 + 3} p={prog(t, e.at + 0.2, 1.4)} />
              </g>
            </svg>
            <Txt x={e.x} y={760} at={e.at + 0.3} size={36} weight={900} align="center" width={300}>
              “{e.n}”
            </Txt>
          </React.Fragment>
        ))}
        <Txt x={1080} y={420} at={4.4} size={34} weight={700} color={C.slate} width={760}>
          两个能量约
        </Txt>
        <Txt x={1080} y={470} at={4.6} size={110} weight={900} color={C.blue} width={760}>
          1 PeV
        </Txt>
        <Txt x={1080} y={610} at={5.2} size={28} weight={500} color={C.slate} width={820} lh={1.55}>
          即 10¹⁵ 电子伏特，约为大型强子对撞机质子能量的一百多倍。
          <br />
          团队用《芝麻街》角色给它们起了昵称。
        </Txt>
        <Txt x={150} y={880} at={7.0} size={40} weight={900} width={1700}>
          加上其余事件，共 28 个高能中微子：<span style={{color: C.blue}}>首次确认来自太阳系之外</span>
        </Txt>
        <Txt x={150} y={945} at={8.4} size={28} weight={500} color={C.slate} width={1700}>
          这一发现被《物理世界》评为 2013 年度突破。
        </Txt>

        {/* ---------- 2017 ---------- */}
        <Chip x={2080} y={270} at={11.6} color={C.red} size={34}>
          2017.09.22
        </Chip>
        <Txt x={2080} y={130} at={11.8} size={56} weight={900} width={1700}>
          一个中微子，一次全球联动
        </Txt>
        <div style={{position: 'absolute', left: 2080, top: 380, width: 820, padding: '22px 28px', background: C.dark, borderRadius: 14, opacity: prog(t, 12.0, 0.3)}}>
          <div style={{fontFamily: MONO, fontSize: 22, color: C.cyan, whiteSpace: 'nowrap'}}>
            ⚠ ALERT{'  '}
            {alert}
          </div>
          <div style={{fontFamily: MONO, fontSize: 22, color: C.ice, marginTop: 10, opacity: prog(t, 13.6, 0.4)}}>
            ~290 TeV · 方向已重建 · 通报全球望远镜
          </div>
        </div>
        <Sticker x={2140} y={600} w={300} h={170} at={14.6} vb="-60 0 360 170">
          <Telescope />
        </Sticker>
        <Txt x={2080} y={800} at={15.0} size={28} weight={700} color={C.slate} width={460}>
          费米伽马射线太空望远镜等跟进观测
        </Txt>
        <Layer w={4000} h={1080}>
          <Draw d="M2480 680 C2700 640 2860 620 3040 600" p={prog(t, 15.6, 1.0, ease.inOutCubic)} stroke={C.gold} width={6} dash="14 12" />
        </Layer>
        <Sticker x={3040} y={420} w={340} h={340} at={16.4} vb="0 -10 400 420">
          <BlackHole />
        </Sticker>
        {/* 锁定框 */}
        {t > 16.8
          ? (() => {
              const k = prog(t, 16.8, 0.6, ease.outQuint);
              const s = 1.45 - 0.45 * k;
              const cx = 3210;
              const cy = 590;
              const h = 200 * s;
              const L = 46;
              const corners = [
                [-1, -1],
                [1, -1],
                [1, 1],
                [-1, 1],
              ];
              return (
                <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
                  {corners.map(([sx, sy], i) => (
                    <path
                      key={i}
                      d={`M${cx + sx * h} ${cy + sy * h - sy * L} L${cx + sx * h} ${cy + sy * h} L${cx + sx * h - sx * L} ${cy + sy * h}`}
                      fill="none"
                      stroke={C.red}
                      strokeWidth={7}
                      opacity={k}
                    />
                  ))}
                </svg>
              );
            })()
          : null}
        <Txt x={3460} y={420} at={17.4} size={44} weight={900} width={560} mono>
          TXS 0506+056
        </Txt>
        <Txt x={3460} y={490} at={17.8} size={30} weight={700} color={C.slate} width={540} lh={1.5}>
          一个正在“爆发”的耀变体
          <br />
          距离约 37 亿光年
        </Txt>
        <Txt x={2080} y={900} at={19.2} size={38} weight={900} width={1800}>
          第一次把高能中微子与一个具体天体对上——<span style={{color: C.blue}}>多信使天文学的里程碑</span>
        </Txt>

        {/* ---------- 2022 ---------- */}
        <Chip x={4000} y={270} at={23.4} color={C.red} size={34}>
          2022
        </Chip>
        <Txt x={4000} y={130} at={23.6} size={56} weight={900} width={1700}>
          被尘埃遮住的“中微子灯塔”
        </Txt>
        <Sticker x={4040} y={420} w={340} h={340} at={24.2} vb="0 0 320 320">
          <Galaxy />
        </Sticker>
        <Txt x={4480} y={430} at={24.6} size={48} weight={900} width={700} mono>
          NGC 1068
        </Txt>
        <Txt x={4480} y={500} at={25.0} size={30} weight={700} color={C.slate} width={720} lh={1.55}>
          一个活动星系，距离约 4700 万光年。
          <br />
          核心被浓密尘埃包裹，伽马射线难以逃出，
          <br />
          <span style={{color: C.blue}}>中微子却能穿透而来</span>。
        </Txt>
        <Txt x={4000} y={880} at={27.0} size={36} weight={900} width={1800}>
          这正是中微子天文学的意义：看见光看不见的地方。
        </Txt>

        {/* ---------- 2023 ---------- */}
        <Chip x={5920} y={270} at={31.8} color={C.red} size={34}>
          2023
        </Chip>
        <Txt x={5920} y={130} at={32.0} size={56} weight={900} width={1700}>
          用中微子“看见”银河系
        </Txt>
        {[
          {y: 400, label: '可见光', at: 32.8, kind: 'opt'},
          {y: 620, label: '中微子', at: 33.8, kind: 'nu'},
        ].map((row) => {
          const p = prog(t, row.at, 1.2, ease.inOutCubic);
          return (
            <React.Fragment key={row.label}>
              <svg width={1300} height={180} style={{position: 'absolute', left: 6240, top: row.y, overflow: 'visible', clipPath: `inset(0 ${(1 - p) * 100}% 0 0 round 20px)`}}>
                <rect width={1300} height={180} rx={20} fill={C.dark} />
                {row.kind === 'opt'
                  ? Array.from({length: 260}, (_, i) => {
                      const x = rand(i, 21) * 1300;
                      const band = Math.exp(-Math.pow((rand(i, 22) - 0.5) * 3.2, 2));
                      const y = 90 + (rand(i, 23) - 0.5) * 170 * (1.1 - band);
                      return <circle key={i} cx={x} cy={y} r={0.8 + rand(i, 24) * 2.2} fill="#FFF6E0" opacity={0.4 + band * 0.6} />;
                    })
                  : (
                    <>
                      <defs>
                        <linearGradient id="nuband" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor={C.blue} stopOpacity={0} />
                          <stop offset="0.5" stopColor={C.cyan} stopOpacity={0.85} />
                          <stop offset="1" stopColor={C.blue} stopOpacity={0} />
                        </linearGradient>
                        <radialGradient id="nucore">
                          <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
                          <stop offset="1" stopColor={C.cyan} stopOpacity={0} />
                        </radialGradient>
                      </defs>
                      <rect x={0} y={45} width={1300} height={90} fill="url(#nuband)" filter="url(#softglow)" />
                      <ellipse cx={650} cy={90} rx={240} ry={40} fill="url(#nucore)" />
                    </>
                  )}
              </svg>
              <Txt x={5920} y={row.y + 60} at={row.at} size={36} weight={900} width={300} color={row.kind === 'nu' ? C.blue : C.ink}>
                {row.label}
              </Txt>
            </React.Fragment>
          );
        })}
        <Txt x={6240} y={820} at={35.0} size={24} weight={500} color={C.mute} width={1300}>
          示意图：银河系盘面的可见光与中微子辐射
        </Txt>
        <Txt x={5920} y={890} at={36.0} size={38} weight={900} width={1800}>
          第一次不用“光”，而是用中微子描绘出我们自己的星系。
        </Txt>
        <Sticker x={7660} y={150} w={120} h={120} at={32.4}>
          <Earth cx={60} cy={60} r={56} />
        </Sticker>
      </Camera>
      <Hud chapter="04 来自宇宙深处" at={1.8} />
      <div style={{position: 'absolute', right: 64, bottom: 48, fontFamily: MONO, fontSize: 20, color: C.mute, opacity: clamp(prog(t, 2, 0.5))}}>
        DISCOVERIES · 2013 → 2023
      </div>
    </AbsoluteFill>
  );
};
