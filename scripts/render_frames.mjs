// usage: node scripts/render_frames.mjs <CompId> <outDir>   (resumable: renders from the first missing frame)
// Software GL is slow, so the final is rendered as a JPEG sequence that survives interruptions; encode with ffmpeg:
//   ffmpeg -framerate 30 -i <outDir>/element-%04d.jpeg -i mix.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k final.mp4
// RANGES=642-678,1047-1064 re-renders only those frames of an existing sequence (after a fix that touches a few shots).
import fs from "node:fs";
import path from "node:path";
const tmp = process.env.REMOTION_TMP || path.resolve(".remotion-tmp");
fs.mkdirSync(tmp, { recursive: true });
process.env.TMPDIR = process.env.TEMP = process.env.TMP = tmp;
const { bundle } = await import("@remotion/bundler");
const { renderFrames, selectComposition } = await import("@remotion/renderer");
const [id, out] = process.argv.slice(2);
const chromiumOptions = { gl: process.env.REMOTION_GL || "swangle" };
const inputProps = process.env.SHORT_PROPS ? JSON.parse(process.env.SHORT_PROPS) : {};
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, chromiumOptions, inputProps });
const outputDir = path.resolve(out);
fs.mkdirSync(outputDir, { recursive: true });
const total = composition.durationInFrames, pad = String(total - 1).length;
const name = (f) => path.join(outputDir, "element-" + String(f).padStart(pad, "0") + ".jpeg");
const t0 = Date.now();
let done = 0;
const run = (dir, a, b) => renderFrames({
  composition, serveUrl, inputProps, outputDir: dir, imageFormat: "jpeg", jpegQuality: 95, scale: 1, chromiumOptions,
  frameRange: [a, b], concurrency: 1, timeoutInMilliseconds: 900000, onStart: () => {},
  onFrameUpdate: (n) => { done = n; if (n % 50 === 0) console.log("frames", a + n, ((Date.now() - t0) / 1000).toFixed(0) + "s"); },
  onBrowserLog: (l) => { if (l.type === "error") console.log("[error]", l.text.slice(0, 300)); },
});
if (process.env.RANGES) {
  for (const [a, b] of process.env.RANGES.split(",").map((r) => r.split("-").map(Number))) {
    const part = path.join(outputDir, ".range");
    fs.rmSync(part, { recursive: true, force: true });
    fs.mkdirSync(part, { recursive: true });
    await run(part, a, b);
    // Remotion pads (and may number) the files of a partial range differently: move them back under the sequence's names
    const got = fs.readdirSync(part).filter((f) => f.endsWith(".jpeg")).map((f) => [Number(f.match(/(\d+)/)[1]), f]).sort((x, y) => x[0] - y[0]);
    const off = got.length && got[0][0] === 0 && a !== 0 ? a : 0;
    if (got.length !== b - a + 1 || got[0][0] + off !== a || got[got.length - 1][0] + off !== b) throw new Error(`range ${a}-${b}: unexpected files ${got.length ? got[0][1] + " .. " + got[got.length - 1][1] : "none"}`);
    for (const [n, f] of got) fs.renameSync(path.join(part, f), name(n + off));
    fs.rmSync(part, { recursive: true, force: true });
    console.log("range", a, "->", b, "done", ((Date.now() - t0) / 1000).toFixed(0) + "s");
  }
} else {
  let first = 0;
  while (first < total && fs.existsSync(name(first))) first++;
  if (first > 0) first--; // the last file may be partial
  const last = Number(process.env.LAST ?? total - 1);
  console.log("render", first, "->", last, "of", total);
  if (first <= last) await run(outputDir, first, last);
  console.log("DONE", done, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
fs.rmSync(serveUrl, { recursive: true, force: true });
