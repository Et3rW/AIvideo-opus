import React from 'react';
import {C, G, SANS} from '../theme';
import {countUp, ease, prog, useT} from '../anim';
import {GridLines, Hud, Layer, Mark, Paper, Pinwheel, T, mv} from '../ui';

const Laureate: React.FC<{x: number; at: number; out: number; name: string; latin: string; lines: string[]; accent: 'circle' | 'tri'}> = ({
  x,
  at,
  out,
  name,
  latin,
  lines,
  accent,
}) => {
  const t = useT();
  // 从下方推上来（4 个模数），退场时再下去
  const y = mv(t, [
    [at, 1080],
    [at + 0.7, 360],
    [out, 360],
    [out + 0.6, 1080],
  ]);
  if (y >= 1080) return null;
  const w = 780;
  const h = 480;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, background: C.ink, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
        {accent === 'circle' ? (
          <circle cx={w} cy={0} r={130} fill={C.red} />
        ) : (
          <polygon points={`${w},0 ${w},${G * 1.5} ${w - G * 1.5},0`} fill={C.blue} />
        )}
      </svg>
      <div style={{position: 'absolute', left: 60, top: 64, fontFamily: SANS, fontWeight: 900, fontSize: 84, color: C.paper, letterSpacing: 4}}>{name}</div>
      <div style={{position: 'absolute', left: 64, top: 184, fontFamily: SANS, fontWeight: 500, fontSize: 32, color: C.yellow, letterSpacing: 3}}>{latin}</div>
      <div style={{position: 'absolute', left: 64, top: 270, fontFamily: SANS, fontWeight: 500, fontSize: 34, color: C.paper, lineHeight: 1.65, opacity: 0.92}}>
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </div>
  );
};

/* 诺奖揭晓：海报 → 两位得主 → 授奖理由 → 奖金 */
export const Nobel: React.FC = () => {
  const t = useT();
  // 黄圆（奖章）从右侧滚入，之后缩到右上角
  const mx = mv(t, [
    [0, 2300],
    [0.8, 1440],
    [4.6, 1440],
    [5.4, 1740],
  ]);
  const my = mv(t, [
    [4.6, 520],
    [5.4, 180],
  ]);
  const mr = mv(t, [
    [4.6, 300],
    [5.4, 72],
  ]);
  const medalOut = prog(t, 11.0, 0.5, ease.inOutQuad);
  const spin = t * 20;
  const posterOut = 4.6;
  const prize = countUp(t, 16.4, 1.6, 1200);
  return (
    <Paper>
      <GridLines p={1} />
      <Layer>
        <g transform={`translate(${mx},${my})`} opacity={1 - medalOut}>
          <circle r={mr} fill={C.yellow} />
          <circle r={mr * 0.86} fill="none" stroke={C.ink} strokeWidth={Math.max(2, mr * 0.012)} />
          <Pinwheel x={-mr * 0.36} y={0} r={mr * 0.3} hand={-1} rot={-spin} />
          <Pinwheel x={mr * 0.36} y={0} r={mr * 0.3} hand={1} rot={spin} />
        </g>
      </Layer>
      {/* 海报 */}
      <T x={120} y={150} at={0.3} out={posterOut} size={28} weight={700} ls={10} color={C.ink2}>
        THE NOBEL PRIZE IN CHEMISTRY
      </T>
      <T x={112} y={196} at={0.5} out={posterOut} size={260} weight={900} lh={1} ls={-6}>
        2026
      </T>
      <T x={120} y={470} at={0.8} out={posterOut} size={120} weight={900} ls={8}>
        诺贝尔化学奖
      </T>
      <T x={120} y={660} at={1.4} out={posterOut} size={34} weight={500} color={C.ink2}>
        2026 年 10 月 7 日 · 瑞典皇家科学院宣布
      </T>
      {/* 两位得主 */}
      <T x={120} y={176} at={5.2} out={10.9} size={56} weight={900}>
        两位得主
      </T>
      <Laureate
        x={120}
        at={5.4}
        out={10.8}
        name="亨利·B·卡甘"
        latin="HENRI B. KAGAN"
        lines={['法国 · 1930 年生', '原巴黎南大学 名誉教授']}
        accent="circle"
      />
      <Laureate
        x={1020}
        at={5.7}
        out={10.9}
        name="硖合宪三"
        latin="KENSO SOAI"
        lines={['日本 · 1950 年生', '东京理科大学 名誉教授']}
        accent="tri"
      />
      {/* 授奖理由 */}
      <T x={960} y={190} at={11.6} out={19.6} size={40} weight={500} align="center" color={C.ink2}>
        授奖理由
      </T>
      <T x={960} y={280} at={11.9} out={19.6} size={64} weight={900} align="center">
        发现不对称有机合成中的
      </T>
      <T x={960} y={400} at={12.4} out={19.6} size={120} weight={900} align="center" ls={6}>
        <Mark p={prog(t, 13.0, 0.6, ease.inOutQuad)} color={C.red}>
          非线性效应
        </Mark>
        <span style={{fontSize: 64, margin: '0 28px', verticalAlign: 'middle'}}>和</span>
        <Mark p={prog(t, 13.6, 0.6, ease.inOutQuad)} color={C.blue}>
          自催化
        </Mark>
      </T>
      <T x={960} y={600} at={14.2} out={19.6} size={32} weight={500} align="center" color={C.ink2}>
        for the discovery of non-linear effects and autocatalysis in asymmetric organic synthesis
      </T>
      {t > 16.2 && t < 19.9 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: 1920,
            top: 760,
            textAlign: 'center',
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 40,
            color: C.ink,
            opacity: prog(t, 16.2, 0.4) * (1 - prog(t, 19.4, 0.4)),
          }}
        >
          奖金
          <span style={{fontWeight: 900, fontSize: 72, margin: '0 16px', fontVariantNumeric: 'tabular-nums'}}>{Math.round(prize)}</span>
          万瑞典克朗，两人平分
        </div>
      ) : null}
      <Hud at={5.0} />
    </Paper>
  );
};
