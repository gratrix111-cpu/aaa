// usage: node scripts/keys.mjs <KeysCompId> <t,t,...> [scale=0.3333] [dpr=0.5]
// Look checks: renders one frame per listed second of a "<Short>Keys" composition in ONE browser page (world built
// once) into out/<id>/keys/, then make a contact sheet with scripts/make_sheets.py. SHORT_PROPS adds input props.
import fs from "node:fs";
import path from "node:path";
const tmp = process.env.REMOTION_TMP || path.resolve(".remotion-tmp");
fs.mkdirSync(tmp, { recursive: true });
process.env.TMPDIR = process.env.TEMP = process.env.TMP = tmp;
const { bundle } = await import("@remotion/bundler");
const { renderFrames, selectComposition } = await import("@remotion/renderer");
const [id, times, scale = "0.3333", dpr = "0.5"] = process.argv.slice(2);
const chromiumOptions = { gl: process.env.REMOTION_GL || "swangle" };
const inputProps = { ...(process.env.SHORT_PROPS ? JSON.parse(process.env.SHORT_PROPS) : {}), keys: times.split(",").map(Number), dpr: Number(dpr) };
const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, chromiumOptions, inputProps });
const outputDir = path.resolve("out", id, "keys");
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
await renderFrames({
  composition, serveUrl, inputProps, outputDir, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale), chromiumOptions,
  frameRange: [0, composition.durationInFrames - 1], concurrency: 1, timeoutInMilliseconds: 600000, onStart: () => {}, onFrameUpdate: () => {},
  onBrowserLog: (l) => { if (l.type === "error" || process.env.ALL_LOGS) console.log("[" + l.type + "]", l.text.slice(0, 400)); },
});
console.log("keys", fs.readdirSync(outputDir).length, ((Date.now() - t0) / 1000).toFixed(1) + "s");
fs.rmSync(serveUrl, { recursive: true, force: true });
