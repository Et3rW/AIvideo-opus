#!/bin/zsh
# 补齐所有片子的配乐：src/Root.tsx 打包时会引入每部片子的 assets/audio.wav，缺一个就哪部都渲染不了。
# 缺失的用各片 build.sh audio 生成（已有的不动）。用法: tools/ensure-audio.sh
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
for b in "$ROOT"/films/*/build.sh; do
  [[ -e ${b:h}/assets/audio.wav ]] || zsh "$b" audio
done
