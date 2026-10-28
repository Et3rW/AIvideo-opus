import React from 'react';
import {Composition} from 'remotion';
import {Film} from '../films/nobel2026/src/Film';
import cues from '../films/nobel2026/src/cues.json';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Nobel2026"
    component={Film}
    durationInFrames={cues.duration * cues.fps}
    fps={cues.fps}
    width={1920}
    height={1080}
  />
);
