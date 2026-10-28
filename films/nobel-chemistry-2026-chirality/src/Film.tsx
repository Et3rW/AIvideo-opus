import React, {useLayoutEffect} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender} from 'remotion';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import '@fontsource/noto-sans-sc/900.css';
import cues from './cues.json';
import audioSrc from '../assets/audio.wav';
import {C} from './theme';
import {ChapterCard} from './ui';
import {Hook} from './scenes/Hook';
import {Nobel} from './scenes/Nobel';
import {Chiral} from './scenes/Chiral';
import {Mystery} from './scenes/Mystery';
import {Kagan} from './scenes/Kagan';
import {Soai} from './scenes/Soai';
import {Future} from './scenes/Future';

const SCENES: Record<string, React.FC> = {
  hook: Hook,
  nobel: Nobel,
  chiral: Chiral,
  mystery: Mystery,
  kagan: Kagan,
  soai: Soai,
  future: Future,
};

/** 思源黑体按 unicode-range 分片加载：每帧把当前画面上的字都请求一遍，加载完再截图。 */
export const FontWait: React.FC = () => {
  useLayoutEffect(() => {
    const h = delayRender('fonts');
    const text = document.body.innerText + '0123456789%';
    Promise.all([400, 500, 700, 900].map((w) => document.fonts.load(`${w} 40px "Noto Sans SC"`, text)))
      .then(() => document.fonts.ready)
      .then(() => continueRender(h))
      .catch(() => continueRender(h));
  });
  return null;
};

export const HAS_AUDIO = true;

export const Film: React.FC = () => {
  const fps = cues.fps;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {cues.scenes.map((s) => {
        const S = SCENES[s.id];
        return (
          <Sequence key={s.id} from={Math.round(s.start * fps)} durationInFrames={Math.round((s.end - s.start) * fps)} name={s.id}>
            <S />
          </Sequence>
        );
      })}
      {cues.scenes
        .filter((s) => s.chapter)
        .map((s) => (
          <Sequence key={`ch${s.id}`} from={Math.round(s.start * fps)} durationInFrames={Math.round(2.1 * fps)} name={`card ${s.chapter}`}>
            <ChapterCard num={s.chapter!} title={s.title!} />
          </Sequence>
        ))}
      {HAS_AUDIO ? <Audio src={audioSrc} /> : null}
      <FontWait />
    </AbsoluteFill>
  );
};
