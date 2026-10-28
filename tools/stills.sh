#!/bin/zsh
# 抽帧检查：打包一次，按秒数渲染半分辨率静帧，拼成 2x2 联系表（红线分隔）
# 用法: tools/stills.sh <合成ID> <输出目录> <秒> [<秒> ...]
#   例: tools/stills.sh NobelPhysics2026 /tmp/check 91 94 97.5
# 输出目录必须是新目录（脚本不清空已有目录）
set -e
ID=$1; OUT=$2; shift 2
ROOT=$(cd "$(dirname "$0")/.." && pwd)
[[ -e $OUT ]] && { echo "输出目录已存在：$OUT，请换一个新目录"; exit 1; }
mkdir -p $OUT/bundle
cd $ROOT
zsh tools/ensure-audio.sh
npx remotion bundle src/index.ts --out-dir=$OUT/bundle --log=error >/dev/null
FPS=$(npx remotion compositions $OUT/bundle 2>&1 | awk -v id=$ID '$1==id{print $2}')
for s in "$@"; do
  f=$(python3 -c "print(int(round($s*$FPS)))")
  npx remotion still $OUT/bundle $ID $OUT/s$(printf %06.1f $s).jpg --frame=$f --image-format=jpeg --scale=0.5 --log=error >/dev/null
done
ffmpeg -loglevel error -pattern_type glob -i "$OUT/s*.jpg" -vf "tile=2x2:padding=6:color=red" $OUT/sheet%02d.jpg
ls $OUT/sheet*.jpg
