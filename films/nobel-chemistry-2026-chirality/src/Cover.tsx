import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {C, SANS} from './theme';
import {FontWait} from './Film';
import {GridLines, Paper} from './ui';
import {Stage} from './scenes/Chiral';

/* ================= 封面：片中的三维 L/D-丙氨酸与镜面 + 大标题 =================
   16:9（1920×1080）标题在左、分子在右；4:3（1440×1080）标题在上、分子在下。 */

export type CoverProps = {ratio: '16x9' | '4x3'};

// 01 章里两个分子都已出现、镜面立着、还没开始转的时刻（见 Chiral 的时间轴）
const STAGE_T = 7;

const LAYOUT = {
  '16x9': {
    canvas: {left: 740, top: 90, width: 1180, height: 940},
    text: {left: 120, top: 168},
    title: 176,
    lines: ['分子的', '左右手'],
  },
  '4x3': {
    canvas: {left: 0, top: 420, width: 1440, height: 700},
    text: {left: 96, top: 96},
    title: 150,
    lines: ['分子的左右手'],
  },
} as const;

const HANDS: Record<string, string> = {左: C.red, 右: C.blue};

export const Cover: React.FC<CoverProps> = ({ratio}) => {
  const L = LAYOUT[ratio];
  return (
    <Paper>
      <GridLines p={1} opacity={0.6} />
      <div style={{position: 'absolute', ...L.canvas}}>
        <ThreeCanvas width={L.canvas.width} height={L.canvas.height} camera={{fov: 30, near: 0.1, far: 100}} gl={{antialias: true, alpha: true}}>
          <Stage t={STAGE_T} />
        </ThreeCanvas>
      </div>

      <div style={{position: 'absolute', ...L.text, fontFamily: SANS}}>
        <div style={{display: 'inline-block', padding: '12px 28px', background: C.ink, color: C.yellow, fontWeight: 900, fontSize: 44, letterSpacing: 4}}>
          2026 诺贝尔化学奖
        </div>
        <div style={{marginTop: 40, color: C.ink, fontWeight: 900, fontSize: L.title, lineHeight: 1.1, letterSpacing: 4}}>
          {L.lines.map((line) => (
            <div key={line}>
              {line.split('').map((ch, i) => (
                <span key={i} style={{color: HANDS[ch] ?? C.ink}}>
                  {ch}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div style={{marginTop: 40, color: C.ink, fontWeight: 700, fontSize: 44, letterSpacing: 1}}>亨利·B·卡甘 × 硖合宪三</div>
        <div style={{marginTop: 16, color: C.ink2, fontWeight: 500, fontSize: 32, letterSpacing: 3}}>非线性效应 · 不对称自催化</div>
      </div>
      <FontWait />
    </Paper>
  );
};
