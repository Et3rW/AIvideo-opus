# AIvideo-opus

用 [Remotion](https://www.remotion.dev/) 做科普动画的工作区：只给一个主题，由 agent 自选视觉风格、核对资料、写画面和配乐代码，并保证源码能一键复刻成片。

| 作品 | 说明 |
|---|---|
| [`films/nobel2026`](films/nobel2026/) | 2026 诺贝尔物理学奖：冰立方与高能中微子（4:10，1080p60，字幕 + 配乐） |

- 工作约定（选风格流程、工程结构、检查标准、版本管理、换机器）见 [`AGENTS.md`](AGENTS.md)。
- 成片不进 git，在各片目录运行 `build.sh` 复刻，详见各片 README。

## 环境与工具

| 工具 | 要求 | 实测版本 | 用途 |
|---|---|---|---|
| Node.js | ≥ 26 | 26.12.1 | 运行 Remotion |
| pnpm | 12.15.0（见 `package.json` 的 `packageManager`） | 12.15.0 | 按 `pnpm-lock.yaml` 安装前端依赖 |
| Python | 3.12，包见 `requirements.txt`（numpy / scipy / soundfile） | 3.12.15 | 合成配乐 |
| ffmpeg | 需带 `loudnorm`、`ebur128` 滤镜（常规构建都有） | 9.0.2 | 配乐母带、校验 |
| git | 任意近期版本 | 2.56.0 | 克隆本仓库和参考仓库 |

- 实测平台：macOS，Apple Silicon（M5）。3D 画面通过 Chromium ANGLE 走 Metal 渲染（见 `remotion.config.ts`）；Windows / Linux 未测试，可能要改这一项。
- Remotion 首次渲染会自动下载 Chrome Headless Shell，需要联网。
- 磁盘：`node_modules` 约 1.4 GB；渲染一部片子的中间产物和成片约 250 MB。
- 主要前端依赖（版本由 lockfile 锁定）：Remotion 4.0.539、React 19.3、three 0.186、@react-three/fiber 9、@fontsource/noto-sans-sc（思源黑体，随依赖安装，无需另装字体）。

### 安装与复刻

```bash
git clone https://github.com/Et3rW/AIvideo-opus.git && cd AIvideo-opus
pnpm install --frozen-lockfile
pip install -r requirements.txt     # 或使用版本一致的已有 Python 环境
films/nobel2026/build.sh            # 生成配乐并渲染，成片在 films/nobel2026/build/
```

只改画面、想实时预览时运行 `pnpm studio`。风格参考仓库只在让 agent 做新片时需要，克隆方法见 `AGENTS.md`「换机器」一节；复刻已有作品不需要它。

## 致谢与来源

视觉风格参考了 **[mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)**（作者 [Vincentwei1021](https://github.com/Vincentwei1021)，MIT 许可）。这个仓库收录了 15 种动态图形风格的提示词、示例源码和评分标准。

- 本仓库**没有收录或转载**它的任何文件。它只在本地克隆到 `references/mg-styles-15/`，并被 `.gitignore` 排除。
- 使用方式：agent 阅读其中的风格提示词，选取合适的风格，按标志性特征和质量清单在 Remotion 里**重新实现**。画面和配乐代码都是本仓库自己写的。
- 每部片子用了哪些风格提示词，写在该片 README 的"风格选择"一节，并附原提示词链接。

片中事实与数据的资料来源列在各片 README 的"资料来源"一节。
