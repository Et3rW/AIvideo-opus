#!/bin/zsh
# 两遍 loudnorm：先测量，再按测量值线性标准化到 −14 LUFS、真峰值 ≤ −1.5 dBTP
# 用法: master.sh [输出路径]，输入 build/audio_raw.wav，输出默认 build/audio.wav
set -e
cd "$(dirname "$0")/.."
IN=build/audio_raw.wav
OUT=${1:-build/audio.wav}
J=$(ffmpeg -hide_banner -nostats -i $IN -af loudnorm=I=-14:TP=-2.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$J" | python3 -c "import sys,json; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -loglevel error -y -i $IN -af "loudnorm=I=-14:TP=-2.2:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" -c:a pcm_s24le -fflags +bitexact -flags:a +bitexact $OUT
ffmpeg -hide_banner -nostats -i $OUT -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
