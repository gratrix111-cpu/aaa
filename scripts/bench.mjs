// usage: node scripts/bench.mjs <CompId> <from> <to> [scale]   (per-frame render times; SHORT_PROPS = JSON inputProps)
import fs from "node:fs";
import path from "node:path";
const tmp = process.env.REMOTION_TMP || path.resolve(".remotion-tmp");
fs.mkdirSync(tmp, { recursive: true });
process.env.TMPDIR = process.env.TEMP = process.env.TMP = tmp;
const { bundle } = await import("@remotion/bundler");
const { renderFrames, selectComposition } = await import("@remotion/renderer");
const [id, from, to, scale = "1"] = process.argv.slice(2);
const chromiumOptions = { gl: process.env.REMOTION_GL || "swangle" };
const inputProps = process.env.SHORT_PROPS ? JSON.parse(process.env.SHORT_PROPS) : {};
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.SHORT_ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, chromiumOptions, inputProps });
const outputDir = path.resolve("out/bench/" + (process.env.BENCH_NAME || "x"));
fs.mkdirSync(outputDir, { recursive: true });
const t0 = Date.now();
const times = [];
await renderFrames({
  composition, serveUrl, inputProps, outputDir, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale), chromiumOptions,
  frameRange: [Number(from), Number(to)], concurrency: Number(process.env.CONC || 1), timeoutInMilliseconds: 600000,
  onStart: () => {}, onFrameUpdate: (n, idx, ms) => { times.push(Math.round(ms)); },
});
console.log(process.env.BENCH_NAME || "x", "props", JSON.stringify(inputProps), "total", ((Date.now() - t0) / 1000).toFixed(1) + "s", "frames ms", times.join(","));
fs.rmSync(serveUrl, { recursive: true, force: true });
