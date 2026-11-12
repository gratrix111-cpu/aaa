"""Soundtrack of «Колокол, который молчит»: original score + synthesized SFX + mix with the narration.
usage: python3 score.py   ->  music.wav, sfx.wav, mix.wav (48 kHz stereo, exact video length), printed loudness
Everything is synthesized here (dsp.py / instruments.py come from the cartoon-3d-short skill); no samples.
Event times mirror src/videos/bell/story.ts (T): re-run after any picture timing change.
"""
import os
import numpy as np
from dsp import (SR, TAU, ns, tt, rng, dbg, lp, hp, bp, colored, smooth_noise, fades, phase, modal, pan, st, place,
                 make_ir, convolve_st, integrated, true_peak, read_wav, write_wav)
import instruments as I

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 59.6
N = ns(DUR)
R = rng(1735)
T = dict(hookBucket=3.18, hookSplash=3.5, flash=4.1, elephants=10.55, fire=16.5, scaffoldFire=19.0, glow=20.87, run=22.44,
         throw=24.1, crack=25.5, fall=26.6, thud=27.2, pour=35.6, burst=39.9, snap=47.95, raise_=49.7, land=51.6, crow=53.5, knock=57.9)

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


def splash(size=1.0):
    n = ns(1.1 * size); x = R.standard_normal(n)
    y = hp(x, 700) * env_exp(n, 0.22 * size, 0.004) + 1.6 * bp(x, 110, 420) * env_exp(n, 0.07 * size)
    for _ in range(int(9 * size)):
        f0 = R.uniform(700, 1600); d = ns(0.07); t = np.arange(d) / SR
        blip = np.sin(phase(f0 * (1 + 1.2 * t / 0.07))) * np.sin(np.pi * t / 0.07) ** 2
        k = ns(R.uniform(0.05, 0.75 * size)); y[k:k + d] += 0.22 * blip[: max(0, min(d, n - k))]
    return fades(y, 0.002, 0.08)


def hiss(dur, tau):
    n = ns(dur); return fades(hp(R.standard_normal(n), 3200) * env_exp(n, tau, 0.03) * (1 + 0.3 * smooth_noise(n, R, 12)), 0.01, 0.1)


def tink(f, vel=1.0):
    return fades(modal(0.5, [(f, 1, 0.11), (f * 2.76, 0.55, 0.07), (f * 5.4, 0.3, 0.035)], R) * vel + hp(R.standard_normal(ns(0.5)), 4000) * env_exp(ns(0.5), 0.004) * 0.5 * vel, 0.0005, 0.05)


def bell(f, tau=1.3, vel=1.0):
    parts = [(0.5, 0.5, 1.6), (1, 1, 1.2), (1.19, 0.6, 0.9), (1.5, 0.35, 0.7), (2, 0.5, 0.6), (2.51, 0.25, 0.4), (3.01, 0.2, 0.3), (4.1, 0.12, 0.2)]
    return fades(modal(tau * 2.2, [(f * p, a, tau * k) for p, a, k in parts], R) * vel, 0.001, 0.2)


def fire_bed(dur, level):
    n = ns(dur); t = np.arange(n) / SR
    rumble = lp(colored(n, R, 2.0), 240) * (0.6 + 0.4 * smooth_noise(n, R, 3))
    imp = (R.random(n) < 22 / SR) * R.uniform(0.3, 1.0, n)
    crack = bp(np.convolve(imp, env_exp(ns(0.02), 0.004) * R.standard_normal(ns(0.02)), "same"), 900, 6500) * 9
    roar = bp(colored(n, R, 1.0), 300, 1800) * (0.5 + 0.5 * smooth_noise(n, R, 5)) * 0.5
    return fades((rumble * 0.9 + crack + roar) * np.interp(t, *level), 0.3, 0.3)


def crack_snd():
    n = ns(0.9); y = hp(R.standard_normal(n), 1400) * env_exp(n, 0.035, 0.0005) * 1.5
    y += modal(0.9, [(196, 1, 0.22), (311, 0.7, 0.16), (466, 0.5, 0.1), (1240, 0.3, 0.05)], R, glide=-0.12, glide_tau=0.2)
    for k in range(7):
        i = ns(0.06 + 0.09 * k + R.uniform(0, 0.03)); d = ns(0.03)
        y[i:i + d] += hp(R.standard_normal(d), 2000) * env_exp(d, 0.006, 0.0003) * (0.9 - 0.1 * k)
    return fades(y, 0.0003, 0.1)


def thud(size=1.0):
    n = ns(1.2); t = np.arange(n) / SR
    y = np.sin(phase(38 + 40 * np.exp(-t / 0.06))) * env_exp(n, 0.32, 0.004) * 1.4
    y += lp(R.standard_normal(n), 320) * env_exp(n, 0.1, 0.002) * 1.2 + bp(R.standard_normal(n), 400, 3000) * env_exp(n, 0.05) * 0.35
    for _ in range(8):
        i = ns(R.uniform(0.12, 0.8)); d = ns(0.05); y[i:i + d] += bp(R.standard_normal(d), 500, 4000) * env_exp(d, 0.012) * 0.25
    return fades(y * size, 0.001, 0.15)


def shatter():
    n = ns(1.3); y = hp(R.standard_normal(n), 2400) * env_exp(n, 0.1, 0.0005) * 1.3
    for k in range(46):
        i = ns(R.uniform(0, 0.75) ** 1.4); f = R.uniform(2300, 9000); d = ns(0.25)
        y[i:i + d] += (modal(0.25, [(f, 1, R.uniform(0.02, 0.1)), (f * 1.52, 0.4, 0.03)], R) * R.uniform(0.15, 0.5) * (1 - k / 70))[: n - i]
    return fades(y, 0.0003, 0.1)


def pour(dur):
    n = ns(dur); x = R.standard_normal(n); u = np.linspace(0, 1, n)
    y = (bp(x, 350, 1100) * (1 - u) + bp(x, 700, 2600) * u) * (0.7 + 0.3 * smooth_noise(n, R, 14))
    for _ in range(int(dur * 26)):
        i = ns(R.uniform(0, dur - 0.06)); f0 = R.uniform(350, 700) * (1 + 0.9 * i / n); d = ns(0.045); t = np.arange(d) / SR
        y[i:i + d] += 0.5 * np.sin(phase(f0 * (1 + 0.8 * t / 0.045))) * np.sin(np.pi * t / 0.045) ** 2
    return fades(y, 0.15, 0.25)


def creak(dur, f0=20, f1=55, res=(820, 2100)):
    n = ns(dur); t = np.arange(n) / SR
    rate = f0 + (f1 - f0) * (t / dur) ** 1.5 + 6 * smooth_noise(n, R, 4)
    saw = 2 * ((phase(rate) / TAU) % 1) - 1
    y = bp(saw, res[0] * 0.8, res[0] * 1.25) + 0.6 * bp(saw, res[1] * 0.85, res[1] * 1.2)
    return fades(y * (0.5 + 0.5 * smooth_noise(n, R, 6)) * 3, 0.05, 0.08)


def caw():
    d = 0.2; n = ns(d); t = np.arange(n) / SR
    f = 520 - 140 * t / d + 25 * np.sin(TAU * 31 * t)
    saw = 2 * ((phase(f) / TAU) % 1) - 1
    y = bp(saw * (0.6 + 0.4 * np.sign(np.sin(TAU * 58 * t))), 900, 3200) * np.sin(np.pi * t / d) ** 0.6
    return fades(y * 2.2, 0.005, 0.03)


def pop(f):
    d = 0.06; t = np.arange(ns(d)) / SR
    return np.sin(phase(f * (1 + 1.3 * t / d))) * np.sin(np.pi * t / d) ** 2


def step(vel=1.0):
    n = ns(0.12); return fades((lp(R.standard_normal(n), 260) * env_exp(n, 0.025) * 1.6 + bp(R.standard_normal(n), 1200, 4000) * env_exp(n, 0.006) * 0.3) * vel, 0.0005, 0.03)


def knock():
    return fades(modal(0.3, [(150, 1, 0.045), (395, 0.55, 0.03), (960, 0.25, 0.014)], R) + hp(R.standard_normal(ns(0.3)), 1800) * env_exp(ns(0.3), 0.004) * 0.6, 0.0003, 0.05)


def S(x, t, gain_db=0.0, p=0.0):
    place(sfx, pan(x, p), t, dbg(gain_db))


# ------------------------------------------------------------------ SFX event table
S(whoosh(0.5, 300, 1800), 0.0, -14)
S(whoosh(0.3, 500, 3000), 2.42, -10)
S(creak(0.3, 30, 60, (600, 1500)), T["hookBucket"] - 0.1, -16, 0.2)
S(splash(1.1), T["hookSplash"], -4)
for i, (m, dt) in enumerate([(86, 0.0), (81, 0.35), (84, 0.62), (77, 0.95), (81, 1.3), (86, 1.62), (84, 1.9)]):  # the other bells of Moscow DO ring
    S(bell(I.m2f(m), 0.7, 0.55), 4.35 + dt, -16, -0.4 + 0.13 * i)
S(whoosh(0.7, 400, 2200, False), 9.15, -13)
S(thud(0.7), 9.72, -9)
S(whoosh(0.3, 600, 3500), 10.47, -9)
for k in range(40):
    S(pop(280 + 14 * k), 10.62 + k * 0.012, -17, -0.3)
S(I.brass(I.m2f(70), 0.32, 0.9, R, "stab", fall=-3.0), 11.42, -14, -0.3)
for k in (0, 1):  # hammers of the two craftsmen (2.6 Hz, half a cycle apart)
    for nn in range(60):
        th = (nn - k * 0.5) / 2.6
        if 12.25 < th < 16.0:
            S(tink(1480 if k else 1180, 0.8 + 0.2 * R.random()), th, -16 if th < 14.2 else -12, 0.4 if k else -0.4)
S(whoosh(0.9, 200, 1600), 16.05, -8)
S(fire_bed(13.2, ([0, 0.6, 2.9, 4.2, 8.2, 9.4, 13.2], [0.0, 0.55, 0.6, 1.0, 1.0, 0.35, 0.0])), 16.1, -11)
for k in range(15):  # tocsin
    S(bell(I.m2f(69), 0.28, 0.8 if k % 2 == 0 else 0.6), 16.45 + k * 0.155, -15, 0.5)
S(whoosh(1.4, 150, 900), T["glow"], -10)
for i in range(3):
    for k in range(9):
        S(step(0.9), T["run"] + 0.05 + k * 0.165 + i * 0.05, -13, 0.6 - 0.12 * k)
for i in range(4):
    S(splash(0.8), T["throw"] + i * 0.13 + 0.3, -7, (-0.5, -0.3, 0.3, 0.5)[i])
S(hiss(3.2, 0.9), T["throw"] + 0.45, -8)
S(crack_snd(), T["crack"], -1)
S(creak(0.65, 14, 40, (300, 900)), T["fall"] - 0.05, -9, 0.3)
S(thud(1.2), T["thud"], -1, 0.2)
S(hiss(2.0, 0.8), 27.4, -18)
S(whoosh(0.5, 400, 2000, False), 33.68, -13, 0.5)
for dt in (0.0, 0.11, 0.27):
    S(tink(2900 + 600 * R.random(), 0.5), 34.35 + dt, -17, 0.4)
S(pour(3.6), T["pour"], -11)
S(hiss(2.8, 1.2), T["pour"] + 0.15, -16)
S(creak(0.55, 60, 180, (2600, 5200)), 39.3, -15)
S(shatter(), T["burst"], -3)
S(splash(0.6), T["burst"] + 0.08, -12)
S(fades(bp(colored(ns(2.6), R, 1.2), 200, 900) * (0.5 + 0.5 * smooth_noise(ns(2.6), R, 1.5)), 0.6, 0.8), 43.0, -20)
for t0 in (43.5, 43.82, 44.9, T["crow"], T["crow"] + 0.33, T["crow"] + 0.66):
    S(caw(), t0, -13, 0.1)
S(creak(1.5, 16, 70, (700, 1900)), 46.4, -12, -0.3)
S(I.pluck(55, 1.0, R, 0.8, 0.9), T["snap"], -4, -0.2)
S(hp(R.standard_normal(ns(0.1)), 2200) * env_exp(ns(0.1), 0.012, 0.0003), T["snap"], -6, -0.2)
for i in range(3):
    S(thud(0.45), T["snap"] + 0.3 + i * 0.09, -9, -0.5)
S(creak(1.45, 12, 34, (420, 1200)), T["raise_"], -11)
S(thud(1.3), T["land"], -1)
S(knock(), T["knock"], -6, 0.2)
S(knock(), T["knock"] + 0.22, -9, 0.2)

# ------------------------------------------------------------------ music (original, D minor, 108 BPM)
B = 60 / 108


def M(x, t, gain_db=0.0, p=0.0):
    x = np.asarray(x)
    place(music, x if x.ndim == 2 else pan(x, p), t, dbg(gain_db))


def roll(t0, t1, v0, v1, gain_db):
    for tm, vel in I.snare_roll(t0, t1, v0, v1, R):
        M(I.snare(vel, R, 0.12, buzz=True), tm, gain_db, 0.15)


def oompah(t0, bars, chords, vel=0.7, gain=0.0):
    """tuba on 1 and 3, plucked chord on the off-beats; chords = [(bass midi, [chord midi])] per bar"""
    for b in range(bars):
        bass, ch = chords[b % len(chords)]
        for q in range(4):
            t = t0 + (b * 4 + q) * B
            if t > DUR - 0.5:
                return
            if q % 2 == 0:
                M(I.brass(I.m2f(bass - (0 if q == 0 else 5)), B * 0.8, vel, R, "tuba"), t, gain - 3, -0.15)
            else:
                for m in ch:
                    M(I.pluck(I.m2f(m), vel * 0.7, R, 0.5, 0.6), t, gain - 9, 0.25)


def tune(t0, notes, inst="pluck", gain=0.0, p=0.1):
    """notes = [(midi or None, beats)]"""
    t = t0
    for m, d in notes:
        if m is not None and t < DUR - 0.3:
            if inst == "pluck":  # balalaika-like double stroke
                M(I.pluck(I.m2f(m), 0.8, R, 0.7, 0.75, 0.12), t, gain, p)
                if d >= 1:
                    M(I.pluck(I.m2f(m), 0.5, R, 0.5, 0.75, 0.12), t + B * 0.5, gain - 3, p)
            elif inst == "glock":
                M(I.glock(I.m2f(m), 0.6, R, 1.2), t, gain, p)
            elif inst == "fife":
                M(I.fife(I.m2f(m), d * B * 0.9, 0.6, R), t, gain, p)
            else:
                M(I.brass(I.m2f(m), d * B * 0.92, 0.75, R, inst), t, gain, p)
        t += d * B


DM, GM, A7, F, C, BB = (38, [62, 65, 69]), (43, [62, 67, 70]), (45, [61, 64, 67]), (41, [60, 65, 69]), (36, [60, 64, 67]), (46, [62, 65, 70])
THEME = [(74, 1), (72, 0.5), (70, 0.5), (69, 1), (65, 1), (67, 1), (69, 0.5), (70, 0.5), (69, 2),
         (70, 1), (69, 0.5), (67, 0.5), (65, 1), (62, 1), (64, 1), (61, 1), (62, 2)]
# hook
oompah(0.05, 2, [DM, A7], 0.6, -2)
tune(0.05, [(62, 0.5), (65, 0.5), (69, 0.5), (74, 1.5), (73, 1), (74, 1), (None, 1), (69, 0.5), (74, 0.5)], "pluck", -5)
M(I.timpani(I.m2f(38), 0.9, R), T["flash"], -4); M(I.cymbal(0.5, R, 1.6), T["flash"], -14)
# setting: the folk theme
oompah(4.35, 5, [DM, GM, A7, DM, BB], 0.6, -3)
tune(4.35, THEME + [(74, 1), (77, 1), (76, 1), (73, 1)], "pluck", -5)
oompah(12.1, 2, [DM, GM], 0.45, -6)
tune(12.1, [(69, 2), (67, 2), (65, 2), (64, 1), (None, 1)], "glock", -12)
# fire: tension
M(I.pad([I.m2f(38), I.m2f(39), I.m2f(45), I.m2f(51)], 9.0, 0.6, R, att=0.5, rel=0.4, warm=700), 16.2, -9)
k = 0
t = 16.3
while t < 25.2:
    M(I.timpani(I.m2f(38 if k % 4 else 33), 0.55 + 0.3 * (t - 16.3) / 9, R, 1.0), t, -9, -0.2)
    t += B * (1.0 if t < 19 else 0.5 if t < 22.4 else 0.25); k += 1
tune(18.8, [(81, 0.5), (80, 0.5), (81, 0.5), (80, 0.5), (82, 1), (None, 1), (81, 0.5), (80, 0.5), (81, 0.5), (80, 0.5), (84, 1)], "fife", -14, 0.3)
roll(22.4, 25.35, 0.25, 0.9, -12)
M(I.cymbal(0.7, R, 2.0), T["crack"], -12)
# lucky / unlucky
tune(29.25, [(65, 0.5), (69, 0.5), (72, 0.5), (77, 1.5)], "horn", -7)
oompah(29.25, 1, [F], 0.6, -4)
for i, m in enumerate((58, 57, 56, 55)):  # the descending "wah wah"
    M(I.brass(I.m2f(m), 0.48 if i < 3 else 1.0, 0.8, R, "tuba", fall=-1.5 if i == 3 else 0.0), 31.5 + i * 0.5, -5, -0.1)
# kitchen: tick-tock
for q in range(12):
    tq = 33.8 + q * B
    if tq < 39.4:
        M(I.pluck(I.m2f(50 if q % 2 == 0 else 57), 0.6, R, 0.4, 0.4), tq, -9, -0.2)
        M(I.glock(I.m2f((74, 77, 81, 77, 76, 79, 82, 79, 81, 84, 86, 88)[q]), 0.5, R, 0.9), tq + B * 0.5, -13, 0.3)
roll(38.6, 39.85, 0.15, 0.8, -14)
# same thing / a hundred years
M(I.pad([I.m2f(50), I.m2f(57), I.m2f(62), I.m2f(65)], 3.6, 0.5, R, att=0.4, rel=0.8), 40.9, -10)
tune(41.0, [(69, 2), (65, 1.5), (62, 2)], "glock", -12)
# Napoleon: a little march on fife and drum
for q in range(8):
    tq = 45.85 + q * B * 0.5
    if tq < T["snap"] - 0.1:
        M(I.snare(0.5 + 0.3 * (q % 4 == 0), R, 0.2), tq, -14, 0.2)
tune(45.85, [(74, 0.5), (74, 0.25), (74, 0.25), (79, 0.5), (79, 0.5), (83, 0.5), (79, 0.5), (86, 1)], "fife", -13, -0.2)
M(I.brass(I.m2f(41), 1.1, 0.8, R, "tuba", fall=-4.0), 48.45, -6)
# raising: brass climbs, lands with the bell
tune(49.7, [(50, 0.75), (53, 0.75), (57, 0.75), (62, 0.75)], "horn", -8)
oompah(49.7, 1, [DM], 0.5, -6)
M(I.timpani(I.m2f(38), 1.0, R), T["land"], -3); M(I.cymbal(0.8, R, 2.2), T["land"], -11)
# today: the theme again, then nothing
oompah(52.95, 2, [DM, GM], 0.5, -5)
tune(52.95, THEME[:9], "pluck", -6)
oompah(56.7, 1, [A7], 0.4, -7)
tune(56.7, [(73, 1), (76, 1), (None, 0.2)], "pluck", -7)

ir = make_ir(1.1, 7)
music = music + 0.22 * convolve_st(music, ir)
sfx = sfx + 0.12 * convolve_st(sfx, make_ir(0.7, 9))

# ------------------------------------------------------------------ mix: voice untouched, music ducked under it
voice, sr = read_wav(os.path.join(HERE, "..", "voice", "voice.wav"))
assert sr == SR
v = np.zeros(N); v[: min(N, voice.shape[1])] = voice[0][:N]
v *= dbg(-16.0 - integrated(st(v)))
envv = lp(np.abs(v), 6)
duck = 1 - 0.58 * np.clip(envv / (np.percentile(envv, 90) + 1e-9) * 1.6, 0, 1)
duck = lp(duck, 4)
music *= dbg(-24.0 - integrated(music)) * dbg(3.0)
sfx *= dbg(-6.0) * 0.5
mix = st(v) + music * duck + sfx
mix *= dbg(-14.0 - integrated(mix))
# look-ahead peak limiter (5 ms window, ceiling about -1.5 dBFS), then re-trim to -14 LUFS
from scipy import ndimage
for _ in range(2):
    pk = ndimage.maximum_filter1d(np.abs(mix).max(axis=0), ns(0.005))
    g = ndimage.uniform_filter1d(np.minimum(1.0, 0.8 / np.maximum(pk, 1e-9)), ns(0.004))
    mix = mix * g
    mix *= min(1.0, dbg(-14.0 - integrated(mix)))
mix = fades(mix, 0.005, 0.25)
write_wav(os.path.join(HERE, "music.wav"), music * duck)
write_wav(os.path.join(HERE, "sfx.wav"), sfx)
write_wav(os.path.join(HERE, "mix.wav"), mix)
print("mix %.2f s  integrated %.1f LUFS  true peak %.1f dBTP | voice %.1f  music %.1f  sfx %.1f LUFS" % (
    mix.shape[1] / SR, integrated(mix), true_peak(mix), integrated(st(v)), integrated(music * duck), integrated(sfx)))
