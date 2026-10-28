import React from 'react';
import {C, SANS} from '../theme';
import {ease, prog, useT} from '../anim';
import {Caption, GridLines, Hud, Layer, Mark, Paper, Pinwheel, T, fade} from '../ui';

/** 四个应用领域的几何图标（中心在原点，约 200px） */
const Icon: React.FC<{k: number}> = ({k}) => {
  if (k === 0)
    // 药物：胶囊
    return (
      <g transform="rotate(-35)">
        <rect x={-100} y={-44} width={200} height={88} rx={44} fill={C.white} stroke={C.ink} strokeWidth={6} />
        <path d="M0,-41 L56,-41 A41,41 0 0 1 56,41 L0,41 Z" fill={C.red} />
      </g>
    );
  if (k === 1)
    // 香料：五瓣花
    return (
      <g>
        {Array.from({length: 5}, (_, i) => {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          return <circle key={i} cx={Math.cos(a) * 52} cy={Math.sin(a) * 52} r={42} fill={C.yellow} stroke={C.ink} strokeWidth={5} />;
        })}
        <circle r={30} fill={C.ink} />
      </g>
    );
  if (k === 2)
    // 农用化学品：两个四分之一圆拼成叶片
    return (
      <g>
        <path d="M-80,80 A160,160 0 0 1 80,-80 L-80,80 Z" fill={C.blue} stroke={C.ink} strokeWidth={5} />
        <path d="M-80,80 A160,160 0 0 0 80,-80 Z" fill={C.paper2} stroke={C.ink} strokeWidth={5} />
        <line x1={-100} y1={100} x2={80} y2={-80} stroke={C.ink} strokeWidth={6} />
      </g>
    );
  // 新材料：六边形晶格
  return (
    <g>
      {[
        [0, 0],
        [-70, -40],
        [70, -40],
        [0, 80],
      ].map(([x, y], i) => (
        <polygon
          key={i}
          points={Array.from({length: 6}, (_, j) => {
            const a = (j / 6) * Math.PI * 2;
            return `${x + Math.cos(a) * 46},${y + Math.sin(a) * 46}`;
          }).join(' ')}
          fill={i === 0 ? C.ink : C.white}
          stroke={C.ink}
          strokeWidth={5}
        />
      ))}
    </g>
  );
};

const APPS = ['药物', '香料与香精', '农用化学品', '新材料'];

export const Future: React.FC = () => {
  const t = useT();
  const aO = fade(t, 2.0, 10.8);
  const bO = fade(t, 11.0, 17.8);
  const cO = fade(t, 18.0, 24.2);
  const end = prog(t, 24.4, 0.7, ease.inOutQuad);
  const spin = t * 24;
  return (
    <Paper>
      <GridLines p={1} />
      {/* A 应用 */}
      <Layer opacity={aO}>
        {APPS.map((name, k) => {
          const x = 360 + k * 400;
          const s = prog(t, 3.0 + k * 0.25, 0.45, ease.inOutQuad);
          return (
            <g key={name}>
              <g transform={`translate(${x},500) scale(${s})`}>
                <Icon k={k} />
              </g>
              <text x={x} y={700} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={40} fill={C.ink} opacity={s}>
                {name}
              </text>
            </g>
          );
        })}
      </Layer>
      <T x={960} y={110} at={2.4} out={10.6} size={56} weight={900} align="center">
        今天，非线性效应是化学家的日常工具
      </T>
      <Caption at={4.8} out={10.8} size={40}>
        看曲线怎么弯，就能推断反应怎么进行，进而做出更纯的单一镜像
      </Caption>

      {/* B 生命起源 */}
      <Layer opacity={bO}>
        {Array.from({length: 13}, (_, i) => {
          const x = 240 + i * 120;
          const s = prog(t, 11.6 + i * 0.08, 0.3, ease.inOutQuad);
          const y1 = 430 + (i % 2 ? -40 : 40);
          const y2 = 700 + Math.sin(i * 0.9 + t * 1.2) * 50;
          return (
            <g key={i}>
              {i < 12 ? (
                <>
                  <line x1={x} y1={y1} x2={x + 120} y2={430 + ((i + 1) % 2 ? -40 : 40)} stroke={C.ink} strokeWidth={5} opacity={s} />
                  <line x1={x} y1={y2} x2={x + 120} y2={700 + Math.sin((i + 1) * 0.9 + t * 1.2) * 50} stroke={C.ink} strokeWidth={5} opacity={s} />
                </>
              ) : null}
              <Pinwheel x={x} y={y1} r={34} hand={-1} scale={s} rot={-t * 30} />
              <Pinwheel x={x} y={y2} r={34} hand={1} scale={prog(t, 12.4 + i * 0.08, 0.3, ease.inOutQuad)} rot={t * 30} />
            </g>
          );
        })}
        <text x={240} y={330} fontFamily={SANS} fontWeight={900} fontSize={34} fill={C.red} opacity={prog(t, 12.0, 0.4)}>
          氨基酸 · 左手型
        </text>
        <text x={240} y={850} fontFamily={SANS} fontWeight={900} fontSize={34} fill={C.blue} opacity={prog(t, 12.8, 0.4)}>
          糖 · 右手型
        </text>
      </Layer>
      <T x={960} y={110} at={11.2} out={17.6} size={56} weight={900} align="center">
        追问生命的起源
      </T>
      <Caption at={13.4} out={17.8} size={40}>
        世界各地的研究者正沿着这条路，尝试造出单一手性的氨基酸和糖
      </Caption>

      {/* C 引语 */}
      <Layer opacity={cO}>
        <rect x={240} y={300} width={24} height={360} fill={C.yellow} />
      </Layer>
      <T x={320} y={280} at={18.4} out={24.0} size={56} weight={900} width={1360} lh={1.55}>
        他们解开了一个超过百年的化学谜题：
        <br />
        同手性，如何能够自发产生。
      </T>
      <T x={320} y={480} at={19.2} out={24.0} size={56} weight={900} width={1360}>
        他们发展的化学反应，<Mark p={prog(t, 19.9, 0.5, ease.inOutQuad)}>令人叹为观止</Mark>。
      </T>
      <T x={320} y={620} at={20.2} out={24.0} size={32} weight={500} width={1360} color={C.ink2}>
        —— 海纳·林克，诺贝尔化学委员会主席（大意）
      </T>

      {/* D 结尾海报 */}
      {end > 0 ? (
        <Layer>
          <rect x={957} y={240} width={6} height={480 * end} fill={C.ink} />
          <Pinwheel x={660} y={480} r={170} hand={-1} scale={end} rot={-spin} />
          <Pinwheel x={1260} y={480} r={170} hand={1} scale={end} rot={spin} opacity={0.22} />
        </Layer>
      ) : null}
      <T x={960} y={96} at={24.6} out={1e9} size={30} weight={700} align="center" ls={10} color={C.ink2}>
        2026 诺贝尔化学奖
      </T>
      <T x={960} y={730} at={25.0} out={1e9} size={76} weight={900} align="center" ls={4}>
        一点偶然 × 自我放大 = <span style={{color: C.red}}>单一手性</span>
      </T>
      <T x={960} y={860} at={25.6} out={1e9} size={34} weight={700} align="center">
        亨利·B·卡甘　·　硖合宪三
      </T>
      <T x={960} y={1006} at={26.2} out={1e9} size={20} weight={500} align="center" color={C.mute}>
        资料：NobelPrize.org（新闻稿、科普材料）、新华社 · 分子与反应画面为示意 · 风格参考 mg-styles-15（MIT）
      </T>
      <Hud chapter="05 镜子之后" at={2.0} out={24.4} />
    </Paper>
  );
};
