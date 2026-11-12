// Static pieces of the Emu War set: red earth, a wheat paddock behind a wire fence, the homestead with its windmill,
// gum trees, the army's truck, Lewis guns, ammunition crates, giant cartridges, the farm dam and the roadside board.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { ctex, rep } from "./paint";
import { emblemTex } from "./emu";

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const lam = (o: THREE.MeshLambertMaterialParameters) => twoTone(new THREE.MeshLambertMaterial(o));
export const mk = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0, parent?: THREE.Object3D) => {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent?.add(o); return o;
};
const UP = V(0, 1, 0);
/** round bar between two points */
export const bar = (a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material, parent: THREE.Object3D, sides = 6) => {
  const d = b.clone().sub(a), o = mk(new THREE.CylinderGeometry(r, r, d.length(), sides), m, 0, 0, 0, parent);
  o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(UP, d.normalize()); return o;
};
type G = CanvasRenderingContext2D;
const wrap = (S: number, x: number, y: number, rad: number, fn: (x: number, y: number) => void) => {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) if (x + dx > -rad && x + dx < S + rad && y + dy > -rad && y + dy < S + rad) fn(x + dx, y + dy);
};

// ---------------- painted textures ----------------
export const earthTex = () => ctex("earth", 1024, 1024, (g, r) => {
  const S = 1024; g.fillStyle = "#c97c48"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 28; i++) {
    const x = r() * S, y = r() * S, rad = 90 + r() * 220, light = r() > 0.5;
    wrap(S, x, y, rad, (xx, yy) => { const gr = g.createRadialGradient(xx, yy, 0, xx, yy, rad); gr.addColorStop(0, light ? "rgba(228,156,98,0.5)" : "rgba(170,92,50,0.42)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(xx - rad, yy - rad, rad * 2, rad * 2); });
  }
  for (let i = 0; i < 300; i++) { const x = r() * S, y = r() * S, rr = 2 + r() * 5; g.fillStyle = r() < 0.5 ? "rgba(122,62,36,0.5)" : "rgba(238,186,138,0.55)"; wrap(S, x, y, 8, (xx, yy) => { g.beginPath(); g.ellipse(xx, yy, rr, rr * 0.7, 0, 0, 7); g.fill(); }); }
  g.lineWidth = 3; g.lineCap = "round";
  for (let i = 0; i < 90; i++) { const x = r() * S, y = r() * S, h = 12 + r() * 10; g.strokeStyle = r() < 0.5 ? "rgba(226,200,126,0.7)" : "rgba(160,140,80,0.65)"; wrap(S, x, y, 24, (xx, yy) => { for (const d of [-8, 0, 8]) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + d, yy - h); g.stroke(); } }); }
  g.strokeStyle = "rgba(120,58,32,0.35)"; g.lineWidth = 2.5;
  for (let i = 0; i < 14; i++) { let x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); }
});
export const roadTex = () => ctex("road", 512, 256, (g, r) => {
  g.fillStyle = "#dba872"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "rgba(190,130,84,0.35)" : "rgba(240,206,160,0.4)"; g.fillRect(r() * 512, r() * 256, 40 + r() * 120, 4 + r() * 8); }
  g.fillStyle = "rgba(170,112,70,0.55)"; g.fillRect(0, 62, 512, 30); g.fillRect(0, 164, 512, 30);
});
export const wheatTopTex = () => ctex("wheatTop", 512, 512, (g, r) => {
  g.fillStyle = "#e4b440"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) { g.fillStyle = "rgba(190,140,40,0.55)"; g.fillRect(0, y, 512, 10); g.fillStyle = "rgba(250,224,130,0.5)"; g.fillRect(0, y + 28, 512, 14); }
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(250,226,136,0.8)" : "rgba(184,134,40,0.7)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 3, 7, r() - 0.5, 0, 7); g.fill(); }
});
export const wheatSideTex = () => ctex("wheatSide", 512, 256, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#eac452"); gr.addColorStop(0.5, "#d9a93c"); gr.addColorStop(1, "#b0802c"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.lineCap = "round";
  for (let i = 0; i < 150; i++) { const x = r() * 512; g.strokeStyle = r() < 0.5 ? "rgba(150,104,34,0.6)" : "rgba(250,226,140,0.6)"; g.lineWidth = 3 + r() * 3; g.beginPath(); g.moveTo(x, 256); g.lineTo(x + (r() - 0.5) * 14, 40 + r() * 40); g.stroke(); }
  for (let i = 0; i < 70; i++) { const x = r() * 512, y = 14 + r() * 50; g.fillStyle = "#f3d268"; g.strokeStyle = "rgba(120,80,26,0.7)"; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y, 6, 17, (r() - 0.5) * 0.6, 0, 7); g.fill(); g.stroke(); }
});
/** one wheat tuft for the cut-out cards in front of the paddock */
export const wheatTuftTex = () => ctex("wheatTuft", 256, 256, (g, r) => {
  g.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const x = 28 + i * 25 + (r() - 0.5) * 10, top = 44 + r() * 50, lean = (r() - 0.5) * 34;
    g.strokeStyle = "#2a1c22"; g.lineWidth = 10; g.beginPath(); g.moveTo(x, 256); g.quadraticCurveTo(x + lean * 0.3, 150, x + lean, top); g.stroke();
    g.strokeStyle = i % 2 ? "#d9a93c" : "#c4922e"; g.lineWidth = 5; g.beginPath(); g.moveTo(x, 256); g.quadraticCurveTo(x + lean * 0.3, 150, x + lean, top); g.stroke();
    g.fillStyle = "#f2cc58"; g.strokeStyle = "#2a1c22"; g.lineWidth = 4; g.beginPath(); g.ellipse(x + lean, top - 4, 10, 28, lean * 0.012, 0, 7); g.fill(); g.stroke();
  }
});
export const boardsTex = (key: string, base: string, line: string, n = 8) => ctex("boards" + key, 256, 256, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.08)" : "rgba(60,40,20,0.08)"; g.fillRect(r() * 256, r() * 256, 30 + r() * 80, 3 + r() * 5); }
  g.fillStyle = line; for (let i = 0; i < n; i++) g.fillRect(0, Math.round((i * 256) / n), 256, 4);
});
export const ironTex = (key: string, a: string, b: string) => ctex("iron" + key, 256, 256, (g) => {
  for (let i = 0; i < 16; i++) { const gr = g.createLinearGradient(i * 16, 0, i * 16 + 16, 0); gr.addColorStop(0, b); gr.addColorStop(0.5, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(i * 16, 0, 16, 256); }
});
/** weatherboard wall, 64 px per metre, with windows and an optional door */
export const wallTex = (key: string, wm: number, hm: number, wins: number[], door?: number) => ctex("wall" + key, Math.round(wm * 64), Math.round(hm * 64), (g, r) => {
  const W = wm * 64, H = hm * 64; g.fillStyle = "#efe4c8"; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 14) { g.fillStyle = "rgba(150,126,90,0.5)"; g.fillRect(0, y, W, 2.5); g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.14)" : "rgba(170,140,100,0.1)"; g.fillRect(0, y + 3, W, 10); }
  g.lineJoin = "round";
  for (const x of wins) {
    const X = x * 64, Y = H - 2.15 * 64, w = 70, h = 76;
    g.fillStyle = "#fbf6ea"; g.fillRect(X - w / 2 - 8, Y - 8, w + 16, h + 16); g.fillStyle = "#7f97d0"; g.fillRect(X - w / 2, Y, w, h);
    g.fillStyle = "rgba(255,255,255,0.45)"; g.beginPath(); g.moveTo(X - w / 2 + 6, Y + h - 8); g.lineTo(X - w / 2 + 34, Y + 6); g.lineTo(X - w / 2 + 46, Y + 6); g.lineTo(X - w / 2 + 18, Y + h - 8); g.fill();
    g.fillStyle = "#fbf6ea"; g.fillRect(X - 3, Y, 6, h); g.fillRect(X - w / 2, Y + h / 2 - 3, w, 6);
    g.strokeStyle = "rgba(60,44,40,0.8)"; g.lineWidth = 3; g.strokeRect(X - w / 2 - 8, Y - 8, w + 16, h + 16);
  }
  if (door !== undefined) {
    const X = door * 64, w = 62, h = 132; g.fillStyle = "#5f8f72"; g.fillRect(X - w / 2, H - h, w, h);
    g.strokeStyle = "rgba(40,60,46,0.9)"; g.lineWidth = 4; g.strokeRect(X - w / 2 + 9, H - h + 10, w - 18, 50); g.strokeRect(X - w / 2 + 9, H - 62, w - 18, 52);
    g.strokeStyle = "rgba(60,44,40,0.8)"; g.lineWidth = 3; g.strokeRect(X - w / 2, H - h, w, h); g.fillStyle = "#e0b84a"; g.beginPath(); g.arc(X + w / 2 - 12, H - 62, 5, 0, 7); g.fill();
  }
});
export const crateTex = () => ctex("crate", 256, 256, (g, r) => {
  g.fillStyle = "#b08a58"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "rgba(255,240,200,0.12)" : "rgba(70,44,20,0.1)"; g.fillRect(0, i * 64, 256, 62); g.fillStyle = "rgba(60,36,18,0.6)"; g.fillRect(0, i * 64 + 61, 256, 4); }
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(70,44,20,0.14)"; g.fillRect(r() * 256, r() * 256, 30 + r() * 60, 3); }
  g.strokeStyle = "#6e4f2c"; g.lineWidth = 22; g.strokeRect(11, 11, 234, 234);
  g.fillStyle = "#3a2a22"; g.font = "bold 62px 'DejaVu Sans', Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("10 000", 128, 134);
});
export const waterTex = () => ctex("pond", 512, 512, (g, r) => {
  g.fillStyle = "#3f8fc6"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(176,222,246,0.7)"; g.lineWidth = 5; g.lineCap = "round";
  for (let i = 0; i < 26; i++) { const x = r() * 512, y = r() * 512, w = 30 + r() * 50; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y - 9, x + w, y); g.stroke(); }
});
const grilleTex = () => ctex("grille", 64, 64, (g) => { g.fillStyle = "#2e3034"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#8d939c"; for (let i = 0; i < 8; i++) g.fillRect(i * 8 + 2, 4, 3, 56); });

// ---------------- builders ----------------
export function buildGround(R: THREE.Object3D) {
  const gg = new THREE.PlaneGeometry(2600, 2600, 1, 1); gg.rotateX(-Math.PI / 2);
  const uv = gg.attributes.uv, p = gg.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 10, p.getZ(i) / 10);
  const ground = mk(gg, lam({ map: earthTex() })); ground.castShadow = false; R.add(ground);
  const rg = new THREE.PlaneGeometry(900, 4.6); rg.rotateX(-Math.PI / 2);
  const road = mk(rg, lam({ map: rep(roadTex(), 90, 1), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 0, 0.012, 15, R); road.castShadow = false; road.layers.set(NOINK);
  // far ridges for depth: the emus come over the nearest one
  const hill = (x: number, z: number, sx: number, sy: number, sz: number, col: string) => { const h = mk(new THREE.SphereGeometry(1, 40, 12), lam({ color: col }), x, -sy * 0.3, z, R); h.scale.set(sx, sy, sz); h.castShadow = false; return h; };
  hill(0, -150, 330, 10, 46, "#c27a48"); hill(-260, -330, 420, 26, 70, "#b8785a"); hill(330, -420, 520, 34, 80, "#ad7a6a"); hill(60, 520, 700, 30, 90, "#b8785a");
}

/** wheat paddock: a golden block x in [-L, L], z in [z0 - depth, z0], with cut-out tufts along the front edge */
export function buildWheat(R: THREE.Object3D, L = 170, z0 = -8, depth = 84, h = 0.9) {
  const side = (rx: number) => lam({ map: rep(wheatSideTex(), rx, 1) });
  const top = lam({ map: rep(wheatTopTex(), (2 * L) / 5, depth / 5) });
  const block = mk(new THREE.BoxGeometry(2 * L, h, depth), [side(depth / 3), side(depth / 3), top, top, side((2 * L) / 3), side((2 * L) / 3)], 0, h / 2, z0 - depth / 2, R);
  block.castShadow = false;
  // tufts: crossed cut-out cards standing in front of and on the block
  const quads: THREE.BufferGeometry[] = []; let s = 11; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const tuft = (x: number, y: number, z: number, w: number, hh: number) => {
    const a = r() * Math.PI; for (const k of [0, 1]) quads.push(new THREE.PlaneGeometry(w, hh).translate(0, hh / 2, 0).rotateY(a + k * 1.57).translate(x, y, z));
  };
  for (let x = -70; x <= 70; x += 0.55) { tuft(x + r() * 0.4, 0, z0 + 0.25 + r() * 0.5, 0.9, 0.95 + r() * 0.3); tuft(x + r() * 0.4, h - 0.5, z0 - 0.5 - r() * 2.5, 0.9, 0.9 + r() * 0.25); }
  for (let i = 0; i < 500; i++) tuft(-70 + r() * 140, h - 0.5, z0 - 3 - r() * 22, 0.9, 0.85 + r() * 0.3);
  const tm = lam({ map: wheatTuftTex(), alphaTest: 0.5, side: THREE.DoubleSide });
  const tufts = mk(mergeGeometries(quads)!, tm, 0, 0, 0, R); tufts.castShadow = false; tufts.layers.set(NOINK);
  return block;
}

/** wire fence along z = zf with a separate breakable span x in [gx - 3, gx + 3] */
export function buildFence(R: THREE.Object3D, zf = -6.6, gx = 5, L = 170) {
  const postM = lam({ map: boardsTex("post", "#9a7a56", "rgba(60,40,24,0.35)", 3) }), wireM = lam({ color: "#4a4650" });
  const posts: THREE.BufferGeometry[] = [], wires: THREE.BufferGeometry[] = [];
  for (let x = -L; x <= L; x += 3) if (Math.abs(x - gx) > 3.1) posts.push(new THREE.BoxGeometry(0.16, 1.3, 0.16).translate(x, 0.65, zf));
  for (const y of [0.45, 0.8, 1.12]) {
    wires.push(new THREE.BoxGeometry(L + gx - 3, 0.035, 0.035).translate((-L + gx - 3) / 2, y, zf));
    wires.push(new THREE.BoxGeometry(L - gx - 3, 0.035, 0.035).translate((L + gx + 3) / 2, y, zf));
  }
  mk(mergeGeometries(posts)!, postM, 0, 0, 0, R); const w = mk(mergeGeometries(wires)!, wireM, 0, 0, 0, R); w.castShadow = false;
  const gap = new THREE.Group(); gap.position.set(gx, 0, zf); R.add(gap);
  const gposts = [-3, 0, 3].map((dx) => { const pv = new THREE.Group(); pv.position.set(dx, 0, 0); gap.add(pv); mk(new THREE.BoxGeometry(0.16, 1.3, 0.16), postM, 0, 0.65, 0, pv); return pv; });
  // each wire is two halves hinged on the outer posts, so a broken wire hangs down from both sides
  const gwires: THREE.Group[] = [];
  for (const y of [0.45, 0.8, 1.12]) for (const sd of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(sd * 3, y, 0); gap.add(pv);
    const m = mk(new THREE.BoxGeometry(3, 0.035, 0.035), wireM, -sd * 1.5, 0, 0, pv); m.castShadow = false; gwires.push(pv);
  }
  return { gposts, gwires };
}

export function buildHouse() {
  const g = new THREE.Group(), W = 9, D = 6.4, H = 3.1;
  const wall = (key: string, wm: number, wins: number[], door?: number) => lam({ map: wallTex(key, wm, H, wins, door) });
  mk(new THREE.BoxGeometry(W, H, D), [wall("side", D, [D / 2]), wall("side2", D, [1.8, 4.6]), lam({ color: "#d8cdb0" }), lam({ color: "#d8cdb0" }), wall("front", W, [1.7, 7.3], 4.5), wall("back", W, [2.4, 6.6])], 0, H / 2, 0, g);
  const roofM = lam({ map: rep(ironTex("roof", "#c2513f", "#8e3a30"), 6, 1), side: THREE.DoubleSide });
  const gs = new THREE.Shape(); gs.moveTo(-D / 2 - 0.5, 0); gs.lineTo(D / 2 + 0.5, 0); gs.lineTo(0, 2.1); gs.closePath();
  mk(new THREE.ExtrudeGeometry(gs, { depth: W + 1, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-(W + 1) / 2, H, 0), roofM, 0, 0, 0, g);
  const ver = mk(new THREE.BoxGeometry(W + 1, 0.12, 2.9), roofM, 0, H - 0.25, D / 2 + 1.3, g); ver.rotation.x = 0.16;
  const postM = lam({ color: "#f6f0e0" }); for (const x of [-4.6, -1.55, 1.55, 4.6]) mk(new THREE.BoxGeometry(0.16, 2.6, 0.16), postM, x, 1.3, D / 2 + 2.5, g);
  mk(new THREE.BoxGeometry(W + 1, 0.2, 2.9), lam({ map: boardsTex("deck", "#a88a66", "rgba(60,40,24,0.4)", 10) }), 0, 0.1, D / 2 + 1.35, g);
  mk(new THREE.BoxGeometry(0.9, 2.2, 0.9), lam({ color: "#b0604a" }), -2.6, H + 1.5, -0.6, g);
  // rainwater tank on a stand
  const tank = new THREE.Group(); tank.position.set(W / 2 + 1.8, 0, -1.2); g.add(tank);
  mk(new THREE.CylinderGeometry(1.35, 1.35, 2.3, 20), lam({ map: rep(ironTex("tank", "#c3ccd4", "#8a959e"), 8, 1) }), 0, 2.15, 0, tank);
  mk(new THREE.ConeGeometry(1.45, 0.55, 20), lam({ color: "#9aa5ae" }), 0, 3.57, 0, tank);
  const st = lam({ color: "#8a6a48" }); for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) mk(new THREE.BoxGeometry(0.2, 1, 0.2), st, x, 0.5, z, tank);
  return g;
}

export function buildWindmill() {
  const g = new THREE.Group(), steel = lam({ color: "#9ba8b2" }), Hh = 9.5;
  const base = [[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]], at = (i: number, y: number) => { const k = 1 - (y / Hh) * 0.82; return V(base[i][0] * k, y, base[i][1] * k); };
  for (let i = 0; i < 4; i++) {
    bar(at(i, 0), at(i, Hh), 0.07, steel, g);
    for (const [y0, y1] of [[1.2, 3.6], [3.6, 6], [6, 8.2]]) { bar(at(i, y0), at((i + 1) % 4, y0), 0.045, steel, g, 5); bar(at(i, y0), at((i + 1) % 4, y1), 0.035, steel, g, 5); }
  }
  mk(new THREE.BoxGeometry(1.1, 0.12, 1.1), steel, 0, 8.4, 0, g);
  const head = new THREE.Group(); head.position.set(0, Hh + 0.35, 0); g.add(head);
  mk(new THREE.BoxGeometry(0.34, 0.34, 1.2), lam({ color: "#6e7a84" }), 0, 0, -0.1, head);
  const wheel = new THREE.Group(); wheel.position.set(0, 0, 0.62); head.add(wheel);
  const bladeM = lam({ color: "#d3dbe0", side: THREE.DoubleSide }), blades: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; blades.push(new THREE.BoxGeometry(0.4, 1.55, 0.03).rotateY(0.35).translate(0, 1.28, 0).rotateZ(a)); }
  mk(mergeGeometries(blades)!, bladeM, 0, 0, 0, wheel);
  mk(new THREE.TorusGeometry(2.05, 0.04, 5, 28), steel, 0, 0, 0, wheel); mk(new THREE.TorusGeometry(0.55, 0.04, 5, 16), steel, 0, 0, 0, wheel);
  mk(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 10).rotateX(Math.PI / 2), lam({ color: "#6e7a84" }), 0, 0, 0.05, wheel);
  bar(V(0, 0, -0.6), V(0, 0, -2.5), 0.05, steel, head);
  mk(new THREE.BoxGeometry(0.04, 1.1, 1.3), lam({ color: "#c2513f", side: THREE.DoubleSide }), 0, 0, -3.0, head);
  return { group: g, wheel };
}

export function buildGum(seed: number, s = 1) {
  let q = seed * 7919 + 13; const r = () => { q = (q * 16807) % 2147483647; return q / 2147483647; };
  const g = new THREE.Group(), bark = lam({ color: "#ece4d2" });
  const h = 3.2 + r() * 1.2, lean = (r() - 0.5) * 0.5;
  const top = V(lean, h, (r() - 0.5) * 0.4);
  bar(V(0, 0, 0), top, 0.26, bark, g, 7);
  const leaf = [lam({ color: "#8fa261" }), lam({ color: "#7d9354" }), lam({ color: "#9cad6c" })];
  const n = 4 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r(), c = V(top.x + Math.cos(a) * (1.3 + r()), h + 0.9 + r() * 1.3, top.z + Math.sin(a) * (1.3 + r()));
    bar(top.clone().add(V(0, -0.3, 0)), c.clone().add(V(0, -0.5, 0)), 0.11, bark, g, 5);
    const b = mk(new THREE.SphereGeometry(1.25 + r() * 0.55, 10, 7), leaf[i % 3], c.x, c.y, c.z, g); b.scale.set(1.25, 0.72, 1.1);
  }
  g.scale.setScalar(s); return g;
}
export function buildBush(seed: number) {
  let q = seed * 31 + 7; const r = () => { q = (q * 16807) % 2147483647; return q / 2147483647; };
  const g = new THREE.Group(), cols = ["#7c9150", "#8c9d68", "#6d8348"];
  for (let i = 0; i < 3; i++) { const b = mk(new THREE.SphereGeometry(0.6 + r() * 0.35, 9, 6), lam({ color: cols[i] }), (i - 1) * 0.6 + (r() - 0.5) * 0.3, 0.42 + r() * 0.2, (r() - 0.5) * 0.5, g); b.scale.set(1.2, 0.8, 1); }
  return g;
}

/** Lewis gun (x = muzzle direction) on a tripod; `head` swivels and kicks, `muzzle` is in head coordinates */
export function buildGun(pivotH = 1.08) {
  const g = new THREE.Group(), head = new THREE.Group(); head.position.y = pivotH; g.add(head);
  const steel = lam({ color: "#474a54" }), alu = lam({ color: "#9aa1ab" }), wood = lam({ color: "#94602f" }), S = 1.3;
  mk(new THREE.BoxGeometry(0.52 * S, 0.17 * S, 0.14 * S), steel, -0.05 * S, 0, 0, head);
  mk(new THREE.CylinderGeometry(0.08 * S, 0.08 * S, 0.98 * S, 12).rotateZ(Math.PI / 2), alu, 0.69 * S, 0.02 * S, 0, head);
  mk(new THREE.CylinderGeometry(0.1 * S, 0.085 * S, 0.14 * S, 12).rotateZ(Math.PI / 2), steel, 1.22 * S, 0.02 * S, 0, head);
  mk(new THREE.CylinderGeometry(0.22 * S, 0.22 * S, 0.075 * S, 18), steel, 0.02 * S, 0.125 * S, 0, head);
  mk(new THREE.CylinderGeometry(0.06 * S, 0.06 * S, 0.11 * S, 10), alu, 0.02 * S, 0.15 * S, 0, head);
  mk(new THREE.BoxGeometry(0.5 * S, 0.15 * S, 0.1 * S), wood, -0.54 * S, -0.045 * S, 0, head);
  mk(new THREE.BoxGeometry(0.1 * S, 0.27 * S, 0.11 * S), wood, -0.82 * S, -0.07 * S, 0, head);
  mk(new THREE.BoxGeometry(0.07 * S, 0.2 * S, 0.07 * S), steel, -0.2 * S, -0.17 * S, 0, head);
  const legs = new THREE.Group(); g.add(legs);
  for (const [x, z] of [[0.62, 0], [-0.42, 0.5], [-0.42, -0.5]]) bar(V(0, pivotH - 0.1, 0), V(x, 0, z), 0.035, steel, legs, 6);
  mk(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 8), steel, 0, pivotH - 0.1, 0, legs);
  return { group: g, head, legs, muzzle: V(1.32 * S, 0.02 * S, 0) };
}

/** 1930s army lorry, x = forward; `body` rides on the springs, the gun post stands on the tray */
export function buildTruck() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const green = lam({ color: "#93a25c" }), dark = lam({ color: "#65734a" }), tyre = lam({ color: "#35303a" }), hub = lam({ color: "#b9a67a" }), wood = lam({ map: boardsTex("tray", "#b08f62", "rgba(60,40,24,0.4)", 6) });
  const wheels = [[1.6, 0.92], [1.6, -0.92], [-1.4, 0.92], [-1.4, -0.92]].map(([x, z]) => {
    const w = new THREE.Group(); w.position.set(x, 0.5, z); g.add(w);
    mk(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16).rotateX(Math.PI / 2), tyre, 0, 0, 0, w);
    mk(new THREE.CylinderGeometry(0.24, 0.24, 0.34, 8).rotateX(Math.PI / 2), hub, 0, 0, 0, w); return w;
  });
  mk(new THREE.BoxGeometry(4.7, 0.22, 1.5), dark, 0, 0.74, 0, body);
  mk(new THREE.BoxGeometry(1.3, 0.74, 1.16), green, 1.68, 1.22, 0, body);
  mk(new THREE.BoxGeometry(0.1, 0.82, 1.06), lam({ map: rep(grilleTex(), 3, 1) }), 2.38, 1.2, 0, body);
  for (const z of [-0.66, 0.66]) { mk(new THREE.SphereGeometry(0.17, 10, 8), lam({ color: "#f6eed2", emissive: "#f6eed2", emissiveIntensity: 0.15 }), 2.4, 1.3, z, body); const f = mk(new THREE.BoxGeometry(1.25, 0.09, 0.42), dark, 1.6, 1.08, z * 1.4, body); f.rotation.z = -0.06; }
  mk(new THREE.BoxGeometry(0.1, 0.13, 2.0), dark, 2.52, 0.64, 0, body);
  mk(new THREE.BoxGeometry(1.2, 0.66, 1.66), green, 0.45, 1.18, 0, body);
  mk(new THREE.BoxGeometry(0.1, 1.5, 1.66), green, -0.12, 1.6, 0, body);
  mk(new THREE.BoxGeometry(1.36, 0.1, 1.76), dark, 0.5, 2.38, 0, body);
  for (const z of [-0.79, 0.79]) mk(new THREE.BoxGeometry(0.08, 0.86, 0.08), green, 1.02, 1.94, z, body);
  mk(new THREE.BoxGeometry(2.6, 0.14, 1.96), wood, -1.5, 1.08, 0, body);
  for (const z of [-0.95, 0.95]) mk(new THREE.BoxGeometry(2.6, 0.42, 0.07), wood, -1.5, 1.36, z, body);
  mk(new THREE.BoxGeometry(0.07, 0.42, 1.96), wood, -2.78, 1.36, 0, body);
  mk(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 8), dark, -0.55, 1.95, 0, body);
  return { group: g, body, wheels, mount: V(-0.55, 2.78, 0), tray: V(-1.4, 1.15, 0), cab: V(0.5, 0.6, 0.2) };
}

export function buildCrate() { const m = lam({ map: crateTex() }); return mk(new THREE.BoxGeometry(1.0, 0.55, 0.62), m); }

/** a cartridge as tall as a man's knee, standing on its base */
export function buildCartridge() {
  const g = new THREE.Group();
  const v2 = (p: number[][]) => p.map(([x, y]) => new THREE.Vector2(x, y));
  mk(new THREE.LatheGeometry(v2([[0.001, 0], [0.13, 0], [0.13, 0.03], [0.115, 0.05], [0.115, 0.42], [0.075, 0.5], [0.075, 0.56]]), 14), lam({ color: "#e2aa3c" }), 0, 0, 0, g);
  mk(new THREE.LatheGeometry(v2([[0.074, 0.56], [0.07, 0.66], [0.045, 0.76], [0.001, 0.82]]), 14), lam({ color: "#c96a3c" }), 0, 0, 0, g);
  return g;
}

/** the farm dam: water in an earth bank, reeds, at the group's origin */
export function buildPond(rad = 10) {
  const g = new THREE.Group();
  const wg = new THREE.CircleGeometry(rad, 40); wg.rotateX(-Math.PI / 2);
  const water = mk(wg, lam({ map: rep(waterTex(), 3, 3), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 0, 0.03, 0, g); water.castShadow = false; water.layers.set(NOINK);
  const bank = mk(new THREE.TorusGeometry(rad + 0.3, 0.55, 6, 44).rotateX(Math.PI / 2), lam({ color: "#b56a3e" }), 0, 0, 0, g); bank.scale.y = 0.55;
  const reeds: THREE.BufferGeometry[] = []; let s = 5; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 70; i++) { const a = r() * Math.PI * 2, d = rad - 0.4 - r() * 0.9, h = 0.8 + r() * 0.8; if (Math.sin(a) > 0.55) continue; reeds.push(new THREE.ConeGeometry(0.06, h, 4).translate(Math.cos(a) * d, h / 2, Math.sin(a) * d)); }
  const rm = mk(mergeGeometries(reeds)!, lam({ color: "#7f9a4e" }), 0, 0, 0, g); rm.layers.set(NOINK);
  return g;
}

/** roadside board with the coat of arms */
export function buildBoard() {
  const g = new THREE.Group(), wood = lam({ map: boardsTex("bpost", "#9a7a56", "rgba(60,40,24,0.35)", 3) });
  for (const x of [-2.1, 2.1]) mk(new THREE.BoxGeometry(0.26, 6.6, 0.26), wood, x, 3.3, -0.1, g);
  const face = mk(new THREE.BoxGeometry(5.0, 5.0, 0.14), [wood, wood, wood, wood, lam({ map: emblemTex() }), wood], 0, 4.3, 0.06, g);
  mk(new THREE.BoxGeometry(5.5, 0.2, 0.5), lam({ map: rep(ironTex("broof", "#c2513f", "#8e3a30"), 6, 1) }), 0, 6.92, 0.06, g);
  return { group: g, face };
}
