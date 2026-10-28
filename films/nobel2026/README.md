# 2026 诺贝尔物理学奖：冰立方与高能中微子

4 分 10 秒，1920×1080，60fps，无旁白（字幕 + 配乐），响度 −14 LUFS。

## 目录

| 路径 | 内容 |
|---|---|
| `nobel2026.mp4` | 成片（不进 git，用 `build.sh` 复刻） |
| `src/` | Remotion 源码：`Film.tsx` 总装，`cues.json` 场景时间表（画面和配乐共用），`scenes/` 各场景，`ui.tsx` 镜头/贴纸/文字组件，`anim.ts` 缓动与动画工具，`theme.ts` 配色与字体 |
| `audio/nobel2026_audio.py` | 配乐与音效合成（numpy/scipy，固定随机种子） |
| `audio/master.sh` | 两遍 ffmpeg loudnorm 母带处理 |
| `assets/audio.wav` | 母带后的配乐，渲染时直接引用（不进 git，`build.sh` 缺失时自动生成） |
| `build.sh` | 一键复现，产物写入 `build/` |

工作区根目录的 `src/index.ts`、`src/Root.tsx` 负责注册合成（`Nobel2026`），`package.json` + `pnpm-lock.yaml` 锁定前端依赖，根目录 `requirements.txt` 锁定配乐用的 Python 包。

## 复现

```bash
pnpm install --frozen-lockfile        # 在工作区根目录，node_modules 缺失时
films/nobel2026/build.sh              # 配乐 + 渲染；也可只跑 audio 或 video
```

成片出现在 `films/nobel2026/build/nobel2026.mp4`。已有的 `assets/audio.wav` 和成片不会被覆盖。

配乐基准：`assets/audio.wav` 的 PCM MD5 应为 `d8b41dab0c2decc24022157f6855f799`（`build.sh audio` 会打印）。Python 包版本不同时可能不再逐字节一致，但听感相同。

2026-10-28 整理目录后实测：
- 配乐重新合成后与 `assets/audio.wav` 的 PCM 逐字节一致。
- 重新渲染的画面与成片相比 SSIM 0.99984、PSNR 平均 61 dB，音轨一致。Chromium/GPU 光栅化有微小差异，所以视频不是逐字节一致。

## 当时的环境

- macOS（Apple M5），Node 26.12.1，pnpm 12.15.0，Remotion 4.0.539，three 0.186，React 19.3
- 3D 渲染：Chromium ANGLE（Metal），见根目录 `remotion.config.ts`
- Python 3.12.15（conda 环境 `caos`），numpy 2.5.4，scipy 1.18.1，soundfile 0.14.0
- ffmpeg 9.0.2
- 渲染参数：`--image-format=jpeg --crf=16 --x264-preset=slow`，整片约 3 分钟

## 风格选择

用户只给了主题、时长（3–5 分钟）和规格（1080p60），选择"无旁白，字幕 + 配乐"。风格由 agent 按根目录 `AGENTS.md` 的流程自选：

| 段落 | 风格 | 理由 |
|---|---|---|
| 开场、诺奖揭晓、01–02 章、03 章前半、04–05 章 | [`19-paperclip`](https://github.com/Vincentwei1021/mg-styles-15/blob/main/prompts/19-paperclip.md) 回形针（浅色画布、白边贴纸、遮罩出字、数字滚动、镜头在大画布上串联） | 主题以讲清原理和数字为主，信息讲解型最合适 |
| 下潜冰层、切伦科夫图、三维事件 | [`22-hud`](https://github.com/Vincentwei1021/mg-styles-15/blob/main/prompts/22-hud.md)（深色、等宽字读数、扫描线式界面元素） | 冰下探测器、数据读数天然是界面感 |
| 三维事件显示 | 自创（按冰立方真实 86 串 × 60 个光学模块排布，按命中时间着色） | 提示词里没有对应风格，但这是让观众"看见"中微子最直接的画面 |

风格提示词来自 [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)（作者 Vincentwei1021，MIT 许可）。本片只参考了风格描述，画面代码是重新编写的，没有复制该仓库的源码或素材。

浅色转深色的衔接：镜头从雪面下潜到 2000 米深，背景随深度变暗。排除的风格：合成波、液态、像素等偏情绪或装饰，不适合科普叙事。

## 资料来源

NobelPrize.org、Scientific American、UW–Madison News、NSF、Wikipedia（IceCube Neutrino Observatory、Francis Halzen）、Sweden Herald（奖金）、第一财经。三维事件和切伦科夫图为示意；哈尔岑引语为大意翻译。
