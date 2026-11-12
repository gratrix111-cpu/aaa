"""Per-second RMS (dBFS) of the stems: quick balance check without listening.  usage: python3 levels.py"""
import os
import numpy as np
from dsp import read_wav, SR

HERE = os.path.dirname(os.path.abspath(__file__))
rows = {}
for name, p in (("voice", "../voice/voice.wav"), ("music", "music.wav"), ("sfx", "sfx.wav"), ("mix", "mix.wav")):
    x, sr = read_wav(os.path.join(HERE, p))
    m = x.mean(axis=0) if name != "voice" else x[0]
    n = len(m) // SR
    rows[name] = [20 * np.log10(np.sqrt(np.mean(m[i * SR:(i + 1) * SR] ** 2)) + 1e-9) for i in range(n)]
print("sec  " + "  ".join(f"{k:>5}" for k in rows))
for i in range(max(len(v) for v in rows.values())):
    print(f"{i:>3}  " + "  ".join(f"{rows[k][i]:5.0f}" if i < len(rows[k]) else "    -" for k in rows))
