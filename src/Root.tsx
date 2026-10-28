import React from 'react';
import {Composition, Still} from 'remotion';
import {Film} from '../films/nobel-physics-2026-icecube/src/Film';
import cues from '../films/nobel-physics-2026-icecube/src/cues.json';
import {Cover} from '../films/nobel-physics-2026-icecube/src/Cover';
import {Film as Chem2026Film} from '../films/chem2026/src/Film';
import chemCues from '../films/chem2026/src/cues.json';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="NobelPhysics2026"
      component={Film}
      durationInFrames={cues.duration * cues.fps}
      fps={cues.fps}
      width={1920}
      height={1080}
    />
    <Still id="NobelPhysics2026-Cover16x9" component={Cover} defaultProps={{ratio: '16x9' as const}} width={1920} height={1080} />
    <Still id="NobelPhysics2026-Cover4x3" component={Cover} defaultProps={{ratio: '4x3' as const}} width={1440} height={1080} />
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
