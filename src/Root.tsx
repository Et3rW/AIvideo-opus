import React from 'react';
import {Composition} from 'remotion';
import {Film} from '../films/nobel2026/src/Film';
import cues from '../films/nobel2026/src/cues.json';
import {Film as Chem2026Film} from '../films/chem2026/src/Film';
import chemCues from '../films/chem2026/src/cues.json';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Nobel2026"
      component={Film}
      durationInFrames={cues.duration * cues.fps}
      fps={cues.fps}
      width={1920}
      height={1080}
    />
    <Composition
      id="Chem2026"
      component={Chem2026Film}
      durationInFrames={chemCues.duration * chemCues.fps}
      fps={chemCues.fps}
      width={1920}
      height={1080}
    />
  </>
);
