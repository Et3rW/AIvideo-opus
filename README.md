# AIvideo-opus

用 [Remotion](https://www.remotion.dev/) 做科普动画的工作区：只给一个主题，由 agent 自选视觉风格、核对资料、写画面和配乐代码，并保证源码能一键复刻成片。

| 作品 | 说明 |
|---|---|
| [`films/nobel2026`](films/nobel2026/) | 2026 诺贝尔物理学奖：冰立方与高能中微子（4:10，1080p60，字幕 + 配乐） |

- 工作约定（选风格流程、工程结构、检查标准、版本管理、换机器）见 [`AGENTS.md`](AGENTS.md)。
- 成片不进 git，在各片目录运行 `build.sh` 复刻，详见各片 README。

## 致谢与来源

视觉风格参考了 **[mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)**（作者 [Vincentwei1021](https://github.com/Vincentwei1021)，MIT 许可）。这个仓库收录了 15 种动态图形风格的提示词、示例源码和评分标准。

- 本仓库**没有收录或转载**它的任何文件。它只在本地克隆到 `references/mg-styles-15/`，并被 `.gitignore` 排除。
- 使用方式：agent 阅读其中的风格提示词，选取合适的风格，按标志性特征和质量清单在 Remotion 里**重新实现**。画面和配乐代码都是本仓库自己写的。
- 每部片子用了哪些风格提示词，写在该片 README 的"风格选择"一节，并附原提示词链接。

片中事实与数据的资料来源列在各片 README 的"资料来源"一节。
