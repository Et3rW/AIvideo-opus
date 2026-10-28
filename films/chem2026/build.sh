#!/bin/zsh
# 一键复现。用法：./build.sh [audio|video|all]，默认 all。
#   audio  合成配乐 → 母带。assets/audio.wav 不存在时生成到那里；已存在则生成到 build/audio.wav 并比对 PCM
#   video  渲染整片到 build/chem2026.mp4（缺配乐时先跑 audio）
# 产物只写进 build/ 或缺失的 assets/audio.wav，不覆盖已有文件；确认无误后再手动替换。
set -e
FILM=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$FILM/../.." && pwd)
STEP=${1:-all}
ASSET=$FILM/assets/audio.wav

audio() {
  python3 "$FILM/audio/chem2026_audio.py"
  if [[ ! -e $ASSET ]]; then
    mkdir -p "$FILM/assets"
    zsh "$FILM/audio/master.sh" "$ASSET"
    echo "已生成 $ASSET"
  else
    zsh "$FILM/audio/master.sh" "$FILM/build/audio.wav"
    a=$(ffmpeg -loglevel error -i "$ASSET" -map 0:a -f md5 -)
    b=$(ffmpeg -loglevel error -i "$FILM/build/audio.wav" -map 0:a -f md5 -)
    [[ $a == $b ]] && echo "配乐与 assets/audio.wav 一致" || echo "注意：配乐与 assets/audio.wav 不同（$a vs $b）"
  fi
  echo "PCM $(ffmpeg -loglevel error -i "$ASSET" -map 0:a -f md5 -)（README 记录的基准见“复现”一节）"
}

[[ $STEP == audio || $STEP == all ]] && audio
if [[ $STEP == video || $STEP == all ]]; then
  [[ -e $ASSET ]] || audio
  mkdir -p "$FILM/build"
  cd "$ROOT"
  npx remotion render src/index.ts Chem2026 "$FILM/build/chem2026.mp4" \
    --image-format=jpeg --crf=16 --x264-preset=slow --log=error
  echo "渲染完成：$FILM/build/chem2026.mp4"
fi
