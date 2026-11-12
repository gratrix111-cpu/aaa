// usage: node scripts/sheet.mjs <CompId> <every> [scale] [from] [to]
// Renders every Nth frame in ONE browser page (world built once) into out/<id>/sheet/ for contact sheets.
import fs from "node:fs";
import path from "node:path";
const tmp = process.env.REMOTION_TMP || path.resolve(".remotion-tmp");
fs.mkdirSync(tmp, { recursive: true });
process.env.TMPDIR = process.env.TEMP = process.env.TMP = tmp;
const { bundle } = await import("@remotion/bundler");
const { renderFrames, selectComposition } = await import("@remotion/renderer");
const [id, every = "30", scale = "0.3333", from, to] = process.argv.slice(2);
const chromiumOptions = { gl: process.env.REMOTION_GL || "swangle" };
const inputProps = process.env.SHORT_PROPS ? JSON.parse(process.env.SHORT_PROPS) : {};
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, chromiumOptions, inputProps });
const outputDir = path.resolve("out", id, "sheet");
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
const t0 = Date.now();
await renderFrames({
  composition, serveUrl, inputProps, outputDir, imageFormat: "jpeg", jpegQuality: 85, scale: Number(scale), chromiumOptions,
  frameRange: [Number(from ?? 0), Number(to ?? composition.durationInFrames - 1)], everyNthFrame: Number(every), concurrency: 1,
  timeoutInMilliseconds: 600000, onStart: () => {}, onFrameUpdate: () => {},
  onBrowserLog: (l) => { if (l.type === "error") console.log("[error]", l.text.slice(0, 300)); },
});
console.log("sheet frames", fs.readdirSync(outputDir).length, ((Date.now() - t0) / 1000).toFixed(1) + "s");
fs.rmSync(serveUrl, { recursive: true, force: true });
