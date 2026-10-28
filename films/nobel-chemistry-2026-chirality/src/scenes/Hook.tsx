import React from 'react';
import {C, H, W} from '../theme';
import {ease, prog, useT} from '../anim';
import {GridLines, Hand, Layer, Paper, Pinwheel, T, mv} from '../ui';

/* 开场：左右手互为镜像却无法重合 → 分子也有左右手 → 生命只用一只 */
export const Hook: React.FC = () => {
  const t = useT();
  const axis = prog(t, 0, 0.5, ease.inOutQuad);
  const leftIn = prog(t, 0.6, 0.7, ease.inOutQuad);
  const rightIn = prog(t, 1.4, 0.7, ease.inOutQuad);
  // 左手平移到右手上（5 个模数），再回来
  const lx = mv(t, [
    [5.2, 660],
    [6.4, 1260],
    [8.4, 1260],
    [9.2, 660],
  ]);
  const handS = 1.15 * (1 - prog(t, 9.0, 0.6, ease.inOutQuad));
  const pinS = prog(t, 9.3, 0.6, ease.inOutQuad);
  const spin = Math.max(0, t - 9.3) * 30;
  const grey = prog(t, 13.4, 0.6, ease.inOutQuad);
  const misfit = prog(t, 6.6, 0.4) * (1 - prog(t, 8.2, 0.3));
  return (
    <Paper>
      <GridLines p={prog(t, 0, 1.4)} />
      <Layer>
        <defs>
          <clipPath id="hookL">
            <rect x={0} y={H - H * leftIn} width={960} height={H} />
          </clipPath>
          <clipPath id="hookR">
            <rect x={960} y={0} width={(W / 2) * rightIn} height={H} />
          </clipPath>
        </defs>
        {/* 镜面轴 */}
        <rect x={957} y={190} width={6} height={650 * axis} fill={C.ink} />
        {handS > 0 ? (
          <>
            <g clipPath="url(#hookR)">
              <Hand x={1260} y={560} s={handS} flip color={C.blue} />
            </g>
            <g clipPath={t < 5.2 ? 'url(#hookL)' : undefined}>
              <Hand x={lx} y={560} s={handS} color={C.red} blend={t > 5.2 && t < 9.2} opacity={t > 5.2 && t < 9.2 ? 0.88 : 1} />
            </g>
          </>
        ) : null}
        {/* 对不齐的拇指 */}
        {misfit > 0 ? (
          <g opacity={misfit}>
            <circle cx={1260 - 150} cy={560 + 70} r={92} fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="14 10" />
            <circle cx={1260 + 150} cy={560 + 70} r={92} fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="14 10" />
          </g>
        ) : null}
        <Pinwheel x={660} y={540} r={190} hand={-1} scale={pinS} rot={-spin} />
        <Pinwheel
          x={1260}
          y={540}
          r={190}
          hand={1}
          scale={pinS}
          rot={spin}
          color={grey > 0 ? mixHex(C.blue, C.grey, grey) : C.blue}
          hub={grey > 0 ? mixHex(C.ink, C.grey, grey) : C.ink}
        />
      </Layer>
      <T x={960} y={96} at={2.4} out={5.0} size={64} weight={900} align="center">
        左手与右手，互为镜像
      </T>
      <T x={960} y={96} at={6.6} out={8.9} size={64} weight={900} align="center">
        叠在一起，却怎么也对不齐
      </T>
      <T x={960} y={96} at={9.9} out={12.7} size={64} weight={900} align="center">
        分子，也分左手和右手
      </T>
      <T x={660} y={790} at={10.3} out={15.6} size={36} weight={700} align="center" width={400} color={C.red}>
        左手型
      </T>
      <T x={1260} y={790} at={10.5} out={15.6} size={36} weight={700} align="center" width={400} color={grey > 0.5 ? C.mute : C.blue}>
        右手型
      </T>
      <T x={960} y={96} at={12.9} out={15.6} size={64} weight={900} align="center">
        可生命，只用其中一只
      </T>
      <T x={960} y={880} at={14.0} out={15.7} size={96} weight={900} align="center" color={C.red} ls={8}>
        为什么？
      </T>
    </Paper>
  );
};

export const mixHex = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
};
