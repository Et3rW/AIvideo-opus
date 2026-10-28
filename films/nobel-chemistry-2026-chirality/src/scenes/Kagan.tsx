import React from 'react';
import {C, SANS} from '../theme';
import {ease, prog, useT} from '../anim';
import {Caption, Check, Draw, GridLines, Hud, Layer, Mark, Paper, Pinwheel, T, fade, mv} from '../ui';

/** 胶囊药片，中间嵌一个手性符号 */
const Pill: React.FC<{x: number; y: number; hand: 1 | -1; s: number; t: number}> = ({x, y, hand, s, t}) =>
  s <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${hand * 28})`}>
      <rect x={-210} y={-90} width={420} height={180} rx={90} fill={C.white} stroke={C.ink} strokeWidth={6} />
      <path d="M0,-90 L0,90" stroke={C.ink} strokeWidth={6} />
      <path d={`M${hand * 0},-87 L${hand * 120},-87 A87,87 0 0 ${hand === 1 ? 1 : 0} ${hand * 120},87 L0,87 Z`} fill={hand === -1 ? C.red : C.blue} />
      <Pinwheel x={-hand * 100} y={0} r={52} hand={hand} rot={t * 30 * hand} />
    </g>
  );

/** 金属 + 两个手性分子 */
const Complex: React.FC<{x: number; y: number; a: 1 | -1; b: 1 | -1; s: number; t: number; dim?: number}> = ({x, y, a, b, s, t, dim = 0}) =>
  s <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={1 - dim * 0.55}>
      <line x1={-110} y1={0} x2={110} y2={0} stroke={C.ink} strokeWidth={8} />
      <circle r={70} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
      <text y={14} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={40} fill={C.ink}>
        M
      </text>
      <Pinwheel x={-140} y={0} r={52} hand={a} rot={t * 30 * a} />
      <Pinwheel x={140} y={0} r={52} hand={b} rot={t * 30 * b} />
    </g>
  );

/** 产物流：每拍落下一个 */
const Stream: React.FC<{x: number; y: number; hand: 1 | -1; t: number; at: number; out: number; period: number}> = ({x, y, hand, t, at, out, period}) => {
  const items: React.ReactNode[] = [];
  for (let k = 0; k < 40; k++) {
    const t0 = at + k * period;
    if (t0 > out) break;
    const u = (t - t0) / 1.6;
    if (u < 0 || u > 1) continue;
    const yy = y + ease.inOutQuad(Math.min(1, u * 1.4)) * 180;
    const o = 1 - prog(u, 0.75, 0.25);
    items.push(<Pinwheel key={k} x={x} y={yy} r={24} hand={hand} opacity={o} rot={t * 50 * hand} />);
  }
  return <g>{items}</g>;
};

/* ---- 非线性效应曲线：最简统计模型，“左+右”完全不反应时 ee_产物 = 2e / (1 + e²) ---- */
const CH = {x: 220, y: 850, w: 640, h: 560};
const cx = (e: number) => CH.x + e * CH.w;
const cy = (e: number) => CH.y - e * CH.h;
const curveD = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const e = i / 60;
    const y = (2 * e) / (1 + e * e);
    pts.push(`${i ? 'L' : 'M'}${cx(e).toFixed(1)},${cy(y).toFixed(1)}`);
  }
  return pts.join(' ');
})();

export const Kagan: React.FC = () => {
  const t = useT();
  const aO = fade(t, 2.0, 10.0);
  const bO = fade(t, 10.2, 17.8);
  const cO = fade(t, 18.2, 27.8);
  const dO = fade(t, 28.2, 39.8);
  const eO = fade(t, 40.0, 46.4, 0.4, 0.01);
  const pill = prog(t, 2.6, 0.6, ease.inOutQuad);
  const lig = mv(t, [
    [11.0, 1260],
    [11.8, 880],
  ]);
  return (
    <Paper>
      <GridLines p={1} />
      {/* A 药物也分左右手 */}
      <Layer opacity={aO}>
        <line x1={960} y1={300} x2={960} y2={760} stroke={C.ink} strokeWidth={4} strokeDasharray="12 12" />
        <Pill x={660} y={520} hand={-1} s={pill} t={t} />
        <Pill x={1260} y={520} hand={1} s={pill} t={t} />
        <g opacity={prog(t, 3.6, 0.3)}>
          <circle cx={660} cy={760} r={36} fill={C.ink} />
          <path d="M642,760 L655,774 L680,746" stroke={C.paper} strokeWidth={7} fill="none" />
          <text x={710} y={774} fontFamily={SANS} fontWeight={900} fontSize={38} fill={C.ink}>
            治病
          </text>
        </g>
        <g opacity={prog(t, 4.0, 0.3)}>
          <polygon points="1260,722 1300,794 1220,794" fill={C.yellow} stroke={C.ink} strokeWidth={5} />
          <text x={1260} y={786} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={40} fill={C.ink}>
            !
          </text>
          <text x={1318} y={774} fontFamily={SANS} fontWeight={900} fontSize={38} fill={C.ink}>
            可能有害
          </text>
        </g>
      </Layer>
      <T x={960} y={110} at={2.4} out={9.8} size={60} weight={900} align="center">
        药物分子，同样分左右手
      </T>
      <Caption at={3.4} out={6.4}>
        常常只有一种镜像能治病，另一种没用，甚至有害
      </Caption>
      <Caption at={6.6} out={9.8} size={38}>
        1960 年代初的沙利度胺事件：数千名婴儿出生缺陷，祸根被归于其中一种镜像
      </Caption>
      <T x={960} y={996} at={7.2} out={9.8} size={24} weight={500} align="center" color={C.ink2}>
        （后来还发现，沙利度胺的两种镜像在体内会相互转化，单用一种也不安全）
      </T>

      {/* B 不对称催化：金属 + 手性分子 */}
      <Layer opacity={bO}>
        <circle cx={720} cy={520} r={110 * prog(t, 10.4, 0.5, ease.inOutQuad)} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
        <line x1={830} y1={520} x2={lig - 70} y2={520} stroke={C.ink} strokeWidth={10} opacity={prog(t, 11.8, 0.2)} />
        <Pinwheel x={lig} y={520} r={80} hand={-1} rot={-t * 30} scale={prog(t, 10.8, 0.3)} />
        <Draw d="M1060,520 L1300,520 M1270,490 L1300,520 L1270,550" p={prog(t, 12.4, 0.5)} width={8} cap="butt" />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <Pinwheel
            key={k}
            x={1440 + (k % 3) * 110}
            y={470 + Math.floor(k / 3) * 110}
            r={40}
            hand={k === 5 ? 1 : -1}
            scale={prog(t, 12.8 + k * 0.12, 0.3)}
            rot={t * 30 * (k === 5 ? 1 : -1)}
          />
        ))}
        {/* 纯度条：原以为成正比 */}
        {[
          ['催化剂中手性分子的纯度', 760],
          ['产物的纯度', 840],
        ].map(([label, y], i) => {
          const p = prog(t, 14.6 + i * 0.6, 0.6, ease.inOutQuad);
          return (
            <g key={i} opacity={prog(t, 14.4, 0.3)}>
              <text x={980} y={(y as number) + 14} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={32} fill={C.ink}>
                {label}
              </text>
              <rect x={1020} y={(y as number) - 20} width={600} height={40} fill="none" stroke={C.ink} strokeWidth={3} />
              <rect x={1020} y={(y as number) - 20} width={300 * p} height={40} fill={C.red} />
              <text x={1640} y={(y as number) + 14} fontFamily={SANS} fontWeight={900} fontSize={34} fill={C.ink} opacity={p}>
                50%
              </text>
            </g>
          );
        })}
      </Layer>
      <T x={720} y={660} at={10.8} out={14.2} size={30} weight={700} align="center" width={500}>
        金属：反应的「发动机」
      </T>
      <T x={940} y={330} at={11.6} out={14.2} size={30} weight={700} align="center" width={500}>
        手性分子：把握方向
      </T>
      <T x={960} y={110} at={10.4} out={17.6} size={60} weight={900} align="center">
        不对称催化 = 金属 + 手性分子
      </T>
      <Caption at={14.4} out={17.6} y={216} size={38}>
        当时都以为：催化剂有多纯，产物就有多纯——成正比
      </Caption>

      {/* C 卡甘的设想：三种组合 */}
      <Layer opacity={cO}>
        <Complex x={420} y={470} a={-1} b={-1} s={prog(t, 19.4, 0.4, ease.inOutQuad)} t={t} />
        <Complex x={960} y={470} a={-1} b={1} s={prog(t, 19.8, 0.4, ease.inOutQuad)} t={t} dim={prog(t, 22.4, 0.6)} />
        <Complex x={1500} y={470} a={1} b={1} s={prog(t, 20.2, 0.4, ease.inOutQuad)} t={t} />
        <Stream x={420} y={600} hand={-1} t={t} at={21.0} out={27.4} period={0.5} />
        <Stream x={1500} y={600} hand={1} t={t} at={21.0} out={27.4} period={0.5} />
        <Stream x={960} y={600} hand={-1} t={t} at={23.6} out={24} period={4} />
        {/* 时钟：慢 */}
        <g transform="translate(960,770)" opacity={prog(t, 22.6, 0.4)}>
          <circle r={50} fill={C.white} stroke={C.ink} strokeWidth={5} />
          <line x1={0} y1={0} x2={0} y2={-34} stroke={C.ink} strokeWidth={6} transform={`rotate(${t * 12})`} />
          <line x1={0} y1={0} x2={24} y2={0} stroke={C.ink} strokeWidth={6} />
        </g>
      </Layer>
      <T x={960} y={110} at={18.4} out={27.6} size={56} weight={900} align="center">
        卡甘设想：一个金属，同时抓住两个手性分子
      </T>
      {[
        [420, '左 + 左', C.red],
        [960, '左 + 右', C.ink],
        [1500, '右 + 右', C.blue],
      ].map(([x, l, col], i) => (
        <T key={i} x={x as number} y={300} at={19.6 + i * 0.4} out={27.6} size={40} weight={900} align="center" width={400} color={col as string}>
          {l}
        </T>
      ))}
      <T x={1040} y={740} at={22.8} out={27.6} size={36} weight={900} width={400}>
        慢得多
      </T>
      <Caption at={23.6} out={27.6}>
        混搭的「左 + 右」组合，干活慢得多
      </Caption>

      {/* D 非线性曲线 */}
      <Layer opacity={dO}>
        <Draw d={`M${CH.x},${CH.y - CH.h - 20} L${CH.x},${CH.y} L${CH.x + CH.w + 20},${CH.y}`} p={prog(t, 28.4, 0.6)} width={5} cap="butt" />
        {[0, 0.5, 1].map((e) => (
          <g key={e} opacity={prog(t, 28.8, 0.3)} fontFamily={SANS} fontSize={26} fontWeight={700} fill={C.ink2}>
            <text x={cx(e)} y={CH.y + 40} textAnchor="middle">
              {e * 100}%
            </text>
            {e > 0 ? (
              <text x={CH.x - 16} y={cy(e) + 9} textAnchor="end">
                {e * 100}%
              </text>
            ) : null}
          </g>
        ))}
        <Draw d={`M${cx(0)},${cy(0)} L${cx(1)},${cy(1)}`} p={prog(t, 29.0, 0.8, ease.inOutQuad)} stroke={C.mute} width={5} dash="16 12" />
        <Draw d={curveD} p={prog(t, 30.4, 1.4, ease.inOutQuad)} stroke={C.red} width={9} />
        {/* 50% → 80% 标注 */}
        <g opacity={prog(t, 32.2, 0.4)}>
          <line x1={cx(0.5)} y1={CH.y} x2={cx(0.5)} y2={cy(0.8)} stroke={C.ink} strokeWidth={2} strokeDasharray="6 6" />
          <line x1={CH.x} y1={cy(0.8)} x2={cx(0.5)} y2={cy(0.8)} stroke={C.ink} strokeWidth={2} strokeDasharray="6 6" />
          <circle cx={cx(0.5)} cy={cy(0.5)} r={11} fill={C.mute} />
          <circle cx={cx(0.5)} cy={cy(0.8)} r={13} fill={C.red} stroke={C.ink} strokeWidth={3} />
          <text x={cx(0.5) + 24} y={cy(0.8) - 16} fontFamily={SANS} fontWeight={900} fontSize={40} fill={C.red}>
            80%
          </text>
        </g>
        <text x={cx(0.86)} y={cy(0.72) + 10} fontFamily={SANS} fontWeight={700} fontSize={28} fill={C.mute} opacity={prog(t, 29.6, 0.4)}>
          原以为
        </text>
        <text x={cx(0.04)} y={cy(0.9)} fontFamily={SANS} fontWeight={900} fontSize={32} fill={C.red} opacity={prog(t, 31.6, 0.4)}>
          卡甘发现
        </text>
        {/* 右侧：一个例子 */}
        <g opacity={prog(t, 33.0, 0.4)}>
          {(() => {
            const segs: [string, number, string][] = [
              ['左+左', 56.25, C.red],
              ['左+右', 37.5, C.grey],
              ['右+右', 6.25, C.blue],
            ];
            let x = 1060;
            return segs.map(([l, v, col], i) => {
              const w = (v / 100) * 720 * prog(t, 33.4 + i * 0.3, 0.5, ease.inOutQuad);
              const node = (
                <g key={l}>
                  <rect x={x} y={560} width={w} height={90} fill={col} stroke={C.ink} strokeWidth={3} />
                  <text x={x + 12} y={545} fontFamily={SANS} fontWeight={900} fontSize={i === 2 ? 24 : 30} fill={C.ink} opacity={w > 10 ? 1 : 0}>
                    {i === 2 ? '' : l}
                  </text>
                  <text x={x + 14} y={620} fontFamily={SANS} fontWeight={900} fontSize={34} fill={C.paper} opacity={w > 60 ? 1 : 0}>
                    {i === 2 ? '' : `${Math.round(v)}%`}
                  </text>
                </g>
              );
              x += (v / 100) * 720;
              return node;
            });
          })()}
          <text x={1780} y={545} textAnchor="end" fontFamily={SANS} fontWeight={900} fontSize={30} fill={C.blue} opacity={prog(t, 34.2, 0.3)}>
            右+右 6%
          </text>
        </g>
      </Layer>
      <T x={1060} y={250} at={32.8} out={39.6} size={40} weight={900} width={760}>
        例：手性分子 75% 左、25% 右
      </T>
      <T x={1060} y={312} at={33.0} out={39.6} size={30} weight={500} width={760} color={C.ink2}>
        纯度（ee，两种镜像之差）只有 50%
      </T>
      <T x={1060} y={400} at={33.2} out={39.6} size={30} weight={700} width={760}>
        随机两两配对：
      </T>
      <T x={1060} y={690} at={35.0} out={39.6} size={34} weight={700} width={760}>
        「左+右」几乎不干活；产物 ≈ 左 56 : 右 6
      </T>
      <T x={1060} y={754} at={35.6} out={39.6} size={44} weight={900} width={760}>
        纯度升到 <span style={{color: C.red}}>80%</span>
      </T>
      <T x={220} y={180} at={28.4} out={39.6} size={30} weight={700} width={800}>
        产物纯度（ee）
      </T>
      <T x={540} y={920} at={28.6} out={39.6} size={28} weight={700} align="center" width={800}>
        催化剂中手性分子的纯度（ee）
      </T>
      <T x={1060} y={834} at={36.2} out={39.6} size={24} weight={500} width={760} color={C.ink2}>
        示意：最简单的统计模型，假设「左+右」完全不反应
      </T>
      <T x={960} y={84} at={28.2} out={39.6} size={52} weight={900} align="center">
        结果：曲线是弯的
      </T>

      {/* E 1986 */}
      <Layer opacity={eO}>
        <g transform="translate(1340,560)">
          <rect x={-240} y={-210} width={480} height={420} fill={C.white} stroke={C.ink} strokeWidth={5} />
          <rect x={-240} y={-210} width={480} height={24} fill={C.red} />
          <text x={-200} y={-60} fontFamily={SANS} fontWeight={900} fontSize={110} fill={C.ink}>
            ②
          </text>
          <text x={-200} y={40} fontFamily={SANS} fontWeight={900} fontSize={44} fill={C.ink}>
            放大一种镜像
          </text>
          <text x={-200} y={102} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.ink2}>
            压制另一种
          </text>
          <Check x={160} y={-100} p={prog(t, 42.6, 0.4)} size={80} color={C.red} />
        </g>
      </Layer>
      <T x={120} y={300} at={40.2} out={46.4} size={200} weight={900} lh={1} ls={-6}>
        1986
      </T>
      <T x={120} y={540} at={40.6} out={46.4} size={44} weight={900} width={820} lh={1.5}>
        卡甘在三个不同的反应里，
        <br />
        都看到了这种<Mark p={prog(t, 41.4, 0.5, ease.inOutQuad)}>「非线性效应」</Mark>
      </T>
      <T x={120} y={720} at={41.2} out={46.4} size={26} weight={500} width={820} color={C.ink2}>
        J. Am. Chem. Soc. 1986, 108, 2353
      </T>
      <Caption at={43.0} out={46.6}>
        弗兰克的第 ② 条，实现了
      </Caption>
      <Hud chapter="03 卡甘：非线性效应" at={2.0} />
    </Paper>
  );
};
