"""Soundtrack of «Война, которую выиграли птицы»: original score + synthesized SFX + mix with the draft narration.
usage: python3 score.py   ->  music.wav, sfx.wav, mix.wav (with the draft voice), bed_novoice.wav (the deliverable:
the same mix without narration, for an external voice-over); 48 kHz stereo, exact video length, printed loudness.
Everything is synthesized here (dsp.py / instruments.py come from the cartoon-3d-short skill); no samples.
Event times mirror src/videos/emu/story.ts (T, SHOTS): re-run after any picture timing change.
"""
import math
import os
import numpy as np
from dsp import (SR, TAU, ns, rng, dbg, lp, hp, bp, colored, smooth_noise, fades, phase, modal, pan, st, place,
                 make_ir, convolve_st, integrated, true_peak, read_wav, write_wav)
import instruments as I

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 59.8
N = ns(DUR)
R = rng(1932)
T = dict(lost=5.03, emus=10.54, tall=13.11, eat=14.01, fence=15.12, call=17.04, major=18.87, two=19.83, guns=20.74, crates=21.67,
         shots=23.3, scatter=24.6, jam=31.52, truck=34.47, legs=37.13, hatOff=40.5, recall=42.31, ten=46.2, admit=47.99,
         division=48.73, arms=55.87, winners=57.66, blink=59.05)
BUMPS = [37.9 + 0.36 * k for k in range(10)]

music = np.zeros((2, N))
sfx = np.zeros((2, N))


def env_exp(n, tau, att=0.002):
    t = np.arange(n) / SR
    return (1 - np.exp(-t / att)) * np.exp(-t / tau)


# ------------------------------------------------------------------ SFX synths
def whoosh(dur, lo=300, hi=2500, up=True):
    n = ns(dur); x = colored(n, R, 0.6)
    a, b = bp(x, lo, lo * 3), bp(x, hi * 0.5, hi)
    u = np.linspace(0, 1, n) if up else np.linspace(1, 0, n)
    return fades((a * (1 - u) + b * u) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2, 0.01, 0.05)


def gun_shot(vel=1.0):
    """one round of the Lewis gun: dry crack + a short low thump"""
    n = ns(0.12); t = np.arange(n) / SR
    y = bp(R.standard_normal(n), 600, 4800) * env_exp(n, 0.013, 0.0004) * 1.2
    y += np.sin(phase(70 + 130 * np.exp(-t / 0.025))) * env_exp(n, 0.035, 0.001) * 0.9
    return fades(y * vel, 0.0003, 0.02)


def ricochet():
    d = 0.24; n = ns(d); t = np.arange(n) / SR
    y = np.sin(phase(500 + 2400 * np.exp(-t / 0.06))) * env_exp(n, 0.07, 0.002) * 0.5 + lp(R.standard_normal(n), 800) * env_exp(n, 0.05, 0.004) * 0.9
    return fades(y, 0.001, 0.03)


def thud(size=1.0):
    n = ns(1.0); t = np.arange(n) / SR
    y = np.sin(phase(42 + 44 * np.exp(-t / 0.06))) * env_exp(n, 0.26, 0.004) * 1.4
    y += lp(R.standard_normal(n), 340) * env_exp(n, 0.09, 0.002) * 1.2 + bp(R.standard_normal(n), 400, 3000) * env_exp(n, 0.04) * 0.4
    return fades(y * size, 0.001, 0.15)


def wood(vel=1.0):
    """a crate or a post landing"""
    return fades(modal(0.4, [(120, 1, 0.07), (310, 0.7, 0.05), (640, 0.4, 0.03), (1500, 0.2, 0.015)], R) * vel
                 + lp(R.standard_normal(ns(0.4)), 500) * env_exp(ns(0.4), 0.05) * 0.8 * vel, 0.0005, 0.06)


def crack_snd():
    n = ns(0.7); y = hp(R.standard_normal(n), 1300) * env_exp(n, 0.03, 0.0005) * 1.5
    y += modal(0.7, [(230, 1, 0.12), (410, 0.7, 0.09), (890, 0.5, 0.05)], R, glide=-0.1, glide_tau=0.15)
    for k in range(6):
        i = ns(0.05 + 0.07 * k + R.uniform(0, 0.03)); d = ns(0.03)
        y[i:i + d] += hp(R.standard_normal(d), 1800) * env_exp(d, 0.006, 0.0003) * (0.9 - 0.1 * k)
    return fades(y, 0.0003, 0.1)


def twang():
    return fades(modal(0.7, [(170, 1, 0.16), (345, 0.7, 0.1), (690, 0.45, 0.06), (1400, 0.25, 0.03)], R, glide=-0.35, glide_tau=0.18), 0.0005, 0.08)


def clunk():
    return fades(modal(0.35, [(205, 1, 0.05), (530, 0.7, 0.035), (1310, 0.5, 0.02), (2850, 0.3, 0.012)], R)
                 + hp(R.standard_normal(ns(0.35)), 2500) * env_exp(ns(0.35), 0.005) * 0.7, 0.0003, 0.05)


def boing(f0=190, dur=0.85):
    n = ns(dur); t = np.arange(n) / SR
    f = f0 * (1 + 0.3 * np.sin(TAU * 11 * t) * np.exp(-t / 0.4)) * (1 + 0.3 * np.exp(-t / 0.07))
    ph = phase(f)
    return fades((np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * env_exp(n, 0.3, 0.003), 0.002, 0.1)


def emu_drum(beats=3, f=84, gap=0.17, vel=1.0):
    """the emu's booming call: low throaty "bup bup bup" with enough overtones for a phone speaker"""
    out = np.zeros(ns(beats * gap + 0.35))
    for k in range(beats):
        d = ns(0.24); t = np.arange(d) / SR
        ph = phase(f * (1 + 0.45 * np.exp(-t / 0.018)))
        y = sum(a * np.sin(h * ph) for h, a in ((1, 1.0), (2, 0.7), (3, 0.5), (4, 0.3), (5, 0.18))) * env_exp(d, 0.065, 0.006)
        y += bp(R.standard_normal(d), 220, 620) * env_exp(d, 0.03, 0.004) * 0.5
        i = ns(k * gap); out[i:i + d] += y * (1 - 0.1 * k) * vel
    return fades(out, 0.002, 0.05)


def crunch(vel=1.0):
    n = ns(0.17); t = np.arange(n) / SR
    return fades(bp(R.standard_normal(n), 1100, 5200) * env_exp(n, 0.04, 0.003) * (0.6 + 0.4 * np.sign(np.sin(TAU * 64 * t))) * vel, 0.002, 0.03)


def chew(vel=1.0):
    n = ns(0.07); return fades(bp(R.standard_normal(n), 800, 2800) * env_exp(n, 0.015, 0.002) * vel, 0.001, 0.02)


def step(vel=1.0):
    n = ns(0.12); return fades((lp(R.standard_normal(n), 260) * env_exp(n, 0.025) * 1.6 + bp(R.standard_normal(n), 1200, 4000) * env_exp(n, 0.006) * 0.3) * vel, 0.0005, 0.03)


def patter(dur, rate, vel=1.0, jit=0.4, level=None):
    """many feet: steps at `rate` per second; level = (times, gains) envelope"""
    n = ns(dur); y = np.zeros(n); t0 = 0.0
    while t0 < dur - 0.13:
        s = step(vel * (0.6 + 0.6 * R.random())); i = ns(t0); y[i:i + len(s)] += s
        t0 += (1 / rate) * (1 + jit * (R.random() - 0.5))
    if level is not None:
        y *= np.interp(np.arange(n) / SR, *level)
    return fades(y, 0.01, 0.1)


def klaxon():
    out = []
    for d, f0, f1 in ((0.15, 330, 540), (0.36, 540, 520), (0.24, 520, 300)):
        n = ns(d); t = np.arange(n) / SR
        saw = 2 * ((phase(np.linspace(f0, f1, n)) / TAU) % 1) - 1
        out.append(bp(saw * (0.7 + 0.3 * np.sign(np.sin(TAU * 43 * t))), 300, 3200))
    return fades(np.concatenate(out), 0.01, 0.05)


def engine(dur, hz=(12, 12), level=None, lope=0.25):
    """putt-putt of a 1930s lorry: firing pulses at hz[0] -> hz[1] per second"""
    n = ns(dur); f = np.linspace(hz[0], hz[1], n); ph = phase(f)
    pulse = np.maximum(0, np.sin(ph)) ** 6
    body = lp(R.standard_normal(n), 230) * 2.4 + bp(R.standard_normal(n), 300, 1500) * 0.6
    y = body * pulse * (1 + lope * np.sin(ph / 4)) + 0.5 * np.sin(phase(f * 4)) * pulse + 0.3 * np.sin(phase(f * 8)) * pulse
    if level is not None:
        y *= np.interp(np.arange(n) / SR, *level)
    return fades(y, 0.06, 0.15)


def scribble(dur):
    n = ns(dur); t = np.arange(n) / SR
    return fades(bp(R.standard_normal(n), 2500, 7000) * (0.5 + 0.5 * np.sin(TAU * 9 * t)) ** 2 * 0.6, 0.01, 0.03)


def crickets(dur, f=4300, level=1.0):
    n = ns(dur); t = np.arange(n) / SR
    trill = (np.sin(TAU * 36 * t) > 0.1) * (np.sin(TAU * 1.9 * t + 0.4) > -0.2)
    return fades(np.sin(TAU * f * t) * lp(trill.astype(float), 400) * 0.3 * level, 0.1, 0.2)


def slide(f0, f1, dur, vel=0.5):
    n = ns(dur); t = np.arange(n) / SR; ph = phase(f0 * (f1 / f0) ** (t / dur))
    return fades((np.sin(ph) + 0.15 * np.sin(2 * ph)) * vel * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.5, 0.01, 0.04)


def pop(f):
    d = 0.06; t = np.arange(ns(d)) / SR
    return np.sin(phase(f * (1 + 1.3 * t / d))) * np.sin(np.pi * t / d) ** 2


def tink(f, vel=1.0):
    return fades(modal(0.5, [(f, 1, 0.11), (f * 2.76, 0.55, 0.07), (f * 5.4, 0.3, 0.035)], R) * vel + hp(R.standard_normal(ns(0.5)), 4000) * env_exp(ns(0.5), 0.004) * 0.5 * vel, 0.0005, 0.05)


def grumble(notes, dur=0.16):
    """angry "wa-wa-wa" of a muted horn standing in for shouting farmers"""
    out = [I.brass(I.m2f(m), dur, 0.9, R, "stab", scoop=-60, fall=-1.0) for m in notes]
    return np.concatenate([np.pad(x, (0, ns(0.03))) for x in out])


def S(x, t, gain_db=0.0, p=0.0):
    place(sfx, pan(x, p), t, dbg(gain_db))


def bursts(spans, gain_db, p=0.0, zip_db=None):
    """gun rounds on the picture's 15 per second grid; zip_db adds a ricochet for every third round"""
    for a, b in spans:
        for k in range(math.ceil(a * 15 - 1e-6), math.ceil(b * 15 - 1e-6)):
            S(gun_shot(0.85 + 0.3 * R.random()), k / 15, gain_db, p)
            if zip_db is not None and k % 3 == 0:
                S(ricochet(), k / 15 + 0.15, zip_db, R.uniform(-0.6, 0.6))


# ------------------------------------------------------------------ SFX event table
# 1-3: the gun, the birds, the chewing
bursts([(0.25, 1.25), (1.6, 2.5), (2.75, 3.25)], -5, -0.3)
S(whoosh(0.3, 500, 3000), 3.17, -12)
bursts([(3.25, 3.95), (4.15, 4.8)], -17, 0.5, zip_db=-8)
for k in range(8):
    S(chew(0.7 + 0.3 * R.random()), 4.9 + k * 0.143, -8, 0.1)
S(emu_drum(2, 88), 5.72, -6)
# 4: the farm
S(whoosh(1.6, 200, 1400, False), 6.25, -15)
for k in range(3):
    S(fades(bp(R.standard_normal(ns(0.35)), 1500, 2600) * np.sin(np.pi * np.linspace(0, 1, ns(0.35))) ** 2 * 0.3, 0.02, 0.05), 7.0 + k * 0.97, -13, -0.4)  # the windmill squeaks
for k, t0 in enumerate((7.35, 8.3, 9.15)):  # a bird somewhere
    S(slide(2300 + 200 * k, 3100 - 150 * k, 0.09, 0.4), t0, -15, 0.5); S(slide(3000, 2500, 0.07, 0.4), t0 + 0.11, -15, 0.5)
# 5-6: they arrive
S(patter(1.9, 26, 0.8, level=([0, 0.4, 1.5, 1.9], [0.15, 0.6, 1.0, 0.9])), 9.85, -11)
for k, t0 in enumerate((10.2, 10.6, 10.95, 11.2, 11.45)):
    S(emu_drum(2 + k % 2, 80 + 5 * k, 0.15, 0.8), t0, -10, (-0.5, 0.4, -0.2, 0.5, 0.0)[k])
S(I.brass(I.m2f(58), 0.3, 0.95, R, "stab", fall=-2.0), 11.65, -9)
S(emu_drum(1, 92), 12.25, -8)
# 7-9: tall, hungry, through the fence
S(slide(520, 1100, 0.3), T["tall"] - 0.1, -12); S(emu_drum(1, 90), 13.55, -8, 0.3)
for k in range(2):
    S(crunch(), 14.02 + 0.47 * k, -4, -0.3 + 0.6 * k); S(crunch(0.8), 14.2 + 0.47 * k, -6, 0.3 - 0.6 * k)
S(patter(1.5, 14, 1.0), 14.75, -10)
S(crack_snd(), T["fence"], -2); S(twang(), T["fence"] + 0.03, -6, -0.4); S(twang(), T["fence"] + 0.1, -8, 0.4)
S(wood(1.0), T["fence"] + 0.62, -6)
# 10: the farmers have something to say
S(grumble([58, 61, 58, 56]), 16.5, -10, -0.3); S(grumble([63, 61, 63, 65, 61]), 17.25, -10, 0.3)
# 11: the army arrives, item by item
S(engine(0.75, (20, 9), level=([0, 0.5, 0.75], [1.0, 0.9, 0.2])), 18.2, -10, -0.4)
S(fades(bp(R.standard_normal(ns(0.3)), 2300, 3400) * 0.5, 0.02, 0.1), 18.62, -18, -0.4)  # brakes
for t0, f in ((T["major"] - 0.06, 320), (T["two"] - 0.04, 420), (T["two"] + 0.22, 480)):
    S(pop(f), t0, -9)
for t0 in (T["guns"] - 0.02, T["guns"] + 0.2):
    S(clunk(), t0, -9, -0.3 if t0 < 20.8 else 0.3)
for row in range(5):
    S(wood(0.8 + 0.1 * row), T["crates"] + 0.33 + row * 0.19, -5 + row * 0.6)
S(thud(0.9), T["crates"] + 1.09, -6)
# 12-14: first shots, panic
bursts([(23.25, 24.6)], -9, 0.3)
S(whoosh(0.25, 600, 3500), 24.42, -10)
S(emu_drum(1, 110, vel=1.0), 24.52, -5)
S(patter(1.5, 34, 1.0, level=([0, 0.15, 0.7, 1.5], [0.3, 1.0, 0.8, 0.1])), 24.58, -6)
bursts([(24.62, 25.9)], -19, 0.5)
S(slide(1500, 700, 0.9, 0.3), 25.2, -20)  # the feather
S(patter(2.0, 40, 0.5, level=([0, 0.3, 2.0], [0.5, 0.8, 0.25])), 26.05, -8)
bursts([(26.1, 26.9), (27.1, 27.9)], -24, 0.0)
# 15-17: the dam
S(fades(bp(colored(ns(2.6), R, 1.0), 300, 1200) * (0.5 + 0.5 * smooth_noise(ns(2.6), R, 2.0)), 0.5, 0.5), 28.1, -24)
S(patter(1.7, 16, 0.6, level=([0, 0.6, 1.7], [0.7, 0.7, 0.0])), 28.1, -17)
for k, t0 in enumerate((28.5, 29.3, 30.0)):
    S(emu_drum(2, 84 + 6 * k, 0.16, 0.7), t0, -8, (-0.4, 0.4, 0.0)[k])
S(gun_shot(1.0), 31.14, -8, -0.2)
S(clunk(), T["jam"], -2, -0.2); S(boing(), T["jam"] + 0.04, -4, -0.2)
S(crickets(0.75), 32.3, -14)
S(tink(2400, 0.4), 32.62, -20)
# 18: the truck
S(engine(2.6, (11, 13), level=([0, 1.9, 2.1, 2.6], [0.7, 0.7, 1.0, 1.0])), 32.95, -10)
S(klaxon(), T["truck"] - 0.1, -8)
S(engine(0.7, (14, 26)), 34.85, -8)
# 19: legs
S(whoosh(0.3, 600, 3500), 35.42, -10)
for k in range(20):
    S(step(0.9), 35.55 + k * 0.1163, -5, 0.1)  # 8.6 footfalls a second: the hero bird
S(fades(bp(colored(ns(2.3), R, 0.8), 500, 2600) * (0.6 + 0.4 * smooth_noise(ns(2.3), R, 5)), 0.15, 0.2), 35.5, -13)
S(pop(520), 36.35, -8); S(tink(1760, 0.6), 36.4, -15)
# 20-21: the chase and the bumps
S(engine(3.75, (21, 19), level=([0, 3.4, 3.75], [1.0, 0.95, 0.5])), 37.75, -11)
S(patter(1.65, 22, 0.7), 37.8, -14, 0.4)
for k, tb in enumerate(BUMPS):
    if tb < 41.4:
        S(wood(0.9), tb, -8 if tb > 39.4 else -13); S(boing(150 + 25 * (k % 3), 0.33), tb + 0.02, -11 if tb > 39.4 else -17, 0.2)
S(whoosh(0.4, 500, 2500), T["hatOff"] - 0.05, -12, -0.3)
# 22: they leave
S(engine(2.5, (17, 13), level=([0, 2.5], [0.8, 0.12])), 41.45, -13, 0.2)
S(emu_drum(2, 86), 43.25, -8, -0.3)
# 23: the report
S(scribble(0.9), 44.25, -11, 0.4); S(emu_drum(1, 88), 45.45, -10, -0.3)
for k in range(10):
    S(tink(I.m2f((79, 81, 83, 84, 86, 88, 90, 91, 93, 95)[k]), 0.7), T["ten"] + k * 0.085, -12, -0.4 + 0.09 * k); S(pop(360 + 40 * k), T["ten"] + k * 0.085, -15)
S(emu_drum(1, 90), 47.25, -9, -0.3)
# 24-25: the major, the division
S(whoosh(0.2, 800, 3000), T["admit"] - 0.1, -18, 0.3)
for k in range(8):
    S(step(1.0), 48.75 + k * 0.5, -1); S(step(0.8), 48.76 + k * 0.5, -3, -0.4); S(step(0.8), 48.74 + k * 0.5, -3, 0.4); S(thud(0.3), 48.75 + k * 0.5, -10)  # in step
# 26-27: evening, the board
S(crickets(5.2, 4100, 0.8), 52.4, -17)
S(emu_drum(2, 80, 0.2, 0.6), 53.3, -15, 0.4)
S(patter(1.5, 3.2, 0.6, jit=0.1), 55.0, -15, 0.4)
S(emu_drum(1, 92), T["winners"] - 0.1, -8)
for k in range(5):
    S(chew(0.7), 57.9 + k * 0.166, -15)
S(tink(2600, 0.4), T["blink"], -18)

# ------------------------------------------------------------------ music (original, G major, 120 BPM)
B = 0.5


def M(x, t, gain_db=0.0, p=0.0):
    x = np.asarray(x)
    place(music, x if x.ndim == 2 else pan(x, p), t, dbg(gain_db))


def roll(t0, t1, v0, v1, gain_db):
    for tm, vel in I.snare_roll(t0, t1, v0, v1, R):
        M(I.snare(vel, R, 0.12, buzz=True), tm, gain_db, 0.15)


def oompah(t0, beats, chords, vel=0.7, gain=0.0, b=B, stop=DUR - 0.5):
    """tuba on the beat, plucked chord off the beat; chords = [(bass midi, [chord midi])], one per two beats"""
    for q in range(beats):
        t = t0 + q * b
        if t > stop:
            return
        bass, ch = chords[(q // 2) % len(chords)]
        if q % 2 == 0 or b < 0.3:
            M(I.brass(I.m2f(bass - (0 if q % 4 == 0 else 5)), b * 0.7, vel, R, "tuba"), t, gain - 3, -0.15)
        if q % 2 == 1 or b < 0.3:
            for m in ch:
                M(I.pluck(I.m2f(m), vel * 0.7, R, 0.45, 0.6), t + (b * 0.5 if b < 0.3 else 0), gain - 10, 0.25)


def tune(t0, notes, inst="pluck", gain=0.0, p=0.1, b=B, stacc=0.92):
    """notes = [(midi or None, beats)]"""
    t = t0
    for m, d in notes:
        if m is not None and t < DUR - 0.2:
            if inst == "pluck":
                M(I.pluck(I.m2f(m), 0.8, R, 0.6, 0.7, 0.14), t, gain, p)
            elif inst == "glock":
                M(I.glock(I.m2f(m), 0.6, R, 1.0), t, gain, p)
            elif inst == "fife":
                M(I.fife(I.m2f(m), d * b * stacc, 0.6, R), t, gain, p)
            else:
                M(I.brass(I.m2f(m), d * b * stacc, 0.8, R, inst), t, gain, p)
        t += d * b


def snares(t0, pattern, gain=-9, b=B):
    """pattern = [(beat offset, velocity)]"""
    for off, vel in pattern:
        M(I.snare(vel, R, 0.2), t0 + off * b, gain, 0.2)


G, D7, C, EM, GM = (43, [59, 62, 67]), (38, [57, 60, 66]), (36, [60, 64, 67]), (40, [59, 64, 67]), (43, [58, 62, 67])
# the army's march: four bars
MARCH = [(67, 0.5), (71, 0.5), (74, 1), (74, 0.5), (76, 0.5), (74, 1),
         (71, 0.5), (74, 0.5), (79, 1.5), (78, 0.5), (76, 1),
         (74, 1), (76, 0.5), (78, 0.5), (79, 1), (71, 1),
         (69, 1), (74, 1), (67, 2)]
CADENCE = [(0, 0.8), (1, 0.5), (1.5, 0.5), (2, 0.8), (3, 0.5), (3.25, 0.4), (3.5, 0.5), (3.75, 0.4)]
# the emus' tune: sneaky, staccato, a little crooked
EMU = [(67, 0.5), (70, 0.5), (None, 0.5), (72, 0.5), (73, 0.5), (72, 0.5), (70, 0.5), (None, 0.5),
       (67, 0.5), (65, 0.5), (None, 0.5), (62, 0.5), (63, 0.5), (65, 0.5), (67, 1)]

# hook: drum roll, bugle call, and the call falls flat
roll(0.05, 0.5, 0.2, 0.8, -12)
tune(0.25, [(62, 0.5), (67, 0.5), (67, 0.25), (67, 0.25), (71, 0.5), (74, 1.5), (71, 0.5), (74, 0.5), (79, 1.5)], "stab", -10, -0.1)
oompah(0.25, 6, [G, G, D7], 0.6, -4)
snares(0.25, CADENCE[:6], -12); snares(2.25, CADENCE[:4], -12)
for k, m in enumerate((62, 55, 62, 55)):
    M(I.pluck(I.m2f(m), 0.7, R, 0.5, 0.5), 3.3 + k * 0.38, -6, 0.3)
for i, m in enumerate((46, 43)):  # "...and lost"
    M(I.brass(I.m2f(m), 0.34 if i == 0 else 0.7, 0.85, R, "tuba", fall=-2.0 if i else 0.0), 5.1 + i * 0.36, -4, -0.1)
# the farm: the march, gentle, on a fife
oompah(6.35, 7, [G, G, D7, G], 0.45, -5)
tune(6.35, MARCH[:11], "fife", -9, 0.2)
# they arrive: a low patter that grows
for q in range(7):
    M(I.pluck(I.m2f((43, 43, 46, 43, 48, 46, 43)[q]), 0.5 + 0.06 * q, R, 0.4, 0.4), 9.95 + q * 0.24, -9 + q * 0.6, -0.2)
    M(I.timpani(I.m2f(31), 0.3 + 0.07 * q, R, 0.6), 9.95 + q * 0.24, -15 + q * 0.8)
M(I.timpani(I.m2f(31), 0.95, R), 11.65, -5); M(I.cymbal(0.5, R, 1.2), 11.65, -16)
# the emus' tune
tune(12.7, EMU[:8], "pluck", -2); tune(12.7, EMU[:8], "glock", -10, 0.3)
for q in range(4):
    M(I.brass(I.m2f((43, 38, 43, 38)[q]), 0.2, 0.6, R, "tuba"), 12.7 + q * B, -8, -0.15)
tune(14.0, EMU[8:12], "pluck", -2); tune(14.0, EMU[8:12], "glock", -10, 0.3)
tune(15.3, [(86, 0.25), (84, 0.25), (82, 0.25), (79, 0.25), (77, 0.25), (74, 0.25), (72, 0.25), (70, 0.25)], "glock", -12, 0.3)
# the farmers: a cross little vamp
for q in range(4):
    M(I.brass(I.m2f((43, 46, 43, 41)[q]), 0.3, 0.75, R, "tuba"), 16.45 + q * 0.45, -7, -0.1)
# the army: the march in full dress
roll(18.38, 18.85, 0.2, 0.85, -11)
oompah(18.87, 8, [G, G, D7, G], 0.7, -3)
tune(18.87, MARCH[:11], "stab", -8, -0.1); tune(18.87, MARCH[:11], "horn", -10, 0.2)
snares(18.87, CADENCE, -10); snares(20.87, CADENCE[:6], -10)
for row in range(5):
    M(I.timpani(I.m2f((43, 45, 47, 48, 50)[row]), 0.7 + 0.06 * row, R, 0.7), T["crates"] + 0.33 + row * 0.19, -8)
M(I.cymbal(0.8, R, 1.8), T["crates"] + 1.09, -12)
# first shots: a roll that breaks into a scramble
roll(23.2, 24.55, 0.3, 0.9, -13)
M(I.timpani(I.m2f(38), 0.8, R, 0.8), 24.55, -8)
tune(24.62, [(79, 0.25), (80, 0.25), (82, 0.25), (84, 0.25), (86, 0.25), (87, 0.25), (89, 0.25), (91, 0.25), (89, 0.25), (86, 0.25), (84, 0.25), (80, 0.25)], "glock", -11, 0.3)
tune(26.08, [(m, 0.25) for m in (74, 73, 72, 70, 69, 67, 66, 65, 63, 62, 61, 60, 58, 57, 55, 54)], "pluck", -6, 0.2)
for q in range(4):
    M(I.brass(I.m2f((43, 42, 41, 40)[q]), 0.18, 0.6, R, "tuba"), 26.08 + q * B, -9, -0.15)
# the ambush: tiptoe
for q in range(5):
    M(I.brass(I.m2f((43, 38, 43, 38, 43)[q]), 0.16, 0.5, R, "tuba"), 28.2 + q * B, -6, -0.15)
    M(I.pluck(I.m2f((58, 62, 58, 61, 58)[q]), 0.5, R, 0.35, 0.4), 28.45 + q * B, -5, 0.25)
roll(30.25, 31.1, 0.15, 0.75, -14)
for i, m in enumerate((46, 45, 44)):  # the gun says no
    M(I.brass(I.m2f(m), 0.3 if i < 2 else 0.75, 0.85, R, "tuba", fall=-2.5 if i == 2 else 0.0), 31.78 + i * 0.36, -5, -0.1)
# luckily: a fanfare
roll(32.98, 33.3, 0.4, 0.8, -13)
tune(33.0, [(67, 0.5), (71, 0.5), (74, 0.5), (79, 1.5), (78, 0.5), (79, 1.5)], "stab", -9, -0.1); tune(33.0, [(59, 0.5), (62, 0.5), (67, 0.5), (71, 1.5), (69, 0.5), (71, 1.5)], "horn", -11, 0.2)
oompah(33.0, 5, [G, D7, G], 0.6, -5)
M(I.cymbal(0.6, R, 1.4), T["truck"], -14)
# unluckily: legs (a quick picked run)
tune(35.55, [(m, 0.25) for m in (67, 71, 74, 79, 74, 71, 67, 71, 74, 79, 83, 79, 74, 79, 83, 86, 83, 79)], "pluck", -5, 0.2)
for q in range(5):
    M(I.brush(0.5, R, 0.2), 35.55 + q * B, -12, 0.2)
# the chase: gallop
oompah(37.85, 14, [G, D7, C, D7, G, D7, EM], 0.65, -5, b=0.25, stop=41.3)
tune(37.85, [(79, 1), (78, 0.5), (76, 0.5), (74, 1), (71, 1), (72, 1), (76, 0.5), (74, 0.5), (71, 1), (67, 1), (69, 1), (71, 0.5), (72, 0.5), (74, 1)], "fife", -13, 0.2, b=0.25)
M(I.brass(I.m2f(36), 0.5, 0.8, R, "tuba", fall=-3.0), 41.1, -6)
# they leave: the march in minor, slow
tune(41.55, [(67, 1), (70, 1), (74, 1.6)], "horn", -10, 0.1, b=0.55)
M(I.pad([I.m2f(43), I.m2f(50), I.m2f(58)], 2.2, 0.45, R, att=0.3, rel=0.6), 41.5, -12)
# the report: tick-tock
for q in range(7):
    M(I.pluck(I.m2f(55 if q % 2 == 0 else 62), 0.5, R, 0.35, 0.4), 43.95 + q * B, -3, -0.2)
    M(I.glock(I.m2f(79 if q % 2 == 0 else 74), 0.4, R, 0.6), 44.2 + q * B, -12, 0.3)
# the major: three lonely notes
tune(47.7, [(62, 0.5), (67, 0.5), (71, 1.2)], "horn", -9, 0.0, b=0.42)
# the division: the march belongs to the birds now (footfalls on the beat)
oompah(48.75, 8, [G, G, D7, G], 0.75, -2)
tune(48.75, MARCH[:11], "fife", -9, 0.25); tune(48.75, [(m - 12, d) for m, d in MARCH[:11]], "stab", -9, -0.15)
snares(48.75, CADENCE, -9); snares(50.75, CADENCE[:6], -9)
M(I.cymbal(0.7, R, 1.6), 48.75, -13)
# evening
M(I.pad([I.m2f(43), I.m2f(50), I.m2f(59), I.m2f(62), I.m2f(69)], 4.4, 0.5, R, att=0.5, rel=1.0), 52.4, -5)
tune(52.6, [(74, 1), (71, 1), (74, 1), (79, 1.5)], "glock", -8, 0.3)
# the coat of arms
tune(55.25, [(67, 0.4), (71, 0.4), (74, 0.4), (79, 2)], "stab", -9, -0.1, b=0.5); tune(55.25, [(59, 0.4), (62, 0.4), (67, 0.4), (71, 2)], "horn", -11, 0.2)
M(I.timpani(I.m2f(43), 0.8, R), T["arms"], -8); M(I.cymbal(0.7, R, 2.0), T["arms"], -13)
# the button
for k, m in enumerate((74, 67)):
    M(I.pluck(I.m2f(m), 0.8, R, 0.5, 0.6), 58.0 + k * 0.3, -5, 0.2)
M(I.brass(I.m2f(31), 0.35, 0.9, R, "tuba"), 58.9, -4, -0.1); M(I.timpani(I.m2f(43), 0.9, R, 1.0), 58.9, -6)
M(I.glock(I.m2f(91), 0.5, R, 1.0), T["blink"], -11, 0.3)

music = music + 0.2 * convolve_st(music, make_ir(1.0, 7))
sfx = sfx + 0.1 * convolve_st(sfx, make_ir(0.6, 9))

# ------------------------------------------------------------------ mix: voice untouched, music ducked under it
voice, sr = read_wav(os.path.join(HERE, "..", "voice", "voice.wav"))
assert sr == SR
v = np.zeros(N); v[: min(N, voice.shape[1])] = voice[0][:N]
v *= dbg(-16.0 - integrated(st(v)))
envv = lp(np.abs(v), 6)
duck = 1 - 0.55 * np.clip(envv / (np.percentile(envv, 90) + 1e-9) * 1.6, 0, 1)
duck = lp(duck, 4)
music *= dbg(-24.0 - integrated(music)) * dbg(3.0)
sfx *= dbg(-6.0) * 0.5
mix = st(v) + music * duck + sfx
bed = music * duck + sfx  # the same mix without the narration, carried through identical gains
vgain = dbg(-14.0 - integrated(mix))
mix *= vgain
bed *= vgain
# look-ahead peak limiter (5 ms window, ceiling about -1.5 dBFS), then re-trim to -14 LUFS
from scipy import ndimage
for _ in range(2):
    pk = ndimage.maximum_filter1d(np.abs(mix).max(axis=0), ns(0.005))
    g = ndimage.uniform_filter1d(np.minimum(1.0, 0.8 / np.maximum(pk, 1e-9)), ns(0.004))
    trim = min(1.0, dbg(-14.0 - integrated(mix * g)))
    mix = mix * g * trim
    bed = bed * g * trim
    vgain *= trim
mix = fades(mix, 0.005, 0.25)
bed = fades(bed, 0.005, 0.25)
write_wav(os.path.join(HERE, "bed_novoice.wav"), bed)
write_wav(os.path.join(HERE, "music.wav"), music * duck)
write_wav(os.path.join(HERE, "sfx.wav"), sfx)
write_wav(os.path.join(HERE, "mix.wav"), mix)
print("bed without voice: %.1f LUFS, true peak %.1f dBTP; the draft narration sits at %.1f LUFS in the full mix" % (
    integrated(bed), true_peak(bed), integrated(st(v) * vgain)))
print("mix %.2f s  integrated %.1f LUFS  true peak %.1f dBTP | voice %.1f  music %.1f  sfx %.1f LUFS" % (
    mix.shape[1] / SR, integrated(mix), true_peak(mix), integrated(st(v)), integrated(music * duck), integrated(sfx)))
