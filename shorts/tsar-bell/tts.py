"""Russian narration with edge-tts + word timings.
usage: python3 tts.py  ->  voice/voice.mp3, voice/voice.wav (48 kHz mono), voice/words.json [{w, t0, t1}] (seconds)
The text is the "## Текст" section of ../SCRIPT.md; each line is synthesized separately and joined with short gaps,
so line starts are exact and the word boundaries only have to be right within a line.
"""
import asyncio, json, os, re, subprocess, sys, wave
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.environ.get("TTS_VOICE", "ru-RU-DmitryNeural")
TEMPO = float(os.environ.get("TTS_TEMPO", "1.12"))  # sped up with ffmpeg atempo (edge-tts rate + WordBoundary returns no audio)
GAP = float(os.environ.get("TTS_GAP", "0.16"))  # silence between lines, seconds
OUT = os.path.join(HERE, "voice")


def lines():
    txt = open(os.path.join(HERE, "SCRIPT.md"), encoding="utf-8").read().split("## Текст", 1)[1]
    return [l.strip() for l in txt.strip().splitlines() if l.strip()]


async def synth(i, text):
    for attempt in range(8):  # the service intermittently answers without audio
        try:
            return await synth_once(i, text)
        except edge_tts.exceptions.NoAudioReceived:
            await asyncio.sleep(1.5 + attempt)
    raise RuntimeError(f"no audio for line {i}")


async def synth_once(i, text):
    mp3 = os.path.join(OUT, f"line{i:02d}.mp3")
    try:
        com = edge_tts.Communicate(text, VOICE, boundary="WordBoundary")
    except TypeError:
        com = edge_tts.Communicate(text, VOICE)
    words = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append({"w": ch["text"], "t0": ch["offset"] / 1e7 / TEMPO, "t1": (ch["offset"] + ch["duration"]) / 1e7 / TEMPO})
    wav = mp3[:-4] + ".wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-af", f"atempo={TEMPO}", "-ar", "48000", "-ac", "1", wav], check=True)
    return wav, words


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
    os.makedirs(OUT, exist_ok=True)
    out, words, t, starts = [], [], 0.0, []
    for i, text in enumerate(lines()):
        wav, ws = await synth(i, text)
        x, a = trim(read(wav))
        off = t - a / 48000
        starts.append({"line": i, "text": text, "t0": round(t, 3), "t1": round(t + len(x) / 48000, 3)})
        for w in ws:
            words.append({"w": w["w"], "t0": round(max(t, w["t0"] + off), 3), "t1": round(w["t1"] + off, 3), "line": i})
        out.append(x)
        t += len(x) / 48000
        gap = np.zeros(int(GAP * 48000), dtype="float32")
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
