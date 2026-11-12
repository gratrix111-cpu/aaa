"""Draft Russian narration with edge-tts + word timings (timing reference only: the final voice is recorded separately).
usage: python3 tts.py  ->  voice/voice.wav (48 kHz mono), voice/words.json [{w, t0, t1, line}], voice/lines.json
The text is the "## Текст" section of SCRIPT.md: one sentence per line, synthesized separately and joined with the
pause written after it ({0.5} = seconds, default TTS_GAP), so every sentence has an exact slot (voice/lines.json).
Raw service answers are cached by sentence in voice/cache/, so a re-run only asks for sentences that changed.
"""
import asyncio, hashlib, json, os, re, subprocess, wave
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.environ.get("TTS_VOICE", "ru-RU-DmitryNeural")
TEMPO = float(os.environ.get("TTS_TEMPO", "1.10"))  # sped up with ffmpeg atempo (edge-tts rate + WordBoundary returns no audio)
GAP = float(os.environ.get("TTS_GAP", "0.24"))  # default silence between sentences, seconds
OUT = os.path.join(HERE, "voice")
CACHE = os.path.join(OUT, "cache")


def lines():
    """[(sentence, pause after it in seconds)]"""
    txt = open(os.path.join(HERE, "SCRIPT.md"), encoding="utf-8").read().split("## Текст", 1)[1]
    out = []
    for l in txt.strip().splitlines():
        if l.strip():
            m = re.match(r"^(.*?)\s*(?:\{([\d.]+)\})?$", l.strip())
            out.append((m.group(1), float(m.group(2)) if m.group(2) else GAP))
    return out


async def fetch(text):
    """-> (mp3 path, [{w, t0, t1}] in seconds at the service's own tempo)"""
    h = hashlib.md5((VOICE + "|" + text).encode()).hexdigest()[:12]
    mp3, meta = os.path.join(CACHE, h + ".mp3"), os.path.join(CACHE, h + ".json")
    if os.path.exists(mp3) and os.path.exists(meta):
        return mp3, json.load(open(meta, encoding="utf-8"))["words"]
    for attempt in range(14):  # the service intermittently answers without audio
        try:
            try:
                com = edge_tts.Communicate(text, VOICE, boundary="WordBoundary")
            except TypeError:
                com = edge_tts.Communicate(text, VOICE)
            words, audio = [], b""
            async for ch in com.stream():
                if ch["type"] == "audio":
                    audio += ch["data"]
                elif ch["type"] == "WordBoundary":
                    words.append({"w": ch["text"], "t0": ch["offset"] / 1e7, "t1": (ch["offset"] + ch["duration"]) / 1e7})
            open(mp3, "wb").write(audio)
            json.dump({"text": text, "voice": VOICE, "words": words}, open(meta, "w", encoding="utf-8"), ensure_ascii=False)
            return mp3, words
        except edge_tts.exceptions.NoAudioReceived:
            await asyncio.sleep(2 + attempt)
    raise RuntimeError("no audio for: " + text)


def read(wav):
    import numpy as np
    with wave.open(wav) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype("float32") / 32768


def trim(x, thr=0.004):
    import numpy as np
    idx = np.nonzero(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x, 0
    a = max(0, idx[0] - 480)
    b = min(len(x), idx[-1] + 2400)
    return x[a:b], a


async def main():
    import numpy as np
    os.makedirs(CACHE, exist_ok=True)
    out, words, t, starts = [], [], 0.0, []
    for i, (text, pause) in enumerate(lines()):
        mp3, ws = await fetch(text)
        wav = os.path.join(OUT, f"line{i:02d}.wav")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-af", f"atempo={TEMPO}", "-ar", "48000", "-ac", "1", wav], check=True)
        x, a = trim(read(wav))
        off = t - a / 48000
        starts.append({"line": i, "text": text, "t0": round(t, 3), "t1": round(t + len(x) / 48000, 3)})
        for w in ws:
            words.append({"w": w["w"], "t0": round(max(t, w["t0"] / TEMPO + off), 3), "t1": round(w["t1"] / TEMPO + off, 3), "line": i})
        out.append(x)
        t += len(x) / 48000
        gap = np.zeros(int(pause * 48000), dtype="float32")
        out.append(gap)
        t += len(gap) / 48000
    y = np.concatenate(out[:-1])
    y = y / max(1e-6, np.abs(y).max()) * 0.89
    with wave.open(os.path.join(OUT, "voice.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000)
        w.writeframes((y * 32767).astype("int16").tobytes())
    json.dump(words, open(os.path.join(OUT, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    json.dump(starts, open(os.path.join(OUT, "lines.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("voice", round(len(y) / 48000, 2), "s,", len(words), "words")
    for s in starts:
        print(f'{s["t0"]:6.2f} {s["t1"]:6.2f}  {s["text"]}')


asyncio.run(main())
