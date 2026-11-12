# Cartoon shorts

Vertical animated story shorts made with the `cartoon-3d-short` skill (flat 2D characters in a painted 3D world,
three.js inside Remotion, synthesized sound).

- Skill: `.claude/skills/cartoon-3d-short/` (also copy it to `~/.claude/skills/cartoon-3d-short/` for Claude Code).
- Shorts: `src/videos/<name>/` (picture) + `shorts/<name>/` (script, voice, sound).

## «Колокол, который молчит» (Tsar Bell, Russian, ~60 s)

| What | Where |
|---|---|
| Script and sources | `shorts/tsar-bell/SCRIPT.md` |
| Narration + word timings | `shorts/tsar-bell/tts.py` → `voice/voice.wav`, `voice/words.json` |
| Music, SFX, mix | `shorts/tsar-bell/audio/score.py` → `mix.wav` |
| Timeline, cameras | `src/videos/bell/story.ts` |
| Set and per-frame posing | `src/videos/bell/world.ts` |
| Characters and effect cards | `src/videos/bell/chars.ts` |
| Composition, post chain, captions | `src/videos/bell/Bell.tsx`, `Captions.tsx` |

### Rebuild

```sh
npm install
npx remotion browser ensure
python3 shorts/tsar-bell/tts.py                 # only if the script changed (needs network: edge-tts)
python3 shorts/tsar-bell/audio/score.py         # after any timing change
node scripts/stills.mjs BellShort out/bell/x_ 100,400 0.5            # look checks
node scripts/sheet.mjs BellShort 22 && python3 scripts/make_sheets.py out/BellShort/sheet out/bell/cs_ 7 2 260
node scripts/render_frames.mjs BellShort out/bell/frames             # resumable JPEG sequence
ffmpeg -framerate 30 -i out/bell/frames/element-%04d.jpeg -i shorts/tsar-bell/audio/mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k out/bell/final.mp4
python3 scripts/short_qa.py out/bell/final.mp4 out/bell/qa shorts/tsar-bell/shots.json
```

### Voice-free version and cover

`score.py` also writes `bed_novoice.wav`: the same music and SFX at the gains they have in the full mix, without the
narration (the music still dips where each line is spoken). Mux it instead of `mix.wav` to get a video for an external
voice-over; `shorts/tsar-bell/VOICEOVER.txt` is the narration text and `voice/lines.json` has the start and end of every
line that the animation and captions are timed to.

```bash
node scripts/stills.mjs BellCover out/bell/cover_ 0 1     # cover -> out/bell/cover_0.jpg (committed as shorts/tsar-bell/cover.jpg)
```

### Notes

- `@react-three/postprocessing` is pinned to 3.0.4: 3.2.x builds its composer asynchronously, so Remotion captures a
  blank canvas on the first frame of every page.
- The scripts default to software GL (`REMOTION_GL=swangle`). On a machine with a GPU set `REMOTION_GL=angle` and
  pass `SHORT_PROPS='{"dpr":1}'` (or render with `--scale 1.3333`) for a full-resolution WebGL buffer; the committed
  default `dpr` of 0.8333 renders the 3D layer at 900x1600 under 1080x1920 captions.
- Russian narration and captions are a deliberate departure from the skill's "English only / no captions" rules.
