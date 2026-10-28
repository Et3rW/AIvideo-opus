import {Config} from '@remotion/cli/config';

// 3D 画面用 GPU 渲染：ANGLE 把 WebGL 翻译成 Metal，跑在 M5 GPU 上。
// 怀疑是 GPU 驱动问题时，用 `npm run still:cpu` 以 CPU（SwiftShader）渲染同一帧对比。
Config.setChromiumOpenGlRenderer('angle');

// 编码方式按用途放在 package.json 的脚本里：
//   render:preview  样片：硬件编码（VideoToolbox），半分辨率，速度优先
//   render:final    成片：CPU 编码 x264，CRF 16，速度换画质
//   render:master   母带：ProRes 422 HQ，优先用硬件编码
