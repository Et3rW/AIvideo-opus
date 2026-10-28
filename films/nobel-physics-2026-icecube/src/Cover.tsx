import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import '@fontsource/noto-sans-sc/900.css';
import {C, MONO, SANS} from './theme';
import {FontWait} from './Film';
import {Detector} from './scenes/Event3D';

/* ================= 封面：片中的三维事件显示 + 大标题 =================
   16:9（1920×1080）标题在左、探测器在右；4:3（1440×1080）标题在上、探测器在下。
   右下角和底边留空：视频平台会在那里叠时长和播放数。 */

export type CoverProps = {ratio: '16x9' | '4x3'};

const BG = '#040B17';
// 事件完全点亮、红色反推线已画完的时刻（见 Event3D 的时间轴）
const EVENT_T = 12.6;

const LAYOUT = {
  '16x9': {
    canvas: {left: 560, top: -40, width: 1420, height: 1160},
    cam: {az: 1.18, el: 0.2, rad: 2.35},
    text: {left: 112, top: 150},
    title: 150,
    shade: 'linear-gradient(90deg, rgba(4,11,23,0.96) 0%, rgba(4,11,23,0.85) 34%, rgba(4,11,23,0) 58%)',
  },
  '4x3': {
    canvas: {left: 200, top: 430, width: 1300, height: 700},
    cam: {az: 1.18, el: 0.2, rad: 2.05},
    text: {left: 96, top: 96},
    title: 136,
    shade: 'linear-gradient(180deg, rgba(4,11,23,0.97) 0%, rgba(4,11,23,0.9) 52%, rgba(4,11,23,0) 68%)',
  },
} as const;

export const Cover: React.FC<CoverProps> = ({ratio}) => {
  const L = LAYOUT[ratio];
  return (
    <AbsoluteFill style={{background: BG, fontFamily: SANS}}>
      <div style={{position: 'absolute', ...L.canvas}}>
        <ThreeCanvas width={L.canvas.width} height={L.canvas.height} camera={{fov: 34, near: 0.01, far: 50}} gl={{antialias: true}}>
          <Detector time={EVENT_T} cam={L.cam} />
        </ThreeCanvas>
      </div>
      <AbsoluteFill style={{background: L.shade}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(4,11,23,0) 55%, rgba(4,11,23,0.55) 100%)'}} />

      <div style={{position: 'absolute', ...L.text}}>
        <div
          style={{
            display: 'inline-block',
            padding: '10px 26px',
            border: `3px solid ${C.gold}`,
            borderRadius: 999,
            color: C.gold,
            fontWeight: 900,
            fontSize: 44,
            letterSpacing: 4,
          }}
        >
          2026 诺贝尔物理学奖
        </div>
        <div style={{marginTop: 36, color: '#fff', fontWeight: 900, fontSize: L.title, lineHeight: 1.12, letterSpacing: 2, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
          南极冰下
          <br />
          捕捉<span style={{color: C.cyan}}>幽灵粒子</span>
        </div>
        <div style={{marginTop: 34, color: C.ice, fontWeight: 700, fontSize: 42, letterSpacing: 1}}>
          弗朗西斯·哈尔岑 × 冰立方中微子天文台
        </div>
        <div style={{marginTop: 18, color: 'rgba(76,211,255,0.75)', fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>
          1 km³ ICE · 5,160 SENSORS · 2,450 m DEEP
        </div>
      </div>
      <FontWait />
    </AbsoluteFill>
  );
};
