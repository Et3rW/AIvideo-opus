"""2026 诺贝尔物理学奖短片配乐：纯 numpy/scipy 合成（无采样、无外部音频）。

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
ROOT = pathlib.Path(__file__).resolve().parents[1]  # films/nobel-physics-2026-icecube
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


# ---------------------------------------------------------------- 编曲
BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT
# D 大调：Dmaj7 – Bm7 – Gmaj7 – A6（每小节一个和弦）
PROG = [
    (n('D3'), [n('F#3'), n('A3'), n('C#4'), n('E4')]),
    (n('B2'), [n('D3'), n('F#3'), n('A3'), n('C#4')]),
    (n('G2'), [n('B2'), n('D3'), n('F#3'), n('A3')]),
    (n('A2'), [n('C#3'), n('E3'), n('F#3'), n('B3')]),
]
ARP_PAT = [0, 1, 2, 3, 2, 1, 3, 2]


def groove(t0, t1, level=1.0, drums=True, snare_on=True, shaker_on=False, arp=True, pad_on=True, bass_on=True, four=False,
           pat=ARP_PAT, intro_bars=0, breaks=(), riser_end=None):
    nbars = int(np.ceil((t1 - t0) / BAR))
    for b in range(nbars):
        bt = t0 + b * BAR
        root, chord = PROG[b % 4]
        drum_bar = drums and b >= intro_bars and b not in breaks
        if pad_on:
            music.add(pad([m + 12 for m in chord], BAR, bright=2200, att=0.3, rel=0.8) * 0.9 * level, bt, -6)
            verb_send.add(pad([m + 12 for m in chord], BAR, bright=1600, att=0.3, rel=0.8) * 0.5 * level, bt, -6)
        for i in range(8):
            tt = bt + i * BEAT / 2
            if tt >= t1:
                break
            if arp:
                m = chord[pat[i]] + 24
                x = marimba(m, 0.75 if i % 2 == 0 else 0.55)
                music.add(x * level, tt, -3, pan=0.25 if i % 2 else -0.25)
                verb_send.add(x * level * 0.6, tt, -4)
            if drum_bar:
                if i % 2 == 0 and (four or i in (0, 4)):
                    music.add(kick(0.95) * level, tt, -1)
                if snare_on and i in (2, 6):
                    music.add(snare(0.8) * level, tt, -6)
                    verb_send.add(snare(0.6) * level, tt, -10)
                music.add(hat(0.7 if i % 2 else 0.45) * level, tt, -9, pan=0.3)
                if shaker_on:
                    music.add(shaker() * level, tt + BEAT / 4, -6, pan=-0.3)
            if bass_on and (b >= intro_bars or i == 0) and i in (0, 3, 4, 6):
                music.add(bass(root, BEAT * (1.4 if i in (0, 4) else 0.4), 0.9) * level, tt, -2)


# 开场：Bm9 低沉铺底 + 稀疏的“中微子”玻璃音
music.add(pad([n('B1'), n('F#2'), n('D3'), n('C#4'), n('F#4')], 14.6, bright=900, att=3.0, rel=1.2) * 1.2, 0.0, 0)
verb_send.add(pad([n('D4'), n('F#4'), n('C#5')], 14.0, bright=2000, att=4.0, rel=2.0), 0.5, -10)
penta = [n(x) for x in ('B5', 'D6', 'E6', 'F#6', 'A6', 'B6')]
tt = 0.3
while tt < 10.8:
    x = pluck_glass(penta[int(rng.random() * len(penta))], 0.4 + rng.random() * 0.4)
    music.add(x, tt, -7, pan=rng.random() * 1.6 - 0.8)
    verb_send.add(x, tt, -6)
    tt += 0.18 + rng.random() * 0.5

# 诺奖段：轻律动
groove(S['nobel'], S['ghost'], level=0.75, snare_on=False)
# 01–03 章：完整讲解律动
groove(S['ghost'], S['cosmic'], level=0.9, intro_bars=2, breaks=(8, 9))
groove(S['cosmic'], S['icecube'], level=0.9, pat=[0, 2, 1, 3, 0, 2, 3, 1], intro_bars=1, breaks=(6,))
groove(S['icecube'], S['deep'], level=0.95, shaker_on=True, pat=[3, 2, 1, 0, 1, 2, 3, 2], breaks=(7, 8))
sfx.add(riser(3.0, 0.7, 300, 8000), S['deep'] - 3.0, -12)
# 下潜：暗色铺底 + 心跳
music.add(pad([n('B1'), n('F#2'), n('B2'), n('D3')], 14.0, bright=700, att=1.5, rel=1.5) * 1.3, S['deep'], -2)
for k in range(10):
    t = S['deep'] + 3.4 + k * 1.0
    if t > S['event3d'] - 0.2:
        break
    music.add(kick(0.7, 70, 40, 0.3), t, -6)
    music.add(kick(0.45, 70, 40, 0.3), t + 0.22, -9)
# 三维事件：大铺底 + 钟琴琶音 + 低频脉冲
hero_chords = [
    [n('D3'), n('A3'), n('E4'), n('F#4'), n('C#5')],
    [n('B2'), n('F#3'), n('C#4'), n('D4'), n('A4')],
    [n('G2'), n('D3'), n('A3'), n('B3'), n('F#4')],
    [n('A2'), n('E3'), n('B3'), n('C#4'), n('F#4')],
]
for k, ch in enumerate(hero_chords):
    t = S['event3d'] + k * 4.0
    music.add(pad(ch, 4.0, bright=2600, att=0.8 if k else 1.6, rel=1.2) * 1.2, t, 1)
    verb_send.add(pad(ch, 4.0, bright=2000, att=0.8, rel=1.2), t, -6)
for k in range(int(13.4 / (BEAT / 2))):
    t = S['event3d'] + 2.6 + k * BEAT / 2
    ch = hero_chords[min(int((t - S['event3d']) / 4.0), 3)]
    m = ch[1:][k % 4] + 24
    x = bell(m, 0.55, 2.0, ratio=2.0, index=1.2)
    music.add(x, t, -4, pan=0.4 if k % 2 else -0.4)
    verb_send.add(x, t, -5)
    if k % 2 == 0:
        music.add(kick(0.7, 80, 40, 0.4), t, -3)
# 04 章：更满的律动（四拍底鼓）
groove(S['discover'], S['future'], level=0.85, shaker_on=True, four=True, pat=[0, 1, 2, 3, 3, 2, 1, 0], breaks=(9, 10))
# 05 章：收束
groove(S['future'], S['future'] + 20.4, level=0.8, snare_on=False, intro_bars=1)
END = S['future'] + 20.4
final = [n('D2'), n('A2'), n('F#3'), n('A3'), n('C#4'), n('E4'), n('F#4')]
music.add(pad(final, 7.6, bright=2400, att=1.4, rel=2.0) * 1.4, END, -2)
verb_send.add(pad(final, 7.6, bright=2000, att=1.4, rel=2.0), END, -4)
for k, m in enumerate([n('F#5'), n('A5'), n('D6'), n('E6')]):
    x = bell(m, 0.8, 4.0, ratio=2.0, index=1.4)
    music.add(x, END + 0.8 + k * 0.6, -6)
    verb_send.add(x, END + 0.8 + k * 0.6, -2)


# ---------------------------------------------------------------- 音效（局部时间 + 场景起点）
def W(t_peak, dur=0.9, vel=1.0, gain=-4):
    x, pk = whoosh(dur, 0.6, vel=vel)
    sfx.add(x, t_peak - pk, gain)


def P(t, gain=-8, f0=900, f1=320, pan=0.0):
    sfx.add(pop(f0, f1), t, gain, pan)


def ticks(t0, t1, gain=-14):
    t = t0
    k = 0
    while t < t1:
        sfx.add(tick(2600 + (k % 3) * 300), t, gain)
        u = (t - t0) / (t1 - t0)
        t += 0.035 + 0.11 * u**2
        k += 1


def card(t):
    W(t + 0.3, 0.8, 1.0, -3)
    sfx.add(thud(1.0), t + 0.42, -6)
    W(t + 1.6, 0.6, 0.6, -10)


h = S['hook']
sfx.add(tick(1800), h + 0.05, -10)
ticks(h + 1.0, h + 3.2)
P(h + 3.1, -8)
W(h + 7.0, 2.4, 0.8, -8)
P(h + 6.6, -12)
P(h + 8.4, -12)
sfx.add(shimmer(n('B6')), h + 11.0, -10)
sfx.add(impact(0.5), h + 11.0, -12)

b = S['nobel']
sfx.add(impact(0.9), b, -6)
sfx.add(shimmer(n('D6'), 1.0), b, -6)
sfx.add(typing(33, 40, 0.8), b + 0.35, -12)
P(b + 0.5, -10)
P(b + 2.0, -10, 1100, 400)
for tp in (4.0, 9.0, 14.0):
    W(b + tp, 1.0, 0.7, -9)
for i in range(3):
    P(b + 5.8 + i * 0.45, -13, 1000 + i * 120, 380)
P(b + 9.3, -10)
ticks(b + 14.8, b + 16.4)
P(b + 17.6, -13)

g = S['ghost']
card(g)
P(g + 1.8, -10)
P(g + 2.4, -8, 700, 250)
W(g + 3.3, 0.5, 0.6, -12)
P(g + 5.3, -10, 1300, 600)
sfx.add(shimmer(n('F#6'), 0.6), g + 8.0, -12)
for tp in (11.9, 18.9, 25.9):
    W(g + tp, 1.0, 0.7, -9)
P(g + 13.0, -9, 700, 250)
P(g + 13.8, -9, 800, 300)
for k in range(3):
    sfx.add(pluck_glass(n('A6'), 0.6), g + 14.5 + k * 1.3, -12)
for i, tp in enumerate((19.6, 20.1, 20.6)):
    P(g + tp, -10, 900 + i * 150, 350)
P(g + 25.9, -8, 600, 220)
W(g + 28.0, 1.4, 0.5, -12)

c = S['cosmic']
card(c)
P(c + 1.8, -10)
P(c + 2.2, -9, 700, 260)
for tp in (10.9, 15.9, 26.1):
    W(c + tp, 1.0, 0.7, -9)
sfx.add(thud(1.0), c + 11.6, -6)
P(c + 16.0, -9, 600, 220)
P(c + 16.2, -9, 800, 300)
W(c + 18.6, 2.0, 0.6, -12)
sfx.add(thud(0.9), c + 21.0, -8)
W(c + 23.2, 1.4, 0.7, -10)
for i, tp in enumerate((27.2, 28.0, 28.8)):
    P(c + tp, -8, 800 + i * 200, 300 + i * 80)
sfx.add(thud(0.8), c + 30.4, -10)

i3 = S['icecube']
card(i3)
P(i3 + 3.6, -10, 1200, 500)
P(i3 + 4.6, -6, 500, 160)
for tp in (10.9, 18.9, 26.9):
    W(i3 + tp, 1.0, 0.7, -9)
for tp in (11.6, 13.2, 14.8):
    P(i3 + tp, -9)
# 热水钻：低频轰鸣
Ld = int(2.8 * SR)
td = np.arange(Ld) / SR
rumble = lp(rng.standard_normal(Ld), 220) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * td)) * np.minimum(td / 0.3, 1) * np.minimum((2.8 - td) / 0.4, 1)
sfx.add(rumble * 2.0, i3 + 20.2, -8)
for k in range(9):
    sfx.add(tick(1600 + k * 90), i3 + 23.0 + k * 0.22 + 0.5, -14)
P(i3 + 27.2, -8, 700, 260)
for k in range(0, 86, 4):
    sfx.add(tick(3000 + (k % 8) * 150, 0.6), i3 + 28.6 + k * 0.022, -18)
ticks(i3 + 29.6, i3 + 31.2)
for tp in (31.6, 32.2, 32.8):
    P(i3 + tp, -11)

d = S['deep']
sfx.add(impact(0.8), d, -8)
sfx.add(riser(2.8, 0.6, 3000, 200)[::-1] * 0.8, d + 0.2, -14)
sfx.add(impact(0.9), d + 4.6, -6)
sfx.add(shimmer(n('B6'), 0.8), d + 4.6, -10)
sfx.add(riser(4.2, 0.5, 800, 6000), d + 4.6, -16)
for k in range(14):
    sfx.add(pluck_glass(penta[k % len(penta)] - 12, 0.5), d + 5.0 + k * 0.29, -16, pan=-0.6 + k * 0.09)

e = S['event3d']
sfx.add(typing(31, 30, 0.8), e + 0.6, -12)
sfx.add(riser(2.6, 0.6, 400, 5000), e, -16)
sfx.add(impact(0.6), e + 2.6, -10)
sfx.add(lock_on(), e + 10.2, -8)
sfx.add(lock_on(), e + 12.0, -10)

ds = S['discover']
card(ds)
P(ds + 1.9, -10)
for tp in (3.0, 3.4):
    P(ds + tp, -9, 700, 260)
    sfx.add(shimmer(n('A6'), 0.4), ds + tp + 0.2, -16)
sfx.add(thud(0.9), ds + 4.6, -8)
for tp in (11.1, 23.1, 31.5):
    W(ds + tp, 1.0, 0.7, -9)
P(ds + 11.6, -10)
sfx.add(lock_on(0.8), ds + 12.0, -10)
sfx.add(typing(30, 30, 0.8), ds + 12.2, -12)
P(ds + 14.6, -9, 700, 260)
W(ds + 16.2, 1.0, 0.5, -12)
P(ds + 16.4, -8, 600, 220)
sfx.add(lock_on(), ds + 17.0, -8)
P(ds + 23.4, -10)
P(ds + 24.2, -8, 600, 220)
P(ds + 31.8, -10)
W(ds + 33.2, 1.2, 0.5, -12)
sfx.add(shimmer(n('D6'), 0.7), ds + 34.2, -10)

f = S['future']
card(f)
for i, tp in enumerate((2.4, 2.9, 3.4)):
    P(f + tp, -8, 700 + i * 160, 260 + i * 60)
for tp in (8.9, 15.1):
    W(f + tp, 1.0, 0.7, -9)
P(f + 9.6, -10)
P(f + 11.0, -10, 1100, 450)
P(f + 11.8, -7, 600, 200)
sfx.add(thud(0.8), f + 12.6, -10)
W(f + 20.8, 1.6, 0.6, -10)
sfx.add(impact(0.7), f + 21.2, -8)


# ---------------------------------------------------------------- 混音
def reverb_ir(sec=2.6, decay=3.2):
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


# 音效周围给音乐让位（简易侧链：音效包络 → 3 dB 衰减）
env = np.abs(fx).max(1)
env = signal.sosfilt(signal.butter(1, 6, 'low', fs=SR, output='sos'), env)
duck = 1 - 0.3 * np.clip(env / (env.max() + 1e-9) * 4, 0, 1)
mix = mus * duck[:, None] + fx * 1.0

# 柔性限幅，交给 ffmpeg loudnorm 做最终响度
peak = np.abs(mix).max()
mix = mix / peak * 0.9
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
# 首尾淡入淡出
fi = int(0.01 * SR)
fo = int(1.6 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5

out = ROOT / 'build/audio_raw.wav'
out.parent.mkdir(exist_ok=True)
sf.write(out, mix.astype(np.float32), SR, subtype='FLOAT')
print('wrote', out, f'{len(mix) / SR:.2f}s', f'music {rms_db(mus):.1f} dB rms, sfx {rms_db(fx):.1f} dB rms')
