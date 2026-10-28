# AIvideo 工作区约定

> 本文件是这个工作区的项目级约定，随工作区一起迁移。若上级目录还有总则（如 `~/AGENTS.md` 宪法），以总则为准；本文件只补充"怎么做视频"。

## 一、只给主题时，怎么定风格

用户常常只给一个主题（加时长、分辨率等要求），风格由 agent 自己定。流程：

1. **读候选**：读 `references/mg-styles-15/prompts/` 下全部风格提示词（每份含标志性特征、配色、运动、质量清单、创意种子）。
2. **自行判断**：对照主题选择风格，可以混用多种，也可以不用提示词、自己设计。
3. **开工前先告诉用户**：用一两句话说明选了什么、为什么，然后直接开做（不必等确认，除非用户要求）。
4. **记下来**：在该片的 `films/<片名>/README.md` 里写"风格选择"一节，记录选了哪些提示词、各用在哪一段、为什么、哪些是自创。这样选择可审核，换机器、换会话也能延续。

提示词的用法：
- 提示词默认流程是单个 HTML + 无头浏览器录制、固定 10 秒；本工作区用 Remotion，所以**只取风格本身**（标志性特征 + 质量清单作为验收标准），用 Remotion 组件重新实现，时长和画幅按用户要求。
- `references/mg-styles-15/demos/<风格>/` 可参考技法；`rubric.md` 用于成片自评；`template.md` 可用来写新风格。
- 该仓库的配乐工具 `lib/audio` 需要额外 Python 包；本工作区的做法是用 numpy/scipy 直接合成（见现有片子的 `audio/`）。

## 二、工程结构

```
src/index.ts, src/Root.tsx   入口；Root 里为每部片子登记一个 <Composition>
src/assets.d.ts              音频等静态资源的类型声明
films/<片名>/                一部片子的全部内容，不要散落到别处
  ├── <片名>.mp4             成片（不进 git）
  ├── README.md              说明、复现步骤、环境版本、风格选择、资料来源
  ├── build.sh               一键复现，产物只写入 build/（或缺失的 assets/audio.wav），不覆盖已有文件
  ├── src/                   画面源码；cues.json 是场景时间表（画面和配乐共用）
  ├── audio/                 配乐合成与母带脚本（固定随机种子）
  └── assets/                渲染要用的资源，在代码里 import，不放 public/；可由脚本生成的（如 audio.wav）不进 git
references/                  外部参考仓库，只读
tools/                       各片通用的辅助脚本
```

可复用的组件（镜头、贴纸、出字、缓动等）目前在 `films/nobel2026/src/ui.tsx`、`anim.ts`，新片可以复制过去改。

## 三、制作与检查

- 事实、数字、人名、日期要联网核对来源，写进 README；示意性画面在片中标注"示意"，转述的引语标"大意"。
- 先用 `tools/stills.sh` 抽帧拼联系表检查重叠、裁切、可读性，再渲染整片。
- 成片渲染参数：`--image-format=jpeg --crf=16 --x264-preset=slow`；配乐母带到 −14 LUFS、真峰值 ≤ −1.5 dBTP。
- 渲染后核对分辨率、帧率、帧数、时长、响度，并抽查成片画面。
- 配乐无法试听时，要如实告诉用户，请其听过确认。

## 四、版本管理

本工作区是 git 仓库，原则是**追踪能复刻作品的一切，不追踪能再生成的东西**：
- 追踪：源码、场景时间表、配乐脚本、README、构建脚本、依赖锁定文件（`pnpm-lock.yaml`、`requirements.txt`）。
- 不追踪（见 `.gitignore`）：成片 mp4、`build/`、可由脚本逐字节生成的 `assets/audio.wav`、`node_modules/`、`references/`。
- 新片要保证：干净克隆后跑 `films/<片名>/build.sh` 就能复刻；手工制作、无法用脚本再生成的素材要进 git。

## 五、换机器

```bash
git clone https://github.com/Et3rW/AIvideo-opus.git && cd AIvideo-opus
pnpm install --frozen-lockfile
pip install -r requirements.txt   # 或用已有的、版本一致的 Python 环境
git clone --depth 1 --filter=blob:none --no-checkout https://github.com/Vincentwei1021/mg-styles-15.git references/mg-styles-15
git -C references/mg-styles-15 sparse-checkout set --no-cone '/*' '!/videos/' '!/docs/'
git -C references/mg-styles-15 checkout 49052d80bfaf9fa8412cc9710530e5e95a3b8d8c
```

然后用各片的 `build.sh` 复刻成片。另需：Node + pnpm（版本见 `package.json`）、ffmpeg。各片 README 记有当时的具体版本。
