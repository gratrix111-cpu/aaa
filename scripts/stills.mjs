// usage: node scripts/stills.mjs <CompId> <outPrefix> <frame,frame,...> [scale]  (bundles once, software GL, jpeg)
// SHORT_ENTRY=src/sandboxes/<name>/index.tsx renders a sandbox copy instead of the main project entry.
import fs from "node:fs";
import path from "node:path";
const tmp = process.env.REMOTION_TMP || path.resolve(".remotion-tmp");
fs.mkdirSync(tmp, { recursive: true });
process.env.TMPDIR = process.env.TEMP = process.env.TMP = tmp;
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");
const [id, prefix, frames, scale = "0.5"] = process.argv.slice(2);
const chromiumOptions = { gl: process.env.REMOTION_GL || "swangle" };
fs.mkdirSync(path.dirname(prefix), { recursive: true });
const t00 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.SHORT_ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
console.log("bundle", ((Date.now() - t00) / 1000).toFixed(1) + "s");
const inputProps = process.env.SHORT_PROPS ? JSON.parse(process.env.SHORT_PROPS) : {};
const composition = await selectComposition({ serveUrl, id, chromiumOptions, inputProps });
const onBrowserLog = (l) => { if (process.env.ALL_LOGS || l.type === "error" || l.type === "warning") console.log("[" + l.type + "]", l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: prefix + f + ".jpg", imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale),
    chromiumOptions, inputProps, timeoutInMilliseconds: 600000, onBrowserLog });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
fs.rmSync(serveUrl, { recursive: true, force: true });
