"""2026 诺贝尔化学奖短片配乐：纯 numpy/scipy 合成（无采样、无外部音频），120 BPM 极简电子。

合成器与音效函数沿用 films/nobel-physics-2026-icecube/audio/nobel2026_audio.py，编曲与音效时间点为本片新写。

时间点与 src/cues.json 的场景表一一对应；场景内的动作时间（局部秒）写在 CUES 里。
输出：build/audio_raw.wav（未做响度标准化），再由 master.sh 用 ffmpeg loudnorm 母带到 −14 LUFS。
随机数固定种子，同一套 numpy/scipy 版本下每次输出逐字节相同。
"""
import json
import pathlib

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
ROOT = pathlib.Path(__file__).resolve().parents[1]  # films/nobel-chemistry-2026-chirality
CUES = json.loads((ROOT / 'src/cues.json').read_text())
DUR = CUES['duration']
N = int(DUR * SR)
S = {s['id']: s['start'] for s in CUES['scenes']}

rng = np.random.default_rng(2026)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def n(name):
    """'F#4' → MIDI"""
    p, o = name[:-1], int(name[-1])
    return 12 * (o + 1) + NOTE[p]


# ---------------------------------------------------------------- buses
class Bus:
    def __init__(self, name):
        self.name = name
        self.x = np.zeros((N, 2), np.float32)

    def add(self, snd, t, gain_db=0.0, pan=0.0):
        if snd.ndim == 1:
            l = np.sqrt(0.5 * (1 - pan))
            r = np.sqrt(0.5 * (1 + pan))
            snd = np.stack([snd * l * 1.414, snd * r * 1.414], 1)
        i0 = int(round(t * SR))
        if i0 >= N:
            return
        if i0 < 0:
            snd = snd[-i0:]
            i0 = 0
        m = min(len(snd), N - i0)
        self.x[i0 : i0 + m] += snd[:m] * (10 ** (gain_db / 20))


music = Bus('music')
verb_send = Bus('verb')
sfx = Bus('sfx')


# ---------------------------------------------------------------- dsp helpers
def env_adsr(L, a, d, s, r, sr=SR):
    a_n, d_n, r_n = int(a * sr), int(d * sr), int(r * sr)
    sus = max(L - a_n - d_n - r_n, 0)
    e = np.concatenate(
        [np.linspace(0, 1, a_n, False), np.linspace(1, s, d_n, False), np.full(sus, s), np.linspace(s, 0, r_n)]
    )
    return np.pad(e, (0, max(0, L - len(e))))[:L]


def lp(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def bp(x, f1, f2, order=2):
    sos = signal.butter(order, [f1, min(f2, SR * 0.45)], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def tvlp(x, fc_curve):
    """时变一阶低通（逐样本截止频率）。"""
    y = np.empty_like(x)
    a = 1 - np.exp(-2 * np.pi * np.asarray(fc_curve) / SR)
    z = 0.0
    for i in range(len(x)):
        z += a[i] * (x[i] - z)
        y[i] = z
    return y


def saw(f, L, phase=0.0):
    t = np.arange(L) / SR
    ph = (f * t + phase) % 1.0
    return 2 * ph - 1


def sine(f, L, phase=0.0):
    t = np.arange(L) / SR
    return np.sin(2 * np.pi * f * t + phase)


# ---------------------------------------------------------------- instruments
def pad(notes, dur, bright=1800, att=1.2, rel=1.6, detune=0.12):
    L = int((dur + rel) * SR)
    out = np.zeros((L, 2))
    for k, m in enumerate(notes):
        f = midi(m)
        for j, dt in enumerate((-detune, 0.0, detune)):
            ff = f * 2 ** (dt / 12)
            v = saw(ff, L, rng.random())
            pan = (j - 1) * 0.6
            out[:, 0] += v * (1 - pan) * 0.5
            out[:, 1] += v * (1 + pan) * 0.5
    out = lp(out, bright, 2) / (len(notes) * 2.5)
    e = env_adsr(L, att, 0.4, 0.85, rel)
    return out * e[:, None]


def marimba(m, vel=1.0, dur=0.9):
    f = midi(m)
    L = int(dur * SR)
    t = np.arange(L) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 28)
    x += 0.15 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 60)
    x[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return x * vel * 0.5


def bell(m, vel=1.0, dur=3.0, ratio=3.5, index=2.2):
    f = midi(m)
    L = int(dur * SR)
    t = np.arange(L) / SR
    I = index * np.exp(-t * 2.2)
    x = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * ratio * t)) * np.exp(-t * 1.6)
    x[: int(0.003 * SR)] *= np.linspace(0, 1, int(0.003 * SR))
    return x * vel * 0.4


def pluck_glass(m, vel=1.0, dur=1.6):
    f = midi(m)
    L = int(dur * SR)
    t = np.arange(L) / SR
    x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 3.5)
    x[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return x * vel * 0.35


def bass(m, dur, vel=1.0):
    f = midi(m)
    L = int((dur + 0.08) * SR)
    x = 0.7 * sine(f, L) + 0.35 * lp(saw(f, L), 500, 2)
    e = env_adsr(L, 0.006, 0.12, 0.7, 0.08)
    return x * e * vel * 0.55


def kick(vel=1.0, f0=120, f1=45, dec=0.35):
    L = int(0.6 * SR)
    t = np.arange(L) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / dec)
    click = rng.standard_normal(L) * np.exp(-t * 400) * 0.25
    return (x + hp(click, 1500)) * vel * 0.9


def snare(vel=1.0):
    L = int(0.35 * SR)
    t = np.arange(L) / SR
    noise = bp(rng.standard_normal(L), 1500, 9000) * np.exp(-t * 18)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return (noise * 0.8 + tone * 0.5) * vel * 0.5


def hat(vel=1.0, open_=False):
    L = int((0.3 if open_ else 0.06) * SR)
    t = np.arange(L) / SR
    x = hp(rng.standard_normal(L), 7000) * np.exp(-t * (12 if open_ else 70))
    return x * vel * 0.25


def shaker(vel=1.0):
    L = int(0.09 * SR)
    t = np.arange(L) / SR
    e = np.minimum(t / 0.02, 1) * np.exp(-t * 40)
    return bp(rng.standard_normal(L), 4000, 12000) * e * vel * 0.18


# ---------------------------------------------------------------- sfx
def whoosh(dur=0.9, peak=0.6, lo=300, hi=5000, vel=1.0):
    L = int(dur * SR)
    t = np.arange(L) / SR
    u = t / dur
    e = np.where(u < peak, (u / peak) ** 2, np.exp(-(u - peak) / (1 - peak) * 4))
    fc = lo + (hi - lo) * np.where(u < peak, u / peak, 1 - (u - peak) / (1 - peak) * 0.7)
    x = tvlp(rng.standard_normal(L), fc)
    x = hp(x, 150)
    st = np.stack([x * (0.6 + 0.4 * u), x * (1.0 - 0.4 * u)], 1)
    return st * e[:, None] * vel * 1.6, peak * dur


def tick(freq=3200, vel=1.0):
    L = int(0.03 * SR)
    t = np.arange(L) / SR
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 260) * vel * 0.4


def pop(f0=900, f1=320, vel=1.0):
    L = int(0.12 * SR)
    t = np.arange(L) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 60)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35)
    return x * vel * 0.55


def thud(vel=1.0):
    return kick(vel, 90, 38, 0.5) * 0.8


def impact(vel=1.0):
    L = int(2.5 * SR)
    t = np.arange(L) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.6)
    nz = lp(rng.standard_normal(L), 2500) * np.exp(-t * 6) * 0.5
    x = sub * 0.9 + nz
    return x * vel * 0.8


def riser(dur=2.0, vel=1.0, f_lo=300, f_hi=7000):
    L = int(dur * SR)
    u = np.arange(L) / L
    x = tvlp(rng.standard_normal(L), f_lo + (f_hi - f_lo) * u**2)
    tone = sine(1, L) * 0  # 占位，保持接口简单
    return (x * u**1.6 + tone) * vel * 0.9


def typing(n_keys, rate, vel=1.0):
    L = int((n_keys / rate + 0.1) * SR)
    x = np.zeros(L)
    for k in range(n_keys):
        i = int((k / rate + rng.random() * 0.012) * SR)
        c = tick(2000 + rng.random() * 1500, 0.6 + rng.random() * 0.4)
        m = min(len(c), L - i)
        x[i : i + m] += c[:m]
    return x * vel


def lock_on(vel=1.0):
    L = int(0.5 * SR)
    t = np.arange(L) / SR
    beeps = np.zeros(L)
    for k, (tt, f) in enumerate([(0.0, 1600), (0.12, 1600), (0.24, 2400)]):
        i = int(tt * SR)
        b = np.sin(2 * np.pi * f * t[: int(0.09 * SR)]) * np.exp(-t[: int(0.09 * SR)] * 30)
        beeps[i : i + len(b)] += b
    return beeps * vel * 0.3


def shimmer(root=n('D6'), vel=1.0):
    out = np.zeros(int(3.5 * SR))
    for k, iv in enumerate([0, 4, 7, 11, 14, 19]):
        b = bell(root + iv - 12, 0.5, 3.0, ratio=2.0, index=1.0)
        i = int(k * 0.05 * SR)
        out[i : i + len(b)] += b[: len(out) - i]
    return out * vel


# ---------------------------------------------------------------- 包豪斯的“咔嗒”：带音高的短促电子音
def blip(m, vel=1.0, dur=0.16, fm=2.0):
    f = midi(m)
    L = int(dur * SR)
    t = np.arange(L) / SR
    x = np.sin(2 * np.pi * f * t + 1.2 * np.exp(-t * 40) * np.sin(2 * np.pi * f * fm * t)) * np.exp(-t * 28)
    x[: int(0.001 * SR)] *= np.linspace(0, 1, int(0.001 * SR))
    return x * vel * 0.45


def click(vel=1.0):
    L = int(0.025 * SR)
    t = np.arange(L) / SR
    return hp(rng.standard_normal(L), 3000) * np.exp(-t * 300) * vel * 0.5


def rim(vel=1.0):
    L = int(0.08 * SR)
    t = np.arange(L) / SR
    x = np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 90) + 0.5 * bp(rng.standard_normal(L), 2000, 6000) * np.exp(-t * 120)
    return x * vel * 0.35


def clap(vel=1.0):
    L = int(0.3 * SR)
    t = np.arange(L) / SR
    e = np.zeros(L)
    for k in range(3):
        i = int(k * 0.011 * SR)
        e[i:] += np.exp(-(t[: L - i]) * (90 if k < 2 else 16))
    return bp(rng.standard_normal(L), 900, 6000) * e * vel * 0.3


def sub_pluck(m, dur, vel=1.0):
    f = midi(m)
    L = int((dur + 0.05) * SR)
    x = sine(f, L) + 0.3 * lp(saw(f, L), 900, 2)
    e = env_adsr(L, 0.004, 0.09, 0.35, 0.05)
    return x * e * vel * 0.6


def cascade(t, n_=16, span=0.3, gain=-14, base=n('A5')):
    """章节卡：16 列黑块落下 = 一串下行的咔嗒声"""
    for k in range(n_):
        sfx.add(blip(base - (k % 5) * 2, 0.5, 0.06, 1.0), t + k * span / n_, gain, pan=-0.8 + 1.6 * k / (n_ - 1))


# ---------------------------------------------------------------- 编曲：120 BPM 极简电子
BPM = CUES['bpm']
BEAT = 60 / BPM
BAR = 4 * BEAT
# A 小调：Am9 – Fmaj7 – Dm9 – Em7（每小节一个和弦）
PROG = [
    (n('A2'), [n('C4'), n('E4'), n('G4'), n('B4')]),
    (n('F2'), [n('A3'), n('C4'), n('E4'), n('G4')]),
    (n('D2'), [n('F3'), n('A3'), n('C4'), n('E4')]),
    (n('E2'), [n('G3'), n('B3'), n('D4'), n('E4')]),
]
PENTA = [n(x) for x in ('A5', 'C6', 'D6', 'E6', 'G6', 'A6')]


def groove(t0, t1, level=1.0, kick_on=True, hats=True, bass_on=True, pad_on=True, arp=False, clap_on=False, rim_on=False,
           pad_bright=2000, breaks=()):
    nbars = int(np.ceil((t1 - t0) / BAR - 1e-6))
    for b in range(nbars):
        bt = t0 + b * BAR
        root, chord = PROG[b % 4]
        on = b not in breaks
        if pad_on:
            L = min(BAR, t1 - bt)
            music.add(pad(chord, L, bright=pad_bright, att=0.25, rel=0.6) * 0.8 * level, bt, -7)
            verb_send.add(pad(chord, L, bright=1500, att=0.25, rel=0.6) * 0.5 * level, bt, -8)
        for i in range(8):
            tt = bt + i * BEAT / 2
            if tt >= t1 - 1e-6:
                break
            if on and kick_on and i % 2 == 0:
                music.add(kick(0.9, 110, 46, 0.28) * level, tt, -2)
            if on and hats and i % 2 == 1:
                music.add(hat(0.8) * level, tt, -9, pan=0.25)
            if on and rim_on and i in (3, 7):
                music.add(rim(0.8) * level, tt, -10, pan=-0.3)
            if on and clap_on and i in (2, 6):
                music.add(clap() * level, tt, -5)
                verb_send.add(clap(0.7) * level, tt, -8)
            if on and bass_on and i % 2 == 1:
                music.add(sub_pluck(root + (12 if i == 5 else 0), BEAT * 0.4, 0.9) * level, tt, -3)
            if arp:
                m = chord[[0, 2, 1, 3, 2, 0, 3, 1][i]] + 12
                x = marimba(m, 0.6 if i % 2 else 0.8)
                music.add(x * level, tt, -5, pan=0.3 if i % 2 else -0.3)
                verb_send.add(x * level * 0.6, tt, -5)


def drone(t0, dur, notes, bright=1200, gain=-4, att=1.5):
    music.add(pad(notes, dur, bright=bright, att=att, rel=1.5), t0, gain)
    verb_send.add(pad(notes, dur, bright=bright, att=att, rel=1.5), t0, gain - 6)


# 开场：Am 低铺 + 时钟般的边击（机械感），没有底鼓
drone(0.0, 15.5, [n('A2'), n('E3'), n('C4'), n('B4')], bright=900, gain=-3, att=2.0)
for k in range(int(14 / BEAT)):
    t = 2.0 + k * BEAT
    music.add(rim(0.5 if k % 4 else 0.8), t, -14, pan=-0.2 if k % 2 else 0.2)
# 诺奖段：律动进入
groove(S['nobel'], S['chiral'], level=0.8, rim_on=True)
# 01：三维段只留铺底与马林巴琶音；同手性段律动回来
groove(S['chiral'] + 2, S['chiral'] + 24, level=0.75, kick_on=False, hats=False, bass_on=False, arp=True, pad_bright=1500)
groove(S['chiral'] + 24, S['mystery'], level=0.8, rim_on=True)
# 02：完整律动，第 1953 页加拍手
groove(S['mystery'] + 2, S['mystery'] + 30, level=0.85, rim_on=True)
groove(S['mystery'] + 30, S['kagan'], level=0.9, rim_on=True, clap_on=True)
# 03：讲解律动；画曲线时去掉底鼓
groove(S['kagan'] + 2, S['kagan'] + 28, level=0.85, rim_on=True)
groove(S['kagan'] + 28, S['kagan'] + 40, level=0.8, kick_on=False, arp=True)
groove(S['kagan'] + 40, S['soai'], level=0.95, rim_on=True, clap_on=True)
# 04：设想 → 1995 放大（滤波逐小节打开）→ 停顿 → 2003 雪崩（全开）→ 收束
so = S['soai']
groove(so + 2, so + 10, level=0.75, kick_on=False, arp=True)
for k in range(6):
    groove(so + 10 + k * BAR, so + 12 + k * BAR, level=0.7 + k * 0.05, rim_on=True, clap_on=k >= 3, pad_bright=900 + k * 450)
drone(so + 22, 4.8, [n('A2'), n('E3'), n('B3')], bright=700, gain=-6, att=0.4)
for k in range(9):
    music.add(rim(0.6), so + 22.5 + k * BEAT, -14)
# 2003：随机涨落 → 雪崩
drone(so + 26.6, 5.0, [n('A2'), n('E3'), n('A3'), n('B3')], bright=600, gain=-5, att=1.0)
groove(so + 31.6, so + 37.6, level=1.0, clap_on=True, rim_on=True, arp=True, pad_bright=2600)
groove(so + 37.6, so + 42, level=0.8, kick_on=False, arp=True)
final04 = [n('F2'), n('C3'), n('A3'), n('E4'), n('G4'), n('C5')]
drone(so + 42, 8.4, final04, bright=2400, gain=-2, att=0.6)
for k, m in enumerate([n('E5'), n('G5'), n('C6'), n('E6')]):
    x = bell(m, 0.7, 3.5, ratio=2.0, index=1.2)
    music.add(x, so + 42.2 + k * 0.25, -8)
    verb_send.add(x, so + 42.2 + k * 0.25, -4)
# 05：轻律动 → 引语只留铺底 → 结尾大和弦
fu = S['future']
groove(fu + 2, fu + 18, level=0.75, rim_on=True, arp=True)
drone(fu + 18, 6.4, [n('D2'), n('A2'), n('F3'), n('C4'), n('E4')], bright=1400, gain=-4, att=1.0)
END = fu + 24.4
final = [n('A1'), n('E2'), n('C3'), n('G3'), n('B3'), n('E4')]
drone(END, 5.6, final, bright=2200, gain=-1, att=0.8)
for k, m in enumerate([n('A5'), n('C6'), n('E6'), n('B6')]):
    x = bell(m, 0.8, 4.0, ratio=2.0, index=1.3)
    music.add(x, END + 0.6 + k * 0.5, -7)
    verb_send.add(x, END + 0.6 + k * 0.5, -3)


# ---------------------------------------------------------------- 音效（局部时间 + 场景起点）
def Wh(t_peak, dur=0.8, vel=1.0, gain=-8):
    x, pk = whoosh(dur, 0.6, vel=vel)
    sfx.add(x, t_peak - pk, gain)


def B(t, m=n('A5'), gain=-10, pan=0.0, dur=0.16):
    sfx.add(blip(m, 1.0, dur), t, gain, pan)


def card(t):
    cascade(t, gain=-13)
    sfx.add(thud(0.9), t + 0.85, -8)
    B(t + 0.6, n('E6'), -12)
    cascade(t + 1.5, gain=-17, base=n('E6'))


for s in CUES['scenes']:
    if 'chapter' in s:
        card(s['start'])

# 开场
h = S['hook']
sfx.add(click(1.0), h + 0.02, -6)
sfx.add(thud(0.6), h + 0.45, -12)
B(h + 0.9, n('A4'), -10, -0.4)
B(h + 1.7, n('E5'), -10, 0.4)
Wh(h + 6.3, 1.2, 0.8, -10)
B(h + 6.7, n('A3'), -9)
B(h + 6.85, n('G#3'), -9)
Wh(h + 9.1, 0.8, 0.6, -12)
for k, m in enumerate([n('A5'), n('E6')]):
    B(h + 9.5 + k * 0.15, m, -10, -0.4 + 0.8 * k)
B(h + 13.5, n('E4'), -12, 0.4)
sfx.add(impact(0.6), h + 14.0, -10)

# 诺奖
b = S['nobel']
sfx.add(impact(0.8), b, -8)
sfx.add(shimmer(n('A6'), 0.8), b + 0.4, -10)
for k in range(3):
    B(b + 0.3 + k * 0.25, PENTA[k + 1], -13)
Wh(b + 5.2, 1.0, 0.8, -9)
B(b + 6.1, n('A5'), -10, -0.3)
B(b + 6.4, n('C6'), -10, 0.3)
Wh(b + 11.5, 1.0, 0.7, -10)
B(b + 13.2, n('E6'), -10)
B(b + 13.8, n('A6'), -10)
ticks_t = b + 16.4
for k in range(16):
    sfx.add(tick(2600 + (k % 3) * 300), ticks_t + k * 0.1 * (1 + k / 20), -16)

# 01 分子的左右手
c1 = S['chiral']
B(c1 + 2.2, n('A4'), -11, -0.4)
B(c1 + 2.6, n('A4'), -11, 0.4)
for k in range(4):
    B(c1 + 3.4 + k * 0.12, PENTA[k], -14)
Wh(c1 + 9.8, 1.4, 0.7, -10)
sfx.add(riser(3.0, 0.4, 600, 4000), c1 + 10.6, -20)
B(c1 + 13.8, n('G#4'), -10)
Wh(c1 + 14.9, 1.2, 0.6, -11)
sfx.add(shimmer(n('E6'), 0.6), c1 + 15.9, -12)
Wh(c1 + 24.2, 0.9, 0.7, -10)
for i in range(20):
    B(c1 + 24.9 + i * 0.1, n('A5') if i != 7 else n('A4'), -16, -0.6 + i * 0.06, 0.08)
for i in range(10):
    B(c1 + 28.9 + i * 0.1, n('E6'), -16, -0.6 + i * 0.12, 0.08)
sfx.add(impact(0.5), c1 + 31.6, -12)
sfx.add(shimmer(n('A6'), 0.6), c1 + 32.2, -12)

# 02 百年谜题
m2 = S['mystery']
for tp in (11, 17, 24, 31):
    Wh(m2 + tp - 0.3, 0.9, 0.8, -9)
for tp in (2.6, 3.0):
    B(m2 + tp, n('C5'), -11)
B(m2 + 7.2, n('A5'), -11, -0.5)
B(m2 + 7.4, n('E6'), -11, 0.5)
B(m2 + 9.4, n('A4'), -10)
for k in range(6):  # 细菌吃掉右手型
    sfx.add(pop(900, 300), m2 + 12.4 + k * 0.62, -15, 0.3)
for k in range(40):
    B(m2 + 18.2 + k * 0.09, PENTA[k % 6], -19, -0.5 if k % 2 else 0.5, 0.07)
for k in range(40):
    B(m2 + 25.4 + k * 0.085, PENTA[(k * 2) % 6], -19, -0.5 if k % 2 else 0.5, 0.07)
for k in range(3):
    sfx.add(thud(0.7), m2 + 32.4 + k * 0.5 + 0.5, -12)
B(m2 + 36.1, n('E6'), -8)
for k in range(2):
    B(m2 + 36.9 + k * 0.3, n('B4'), -11)

# 03 卡甘
k3 = S['kagan']
B(k3 + 2.7, n('A5'), -11)
B(k3 + 3.6, n('E6'), -11)
B(k3 + 4.0, n('A3'), -10)
Wh(k3 + 10.3, 0.9, 0.7, -10)
B(k3 + 10.6, n('A4'), -10)
sfx.add(click(0.9), k3 + 11.8, -8)
for k in range(6):
    B(k3 + 12.8 + k * 0.12, PENTA[k % 6], -14)
Wh(k3 + 18.3, 0.9, 0.7, -10)
for k in range(3):
    B(k3 + 19.4 + k * 0.4, [n('A5'), n('E5'), n('C6')][k], -11)
B(k3 + 22.6, n('A3'), -10)
Wh(k3 + 28.3, 0.9, 0.7, -10)
sfx.add(riser(1.4, 0.5, 400, 3000), k3 + 30.4, -16)
B(k3 + 32.2, n('E6'), -9)
for k in range(3):
    B(k3 + 33.4 + k * 0.3, [n('A5'), n('C5'), n('E5')][k], -12)
B(k3 + 35.6, n('A6'), -9)
sfx.add(impact(0.5), k3 + 40.0, -12)
B(k3 + 42.6, n('E6'), -7)
sfx.add(shimmer(n('A6'), 0.5), k3 + 42.8, -14)

# 04 硖合宪三
s4 = S['soai']
B(s4 + 4.6, n('C5'), -12)
B(s4 + 5.8, n('E5'), -12)
sfx.add(riser(1.0, 0.4, 500, 4000), s4 + 6.8, -18)
B(s4 + 7.8, n('A5'), -9)
Wh(s4 + 10.3, 0.9, 0.7, -10)
sfx.add(riser(6.0, 0.6, 300, 6000), s4 + 12.6, -16)
sfx.add(impact(0.5), s4 + 18.6, -12)
Wh(s4 + 22.2, 0.9, 0.6, -12)
# 涨落：零星的左右手 = 两种音高的随机咔嗒
rng_f = np.random.default_rng(7)
for k in range(40):
    t = s4 + 28.4 + rng_f.random() * 3.2
    B(t, n('A5') if rng_f.random() > 0.5 else n('E5'), -18, rng_f.random() * 1.6 - 0.8, 0.07)
sfx.add(riser(1.6, 0.8, 400, 8000), s4 + 30.0, -10)
sfx.add(impact(1.0), s4 + 31.6, -4)
sfx.add(shimmer(n('A6'), 1.0), s4 + 31.8, -8)
for k in range(24):
    B(s4 + 31.6 + k * 0.14, PENTA[k % 6] - 12 * (k % 2), -17, -0.8 + (k % 8) * 0.2, 0.08)
B(s4 + 34.8, n('A6'), -9)
Wh(s4 + 37.3, 0.9, 0.7, -10)
for k, hnd in enumerate([-1, 1, -1, -1, 1, -1, 1, 1]):
    B(s4 + 38.0 + k * 0.25, n('A5') if hnd == -1 else n('E5'), -10, -0.7 + k * 0.2)
sfx.add(impact(0.7), s4 + 42.2, -10)
for k in range(3):
    B(s4 + 45.4 + k * 0.3, [n('C6'), n('E6'), n('A6')][k], -8)

# 05 镜子之后
f5 = S['future']
for k in range(4):
    B(f5 + 3.0 + k * 0.25, PENTA[k * 1 + 1], -11)
Wh(f5 + 11.1, 0.9, 0.7, -10)
for k in range(13):
    B(f5 + 11.6 + k * 0.08, PENTA[k % 6], -19, 0, 0.06)
Wh(f5 + 18.2, 1.2, 0.6, -12)
sfx.add(impact(0.6), f5 + 24.4, -10)
sfx.add(click(1.0), f5 + 24.4, -8)


# ---------------------------------------------------------------- 混音
def reverb_ir(sec=2.4, decay=3.4):
    L = int(sec * SR)
    t = np.arange(L) / SR
    ir = rng.standard_normal((L, 2)) * np.exp(-t * decay)[:, None]
    ir = lp(ir, 6000)
    ir[: int(0.012 * SR)] = 0
    return ir / np.sqrt(np.sum(ir**2) / 2)


ir = reverb_ir()
wet = np.stack([signal.oaconvolve(verb_send.x[:, ch], ir[:, ch])[:N] for ch in range(2)], 1)

mus = music.x + 0.22 * wet
mus = hp(mus, 30)
fx = hp(sfx.x, 40)


def rms_db(x):
    return 10 * np.log10(np.mean(x**2) + 1e-12)


# 音效周围给音乐让位（简易侧链）
env = np.abs(fx).max(1)
env = signal.sosfilt(signal.butter(1, 6, 'low', fs=SR, output='sos'), env)
duck = 1 - 0.3 * np.clip(env / (env.max() + 1e-9) * 4, 0, 1)
mix = mus * duck[:, None] + fx * 1.25

# 柔性限幅，交给 ffmpeg loudnorm 做最终响度
peak = np.abs(mix).max()
mix = mix / peak * 0.9
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
fi = int(0.01 * SR)
fo = int(2.0 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5

out = ROOT / 'build/audio_raw.wav'
out.parent.mkdir(exist_ok=True)
sf.write(out, mix.astype(np.float32), SR, subtype='FLOAT')
print('wrote', out, f'{len(mix) / SR:.2f}s', f'music {rms_db(mus):.1f} dB rms, sfx {rms_db(fx):.1f} dB rms')
