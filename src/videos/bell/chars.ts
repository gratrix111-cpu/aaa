// Flat bean-head cartoon cards for the Tsar Bell short, drawn with Canvas2D (plum ink, stick limbs, deadpan faces).
// Design canvas 600 x 1000, soles at y = 975, head centre (300, 309): the zones cardshade.ts expects.
import * as THREE from "three";
import { cardShade } from "./cardshade";
import { NOINK } from "./ink";

export const INK = "#241726";
const W = 600, H = 1000, S = 0.8;
type G = CanvasRenderingContext2D;

export type Face = "flat" | "happy" | "shock" | "sad" | "strain" | "smug" | "blink";
export type Look = {
  id: string; skin: string; body: string; hat?: "tricorn" | "bicorne" | "cap" | "bearskin" | "baseball" | "hair" | "none"; hatCol?: string;
  beard?: string; apron?: string; belts?: string; cuffs?: string; coat?: boolean; epaulettes?: boolean; stripe?: string;
};
export type Pose = { face?: Face; aL?: number; aR?: number; eL?: number; eR?: number; step?: number; prop?: "bucket" | "bucketFull" | "hammer" | "phone" | null; look?: number };

const canvas = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const tex = (c: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter; return t;
};
const ink = (g: G, lw = 10) => { g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = "round"; g.lineCap = "round"; };
const shadeHex = (hex: string, k: number) => "#" + new THREE.Color(hex).multiplyScalar(k).getHexString();

function headPath(g: G) {
  g.beginPath(); g.moveTo(300, 198);
  g.bezierCurveTo(388, 198, 422, 262, 417, 322); g.bezierCurveTo(412, 388, 362, 421, 300, 421);
  g.bezierCurveTo(238, 421, 188, 388, 183, 322); g.bezierCurveTo(178, 262, 212, 198, 300, 198); g.closePath();
}

function drawFace(g: G, face: Face, lookX: number, beard: boolean) {
  const ex = 31, ey = 304, my = beard ? 372 : 366;
  ink(g, 7); g.fillStyle = INK;
  const dot = (x: number, r = 9) => { g.beginPath(); g.arc(x + lookX * 6, ey, r, 0, 7); g.fill(); };
  const line = (x0: number, y0: number, x1: number, y1: number, lw = 7) => { g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  if (face === "shock") {
    for (const s of [-1, 1]) {
      g.fillStyle = "#fff"; g.beginPath(); g.arc(300 + s * ex, ey - 4, 19, 0, 7); g.fill(); g.lineWidth = 5; g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(300 + s * ex + lookX * 7, ey - 4, 6, 0, 7); g.fill();
      line(300 + s * 16, ey - 42, 300 + s * 52, ey - 48, 6);
    }
    g.fillStyle = "#3a1626"; g.beginPath(); g.ellipse(300, my + 6, 15, 21, 0, 0, 7); g.fill(); g.lineWidth = 5; g.stroke();
    return;
  }
  if (face === "strain") {
    for (const s of [-1, 1]) { line(300 + s * 16, ey, 300 + s * 44, ey - 11); line(300 + s * 16, ey, 300 + s * 44, ey + 11); line(300 + s * 12, ey - 30, 300 + s * 50, ey - 40, 6); }
    g.fillStyle = "#fff"; g.beginPath(); g.roundRect(268, my - 9, 64, 24, 8); g.fill(); g.lineWidth = 5; g.stroke();
    line(289, my - 9, 289, my + 15, 3); line(300, my - 9, 300, my + 15, 3); line(311, my - 9, 311, my + 15, 3);
    g.fillStyle = "#8fd3f0"; g.beginPath(); g.moveTo(392, 250); g.quadraticCurveTo(410, 280, 392, 286); g.quadraticCurveTo(374, 280, 392, 250); g.fill(); g.lineWidth = 4; g.stroke();
    return;
  }
  if (face === "blink") { for (const s of [-1, 1]) line(300 + s * ex - 11, ey, 300 + s * ex + 11, ey); }
  else if (face === "happy") { for (const s of [-1, 1]) { g.lineWidth = 7; g.beginPath(); g.arc(300 + s * ex, ey + 6, 12, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }
  else { dot(300 - ex); dot(300 + ex); }
  if (face === "flat" || face === "smug") for (const s of [-1, 1]) line(300 + s * ex - 15, ey - 10, 300 + s * ex + 15, ey - 10, 7);
  if (face === "sad") for (const s of [-1, 1]) line(300 + s * 14, ey - 34, 300 + s * 50, ey - 22, 6);
  g.lineWidth = 7; g.beginPath();
  if (face === "happy") { g.moveTo(272, my - 6); g.quadraticCurveTo(300, my + 26, 328, my - 6); g.closePath(); g.fillStyle = "#fff"; g.fill(); }
  else if (face === "sad") { g.moveTo(278, my + 8); g.quadraticCurveTo(300, my - 10, 322, my + 8); }
  else if (face === "smug") { g.moveTo(280, my + 2); g.quadraticCurveTo(306, my + 8, 326, my - 8); }
  else { g.moveTo(282, my); g.lineTo(318, my); }
  g.stroke();
}

function drawHat(g: G, L: Look) {
  const c = L.hatCol ?? "#1d1a22"; ink(g, 10); g.fillStyle = c;
  switch (L.hat) {
    case "tricorn":
      g.beginPath(); g.moveTo(138, 232); g.quadraticCurveTo(210, 150, 300, 142); g.quadraticCurveTo(390, 150, 462, 232);
      g.quadraticCurveTo(300, 268, 138, 232); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = "#e9d9a8"; g.lineWidth = 6; g.beginPath(); g.moveTo(160, 228); g.quadraticCurveTo(300, 254, 440, 228); g.stroke(); break;
    case "bicorne":
      g.beginPath(); g.moveTo(96, 244); g.bezierCurveTo(110, 120, 240, 70, 300, 70); g.bezierCurveTo(360, 70, 490, 120, 504, 244);
      g.quadraticCurveTo(300, 206, 96, 244); g.closePath(); g.fill(); g.stroke();
      for (const [r, col] of [[20, "#d8323a"], [13, "#f4f1ea"], [7, "#2b55b8"]] as [number, string][]) { g.fillStyle = col; g.beginPath(); g.arc(300, 150, r, 0, 7); g.fill(); }
      ink(g, 4); g.beginPath(); g.arc(300, 150, 20, 0, 7); g.stroke(); break;
    case "bearskin":
      g.beginPath(); g.moveTo(190, 250); g.bezierCurveTo(170, 60, 230, 20, 300, 20); g.bezierCurveTo(370, 20, 430, 60, 410, 250);
      g.quadraticCurveTo(300, 226, 190, 250); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#d8b24a"; g.beginPath(); g.roundRect(268, 150, 64, 70, 10); g.fill(); g.lineWidth = 5; g.stroke(); break;
    case "cap":
      g.beginPath(); g.moveTo(192, 246); g.bezierCurveTo(186, 150, 250, 138, 300, 138); g.bezierCurveTo(350, 138, 414, 150, 408, 246);
      g.quadraticCurveTo(300, 222, 192, 246); g.closePath(); g.fill(); g.stroke(); break;
    case "baseball":
      g.beginPath(); g.moveTo(190, 250); g.bezierCurveTo(184, 150, 250, 150, 300, 150); g.bezierCurveTo(350, 150, 416, 150, 410, 250);
      g.quadraticCurveTo(300, 228, 190, 250); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(300, 238); g.quadraticCurveTo(420, 226, 478, 262); g.quadraticCurveTo(400, 262, 300, 262); g.closePath(); g.fill(); g.stroke(); break;
    case "hair":
      g.beginPath(); g.moveTo(180, 330); g.bezierCurveTo(150, 170, 250, 160, 300, 160); g.bezierCurveTo(350, 160, 450, 170, 420, 330);
      g.quadraticCurveTo(410, 250, 350, 236); g.quadraticCurveTo(250, 232, 196, 262); g.closePath(); g.fill(); g.stroke(); break;
    default:
  }
}

function drawProp(g: G, prop: Pose["prop"], x: number, y: number) {
  ink(g, 8);
  if (prop === "bucket" || prop === "bucketFull") {
    g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(x, y + 10, 46, Math.PI, 0); g.stroke();
    g.fillStyle = "#b0773f"; g.beginPath(); g.moveTo(x - 52, y + 8); g.lineTo(x + 52, y + 8); g.lineTo(x + 40, y + 104); g.lineTo(x - 40, y + 104); g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 5; for (const k of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(x + k * 60, y + 10); g.lineTo(x + k * 48, y + 102); g.stroke(); }
    g.strokeStyle = "#4a4650"; g.lineWidth = 9; g.beginPath(); g.moveTo(x - 49, y + 34); g.lineTo(x + 49, y + 34); g.moveTo(x - 43, y + 82); g.lineTo(x + 43, y + 82); g.stroke();
    if (prop === "bucketFull") { ink(g, 6); g.fillStyle = "#4db4ea"; g.beginPath(); g.ellipse(x, y + 8, 52, 13, 0, 0, 7); g.fill(); g.stroke(); }
  } else if (prop === "hammer") {
    g.lineWidth = 13; g.strokeStyle = "#8a5a2c"; g.beginPath(); g.moveTo(x, y + 12); g.lineTo(x, y - 96); g.stroke();
    ink(g, 7); g.fillStyle = "#70737c"; g.beginPath(); g.roundRect(x - 44, y - 126, 88, 40, 8); g.fill(); g.stroke();
  } else if (prop === "phone") {
    g.fillStyle = "#23232b"; g.beginPath(); g.roundRect(x - 26, y - 76, 52, 88, 9); g.fill(); g.stroke();
    g.fillStyle = "#7fd0ff"; g.beginPath(); g.roundRect(x - 17, y - 66, 34, 60, 4); g.fill();
  }
}

export function drawPerson(g: G, L: Look, P: Pose) {
  const rad = Math.PI / 180;
  const step = P.step ?? 0; // -1..1: left foot lifted (<0) or right foot lifted (>0)
  // legs + feet (behind the torso)
  for (const s of [-1, 1]) {
    const lift = Math.max(0, s * step) * 46, fx = 300 + s * 40 + s * Math.max(0, s * step) * 10;
    ink(g, 14); g.beginPath(); g.moveTo(300 + s * 36, 690); g.lineTo(fx, 958 - lift); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.ellipse(fx + s * 14, 962 - lift, 30, 12, 0, 0, 7); g.fill();
  }
  // arm drawn behind or in front: here always behind the torso edge start, hands on top
  const arm = (s: number, a: number, e: number) => {
    const sx = 300 + s * 80, sy = 478, ex = sx + s * Math.sin(a * rad) * 108, ey = sy + Math.cos(a * rad) * 108;
    const hx = ex + s * Math.sin((a + e) * rad) * 102, hy = ey + Math.cos((a + e) * rad) * 102;
    ink(g, 14); g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke();
    if (L.cuffs) { g.strokeStyle = L.cuffs; g.lineWidth = 20; g.beginPath(); g.moveTo(ex + (hx - ex) * 0.62, ey + (hy - ey) * 0.62); g.lineTo(ex + (hx - ex) * 0.86, ey + (hy - ey) * 0.86); g.stroke(); }
    return [hx, hy] as const;
  };
  const hl = arm(-1, P.aL ?? 12, P.eL ?? 0);
  // torso
  const bot = L.coat ? 770 : 706;
  ink(g, 10); g.fillStyle = L.body;
  g.beginPath(); g.moveTo(214, 500); g.bezierCurveTo(214, 430, 250, 408, 300, 408); g.bezierCurveTo(350, 408, 386, 430, 386, 500);
  g.lineTo(L.coat ? 404 : 392, bot - 30); g.quadraticCurveTo(L.coat ? 404 : 392, bot, 360, bot); g.lineTo(240, bot);
  g.quadraticCurveTo(L.coat ? 196 : 208, bot, L.coat ? 196 : 208, bot - 30); g.closePath(); g.fill(); g.stroke();
  g.save(); g.clip();
  if (L.stripe) { g.fillStyle = L.stripe; g.fillRect(278, 400, 44, 400); }
  if (L.apron) { g.fillStyle = L.apron; g.beginPath(); g.roundRect(234, 500, 132, 300, 16); g.fill(); ink(g, 6); g.stroke(); g.beginPath(); g.moveTo(246, 502); g.lineTo(270, 410); g.moveTo(354, 502); g.lineTo(330, 410); g.stroke(); }
  if (L.belts) { g.strokeStyle = L.belts; g.lineWidth = 22; g.beginPath(); g.moveTo(216, 426); g.lineTo(384, 660); g.moveTo(384, 426); g.lineTo(216, 660); g.stroke(); ink(g, 4); g.fillStyle = "#d8b24a"; g.beginPath(); g.arc(300, 543, 12, 0, 7); g.fill(); g.stroke(); }
  if (!L.apron && !L.belts) { g.fillStyle = INK; for (const y of [520, 580, 640]) { g.beginPath(); g.arc(300, y, 7, 0, 7); g.fill(); } }
  g.restore();
  if (L.epaulettes) for (const s of [-1, 1]) { ink(g, 6); g.fillStyle = "#e0b84a"; g.beginPath(); g.ellipse(300 + s * 82, 448, 30, 15, s * 0.3, 0, 7); g.fill(); g.stroke(); }
  // head
  headPath(g); g.fillStyle = L.skin; g.fill();
  g.save(); headPath(g); g.clip(); g.fillStyle = shadeHex(L.skin, 0.9); g.beginPath(); g.ellipse(250, 300, 150, 150, 0, 0, 7); g.rect(0, 0, W, H); g.fill("evenodd"); g.restore();
  ink(g, 10); headPath(g); g.stroke();
  if (L.beard) {
    g.fillStyle = L.beard; ink(g, 9); g.beginPath(); g.moveTo(190, 330); g.bezierCurveTo(196, 400, 230, 480, 300, 492); g.bezierCurveTo(370, 480, 404, 400, 410, 330);
    g.bezierCurveTo(380, 352, 340, 344, 300, 344); g.bezierCurveTo(260, 344, 220, 352, 190, 330); g.closePath(); g.fill(); g.stroke();
  }
  drawFace(g, P.face ?? "flat", P.look ?? 0, !!L.beard);
  drawHat(g, L);
  const hr = arm(1, P.aR ?? 12, P.eR ?? 0);
  if (P.prop) drawProp(g, P.prop, hr[0], hr[1]);
  g.fillStyle = INK; for (const h of [hl, hr]) { g.beginPath(); g.arc(h[0], h[1], 14, 0, 7); g.fill(); }
}

const cache = new Map<string, THREE.Texture>();
export function personTex(L: Look, P: Pose) {
  const q = (v: number | undefined, d: number) => (v === undefined ? d : Math.round(v / 10) * 10);
  const p: Pose = { face: P.face ?? "flat", aL: q(P.aL, 10), aR: q(P.aR, 10), eL: q(P.eL, 0), eR: q(P.eR, 0), step: Math.round((P.step ?? 0) * 3) / 3, prop: P.prop ?? null, look: Math.round(P.look ?? 0) };
  const key = L.id + JSON.stringify(p);
  let t = cache.get(key);
  if (!t) { const c = canvas(W * S, H * S), g = c.getContext("2d")!; g.scale(S, S); drawPerson(g, L, p); t = tex(c); cache.set(key, t); }
  return t;
}
export function drawTex(key: string, w: number, h: number, draw: (g: G) => void) {
  let t = cache.get(key);
  if (!t) { const c = canvas(w, h), g = c.getContext("2d")!; draw(g); t = tex(c); cache.set(key, t); }
  return t;
}

const UNIT = 1.75 / 950; // metres per design unit (adult = 950 units tall incl. hat room)
const blobTex = () => drawTex("blob", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "#5c5568"); gr.addColorStop(0.55, "#9d97a8"); gr.addColorStop(1, "#ffffff");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

/** camera-facing character card with a contact blob; soles on y = 0 of the group */
export class Actor {
  group = new THREE.Group(); mesh: THREE.Mesh; blob: THREE.Mesh; mat: THREE.MeshLambertMaterial;
  constructor(public look: Look, public h = 1.75) {
    const k = h / 1.75, gw = W * UNIT * k, gh = H * UNIT * k;
    const geo = new THREE.PlaneGeometry(gw, gh); geo.translate(0, gh / 2 - 25 * UNIT * k, 0);
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: personTex(look, {}), alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.layers.set(NOINK); this.mesh.receiveShadow = true;
    const bg = new THREE.PlaneGeometry(0.95 * k, 0.5 * k); bg.rotateX(-Math.PI / 2);
    this.blob = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, premultipliedAlpha: true, fog: false }));
    this.blob.position.y = 0.02; this.blob.layers.set(NOINK); this.blob.renderOrder = 1;
    this.group.add(this.blob, this.mesh);
  }
  /** x, z on the ground (y optional), pose, flip = mirror, tilt = roll in radians (falls) */
  set(x: number, z: number, pose: Pose, o: { y?: number; flip?: boolean; tilt?: number; bob?: number; s?: number } = {}) {
    this.group.visible = true; this.group.position.set(x, o.y ?? 0, z);
    this.mat.map = personTex(this.look, pose);
    this.mesh.position.y = o.bob ?? 0; this.mesh.rotation.z = o.tilt ?? 0;
    this.mesh.scale.set((o.flip ? -1 : 1) * (o.s ?? 1), o.s ?? 1, 1);
    this.blob.visible = (o.y ?? 0) < 0.3 && Math.abs(o.tilt ?? 0) < 1;
  }
  face(cam: THREE.Camera) { this.mesh.rotation.y = Math.atan2(cam.position.x - this.group.position.x, cam.position.z - this.group.position.z); }
}

/** flat effect card (unlit; `glow` > 1 feeds the bloom) */
export function fxCard(t: THREE.Texture, w: number, h: number, glow = 1, soft = false) {
  const m = new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(glow, glow, glow), side: THREE.DoubleSide, fog: false,
    ...(soft ? { transparent: true, depthWrite: false } : { alphaTest: 0.5 }) });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.layers.set(NOINK); mesh.frustumCulled = false; mesh.visible = false;
  return mesh;
}

// ---------------- effect drawings ----------------
const blobPath = (g: G, cx: number, cy: number, r: number, n: number, seed: number, wob = 0.25) => {
  g.beginPath();
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2, rr = r * (1 + (i % 2 ? wob : -wob * 0.2) + 0.08 * Math.sin(seed * 7.1 + i * 2.3));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.85;
    if (i === 0) g.moveTo(x, y); else { const am = a - Math.PI / (n * 2), rm = rr * 1.12; g.quadraticCurveTo(cx + Math.cos(am) * rm, cy + Math.sin(am) * rm * 0.85, x, y); }
  }
  g.closePath();
};
export const flameTex = (k: number) => drawTex("flame" + k, 256, 384, (g) => {
  const lay = (col: string, sc: number, sway: number) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(128 - 96 * sc, 372);
    g.bezierCurveTo(128 - 130 * sc, 250, 128 - 60 * sc + sway, 210, 128 - 70 * sc + sway, 120 + 90 * (1 - sc));
    g.bezierCurveTo(128 - 20 * sc, 190, 128 - 10 * sc + sway, 110, 128 + sway * 2, 372 - 356 * sc);
    g.bezierCurveTo(128 + 30 * sc, 130, 128 + 20 * sc - sway, 200, 128 + 74 * sc - sway, 150 + 80 * (1 - sc));
    g.bezierCurveTo(128 + 70 * sc, 240, 128 + 130 * sc, 260, 128 + 96 * sc, 372); g.closePath(); g.fill();
  };
  const sw = [-14, 10, 22][k % 3];
  lay("#e2321c", 1, sw); lay("#ff8a1e", 0.74, -sw * 0.6); lay("#ffd94a", 0.46, sw * 0.4); lay("#fff6c8", 0.22, 0);
});
export const puffTex = (key: string, fill: string, line: string | null) => drawTex("puff" + key, 256, 256, (g) => {
  blobPath(g, 128, 128, 92, 7, key.length * 1.7); g.fillStyle = fill; g.fill();
  if (line) { g.strokeStyle = line; g.lineWidth = 9; g.lineJoin = "round"; g.stroke(); }
});
export const splashTex = () => drawTex("splash", 384, 384, (g) => {
  ink(g, 9); g.fillStyle = "#4db4ea";
  g.beginPath(); g.moveTo(40, 372); g.bezierCurveTo(10, 250, 70, 240, 60, 150); g.bezierCurveTo(110, 220, 130, 150, 150, 60);
  g.bezierCurveTo(180, 160, 220, 120, 230, 30); g.bezierCurveTo(260, 150, 290, 190, 330, 130); g.bezierCurveTo(320, 250, 380, 260, 344, 372); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#bfe9ff"; g.beginPath(); g.ellipse(150, 250, 26, 60, 0.2, 0, 7); g.fill();
  for (const [x, y, r] of [[30, 80, 16], [350, 60, 13], [290, 20, 10], [90, 30, 12]]) { g.fillStyle = "#4db4ea"; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); }
});
export const burstTex = () => drawTex("burst", 384, 384, (g) => {
  ink(g, 10); g.fillStyle = "#ffe14a"; g.beginPath();
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 80 : 180 - (i % 3) * 22; g.lineTo(192 + Math.cos(a) * r, 192 + Math.sin(a) * r); }
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 40 : 96; g.lineTo(192 + Math.cos(a) * r, 192 + Math.sin(a) * r); } g.closePath(); g.fill();
});
export const elephantTex = (blink: boolean) => drawTex("eleph" + blink, 512, 400, (g) => {
  const col = "#9aa0b4", dk = "#7f859c"; ink(g, 10);
  for (const x of [150, 220, 330, 400]) { g.fillStyle = dk; g.beginPath(); g.roundRect(x - 30, 250, 60, 130, 14); g.fill(); g.stroke(); }
  g.fillStyle = col; g.beginPath(); g.ellipse(280, 190, 170, 120, 0, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(130, 170, 95, 100, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = dk; g.beginPath(); g.ellipse(196, 150, 54, 82, -0.15, 0, 7); g.fill(); g.stroke();
  g.fillStyle = col; g.beginPath(); g.moveTo(70, 210); g.bezierCurveTo(30, 260, 40, 330, 76, 372); g.lineTo(112, 356); g.bezierCurveTo(90, 320, 96, 270, 124, 240); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.moveTo(110, 246); g.quadraticCurveTo(140, 290, 170, 270); g.quadraticCurveTo(140, 262, 128, 236); g.closePath(); g.fill(); g.lineWidth = 6; g.stroke();
  g.fillStyle = INK; if (blink) { g.lineWidth = 7; g.beginPath(); g.moveTo(88, 160); g.lineTo(112, 160); g.stroke(); } else { g.beginPath(); g.arc(100, 160, 9, 0, 7); g.fill(); }
  g.lineWidth = 7; g.beginPath(); g.moveTo(84, 138); g.lineTo(116, 138); g.stroke();
  g.lineWidth = 8; g.beginPath(); g.moveTo(448, 170); g.quadraticCurveTo(480, 210, 468, 250); g.stroke();
});
export const crowTex = (open: boolean) => drawTex("crow" + open, 256, 256, (g) => {
  ink(g, 9); g.fillStyle = "#2c2a36";
  g.beginPath(); g.ellipse(130, 150, 78, 54, -0.2, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.arc(70, 96, 40, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(190, 150); g.lineTo(250, 120); g.lineTo(240, 176); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#f0b23a"; g.beginPath();
  if (open) { g.moveTo(36, 84); g.lineTo(0, 66); g.lineTo(34, 100); g.lineTo(2, 118); g.lineTo(44, 112); } else { g.moveTo(36, 86); g.lineTo(0, 100); g.lineTo(40, 110); }
  g.closePath(); g.fill(); g.lineWidth = 6; g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.arc(64, 88, 10, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(62, 88, 5, 0, 7); g.fill();
  g.lineWidth = 8; g.beginPath(); g.moveTo(120, 200); g.lineTo(120, 244); g.moveTo(150, 198); g.lineTo(150, 244); g.stroke();
});
export const noteTex = () => drawTex("note", 128, 128, (g) => {
  ink(g, 9); g.fillStyle = INK; g.beginPath(); g.ellipse(44, 96, 22, 16, -0.3, 0, 7); g.fill();
  g.beginPath(); g.moveTo(64, 92); g.lineTo(64, 22); g.quadraticCurveTo(96, 30, 104, 62); g.stroke();
});
export const zzzTex = () => drawTex("dots", 256, 128, (g) => { g.fillStyle = INK; for (const x of [56, 128, 200]) { g.beginPath(); g.arc(x, 64, 17, 0, 7); g.fill(); } });
