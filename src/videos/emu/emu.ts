// The emus: flat cards drawn with Canvas2D in the same plum-ink style as the people.
// Side view (stand / walk / run, neck from "tall" down to "ground") and a front view for the stare into the lens.
// Design canvas 860 x 1100, soles at y = 1075; the hips sit at x = 325, which is the actor's origin.
import * as THREE from "three";
import { cardShade } from "./cardshade";
import { NOINK } from "./ink";
import { INK, ink, drawTex, blobMesh, shadeHex } from "./chars";

type G = CanvasRenderingContext2D;
export const EW = 860, EH = 1100, GROUND = 1075, HIP = 325;
export const EUNIT = 1.8 / 877; // metres per design unit (head top of the "up" pose is 877 units above the soles)
const BODY = "#806850", BODY_D = "#5c493a", BODY_L = "#a58c6c", NECK = "#93aabd", FUZZ = "#3a2f36", BEAK = "#4d4852", HAT = "#93834c";

export type Gait = "stand" | "walk" | "run";
export type EFace = "flat" | "blink" | "wide" | "smug";
/** n: neck 0 tall, 1 up, 2 forward (running), 3 down (eating wheat), 4 on the ground; ph: step phase 0..1 */
export type EmuPose = { n?: number; face?: EFace; gait?: Gait; ph?: number; hat?: boolean; leader?: boolean; stalk?: boolean; front?: boolean; chew?: number };

const shaggy = (g: G, cx: number, cy: number, rx: number, ry: number, n = 7) => {
  g.beginPath(); g.moveTo(cx - rx, cy);
  g.bezierCurveTo(cx - rx, cy - ry * 1.28, cx + rx, cy - ry * 1.28, cx + rx, cy);
  for (let i = 0; i < n; i++) {
    const a1 = ((i + 1) / n) * Math.PI, am = ((i + 0.5) / n) * Math.PI;
    g.quadraticCurveTo(cx + Math.cos(am) * rx * 1.1, cy + Math.sin(am) * ry * 1.2 + 14, cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry);
  }
  g.closePath();
};
const feathers = (g: G, pts: [number, number][], col: string, lw = 8, dx = -16, dy = 40) => {
  g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round";
  for (const [x, y] of pts) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dx * 0.2, y + dy * 0.7, x + dx, y + dy); g.stroke(); }
};
/** tapered tube along a quadratic curve */
const tube = (g: G, p0: [number, number], c: [number, number], p1: [number, number], w0: number, w1: number) => {
  const L: [number, number][] = [], R: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u;
    const x = a * p0[0] + b * c[0] + d * p1[0], y = a * p0[1] + b * c[1] + d * p1[1];
    let tx = 2 * (1 - u) * (c[0] - p0[0]) + 2 * u * (p1[0] - c[0]), ty = 2 * (1 - u) * (c[1] - p0[1]) + 2 * u * (p1[1] - c[1]);
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const w = (w0 + (w1 - w0) * u) / 2;
    L.push([x - ty * w, y + tx * w]); R.push([x + ty * w, y - tx * w]);
  }
  g.beginPath(); g.moveTo(...L[0]); for (const p of L) g.lineTo(...p); for (const p of R.reverse()) g.lineTo(...p); g.closePath();
};

function slouchSide(g: G) {
  ink(g, 9); g.fillStyle = HAT;
  g.beginPath(); g.moveTo(-56, -40); g.bezierCurveTo(-60, -112, -30, -124, -6, -116); g.quadraticCurveTo(8, -104, 22, -116); g.bezierCurveTo(46, -122, 60, -100, 54, -40); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = shadeHex(HAT, 0.62); g.beginPath(); g.moveTo(-57, -62); g.lineTo(55, -62); g.lineTo(54, -40); g.lineTo(-56, -40); g.closePath(); g.fill();
  g.fillStyle = HAT; ink(g, 9); g.beginPath(); g.ellipse(4, -38, 112, 17, -0.05, 0, 7); g.fill(); g.stroke();
  ink(g, 5); g.fillStyle = "#e0b84a"; g.beginPath(); g.arc(-22, -84, 13, 0, 7); g.fill(); g.stroke();
}
function eye(g: G, x: number, y: number, r: number, face: EFace, px = 4) {
  if (face === "blink") { ink(g, 7); g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke(); return; }
  const rr = face === "wide" ? r * 1.18 : r;
  ink(g, 6); g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.arc(x + px, y + (face === "wide" ? 0 : 3), face === "wide" ? r * 0.3 : r * 0.44, 0, 7); g.fill();
  if (face !== "wide") { // heavy upper lid: the bored look
    const k = face === "smug" ? 0.15 : -0.12;
    g.save(); g.beginPath(); g.arc(x, y, rr - 2, 0, 7); g.clip(); g.fillStyle = shadeHex(NECK, 0.8); g.fillRect(x - rr, y - rr - 2, rr * 2, rr * (1 + k)); g.restore();
    ink(g, 7); g.beginPath(); g.moveTo(x - rr - 3, y + rr * k - 2); g.lineTo(x + rr + 3, y + rr * k - 2); g.stroke();
    ink(g, 6); g.beginPath(); g.arc(x, y, rr, 0, 7); g.stroke();
  }
}

// neck keys: control point, head centre, head angle
const NK: number[][] = [[520, 380, 545, 190, -0.05], [545, 400, 600, 250, 0], [620, 470, 735, 395, 0.2], [720, 520, 740, 760, 1.0], [730, 600, 700, 930, 1.35]];
const neckAt = (n: number) => { const i = Math.min(3, Math.max(0, Math.floor(n))), u = Math.min(4, Math.max(0, n)) - i; return NK[i].map((v, k) => v + (NK[i + 1][k] - v) * u); };

export function drawEmuSide(g: G, P: EmuPose) {
  const gait = P.gait ?? "stand", ph = P.ph ?? 0, face = P.face ?? "flat";
  g.save(); g.translate(-30, 0);
  // legs: the far one first
  const stride = gait === "run" ? 175 : gait === "walk" ? 92 : 0, liftK = gait === "run" ? 105 : gait === "walk" ? 48 : 0;
  for (const k of [1, 0]) {
    const p = (ph + k * 0.5) * Math.PI * 2, hipx = 338 + k * 34, hipy = 742;
    const lift = gait === "stand" ? 0 : Math.max(0, Math.cos(p)) * liftK;
    const fx = hipx + (gait === "stand" ? (k ? 26 : -8) : Math.sin(p) * stride), fy = 1060 - lift;
    const jx = (hipx + fx) / 2 - 36 - lift * 0.4, jy = (hipy + fy) / 2 + 22 - lift * 0.25;
    ink(g, 15); g.beginPath(); g.moveTo(hipx, hipy); g.lineTo(jx, jy); g.lineTo(fx, fy); g.stroke();
    const d = lift > 10 ? 0.7 : 0; g.lineWidth = 11;
    for (const [a, l] of [[d, 54], [d - 0.5, 40], [d + 2.75, 16]]) { g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a) * l, fy + Math.sin(a) * l + (lift > 10 ? 0 : 3)); g.stroke(); }
  }
  // neck (its foot disappears under the body feathers)
  const [cx, cy, hx, hy, ha] = neckAt(P.n ?? 1);
  tube(g, [492, 590], [cx, cy], [hx, hy], 84, 42); g.fillStyle = NECK; g.fill(); ink(g, 10); g.stroke();
  // body
  const tilt = gait === "run" ? 0.1 : (P.n ?? 1) > 2.5 ? 0.08 : 0;
  g.save(); g.translate(350, 640); g.rotate(tilt);
  ink(g, 10); g.fillStyle = BODY_D; g.beginPath(); g.moveTo(-140, -70); g.bezierCurveTo(-250, -40, -282, 60, -256, 132); g.lineTo(-222, 96); g.lineTo(-208, 152); g.lineTo(-176, 104); g.lineTo(-150, 142);
  g.bezierCurveTo(-118, 90, -106, 20, -106, -40); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = BODY; shaggy(g, 0, 0, 212, 150); g.fill(); ink(g, 10); g.stroke();
  feathers(g, [[-120, -40], [-60, 20], [10, -20], [80, 30], [-150, 40], [-20, 70], [130, -30], [50, -70], [-90, -90], [150, 50]], BODY_D);
  feathers(g, [[-40, -100], [40, -110], [110, -84], [-110, -70]], BODY_L, 7, -14, 30);
  ink(g, 7); g.beginPath(); g.moveTo(-96, -24); g.quadraticCurveTo(60, -10, 46, 96); g.stroke();
  g.restore();
  // head
  g.save(); g.translate(hx, hy); g.rotate(ha);
  if (P.leader) { g.strokeStyle = "#17121a"; g.lineWidth = 15; g.lineCap = "round"; for (const [x, y, ex, ey] of [[-20, -40, -84, -108], [-4, -46, -50, -128], [10, -48, -14, -136], [-36, -30, -110, -78]]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 10, ey + 20, ex, ey); g.stroke(); } }
  ink(g, 8); g.fillStyle = BEAK; g.beginPath(); g.moveTo(40, -24); g.lineTo(130, 4); g.lineTo(40, 32); g.closePath(); g.fill(); g.stroke();
  g.lineWidth = 5; g.beginPath(); g.moveTo(56, 7); g.lineTo(114, 5); g.stroke();
  if (P.stalk) { g.strokeStyle = "#b98a2c"; g.lineWidth = 8; g.beginPath(); g.moveTo(96, 8); g.quadraticCurveTo(150, 30, 176, 84); g.stroke(); ink(g, 5); g.fillStyle = "#f0c040"; g.beginPath(); g.ellipse(184, 104, 15, 34, -0.35, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = NECK; ink(g, 10); g.beginPath(); g.ellipse(0, 0, 62, 52, 0, 0, 7); g.fill();
  g.save(); g.clip(); g.fillStyle = FUZZ; g.beginPath(); g.ellipse(-26, -44, 74, 44, -0.2, 0, 7); g.fill(); g.restore();
  g.beginPath(); g.ellipse(0, 0, 62, 52, 0, 0, 7); g.stroke();
  if (!P.hat) { ink(g, 7); for (const [x, y, dx, dy] of [[-34, -42, -14, -20], [-10, -50, -4, -24], [14, -49, 8, -21]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + dy); g.stroke(); } }
  eye(g, 16, -6, 21, face);
  if (face === "wide") { ink(g, 6); g.beginPath(); g.moveTo(-4, -44); g.lineTo(38, -38); g.stroke(); }
  if (P.hat) slouchSide(g);
  g.restore();
  g.restore();
}

export function drawEmuFront(g: G, P: EmuPose) {
  const face = P.face ?? "flat", c = P.chew ?? 0, X = HIP;
  for (const s of [-1, 1]) {
    ink(g, 15); g.beginPath(); g.moveTo(X + s * 34, 800); g.lineTo(X + s * 50, 1058); g.stroke();
    g.lineWidth = 11; for (const a of [-0.9, 0, 0.9]) { g.beginPath(); g.moveTo(X + s * 50, 1058); g.lineTo(X + s * 50 + Math.sin(a) * 40, 1058 + Math.cos(a) * 12); g.stroke(); }
  }
  tube(g, [X, 640], [X, 470], [X, 300], 96, 60); g.fillStyle = NECK; g.fill(); ink(g, 10); g.stroke();
  g.fillStyle = BODY; shaggy(g, X, 706, 196, 160, 6); g.fill(); ink(g, 10); g.stroke();
  feathers(g, [[X - 110, 640], [X - 40, 610], [X + 50, 620], [X + 120, 660], [X - 80, 720], [X + 10, 700], [X + 90, 740], [X - 140, 730]], BODY_D, 8, 0, 44);
  feathers(g, [[X - 60, 580], [X + 20, 572], [X + 90, 590]], BODY_L, 7, 0, 30);
  // head
  const hy = 232;
  if (P.leader) { g.strokeStyle = "#17121a"; g.lineWidth = 15; g.lineCap = "round"; for (const dx of [-60, -30, 0, 30, 60]) { g.beginPath(); g.moveTo(X + dx * 0.6, hy - 60); g.quadraticCurveTo(X + dx, hy - 120, X + dx * 1.5, hy - 150 + Math.abs(dx) * 0.4); g.stroke(); } }
  g.fillStyle = NECK; ink(g, 10); g.beginPath(); g.ellipse(X, hy, 98, 82, 0, 0, 7); g.fill();
  g.save(); g.clip(); g.fillStyle = FUZZ; g.beginPath(); g.ellipse(X, hy - 78, 120, 52, 0, 0, 7); g.fill(); g.restore();
  g.beginPath(); g.ellipse(X, hy, 98, 82, 0, 0, 7); g.stroke();
  if (!P.hat) { ink(g, 7); for (const dx of [-40, -14, 14, 40]) { g.beginPath(); g.moveTo(X + dx, hy - 76); g.lineTo(X + dx * 1.35, hy - 104); g.stroke(); } }
  for (const s of [-1, 1]) eye(g, X + s * 62, hy - 12, 27, face, -s * 3);
  // beak seen from the front: upper mandible, lower one chews
  const dy = c === 1 ? 9 : c === 2 ? 4 : 0, dx = c === 1 ? 5 : c === 2 ? -5 : 0;
  ink(g, 8); g.fillStyle = shadeHex(BEAK, 0.8); g.beginPath(); g.moveTo(X - 26 + dx, hy + 46); g.quadraticCurveTo(X + dx, hy + 92 + dy, X + 26 + dx, hy + 46); g.closePath(); g.fill(); g.stroke();
  if (P.stalk) { g.strokeStyle = "#b98a2c"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(X + 10 + dx, hy + 52); g.quadraticCurveTo(X + 110, hy + 60 + dy * 2, X + 178, hy + 108 + dy * 3); g.stroke();
    ink(g, 5); g.fillStyle = "#f0c040"; g.beginPath(); g.ellipse(X + 196, hy + 126 + dy * 3, 17, 38, -0.7, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = BEAK; ink(g, 8); g.beginPath(); g.moveTo(X - 40, hy + 14); g.quadraticCurveTo(X, hy - 4, X + 40, hy + 14); g.quadraticCurveTo(X + 26, hy + 56, X, hy + 66); g.quadraticCurveTo(X - 26, hy + 56, X - 40, hy + 14); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = INK; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(X + s * 12, hy + 26, 4, 6, 0, 0, 7); g.fill(); }
  if (P.hat) {
    ink(g, 10); g.fillStyle = HAT;
    g.beginPath(); g.moveTo(X - 92, hy - 58); g.bezierCurveTo(X - 96, hy - 150, X - 56, hy - 178, X - 26, hy - 172); g.quadraticCurveTo(X, hy - 156, X + 26, hy - 172); g.bezierCurveTo(X + 56, hy - 178, X + 96, hy - 150, X + 92, hy - 58); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = shadeHex(HAT, 0.62); g.beginPath(); g.moveTo(X - 93, hy - 90); g.quadraticCurveTo(X, hy - 104, X + 93, hy - 90); g.lineTo(X + 92, hy - 58); g.quadraticCurveTo(X, hy - 72, X - 92, hy - 58); g.closePath(); g.fill();
    g.fillStyle = HAT; ink(g, 10); g.beginPath(); g.moveTo(X - 196, hy - 62); g.quadraticCurveTo(X - 100, hy - 22, X, hy - 30); g.quadraticCurveTo(X + 66, hy - 34, X + 108, hy - 48); g.lineTo(X + 104, hy - 72); g.quadraticCurveTo(X, hy - 86, X - 190, hy - 80); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = shadeHex(HAT, 0.86); g.beginPath(); g.moveTo(X + 92, hy - 48); g.quadraticCurveTo(X + 160, hy - 52, X + 188, hy - 72); g.quadraticCurveTo(X + 176, hy - 146, X + 144, hy - 182); g.quadraticCurveTo(X + 112, hy - 146, X + 90, hy - 102); g.closePath(); g.fill(); g.stroke();
    ink(g, 5); g.fillStyle = "#e0b84a"; g.beginPath(); g.arc(X + 138, hy - 108, 16, 0, 7); g.fill(); g.stroke();
  }
}

export function emuTex(P: EmuPose) {
  const q: EmuPose = { n: Math.round((P.n ?? 1) * 4) / 4, face: P.face ?? "flat", gait: P.gait ?? "stand", ph: P.gait && P.gait !== "stand" ? (Math.round((P.ph ?? 0) * 8) % 8) / 8 : 0,
    hat: !!P.hat, leader: !!P.leader, stalk: !!P.stalk, front: !!P.front, chew: P.front ? P.chew ?? 0 : 0 };
  const S = q.front ? 1 : 0.7;
  return drawTex("emu" + JSON.stringify(q), Math.round(EW * S), Math.round(EH * S), (g) => { g.scale(S, S); if (q.front) drawEmuFront(g, q); else drawEmuSide(g, q); });
}

/** camera-facing emu card with a contact blob; soles on y = 0, hips over the group origin; side view looks to +x unless flipped */
export class Emu {
  group = new THREE.Group(); mesh: THREE.Mesh; blob: THREE.Mesh; mat: THREE.MeshLambertMaterial; full = false;
  constructor(public h = 1.8, tint: [number, number, number] = [1, 1, 1], public leader = false) {
    const k = h / 1.8, gw = EW * EUNIT * k, gh = EH * EUNIT * k;
    const geo = new THREE.PlaneGeometry(gw, gh); geo.translate((EW / 2 - HIP) * EUNIT * k, gh / 2 - (EH - GROUND) * EUNIT * k, 0);
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: emuTex({}), alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.color.setRGB(...tint);
    this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.layers.set(NOINK); this.mesh.receiveShadow = true;
    this.blob = blobMesh(1.5 * k, 0.6 * k);
    this.group.add(this.blob, this.mesh);
  }
  set(x: number, z: number, pose: EmuPose, o: { y?: number; flip?: boolean; tilt?: number; bob?: number; s?: number; full?: boolean } = {}) {
    this.group.visible = true; this.group.position.set(x, o.y ?? 0, z);
    this.mat.map = emuTex({ ...pose, leader: this.leader });
    this.mesh.position.y = o.bob ?? 0; this.mesh.rotation.set(0, 0, o.tilt ?? 0);
    this.mesh.scale.set((o.flip ? -1 : 1) * (o.s ?? 1), o.s ?? 1, 1);
    this.blob.visible = (o.y ?? 0) < 0.3; this.full = !!o.full;
  }
  face(cam: THREE.Camera) {
    const tilt = this.mesh.rotation.z;
    if (this.full) { this.mesh.quaternion.copy(cam.quaternion); this.mesh.rotateZ(tilt); }
    else this.mesh.rotation.set(0, Math.atan2(cam.position.x - this.group.position.x, cam.position.z - this.group.position.z), tilt);
  }
}

/** a far band of emu silhouettes (tiles horizontally): the rest of the twenty thousand */
export const crowdTex = () => {
  const t = drawTex("emucrowd", 2048, 256, (g) => {
    let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 46; i++) {
      const x = (i + 0.5) * (2048 / 46) + (r() - 0.5) * 16, k = 0.8 + r() * 0.5, y = 250, f = r() < 0.5 ? -1 : 1;
      g.fillStyle = ["#5a4636", "#6b5442", "#4a3a30"][i % 3]; g.strokeStyle = g.fillStyle; g.lineCap = "round";
      g.beginPath(); g.ellipse(x, y - 86 * k, 30 * k, 22 * k, 0, 0, 7); g.fill();
      g.lineWidth = 9 * k; g.beginPath(); g.moveTo(x + f * 20 * k, y - 96 * k); g.quadraticCurveTo(x + f * 30 * k, y - 150 * k, x + f * 34 * k, y - 196 * k); g.stroke();
      g.beginPath(); g.ellipse(x + f * 40 * k, y - 200 * k, 13 * k, 9 * k, 0, 0, 7); g.fill();
      g.lineWidth = 5 * k; for (const d of [-8, 8]) { g.beginPath(); g.moveTo(x + d * k, y - 70 * k); g.lineTo(x + d * k - 4, y); g.stroke(); }
    }
  });
  t.wrapS = THREE.RepeatWrapping; return t;
};

function kangaroo(g: G) { // faces right, feet at (0, 0), ~560 tall
  const col = "#b96a3c", bel = "#e3b890";
  ink(g, 10); g.fillStyle = col;
  g.beginPath(); g.moveTo(-50, -150); g.quadraticCurveTo(-210, -110, -300, -8); g.lineTo(-268, 6); g.quadraticCurveTo(-160, -50, -10, -70); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(8, -110, 76, 92, 0.2, 0, 7); g.fill(); g.stroke();
  g.lineWidth = 34; g.strokeStyle = INK; g.beginPath(); g.moveTo(10, -14); g.lineTo(140, -14); g.stroke(); g.lineWidth = 18; g.strokeStyle = col; g.beginPath(); g.moveTo(10, -14); g.lineTo(140, -14); g.stroke();
  ink(g, 10); g.fillStyle = col; g.beginPath(); g.moveTo(-60, -130); g.bezierCurveTo(-90, -300, -10, -430, 60, -440); g.bezierCurveTo(120, -420, 110, -300, 90, -200); g.bezierCurveTo(80, -150, 40, -100, -60, -130); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = bel; g.beginPath(); g.ellipse(58, -270, 30, 96, 0.12, 0, 7); g.fill();
  ink(g, 9); g.fillStyle = col; for (const dx of [0, 26]) { g.beginPath(); g.moveTo(40 + dx, -500); g.quadraticCurveTo(20 + dx, -590, 50 + dx, -612); g.quadraticCurveTo(78 + dx, -580, 70 + dx, -500); g.closePath(); g.fill(); g.stroke(); }
  g.beginPath(); g.ellipse(82, -484, 50, 42, -0.2, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(132, -468, 40, 26, 0.15, 0, 7); g.fill(); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.arc(96, -494, 8, 0, 7); g.fill(); g.beginPath(); g.ellipse(166, -474, 9, 7, 0, 0, 7); g.fill();
  g.lineWidth = 26; g.strokeStyle = INK; g.beginPath(); g.moveTo(84, -350); g.lineTo(170, -318); g.stroke(); g.lineWidth = 12; g.strokeStyle = col; g.beginPath(); g.moveTo(84, -350); g.lineTo(170, -318); g.stroke();
}

/** the coat of arms on the roadside board, simplified: kangaroo and emu holding a shield under the seven-pointed star */
export const emblemTex = () => drawTex("emblem", 1024, 1024, (g) => {
  g.fillStyle = "#f4ead0"; g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = "#b5473a"; g.lineWidth = 26; g.strokeRect(28, 28, 968, 968); ink(g, 8); g.strokeRect(52, 52, 920, 920);
  // wattle wreath
  for (let i = 0; i < 26; i++) { const a = Math.PI * (0.08 + 0.84 * (i / 25)), x = 512 + Math.cos(a) * 400, y = 640 + Math.sin(a) * 250;
    g.fillStyle = i % 2 ? "#5f9a48" : "#7ab35a"; g.beginPath(); g.ellipse(x, y, 44, 17, a + 1.2, 0, 7); g.fill();
    g.fillStyle = "#f2c230"; g.beginPath(); g.arc(x + 14, y - 22, 13, 0, 7); g.fill(); }
  // star
  ink(g, 9); g.fillStyle = "#f2c230"; g.beginPath(); for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 30 : 68; g.lineTo(512 + Math.cos(a) * r, 136 + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke();
  // shield with the Southern Cross
  g.fillStyle = "#2c56a8"; ink(g, 11); g.beginPath(); g.moveTo(392, 290); g.lineTo(632, 290); g.lineTo(632, 520); g.quadraticCurveTo(632, 650, 512, 700); g.quadraticCurveTo(392, 650, 392, 520); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#fff"; for (const [x, y, r] of [[512, 350, 22], [450, 450, 20], [574, 430, 20], [512, 590, 24], [548, 510, 12]]) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  // supporters
  g.save(); g.translate(250, 800); g.scale(0.74, 0.74); kangaroo(g); g.restore();
  g.save(); g.translate(1000, 150); g.scale(-0.6, 0.6); drawEmuSide(g, { n: 1, face: "smug" }); g.restore();
  // ribbon
  ink(g, 9); g.fillStyle = "#f4f1ea"; g.beginPath(); g.moveTo(250, 826); g.quadraticCurveTo(512, 880, 774, 826); g.lineTo(790, 900); g.quadraticCurveTo(512, 956, 234, 900); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = INK; g.font = "900 52px 'DejaVu Sans', Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("A U S T R A L I A", 512, 884);
});
