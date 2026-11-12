// usage: node scripts/render_frames.mjs <CompId> <outDir>   (resumable: renders from the first missing frame)
// Software GL is slow, so the final is rendered as a JPEG sequence that survives interruptions; encode with ffmpeg:
//   ffmpeg -framerate 30 -i <outDir>/element-%04d.jpeg -i mix.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k final.mp4
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
let first = 0;
while (first < total && fs.existsSync(name(first))) first++;
if (first > 0) first--; // the last file may be partial
const last = Number(process.env.LAST ?? total - 1);
console.log("render", first, "->", last, "of", total);
const t0 = Date.now();
let done = 0;
if (first <= last) {
  await renderFrames({
    composition, serveUrl, inputProps, outputDir, imageFormat: "jpeg", jpegQuality: 95, scale: 1, chromiumOptions,
    frameRange: [first, last], concurrency: 1, timeoutInMilliseconds: 900000, onStart: () => {},
    onFrameUpdate: (n) => { done = n; if (n % 50 === 0) console.log("frames", first + n, ((Date.now() - t0) / 1000).toFixed(0) + "s"); },
    onBrowserLog: (l) => { if (l.type === "error") console.log("[error]", l.text.slice(0, 300)); },
  });
}
console.log("DONE", done, ((Date.now() - t0) / 1000).toFixed(0) + "s");
fs.rmSync(serveUrl, { recursive: true, force: true });
