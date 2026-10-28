import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, MONO, SANS, W, H} from '../theme';
import {clamp, ease, fmtInt, life, prog, rand, useT} from '../anim';
import {Hud, Txt} from '../ui';

/* ================= 下潜 + 探测原理（深色） ================= */
const TAN_C = Math.tan((41 * Math.PI) / 180); // 冰中切伦科夫角约 41°

/** 按命中时间着色：早 = 红，晚 = 蓝（冰立方事件图惯例） */
export const timeColor = (u: number, l = 60) => `hsl(${clamp(u) * 230}, 95%, ${l}%)`;

export const Deep: React.FC = () => {
  const t = useT();
  /* ---- 下潜 0–3.2 s ---- */
  const dive = prog(t, 0, 3.0, ease.inOutCubic);
  const depth = dive * 2000;
  const skyMix = clamp(1 - dive * 1.6);
  const diveOn = t < 3.6;

  /* ---- 原理示意 ---- */
  const P0 = {x: 860, y: 900};
  const dir = (() => {
    const dx = 1780 - P0.x;
    const dy = 120 - P0.y;
    const L = Math.hypot(dx, dy);
    return {x: dx / L, y: dy / L, L};
  })();
  const nrm = {x: -dir.y, y: dir.x};
  const hitT = 4.6;
  const sTip = prog(t, hitT, 4.2, ease.linear) * dir.L;
  const tip = {x: P0.x + dir.x * sTip, y: P0.y + dir.y * sTip};
  const diag = prog(t, 3.0, 0.8);

  // DOM 阵列（屏幕坐标）
  const doms = [];
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 13; j++) {
      const x = 150 + i * 150 + (j % 2) * 10;
      const y = 150 + j * 66;
      const rx = x - P0.x;
      const ry = y - P0.y;
      const s = rx * dir.x + ry * dir.y;
      const d = Math.abs(rx * nrm.x + ry * nrm.y);
      const sHit = s + d * TAN_C;
      const lit = s > -40 && s < dir.L && d < 360 && sTip >= sHit;
      const u = clamp(s / dir.L);
      const amp = Math.exp(-d / 170) * (0.6 + rand(i * 13 + j, 4) * 0.4);
      const since = lit ? (sTip - sHit) / 900 : 0;
      const r = lit ? 6 + amp * 22 * (0.6 + 0.4 * clamp(since * 4)) : 4;
      doms.push(
        <g key={`${i}-${j}`}>
          {lit ? <circle cx={x} cy={y} r={r * 2.2} fill={timeColor(u)} opacity={0.18 * amp} /> : null}
          <circle cx={x} cy={y} r={r} fill={lit ? timeColor(u) : '#2A4A6E'} opacity={lit ? 0.95 : 0.9} />
        </g>,
      );
    }
  }
  // 切伦科夫楔形（波前在尖端后方，与反向径迹夹角 49°）
  const coneLen = Math.min(sTip, 520);
  const back = {x: -dir.x, y: -dir.y};
  const half = ((90 - 41) * Math.PI) / 180;
  const rot = (v: {x: number; y: number}, a: number) => ({x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a)});
  const e1 = rot(back, half);
  const e2 = rot(back, -half);
  const cl = coneLen / Math.cos(half);
  const flash = t > hitT ? Math.exp(-(t - hitT) * 3) : 0;
  const nuIn = prog(t, 3.4, 1.2, ease.inCubic);
  const nuStart = {x: P0.x - dir.x * 900, y: P0.y - dir.y * 900};

  return (
    <AbsoluteFill style={{background: C.dark}}>
      {diveOn ? (
        <AbsoluteFill>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, rgba(233,238,242,${skyMix}) 0%, rgba(150,200,235,${skyMix * 0.9}) 40%, rgba(10,29,54,${1 - skyMix * 0.3}) 100%)`,
            }}
          />
          {/* 上浮的冰晶，制造下潜速度感 */}
          <svg width={W} height={H} style={{position: 'absolute'}}>
            {Array.from({length: 90}, (_, i) => {
              const x = rand(i, 9) * W;
              const sp = 0.6 + rand(i, 10) * 0.8;
              const y = (((rand(i, 11) * 1400 - depth * sp * 1.6) % 1400) + 1400) % 1400 - 160;
              const len = 10 + 60 * Math.sin(dive * Math.PI) * sp;
              return <line key={i} x1={x} x2={x} y1={y} y2={y + len} stroke="#CFEAFF" strokeOpacity={0.25 + 0.4 * (1 - skyMix)} strokeWidth={2} />;
            })}
          </svg>
          <div style={{position: 'absolute', left: 0, width: W, top: 420, textAlign: 'center', opacity: life(t, 0.2, 3.4, 0.3, 0.4)}}>
            <div style={{fontFamily: MONO, fontSize: 30, color: skyMix > 0.75 ? C.slate : C.ice, letterSpacing: 6}}>DEPTH</div>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 150, color: skyMix > 0.75 ? C.ink : '#fff', fontVariantNumeric: 'tabular-nums'}}>
              {fmtInt(depth)} m
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {t > 2.8 ? (
        <AbsoluteFill style={{opacity: diag}}>
          <svg width={W} height={H} style={{position: 'absolute'}}>
            <defs>
              <linearGradient id="cone" gradientUnits="userSpaceOnUse" x1={tip.x} y1={tip.y} x2={tip.x + back.x * coneLen} y2={tip.y + back.y * coneLen}>
                <stop offset="0" stopColor={C.cyan} stopOpacity={0.55} />
                <stop offset="1" stopColor={C.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* 线缆 */}
            {Array.from({length: 12}, (_, i) => (
              <line key={i} x1={150 + i * 150} x2={160 + i * 150} y1={0} y2={H} stroke="#18324F" strokeWidth={2} />
            ))}
            {doms}
            {/* 入射中微子：看不见的虚线 */}
            <line
              x1={nuStart.x}
              y1={nuStart.y}
              x2={nuStart.x + (P0.x - nuStart.x) * nuIn}
              y2={nuStart.y + (P0.y - nuStart.y) * nuIn}
              stroke="#8FB8FF"
              strokeWidth={4}
              strokeDasharray="10 12"
              opacity={0.8 * (1 - prog(t, 6, 1))}
            />
            {/* 光锥 */}
            {sTip > 0 ? (
              <path
                d={`M${tip.x} ${tip.y} L${tip.x + e1.x * cl} ${tip.y + e1.y * cl} L${tip.x + e2.x * cl} ${tip.y + e2.y * cl} Z`}
                fill="url(#cone)"
              />
            ) : null}
            {sTip > 0 ? (
              <g filter="url(#glow)">
                <line x1={P0.x} y1={P0.y} x2={tip.x} y2={tip.y} stroke="#fff" strokeWidth={5} />
                <circle cx={tip.x} cy={tip.y} r={9} fill="#fff" />
              </g>
            ) : null}
            {flash > 0.01 ? <circle cx={P0.x} cy={P0.y} r={30 + (1 - flash) * 120} fill="#fff" opacity={flash} filter="url(#glow)" /> : null}
          </svg>
          {/* 标注 */}
          <div style={{position: 'absolute', left: P0.x + 30, top: P0.y + 10, fontFamily: SANS, fontWeight: 700, fontSize: 26, color: C.ice, opacity: life(t, 4.7, 9.5), whiteSpace: 'nowrap'}}>
            撞击原子核
          </div>
          <div style={{position: 'absolute', left: tip.x + 24, top: tip.y - 18, fontFamily: '"Times New Roman", serif', fontStyle: 'italic', fontWeight: 700, fontSize: 40, color: '#fff', opacity: prog(t, 5.0, 0.4)}}>
            μ
          </div>
          <div
            style={{
              position: 'absolute',
              left: nuStart.x + (P0.x - nuStart.x) * 0.55 - 70,
              top: nuStart.y + (P0.y - nuStart.y) * 0.55 - 10,
              fontFamily: '"Times New Roman", serif',
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 40,
              color: '#8FB8FF',
              opacity: life(t, 3.6, 7),
            }}
          >
            ν
          </div>
        </AbsoluteFill>
      ) : null}

      {/* 文字 */}
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,14,28,0.85) 0%, rgba(5,14,28,0) 46%)', opacity: diag}} />
        <Txt x={110} y={150} at={3.4} out={14} size={44} weight={900} color="#fff" width={760} lh={1.3}>
          极偶尔，一个中微子
          <br />
          撞上冰中的原子核
        </Txt>
        <Txt x={110} y={300} at={5.2} out={14} size={32} weight={500} color={C.ice} width={720} lh={1.5}>
          产生的 μ 子比光在冰中跑得还快，
          <br />
          沿途拖出一道蓝色光锥——
          <br />
          <span style={{color: C.cyan, fontWeight: 900}}>切伦科夫辐射</span>，相当于光的“音爆”。
        </Txt>
        <Txt x={110} y={520} at={8.4} out={14} size={30} weight={500} color={C.ice} width={720} lh={1.5}>
          光学模块按<span style={{color: '#FF6B5B', fontWeight: 900}}>先</span>
          <span style={{color: '#FFC24B', fontWeight: 900}}>后</span>
          <span style={{color: '#4BE08A', fontWeight: 900}}>顺</span>
          <span style={{color: '#4CB8FF', fontWeight: 900}}>序</span>依次亮起。
        </Txt>
        <Txt x={110} y={640} at={10.0} out={14} size={30} weight={700} color="#fff" width={720} lh={1.5}>
          地球本身就是过滤器：
          <br />
          从脚下向上穿出的径迹，几乎只可能是中微子留下的。
        </Txt>
      </div>
      <Hud chapter="03 南极冰下的望远镜" dark />
    </AbsoluteFill>
  );
};
