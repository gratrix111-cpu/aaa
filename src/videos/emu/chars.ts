// Flat bean-head cartoon cards for the Emu War short, drawn with Canvas2D (plum ink, stick limbs, deadpan faces).
// Design canvas 600 x 1000, soles at y = 975, head centre (300, 309): the zones cardshade.ts expects.
// People can also be drawn from behind (pose.back) for over-the-shoulder shots.
import * as THREE from "three";
import { cardShade } from "./cardshade";
import { NOINK } from "./ink";

export const INK = "#241726";
const W = 600, H = 1000, S = 0.8;
type G = CanvasRenderingContext2D;

export type Face = "flat" | "happy" | "shock" | "sad" | "strain" | "smug" | "blink" | "angry";
export type Look = {
  id: string; skin: string; body: string; hat?: "slouch" | "akubra" | "straw" | "hair" | "none"; hatCol?: string; hair?: string;
  beard?: string; mustache?: string; apron?: string; belts?: string; strap?: string; cuffs?: string; coat?: boolean; epaulettes?: boolean; tabs?: string;
};
export type Prop = "binoc" | "stick" | "post" | "notebook" | "lewis" | null;
export type Pose = { face?: Face; aL?: number; aR?: number; eL?: number; eR?: number; step?: number; prop?: Prop; look?: number; back?: boolean; hatOff?: boolean };

const canvas = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const tex = (c: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter; return t;
};
export const ink = (g: G, lw = 10) => { g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = "round"; g.lineCap = "round"; };
export const shadeHex = (hex: string, k: number) => "#" + new THREE.Color(hex).multiplyScalar(k).getHexString();

function headPath(g: G) {
  g.beginPath(); g.moveTo(300, 198);
  g.bezierCurveTo(388, 198, 422, 262, 417, 322); g.bezierCurveTo(412, 388, 362, 421, 300, 421);
  g.bezierCurveTo(238, 421, 188, 388, 183, 322); g.bezierCurveTo(178, 262, 212, 198, 300, 198); g.closePath();
}

function drawFace(g: G, face: Face, lookX: number, low: boolean) {
  const ex = 31, ey = 304, my = low ? 372 : 366;
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
  if (face === "angry") {
    dot(300 - ex, 8); dot(300 + ex, 8);
    for (const s of [-1, 1]) line(300 + s * 10, ey - 14, 300 + s * 52, ey - 34, 8);
    g.fillStyle = "#3a1626"; g.beginPath(); g.roundRect(274, my - 12, 52, 30, 10); g.fill(); g.lineWidth = 5; g.stroke();
    g.fillStyle = "#fff"; g.fillRect(280, my - 10, 40, 8);
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

/** hats sit on the head; `back` mirrors the slouch hat's pinned-up brim */
export function drawHat(g: G, L: Look, back = false) {
  const c = L.hatCol ?? "#1d1a22"; ink(g, 10); g.fillStyle = c;
  switch (L.hat) {
    case "slouch": {
      g.save(); if (back) { g.translate(600, 0); g.scale(-1, 1); }
      g.beginPath(); g.moveTo(204, 240); g.bezierCurveTo(196, 150, 232, 112, 268, 116); g.quadraticCurveTo(300, 132, 332, 116);
      g.bezierCurveTo(368, 112, 404, 150, 396, 240); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = shadeHex(c, 0.62); g.beginPath(); g.moveTo(202, 206); g.quadraticCurveTo(300, 190, 398, 206); g.lineTo(397, 238); g.quadraticCurveTo(300, 222, 203, 238); g.closePath(); g.fill();
      g.fillStyle = c; ink(g, 10); g.beginPath(); g.moveTo(86, 236); g.quadraticCurveTo(190, 276, 300, 268); g.quadraticCurveTo(372, 264, 416, 250);
      g.lineTo(412, 226); g.quadraticCurveTo(300, 212, 92, 218); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = shadeHex(c, 0.86); g.beginPath(); g.moveTo(398, 250); g.quadraticCurveTo(470, 246, 500, 226); g.quadraticCurveTo(486, 150, 452, 112);
      g.quadraticCurveTo(420, 150, 396, 196); g.closePath(); g.fill(); g.stroke();
      if (!back) { ink(g, 5); g.fillStyle = "#e0b84a"; g.beginPath(); g.arc(446, 190, 17, 0, 7); g.fill(); g.stroke(); }
      g.restore(); break;
    }
    case "akubra": case "straw": {
      g.beginPath(); g.moveTo(206, 242); g.bezierCurveTo(206, 150, 240, 122, 270, 126); g.quadraticCurveTo(300, 144, 330, 126);
      g.bezierCurveTo(360, 122, 394, 150, 394, 242); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = L.hat === "straw" ? "#c8483a" : shadeHex(c, 0.6); g.beginPath(); g.moveTo(205, 208); g.quadraticCurveTo(300, 192, 395, 208); g.lineTo(394, 240); g.quadraticCurveTo(300, 224, 206, 240); g.closePath(); g.fill();
      g.fillStyle = c; ink(g, 10); g.beginPath(); g.moveTo(80, 226); g.quadraticCurveTo(190, 280, 300, 270); g.quadraticCurveTo(410, 280, 520, 226);
      g.quadraticCurveTo(410, 232, 300, 222); g.quadraticCurveTo(190, 232, 80, 226); g.closePath(); g.fill(); g.stroke();
      if (L.hat === "straw") { g.strokeStyle = shadeHex(c, 0.78); g.lineWidth = 4; for (const x of [150, 220, 300, 380, 450]) { g.beginPath(); g.moveTo(x, 236); g.lineTo(x + (x - 300) * 0.06, 262); g.stroke(); } }
      break;
    }
    case "hair":
      if (back) { g.beginPath(); g.moveTo(183, 330); g.bezierCurveTo(160, 190, 240, 176, 300, 176); g.bezierCurveTo(360, 176, 440, 190, 417, 330); g.quadraticCurveTo(300, 380, 183, 330); g.closePath(); g.fill(); g.stroke(); }
      else { g.beginPath(); g.moveTo(180, 330); g.bezierCurveTo(150, 170, 250, 160, 300, 160); g.bezierCurveTo(350, 160, 450, 170, 420, 330);
        g.quadraticCurveTo(410, 250, 350, 236); g.quadraticCurveTo(250, 232, 196, 262); g.closePath(); g.fill(); g.stroke(); }
      break;
    default:
  }
}

function drawProp(g: G, prop: Prop, x: number, y: number) {
  ink(g, 8);
  if (prop === "binoc") {
    g.fillStyle = "#3a3c44"; for (const s of [-1, 1]) { g.beginPath(); g.roundRect(x + s * 26 - 22, y - 70, 44, 78, 10); g.fill(); g.stroke(); }
    g.fillStyle = "#9fd8ff"; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * 26, y - 62, 15, 9, 0, 0, 7); g.fill(); }
  } else if (prop === "stick") {
    g.lineWidth = 12; g.strokeStyle = "#6a4322"; g.beginPath(); g.moveTo(x - 8, y + 20); g.lineTo(x + 64, y - 150); g.stroke();
    g.lineWidth = 12; g.strokeStyle = "#d8b24a"; g.beginPath(); g.moveTo(x + 58, y - 136); g.lineTo(x + 64, y - 150); g.stroke();
  } else if (prop === "post") {
    g.fillStyle = "#8a6a48"; g.save(); g.translate(x, y); g.rotate(0.35); g.beginPath(); g.moveTo(-17, 26); g.lineTo(-17, -150); g.lineTo(-4, -172); g.lineTo(6, -148); g.lineTo(17, -166); g.lineTo(17, 26); g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(-4, -20); g.lineTo(-4, -110); g.moveTo(7, 10); g.lineTo(7, -60); g.stroke(); g.restore();
  } else if (prop === "lewis") { // carried on the shoulder: stock in the hand, muzzle up behind the hat brim
    g.save(); g.translate(x, y); g.rotate(0.42);
    g.fillStyle = "#94602f"; g.beginPath(); g.roundRect(-20, -30, 40, 112, 8); g.fill(); g.stroke();
    g.fillStyle = "#9aa1ab"; g.beginPath(); g.roundRect(-18, -338, 36, 212, 12); g.fill(); g.stroke();
    g.fillStyle = "#474a54"; g.beginPath(); g.roundRect(-23, -134, 46, 108, 6); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(-38, -98, 17, 46, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(-21, -364, 42, 34, 8); g.fill(); g.stroke();
    g.restore();
  } else if (prop === "notebook") {
    g.fillStyle = "#f4f1ea"; g.beginPath(); g.roundRect(x - 40, y - 84, 80, 100, 6); g.fill(); g.stroke();
    g.lineWidth = 4; for (const k of [0, 1, 2, 3]) { g.beginPath(); g.moveTo(x - 26, y - 62 + k * 20); g.lineTo(x + 26, y - 62 + k * 20); g.stroke(); }
  }
}

export function drawPerson(g: G, L: Look, P: Pose) {
  const rad = Math.PI / 180, back = !!P.back;
  const step = P.step ?? 0; // -1..1: left foot lifted (<0) or right foot lifted (>0)
  for (const s of [-1, 1]) {
    const lift = Math.max(0, s * step) * 46, fx = 300 + s * 40 + s * Math.max(0, s * step) * 10;
    ink(g, 14); g.beginPath(); g.moveTo(300 + s * 36, 690); g.lineTo(fx, 958 - lift); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.ellipse(fx + s * (back ? 4 : 14), 962 - lift, back ? 22 : 30, 12, 0, 0, 7); g.fill();
  }
  const arm = (s: number, a: number, e: number) => {
    const sx = 300 + s * 80, sy = 478, ex = sx + s * Math.sin(a * rad) * 108, ey = sy + Math.cos(a * rad) * 108;
    const hx = ex + s * Math.sin((a + e) * rad) * 102, hy = ey + Math.cos((a + e) * rad) * 102;
    ink(g, 14); g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke();
    if (L.cuffs) { g.strokeStyle = L.cuffs; g.lineWidth = 20; g.beginPath(); g.moveTo(ex + (hx - ex) * 0.62, ey + (hy - ey) * 0.62); g.lineTo(ex + (hx - ex) * 0.86, ey + (hy - ey) * 0.86); g.stroke(); }
    return [hx, hy] as const;
  };
  const hl = arm(-1, P.aL ?? 12, P.eL ?? 0);
  // seen from behind both arms go first: hands reaching forward end up hidden by the torso
  const hrB = back ? arm(1, P.aR ?? 12, P.eR ?? 0) : null;
  if (back) { g.fillStyle = INK; for (const h of [hl, hrB!]) { g.beginPath(); g.arc(h[0], h[1], 14, 0, 7); g.fill(); } }
  const bot = L.coat ? 770 : 706;
  ink(g, 10); g.fillStyle = L.body;
  g.beginPath(); g.moveTo(214, 500); g.bezierCurveTo(214, 430, 250, 408, 300, 408); g.bezierCurveTo(350, 408, 386, 430, 386, 500);
  g.lineTo(L.coat ? 404 : 392, bot - 30); g.quadraticCurveTo(L.coat ? 404 : 392, bot, 360, bot); g.lineTo(240, bot);
  g.quadraticCurveTo(L.coat ? 196 : 208, bot, L.coat ? 196 : 208, bot - 30); g.closePath(); g.fill(); g.stroke();
  g.save(); g.clip();
  if (L.apron && !back) { g.fillStyle = L.apron; g.beginPath(); g.roundRect(234, 500, 132, 300, 16); g.fill(); ink(g, 6); g.stroke(); g.beginPath(); g.moveTo(246, 502); g.lineTo(270, 410); g.moveTo(354, 502); g.lineTo(330, 410); g.stroke(); }
  if (L.apron && back) { ink(g, 14); g.strokeStyle = L.apron; g.beginPath(); g.moveTo(250, 410); g.lineTo(350, 640); g.moveTo(350, 410); g.lineTo(250, 640); g.stroke(); g.fillStyle = L.apron; g.fillRect(200, 640, 200, 160); }
  if (L.belts) { g.strokeStyle = L.belts; g.lineWidth = 22; g.beginPath(); g.moveTo(216, 426); g.lineTo(384, 660); g.moveTo(384, 426); g.lineTo(216, 660); g.stroke(); if (!back) { ink(g, 4); g.fillStyle = "#d8b24a"; g.beginPath(); g.arc(300, 543, 12, 0, 7); g.fill(); g.stroke(); } }
  if (L.strap) { g.strokeStyle = L.strap; g.lineWidth = 20; g.beginPath(); g.moveTo(back ? 384 : 216, 426); g.lineTo(back ? 226 : 374, 640); g.stroke(); g.lineWidth = 26; g.beginPath(); g.moveTo(200, 652); g.lineTo(400, 652); g.stroke();
    if (!back) { ink(g, 4); g.fillStyle = "#d8b24a"; g.beginPath(); g.roundRect(284, 636, 32, 32, 5); g.fill(); g.stroke(); } }
  if (!L.apron && !L.belts && !L.strap && !back) { g.fillStyle = INK; for (const y of [520, 580, 640]) { g.beginPath(); g.arc(300, y, 7, 0, 7); g.fill(); } }
  if (L.strap && !back) { g.fillStyle = INK; for (const y of [470, 530, 590]) { g.beginPath(); g.arc(300, y, 6, 0, 7); g.fill(); } }
  g.restore();
  if (L.epaulettes) for (const s of [-1, 1]) { ink(g, 6); g.fillStyle = "#e0b84a"; g.beginPath(); g.ellipse(300 + s * 82, 448, 30, 15, s * 0.3, 0, 7); g.fill(); g.stroke(); }
  if (L.tabs && !back) for (const s of [-1, 1]) { ink(g, 5); g.fillStyle = L.tabs; g.beginPath(); g.roundRect(300 + s * 34 - 13, 414, 26, 34, 5); g.fill(); g.stroke(); }
  // head
  headPath(g); g.fillStyle = L.skin; g.fill();
  g.save(); headPath(g); g.clip(); g.fillStyle = shadeHex(L.skin, 0.9); g.beginPath(); g.ellipse(250, 300, 150, 150, 0, 0, 7); g.rect(0, 0, W, H); g.fill("evenodd");
  if (back) { g.fillStyle = L.hair ?? "#4a3324"; g.beginPath(); g.rect(0, 0, W, 318); g.fill(); g.beginPath(); g.ellipse(300, 318, 130, 34, 0, 0, 7); g.fill(); }
  g.restore();
  ink(g, 10); headPath(g); g.stroke();
  if (!back) {
    if (L.beard) {
      g.fillStyle = L.beard; ink(g, 9); g.beginPath(); g.moveTo(190, 330); g.bezierCurveTo(196, 400, 230, 480, 300, 492); g.bezierCurveTo(370, 480, 404, 400, 410, 330);
      g.bezierCurveTo(380, 352, 340, 344, 300, 344); g.bezierCurveTo(260, 344, 220, 352, 190, 330); g.closePath(); g.fill(); g.stroke();
    }
    drawFace(g, P.face ?? "flat", P.look ?? 0, !!L.beard || !!L.mustache);
    if (L.mustache) {
      g.fillStyle = L.mustache; ink(g, 7); g.beginPath(); g.moveTo(300, 338); g.bezierCurveTo(330, 322, 368, 338, 392, 322); g.bezierCurveTo(384, 362, 334, 366, 300, 352);
      g.bezierCurveTo(266, 366, 216, 362, 208, 322); g.bezierCurveTo(232, 338, 270, 322, 300, 338); g.closePath(); g.fill(); g.stroke();
    }
  }
  if (!P.hatOff) drawHat(g, L, back); else drawHat(g, { ...L, hat: "hair", hatCol: L.hair ?? "#4a3324" }, back);
  if (!back) {
    const hr = arm(1, P.aR ?? 12, P.eR ?? 0);
    if (P.prop) drawProp(g, P.prop, hr[0], hr[1]);
    g.fillStyle = INK; for (const h of [hl, hr]) { g.beginPath(); g.arc(h[0], h[1], 14, 0, 7); g.fill(); }
  }
}

const cache = new Map<string, THREE.Texture>();
export function personTex(L: Look, P: Pose) {
  const q = (v: number | undefined, d: number) => (v === undefined ? d : Math.round(v / 10) * 10);
  const p: Pose = { face: P.face ?? "flat", aL: q(P.aL, 10), aR: q(P.aR, 10), eL: q(P.eL, 0), eR: q(P.eR, 0), step: Math.round((P.step ?? 0) * 3) / 3, prop: P.prop ?? null, look: Math.round(P.look ?? 0), back: !!P.back, hatOff: !!P.hatOff };
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

export const UNIT = 1.75 / 950; // metres per design unit (adult = 950 units tall incl. hat room)
export const blobTex = () => drawTex("blob", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "#5c5568"); gr.addColorStop(0.55, "#9d97a8"); gr.addColorStop(1, "#ffffff");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
export const blobMesh = (w: number, d: number) => {
  const bg = new THREE.PlaneGeometry(w, d); bg.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, premultipliedAlpha: true, fog: false }));
  m.position.y = 0.02; m.layers.set(NOINK); m.renderOrder = 1; return m;
};

/** camera-facing character card with a contact blob; soles on y = 0 of the group */
export class Actor {
  group = new THREE.Group(); mesh: THREE.Mesh; blob: THREE.Mesh; mat: THREE.MeshLambertMaterial; full = false;
  constructor(public look: Look, public h = 1.75) {
    const k = h / 1.75, gw = W * UNIT * k, gh = H * UNIT * k;
    const geo = new THREE.PlaneGeometry(gw, gh); geo.translate(0, gh / 2 - 25 * UNIT * k, 0);
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: personTex(look, {}), alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.layers.set(NOINK); this.mesh.receiveShadow = true;
    this.blob = blobMesh(0.95 * k, 0.5 * k);
    this.group.add(this.blob, this.mesh);
  }
  /** x, z on the ground (y optional), pose, flip = mirror, tilt = roll in radians (falls) */
  set(x: number, z: number, pose: Pose, o: { y?: number; flip?: boolean; tilt?: number; bob?: number; s?: number; full?: boolean } = {}) {
    this.group.visible = true; this.group.position.set(x, o.y ?? 0, z);
    this.mat.map = personTex(this.look, pose);
    this.mesh.position.y = o.bob ?? 0; this.mesh.rotation.set(0, 0, o.tilt ?? 0);
    this.mesh.scale.set((o.flip ? -1 : 1) * (o.s ?? 1), o.s ?? 1, 1);
    this.blob.visible = (o.y ?? 0) < 0.3 && Math.abs(o.tilt ?? 0) < 1; this.full = !!o.full;
  }
  /** turn the card to the camera: about the vertical axis, or fully (`full`) for shots from high above */
  face(cam: THREE.Camera) {
    const tilt = this.mesh.rotation.z;
    if (this.full) { this.mesh.quaternion.copy(cam.quaternion); this.mesh.rotateZ(tilt); }
    else this.mesh.rotation.set(0, Math.atan2(cam.position.x - this.group.position.x, cam.position.z - this.group.position.z), tilt);
  }
}

/** flat effect card (unlit; `glow` > 1 feeds the bloom) */
export function fxCard(t: THREE.Texture, w: number, h: number, glow = 1, soft = false) {
  const m = new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(glow, glow, glow), side: THREE.DoubleSide, fog: false,
    ...(soft ? { transparent: true, depthWrite: false } : { alphaTest: 0.5 }) });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.layers.set(NOINK); mesh.frustumCulled = false; mesh.visible = false;
  return mesh;
}

// ---------------- effect drawings ----------------
export const blobPath = (g: G, cx: number, cy: number, r: number, n: number, seed: number, wob = 0.25) => {
  g.beginPath();
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2, rr = r * (1 + (i % 2 ? wob : -wob * 0.2) + 0.08 * Math.sin(seed * 7.1 + i * 2.3));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.85;
    if (i === 0) g.moveTo(x, y); else { const am = a - Math.PI / (n * 2), rm = rr * 1.12; g.quadraticCurveTo(cx + Math.cos(am) * rm, cy + Math.sin(am) * rm * 0.85, x, y); }
  }
  g.closePath();
};
export const puffTex = (key: string, fill: string, line: string | null) => drawTex("puff" + key, 256, 256, (g) => {
  blobPath(g, 128, 128, 92, 7, key.length * 1.7); g.fillStyle = fill; g.fill();
  if (line) { g.strokeStyle = line; g.lineWidth = 9; g.lineJoin = "round"; g.stroke(); }
});
export const burstTex = () => drawTex("burst", 384, 384, (g) => {
  ink(g, 10); g.fillStyle = "#ffe14a"; g.beginPath();
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 80 : 180 - (i % 3) * 22; g.lineTo(192 + Math.cos(a) * r, 192 + Math.sin(a) * r); }
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 40 : 96; g.lineTo(192 + Math.cos(a) * r, 192 + Math.sin(a) * r); } g.closePath(); g.fill();
});
/** bullet streak (drawn pointing right) */
export const tracerTex = () => drawTex("tracer", 256, 64, (g) => {
  ink(g, 8); g.fillStyle = "#ffe14a"; g.beginPath(); g.moveTo(14, 32); g.lineTo(196, 14); g.quadraticCurveTo(250, 32, 196, 50); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.moveTo(90, 32); g.lineTo(196, 24); g.quadraticCurveTo(226, 32, 196, 40); g.closePath(); g.fill();
});
/** speed line (white dash) */
export const streakTex = () => drawTex("streak", 256, 32, (g) => { g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(6, 16); g.quadraticCurveTo(128, 2, 250, 16); g.quadraticCurveTo(128, 30, 6, 16); g.fill(); });
export const bangTex = () => drawTex("bang", 128, 256, (g) => {
  ink(g, 9); g.fillStyle = "#e8402e"; g.beginPath(); g.moveTo(34, 16); g.lineTo(94, 16); g.lineTo(78, 166); g.lineTo(50, 166); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.arc(64, 214, 24, 0, 7); g.fill(); g.stroke();
});
/** the spring that jumps out of a jammed gun */
export const springTex = () => drawTex("spring", 128, 256, (g) => {
  g.strokeStyle = INK; g.lineWidth = 17; g.lineJoin = "round"; g.lineCap = "round";
  const path = () => { g.beginPath(); g.moveTo(64, 244); for (let i = 0; i < 9; i++) g.lineTo(i % 2 ? 104 : 24, 222 - i * 24); g.lineTo(64, 12); g.stroke(); };
  path(); g.strokeStyle = "#c9cfd8"; g.lineWidth = 8; path();
});
/** sound arcs for the lookout's alarm call (drawn opening to the right) */
export const arcsTex = () => drawTex("arcs", 256, 256, (g) => { ink(g, 13); for (const r of [50, 104, 158]) { g.beginPath(); g.arc(20, 128, r, -0.75, 0.75); g.stroke(); } });
/** a shard of fence post */
export const splinterTex = () => drawTex("splinter", 64, 160, (g) => { ink(g, 7); g.fillStyle = "#9a7a56"; g.beginPath(); g.moveTo(14, 150); g.lineTo(8, 40); g.lineTo(30, 8); g.lineTo(40, 46); g.lineTo(56, 30); g.lineTo(50, 150); g.closePath(); g.fill(); g.stroke(); });
/** brass cartridge case flying out of the gun */
export const caseTex = () => drawTex("case", 64, 128, (g) => { ink(g, 7); g.fillStyle = "#e0b040"; g.beginPath(); g.roundRect(18, 12, 28, 104, 6); g.fill(); g.stroke(); });
