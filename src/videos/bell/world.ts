// The Kremlin square set for the Tsar Bell short + per-frame posing. One scene, three states:
//   "pit"  = 1735-1812: bell in its casting pit under the wooden scaffold,  "ped" = 1836-today: bell on its pedestal,
//   "kitchen" = the hot-glass analogy on a table (built far away at x = 400, 4x scale so ink / fog / shadows behave).
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { TONE, CHAR, twoTone, untone } from "./shade";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "./lights";
import { NOINK } from "./ink";
import { ctex, rep, brick, cobbleHD, stoneHD, planksHD, beamHD, roofHD, cloudHD } from "./paint";
import { Actor, Look, Pose, fxCard, flameTex, puffTex, splashTex, burstTex, elephantTex, crowTex, noteTex, zzzTex, INK } from "./chars";
import { FPS, SHOTS, T, Light, V3, Cam, camAt, shotAt, ss, eo, lerp, clamp01 } from "./story";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lam = (o: THREE.MeshLambertMaterialParameters) => twoTone(new THREE.MeshLambertMaterial(o));
const PHI0 = 1.0, GAP = 0.27, PITR = 6.2, PITD = 1.0, KX = 400;

// ---- light presets: template day / golden + our night fire ----
const FIRE: LightPreset = {
  ...LIGHTS.golden, az: 128, el: 24,
  lit: [1.75, 0.82, 0.34], shade: [0.2, 0.14, 0.34], lift: [0.05, 0.03, 0.1], term: 0.12,
  charTint: [1.0, 0.76, 0.56], charShade: 0.8, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.8, 0.72, 0.95],
  top: "#1c1638", hor: "#e8703a", fog: "#7c3a34", fogNear: 30, fogFar: 260, sunDisc: "#000000", sunCol: "#ff9a4e", sunI: 4.5,
};
const FIRE_LOOK: WorldLook = { ...LOOK.golden, sky: { c: ["#f08a3c", "#c9542f", "#7a2f3a", "#3a2148", "#1a1434"], e: [0, 4, 10, 20, 40] }, sat: 1.1, bounce: [0.06, 0.02, 0] };
const PRESET: Record<Light, LightPreset> = { day: LIGHTS.day, golden: LIGHTS.golden, fire: FIRE };
const WLOOK: Record<Light, WorldLook> = { day: LOOK.day, golden: LOOK.golden, fire: FIRE_LOOK };

// ---- painted textures of this short ----
const bellTex = (part: "up" | "low", cracked: boolean) => ctex(`bell_${part}_${cracked}`, 1024, part === "up" ? 512 : 256, (g, r) => {
  const H = part === "up" ? 512 : 256;
  g.fillStyle = "#b9803f"; g.fillRect(0, 0, 1024, H);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,220,150" : "90,50,20"},0.07)`; g.fillRect(r() * 1024, r() * H, 60 + r() * 160, 6 + r() * 14); }
  const band = (y: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(0, y, 1024, h); };
  if (part === "low") {
    band(H - 34, 34, "#8e5c2a"); band(H - 44, 6, "#e0aa5c"); band(96, 8, "#8e5c2a"); band(20, 8, "#8e5c2a");
    g.strokeStyle = "#8e5c2a"; g.lineWidth = 7;
    for (let x = 0; x < 1024; x += 64) { g.beginPath(); g.arc(x + 32, 62, 22, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x, 34); g.lineTo(x + 64, 90); g.stroke(); }
  } else {
    band(H - 16, 16, "#8e5c2a"); band(H - 150, 9, "#8e5c2a"); band(H - 168, 5, "#e0aa5c"); band(120, 9, "#8e5c2a"); band(60, 6, "#8e5c2a");
    for (let x = 64; x < 1024; x += 256) { g.fillStyle = "#a06a30"; g.strokeStyle = "#7a4c20"; g.lineWidth = 8; g.beginPath(); g.ellipse(x, H - 250, 46, 66, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = "#d9a55a"; g.beginPath(); g.arc(x, H - 268, 16, 0, 7); g.fill(); g.fillRect(x - 20, H - 250, 40, 34); }
    g.strokeStyle = "#8e5c2a"; g.lineWidth = 6; for (let x = 0; x < 1024; x += 48) { g.beginPath(); g.arc(x + 24, 92, 16, Math.PI, 0); g.stroke(); }
  }
  if (cracked) {
    g.strokeStyle = "#1c0f14"; g.lineJoin = "round"; g.lineCap = "round";
    const crack = (x: number, y: number, dx: number, dy: number, n: number, w: number) => {
      g.lineWidth = w; g.beginPath(); g.moveTo(x, y);
      for (let i = 0; i < n; i++) { x += dx * (0.5 + r()) + (r() - 0.5) * 26; y += dy * (0.5 + r()); g.lineTo(x, y); }
      g.stroke();
    };
    if (part === "low") { for (const [x, d] of [[6, 1], [1018, -1]] as [number, number][]) { crack(x, 20, 14 * d, 26, 6, 9); crack(x, 120, 26 * d, 10, 5, 7); crack(x + 40 * d, 200, 20 * d, -22, 4, 6); crack(x, 230, 30 * d, -6, 4, 6); } }
    else { const x0 = (PHI0 / (Math.PI * 2)) * 1024; for (const o of [-40, -8, 30, 62]) crack(x0 + o, H - 2, (o > 0 ? 5 : -5), -22, 3 + Math.floor(r() * 2), 5); }
  }
});
const logTex = () => ctex("logwall", 512, 512, (g, r) => {
  for (let i = 0; i < 8; i++) {
    const y = i * 64; const gr = g.createLinearGradient(0, y, 0, y + 64);
    gr.addColorStop(0, "#6b4426"); gr.addColorStop(0.3, "#a8733f"); gr.addColorStop(0.7, "#8f5f33"); gr.addColorStop(1, "#4a2e1a");
    g.fillStyle = gr; g.fillRect(0, y, 512, 64);
    for (let k = 0; k < 5; k++) { g.fillStyle = "rgba(60,35,18,0.25)"; g.fillRect(r() * 512, y + 14 + r() * 36, 40 + r() * 90, 3); }
  }
  g.fillStyle = "#2b1c14"; g.fillRect(200, 190, 112, 150); g.fillStyle = "#f2c56b"; g.fillRect(212, 202, 88, 126);
  g.fillStyle = "#2b1c14"; g.fillRect(252, 202, 8, 126); g.fillRect(212, 260, 88, 8);
});
const churchTex = () => ctex("church", 1024, 1024, (g, r) => {
  g.fillStyle = "#f1ece0"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(180,160,130,0.10)"; g.fillRect(r() * 1024, r() * 1024, 80 + r() * 200, 10 + r() * 30); }
  for (let k = 0; k < 4; k++) {
    const x = 128 + k * 256;
    g.fillStyle = "#d9d0bc"; g.fillRect(x - 122, 0, 16, 1024);
    g.fillStyle = "#2a2a3a"; g.beginPath(); g.moveTo(x - 26, 560); g.lineTo(x - 26, 330); g.arc(x, 330, 26, Math.PI, 0); g.lineTo(x + 26, 560); g.closePath(); g.fill();
    g.strokeStyle = "#c9bfa8"; g.lineWidth = 10; g.stroke();
    g.strokeStyle = "#d9d0bc"; g.lineWidth = 14; g.beginPath(); g.arc(x, 150, 112, Math.PI, 0); g.stroke();
  }
  g.fillStyle = "#d9d0bc"; g.fillRect(0, 150, 1024, 14); g.fillRect(0, 980, 1024, 44);
});
const tileTex = () => ctex("kitchenwall", 1024, 1024, (g, r) => {
  g.fillStyle = "#f3e2bd"; g.fillRect(0, 0, 1024, 1024);
  for (let y = 512; y < 1024; y += 128) for (let x = 0; x < 1024; x += 128) { g.fillStyle = (x / 128 + y / 128) % 2 ? "#4fa39a" : "#e9f1e4"; g.fillRect(x + 4, y + 4, 120, 120); }
  g.fillStyle = "#b9824a"; g.fillRect(0, 492, 1024, 22);
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(160,120,70,0.07)"; g.fillRect(r() * 1024, r() * 480, 100 + r() * 200, 14); }
});
const softDisc = (key: string, inner: string, outer: string) => ctex("disc" + key, 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 2, 64, 64, 63); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

// ---- cast ----
const SKIN = ["#f6d7b4", "#eec39a", "#f9e0c4", "#d9a878", "#f2cba6"];
const MOTORIN: Look = { id: "motorin", skin: SKIN[1], body: "#b8473a", hat: "cap", hatCol: "#5a3a2a", beard: "#8c8478", apron: "#8a5c36" };
const CRAFT: Look[] = [
  { id: "craft0", skin: SKIN[0], body: "#e9dcc0", hat: "none", beard: "#b06a2c", apron: "#7b5234" },
  { id: "craft1", skin: SKIN[3], body: "#6f8fbf", hat: "cap", hatCol: "#3f4a5c", beard: "#3a2c28", apron: "#8a5c36" },
];
const GUARD = (i: number): Look => ({ id: "guard" + i, skin: SKIN[i % 5], body: "#2f8a52", hat: "tricorn", belts: "#f4f1ea", cuffs: "#c8383a", coat: true, ...(i % 2 ? { beard: undefined } : {}) });
const NAPOLEON: Look = { id: "napoleon", skin: SKIN[2], body: "#8d8f98", hat: "bicorne", stripe: "#f4f1ea", coat: true, epaulettes: true };
const GREN = (i: number): Look => ({ id: "gren" + i, skin: SKIN[(i + 1) % 5], body: "#2c4fa8", hat: "bearskin", belts: "#f4f1ea", cuffs: "#c8383a", epaulettes: true });
const TOURIST: Look[] = [
  { id: "tour0", skin: SKIN[0], body: "#f06aa0", hat: "baseball", hatCol: "#ffffff" },
  { id: "tour1", skin: SKIN[3], body: "#2fb5b0", hat: "hair", hatCol: "#3a2618" },
  { id: "tour2", skin: SKIN[4], body: "#f2c230", hat: "hair", hatCol: "#c8742c" },
  { id: "tour3", skin: SKIN[2], body: "#7a5ad0", hat: "baseball", hatCol: "#e84a3a" },
];
const COOK: Look = { id: "cook", skin: SKIN[4], body: "#e9e4d8", hat: "hair", hatCol: "#6a3f24", apron: "#d8554a" };

export class World {
  root = new THREE.Group();
  private sky!: THREE.Mesh; private skyMat!: THREE.ShaderMaterial; private fog = new THREE.Fog("#bccbec", 25, 420);
  private hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1); private sun = new THREE.DirectionalLight("#fff0d6", 2.6);
  private clouds: THREE.Mesh[] = []; private stars!: THREE.Points;
  private pit = new THREE.Group(); private pitFill!: THREE.Mesh; private scaffold = new THREE.Group(); private scaffMat!: THREE.MeshLambertMaterial;
  private pedestal = new THREE.Group(); private grass = new THREE.Group();
  private bell = new THREE.Group(); private frag = new THREE.Group(); private bellMats: THREE.MeshLambertMaterial[] = []; private cross = new THREE.Group();
  private ropes: THREE.Mesh[] = []; private rope!: THREE.Mesh;
  private kitchen = new THREE.Group(); private glass!: THREE.Mesh; private glassMat!: THREE.MeshLambertMaterial; private water!: THREE.Mesh; private jug = new THREE.Group();
  private stream!: THREE.Mesh; private shards: THREE.Mesh[] = []; private spill!: THREE.Mesh;
  private elephants: THREE.Mesh[] = []; private fx: THREE.Mesh[] = []; private fxN = 0;
  private motorin = new Actor(MOTORIN); private crafts = CRAFT.map((l) => new Actor(l)); private guards = [0, 1, 2, 3].map((i) => new Actor(GUARD(i)));
  private napoleon = new Actor(NAPOLEON, 1.6); private grens = [0, 1, 2].map((i) => new Actor(GREN(i), 1.85)); private tourists = TOURIST.map((l, i) => new Actor(l, 1.6 + 0.08 * i));
  private cook = new Actor(COOK, 7.2); private actors: Actor[];
  private houses: V3[] = [];
  private sunDirs = new Map<number, THREE.Vector3>();

  constructor() {
    const R = this.root;
    // ---------- sky, lights ----------
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 32, 16), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudHD(i % 4, LOOK.day.cloud), color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const a = -2.2 + i * 0.75, d = 420 + (i % 3) * 90; m.position.set(Math.sin(a) * d, 110 + (i % 4) * 34, -Math.cos(a) * d); m.scale.set(210 + (i % 3) * 60, 90 + (i % 2) * 30, 1);
      m.layers.set(NOINK); m.frustumCulled = false; this.clouds.push(m); R.add(m);
    }
    const sp: number[] = []; let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 260; i++) { const a = rnd() * 6.283, e = 0.25 + rnd() * 1.2; sp.push(Math.cos(a) * Math.cos(e) * 900, Math.sin(e) * 900, Math.sin(a) * Math.cos(e) * 900); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color(1.6, 1.5, 1.3), size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false }));
    this.stars.layers.set(NOINK); this.stars.frustumCulled = false; R.add(this.stars);

    // ---------- ground + pit ----------
    const cob = cobbleHD();
    const groundUV = (g: THREE.BufferGeometry) => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 8, p.getY(i) / 8); g.rotateX(-Math.PI / 2); return g; };
    const cobM = lam({ map: rep(cob, 1, 1) });
    const ground = new THREE.Mesh(groundUV(new THREE.RingGeometry(PITR, 900, 48, 6)), cobM); ground.receiveShadow = true; R.add(ground);
    this.pitFill = new THREE.Mesh(groundUV(new THREE.CircleGeometry(PITR, 48)), cobM); this.pitFill.receiveShadow = true; R.add(this.pitFill);
    const earth = lam({ color: "#7a5a40" });
    const wallG = new THREE.CylinderGeometry(PITR, PITR, PITD, 48, 1, true); const pw = new THREE.Mesh(wallG, lam({ color: "#8a6848", side: THREE.BackSide })); pw.position.y = -PITD / 2; pw.receiveShadow = true;
    const pf = new THREE.Mesh(new THREE.CircleGeometry(PITR, 48).rotateX(-Math.PI / 2), earth); pf.position.y = -PITD; pf.receiveShadow = true;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(PITR + 0.25, 0.28, 6, 40).rotateX(Math.PI / 2), lam({ color: "#9a7650" })); rim.scale.y = 0.6; rim.castShadow = rim.receiveShadow = true;
    this.pit.add(pw, pf, rim); R.add(this.pit);

    // ---------- Kremlin wall, towers, cathedral, bell tower, wooden houses ----------
    const mk = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, parent: THREE.Object3D = R) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
    const brickM = lam({ map: rep(brick(), 60, 3), color: "#f0b8a8" }), brickT = lam({ map: rep(brick(), 3, 6), color: "#f0b8a8" });
    mk(new THREE.BoxGeometry(260, 9, 3), brickM, 0, 4.5, -52);
    const ms = new THREE.Shape(); ms.moveTo(-0.75, 0); ms.lineTo(0.75, 0); ms.lineTo(0.75, 2.5); ms.lineTo(0, 1.7); ms.lineTo(-0.75, 2.5); ms.closePath();
    const merl: THREE.BufferGeometry[] = [];
    for (let x = -128; x <= 128; x += 2.7) merl.push(new THREE.ExtrudeGeometry(ms, { depth: 0.9, bevelEnabled: false }).translate(x, 9, -51.4));
    mk(mergeGeometries(merl)!, lam({ color: "#c9604a" }));
    const roofG = lam({ color: "#2f8f6a" }), gold = lam({ color: "#f2c230" }), white = lam({ color: "#f3efe4" });
    for (const [x, w, h] of [[-66, 10, 21], [44, 11, 25], [-10, 8, 15], [108, 10, 20], [-122, 10, 20]]) {
      mk(new THREE.BoxGeometry(w, h, w), brickT, x, h / 2, -52); mk(new THREE.BoxGeometry(w * 0.72, 5, w * 0.72), brickT, x, h + 2.5, -52);
      mk(new THREE.ConeGeometry(w * 0.62, h * 0.7, 4).rotateY(Math.PI / 4), roofG, x, h + 5 + h * 0.35, -52); mk(new THREE.SphereGeometry(0.7, 10, 8), gold, x, h + 5 + h * 0.7 + 0.5, -52);
    }
    const onionP = [[1, 0], [1.28, 0.35], [1.4, 0.8], [1.27, 1.3], [0.86, 1.8], [0.4, 2.25], [0.12, 2.6], [0.03, 3.0]];
    const onion = (r: number, x: number, y: number, z: number) => { mk(new THREE.LatheGeometry(onionP.map((p) => new THREE.Vector2(p[0] * r, p[1] * r)), 20), gold, x, y, z); mk(new THREE.BoxGeometry(0.16 * r, 1.5 * r, 0.16 * r), gold, x, y + 3.6 * r, z); mk(new THREE.BoxGeometry(0.8 * r, 0.16 * r, 0.16 * r), gold, x, y + 3.9 * r, z); };
    const chM = lam({ map: churchTex() });
    mk(new THREE.BoxGeometry(18, 14, 15), chM, -34, 7, -30);
    for (const [dx, dz, r, h] of [[0, 0, 2.6, 6], [-5.5, -4.5, 1.6, 4], [5.5, -4.5, 1.6, 4], [-5.5, 4.5, 1.6, 4], [5.5, 4.5, 1.6, 4]]) { mk(new THREE.CylinderGeometry(r, r, h, 12), white, -34 + dx, 14 + h / 2, -30 + dz); onion(r, -34 + dx, 14 + h, -30 + dz); }
    let ty = 0; for (const [r, h] of [[5.6, 15], [4.5, 11], [3.5, 8], [2.6, 5]]) { mk(new THREE.CylinderGeometry(r * 0.94, r, h, 8), white, 27, ty + h / 2, -27); mk(new THREE.CylinderGeometry(r * 1.06, r * 1.06, 0.5, 8), lam({ color: "#d9d0bc" }), 27, ty + h, -27); ty += h; }
    onion(2.7, 27, ty, -27);
    const logM = lam({ map: logTex() }), roofM = lam({ map: rep(roofHD("#8a5a3a"), 2, 1.5), color: "#b98a62" });
    const gable = new THREE.Shape(); gable.moveTo(-4.2, 0); gable.lineTo(4.2, 0); gable.lineTo(0, 3.0); gable.closePath();
    this.houses = [[-36, 0, 16], [-38, 0, 3], [-35, 0, -10], [-48, 0, 10], [-52, 0, -4], [36, 0, 14], [40, 0, 1], [34, 0, -10], [-52, 0, 22], [50, 0, 20]];
    this.houses.forEach(([x, , z], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = (i % 3) * 0.5 - 0.4 + (x > 0 ? 0.5 : 0); R.add(g);
      mk(new THREE.BoxGeometry(7.6, 3.6, 6), logM, 0, 1.8, 0, g); mk(new THREE.ExtrudeGeometry(gable, { depth: 6.8, bevelEnabled: false }).translate(0, 3.6, -3.4), roofM, 0, 0, 0, g);
    });

    // ---------- scaffold over the pit ----------
    this.scaffMat = lam({ map: rep(beamHD(), 1, 1), color: "#ffffff" });
    const beamBetween = (a: THREE.Vector3, b: THREE.Vector3, w = 0.34) => { const d = b.clone().sub(a), g = new THREE.BoxGeometry(w, d.length(), w); const o = mk(g, this.scaffMat, 0, 0, 0, this.scaffold); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return o; };
    const C = 5.6, HS = 9;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { beamBetween(V(sx * C, 0, sz * C), V(sx * C, HS, sz * C), 0.42); beamBetween(V(sx * C, HS, sz * C), V(0, 12.4, 0), 0.3); }
    for (const y of [HS, 5.2]) { beamBetween(V(-C, y, -C), V(C, y, -C)); beamBetween(V(-C, y, C), V(C, y, C)); beamBetween(V(-C, y, -C), V(-C, y, C)); beamBetween(V(C, y, -C), V(C, y, C)); }
    beamBetween(V(-C, 0, -C), V(-C, 5.2, C), 0.24); beamBetween(V(C, 0, -C), V(C, 5.2, C), 0.24); beamBetween(V(-C, 5.2, -C), V(C, HS, -C), 0.24);
    R.add(this.scaffold); for (const o of this.scaffold.children) o.userData.front = o.position.z > 1 || o.position.x > 1;
    for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + 0.78; const o = mk(new THREE.CylinderGeometry(0.05, 0.05, 1, 5), lam({ color: "#c9b089" })); this.ropes.push(o); }
    this.rope = mk(new THREE.CylinderGeometry(0.07, 0.07, 1, 5), lam({ color: "#c9b089" }));

    // ---------- pedestal, grass ----------
    const stone = lam({ map: rep(stoneHD(), 4, 0.6) });
    mk(new THREE.CylinderGeometry(4.5, 5.0, 1.1, 8), stone, 0, 0.55, 0, this.pedestal); mk(new THREE.CylinderGeometry(4.1, 4.1, 0.25, 8), lam({ color: "#cfc4b2" }), 0, 1.2, 0, this.pedestal);
    R.add(this.pedestal);
    const gm = lam({ color: "#7d9a4c" });
    for (let i = 0; i < 26; i++) { const a = i * 2.4, r = PITR + 0.5 + (i % 5) * 0.5; const c = mk(new THREE.ConeGeometry(0.28 + (i % 3) * 0.1, 0.8 + (i % 4) * 0.25, 5), gm, Math.sin(a) * r, 0.4, Math.cos(a) * r, this.grass); c.rotation.z = (i % 3 - 1) * 0.2; }
    for (let i = 0; i < 8; i++) { const a = i * 0.9; mk(new THREE.ConeGeometry(0.3, 1.0, 5), gm, Math.sin(a) * (3.9 + (i % 2)), -PITD + 0.5, Math.cos(a) * (3.9 + (i % 2)), this.grass); }
    R.add(this.grass);

    // ---------- the bell: upper part (full circle), lower ring with a gap, the 11.5 t fragment ----------
    const OUT = [[3.3, 0], [3.26, 0.22], [3.02, 0.6], [2.72, 1.1], [2.45, 1.7], [2.26, 2.3], [2.08, 3.0], [1.94, 3.7], [1.82, 4.35], [1.7, 4.8], [1.48, 5.12], [1.05, 5.32], [0.5, 5.4], [0.001, 5.42]];
    const INN = [[1.82, 2.3], [2.0, 1.7], [2.27, 1.1], [2.57, 0.6], [2.84, 0.2], [2.94, 0]];
    const v2 = (a: number[][]) => a.map((p) => new THREE.Vector2(p[0], p[1]));
    const loop = [...OUT.slice(0, 6), ...INN, OUT[0]];
    const bm = (part: "up" | "low") => { const m = lam({ map: bellTex(part, false), side: THREE.DoubleSide }); this.bellMats.push(m); return m; };
    const up = bm("up"), low = bm("low"), breakM = lam({ color: "#d9a868" }); this.bellMats.push(breakM);
    mk(new THREE.LatheGeometry(v2(OUT.slice(5)), 40), up, 0, 0, 0, this.bell);
    mk(new THREE.LatheGeometry(v2(loop), 40, PHI0 + GAP, Math.PI * 2 - 2 * GAP), low, 0, 0, 0, this.bell);
    const capShape = new THREE.Shape(v2(loop.slice(0, -1)));
    const cap = (phi: number, parent: THREE.Object3D, off = V()) => { const g = new THREE.ShapeGeometry(capShape).rotateY(phi - Math.PI / 2).translate(-off.x, -off.y, -off.z); const o = mk(g, breakM, 0, 0, 0, parent); (o.material as THREE.Material).side = THREE.DoubleSide; };
    cap(PHI0 + GAP, this.bell); cap(PHI0 - GAP, this.bell);
    mk(new THREE.CylinderGeometry(0.55, 0.62, 0.4, 12), up, 0, 5.6, 0, this.bell);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.78; mk(new THREE.TorusGeometry(0.34, 0.11, 6, 10, Math.PI), up, Math.sin(a) * 0.5, 5.75, Math.cos(a) * 0.5, this.bell).rotation.y = a + Math.PI / 2; }
    mk(new THREE.SphereGeometry(0.34, 12, 10), up, 0, 6.1, 0, this.bell);
    mk(new THREE.SphereGeometry(0.42, 12, 10), gold, 0, 6.5, 0, this.cross); mk(new THREE.BoxGeometry(0.14, 1.3, 0.14), gold, 0, 7.4, 0, this.cross); mk(new THREE.BoxGeometry(0.7, 0.14, 0.14), gold, 0, 7.6, 0, this.cross);
    this.bell.add(this.cross);
    const p0 = V(3.3 * Math.sin(PHI0), 0, 3.3 * Math.cos(PHI0));
    mk(new THREE.LatheGeometry(v2(loop), 6, PHI0 - GAP, 2 * GAP).translate(-p0.x, 0, -p0.z), low, 0, 0, 0, this.frag);
    cap(PHI0 - GAP, this.frag, p0); cap(PHI0 + GAP, this.frag, p0);
    this.bell.add(this.frag); R.add(this.bell);

    // ---------- kitchen (4x scale) ----------
    const Kt = this.kitchen; Kt.position.set(KX, 0, 0); R.add(Kt);
    mk(new THREE.BoxGeometry(26, 0.6, 9), lam({ map: rep(planksHD(), 2, 0.7) }), 0, 3.7, 0, Kt);
    mk(new THREE.PlaneGeometry(90, 44), lam({ map: rep(tileTex(), 5, 2.5) }), 0, 12, -7, Kt);
    mk(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), lam({ color: "#b98a5e" }), 0, -0.02, 0, Kt);
    this.glassMat = lam({ color: "#d4eef5", transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    this.glass = mk(new THREE.CylinderGeometry(0.8, 0.64, 2.0, 24, 1, true), this.glassMat, 0, 5.0, 0, Kt); this.glass.castShadow = false;
    mk(new THREE.CylinderGeometry(0.64, 0.64, 0.12, 24), this.glassMat, 0, -0.96, 0, this.glass).castShadow = false;
    this.water = mk(new THREE.CylinderGeometry(0.72, 0.6, 1, 20), lam({ color: "#3aa6e8", emissive: "#0a2a55" }), 0, 4.1, 0, Kt); this.water.castShadow = false;
    const jp = [[0.001, 0], [0.9, 0], [1.1, 0.5], [1.15, 1.2], [0.9, 2.0], [0.7, 2.4], [0.8, 2.7]];
    mk(new THREE.LatheGeometry(v2(jp), 20), lam({ color: "#f3f6fa", side: THREE.DoubleSide }), 0, -1.2, 0, this.jug);
    mk(new THREE.TorusGeometry(0.62, 0.11, 6, 12, Math.PI), lam({ color: "#3d6fd0" }), 1.0, 0.2, 0, this.jug).rotation.z = -Math.PI / 2;
    mk(new THREE.CylinderGeometry(1.13, 1.16, 0.3, 20, 1, true), lam({ color: "#3d6fd0" }), 0, -0.3, 0, this.jug);
    for (const [x, y, z] of [[-0.25, 1.55, 0.1], [0.3, 1.6, -0.2], [0, 1.75, 0.3]]) mk(new THREE.BoxGeometry(0.42, 0.42, 0.42), lam({ color: "#dff4ff" }), x, y, z, this.jug).rotation.set(0.5, 0.6, 0.2);
    Kt.add(this.jug);
    this.stream = mk(new THREE.CylinderGeometry(0.1, 0.07, 1, 8), lam({ color: "#6cc4f2" }), 0, 0, 0, Kt); this.stream.castShadow = false;
    for (let i = 0; i < 7; i++) { const s = mk(new THREE.CylinderGeometry(0.8, 0.64, 2.0, 4, 1, true, (i / 7) * 6.283, 6.283 / 7), this.glassMat, 0, 5, 0, Kt); s.castShadow = false; this.shards.push(s); }
    this.spill = mk(new THREE.CylinderGeometry(1, 1, 0.06, 24), lam({ color: "#3aa6e8" }), 0, 4.03, 0, Kt); this.spill.castShadow = false;

    // ---------- cards ----------
    for (let i = 0; i < 40; i++) { const m = fxCard(elephantTex(false), 1.5, 1.17); R.add(m); this.elephants.push(m); }
    for (let i = 0; i < 90; i++) { const m = fxCard(flameTex(0), 1, 1); R.add(m); this.fx.push(m); }
    this.actors = [this.motorin, ...this.crafts, ...this.guards, this.napoleon, ...this.grens, ...this.tourists, this.cook];
    for (const a of this.actors) R.add(a.group);
  }

  private shotSun(id: number, L: LightPreset) {
    let d = this.sunDirs.get(id);
    if (!d) {
      const s = SHOTS[id - 1], c = camAt(id, s.a + 0.01), f = V(c.look[0] - c.pos[0], 0, c.look[2] - c.pos[2]).normalize(), r = V(-f.z, 0, f.x);
      const az = THREE.MathUtils.degToRad(L.az), el = THREE.MathUtils.degToRad(L.el);
      d = f.multiplyScalar(Math.cos(az)).addScaledVector(r, Math.sin(az)).multiplyScalar(Math.cos(el)); d.y = Math.sin(el); d.normalize();
      this.sunDirs.set(id, d);
    }
    return d;
  }

  /** effect card: texture at a world position, w x h metres, facing the camera */
  private put(t: THREE.Texture, x: number, y: number, z: number, w: number, h: number, o: { glow?: number; rot?: number; op?: number } = {}) {
    const m = this.fx[this.fxN++]; if (!m) return;
    const mat = m.material as THREE.MeshBasicMaterial;
    mat.map = t;
    mat.color.setScalar(o.glow ?? 1); m.visible = true; m.position.set(x, y, z); m.scale.set(w, h, 1); m.userData.rot = o.rot ?? 0;
  }

  update(tSec: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, pxScale: number, camO?: Cam) {
    const t = tSec, s = shotAt(t), id = s.id, L = PRESET[s.light], K = WLOOK[s.light];
    const c = camO ?? camAt(id, t);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    // ---- light rig (camera-relative sun, frozen per shot) ----
    const sunDir = this.shotSun(id, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95); if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su = this.skyMat.uniforms; K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((d) => THREE.MathUtils.degToRad(d)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position); this.stars.position.copy(cam.position); this.stars.visible = s.light === "fire";
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) { m.visible = s.light !== "fire" && s.state !== "kitchen"; m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).color.setScalar(s.light === "golden" ? 1.0 : 1.1); }

    // ---- set state ----
    const pit = s.state !== "ped";
    this.pit.visible = pit; this.pitFill.visible = !pit; this.pedestal.visible = !pit; this.cross.visible = !pit && id !== 17;
    this.scaffold.visible = (pit && id <= 10) || id === 17; this.grass.visible = id === 15 || id === 16;
    for (const o of this.scaffold.children) o.visible = !(id === 10 && o.userData.front);
    const burnt = id >= 10 && id <= 14; this.scaffMat.color.set(burnt ? "#4a3c40" : "#ffffff");
    const cracked = t >= T.crack && id >= 10 || id === 1;
    this.bellMats[0].map = bellTex("up", cracked); this.bellMats[1].map = bellTex("low", cracked);
    const glow = id === 8 ? ss(t, T.glow, 22.3) : id === 9 ? 1 - 0.75 * ss(t, T.throw + 0.3, 25.3) : id === 10 ? 0.25 * (1 - ss(t, 25.4, 27)) : 0;
    for (const m of this.bellMats) { m.emissive.setRGB(1.0, 0.13, 0.0); m.emissiveIntensity = glow * 0.85; }
    // bell height: pit floor / pedestal top / lift in shot 17
    let by = pit ? -PITD : 1.32;
    if (id === 17) by = t < T.land ? lerp(-0.4, 3.0, ss(t, 49.6, 51.0)) - 1.68 * eo(t, 51.2, T.land) * (t > 51.2 ? 1 : 0) : 1.32;
    this.bell.position.set(0, by, 0); this.bell.rotation.z = id === 17 && t < T.land ? 0.02 * Math.sin(t * 5) : 0;
    // the fragment: in place, fallen into the pit (after T.fall), or leaning on the pedestal
    const n = V(Math.sin(PHI0), 0, Math.cos(PHI0)), tan = V(Math.cos(PHI0), 0, -Math.sin(PHI0));
    this.frag.visible = true;
    if (pit) {
      const fell = id > 10 ? 1 : id === 10 ? ss(t, T.fall, T.thud) ** 2 : 0, bounce = id === 10 && t > T.thud ? 0.05 * Math.exp(-(t - T.thud) * 9) * Math.sin((t - T.thud) * 40) : 0;
      this.frag.position.copy(n).multiplyScalar(3.3 + 0.5 * fell); this.frag.quaternion.setFromAxisAngle(tan, fell * 1.32 + bounce);
    } else {
      this.frag.position.copy(n).multiplyScalar(6.0).setY(-by); this.frag.quaternion.setFromAxisAngle(tan, -0.3);
      if (id === 17) this.frag.visible = t >= T.land;
    }
    this.kitchen.visible = s.state === "kitchen";

    // ---- cards ----
    for (let i = 0; i < this.fxN; i++) this.fx[i].visible = false; this.fxN = 0;
    for (const a of this.actors) a.group.visible = false;
    for (const m of this.elephants) m.visible = false;
    this.rope.visible = false; for (const r of this.ropes) r.visible = false;
    const fr = Math.floor(t * FPS), blink = (k: number) => ((fr + k * 37) % (48 + k * 11)) < 4;
    const face = (k: number, f: Pose["face"]) => (blink(k) && (f === "flat" || f === "smug" || f === "sad") ? "blink" : f);
    const flame = (x: number, y: number, z: number, sz: number, k: number, grow = 1) => { if (grow <= 0) return; const ph = Math.floor(t * 10 + k * 1.7); this.put(flameTex((ph + k) % 3), x, y + sz * 0.72 * grow, z, sz * grow * (1 + 0.06 * Math.sin(t * 17 + k)), sz * 1.5 * grow, { glow: 2.3 }); };
    const smoke = (x: number, y: number, z: number, k: number, col = "#3d3442", rise = 9) => { const u = (t * 0.35 + k * 0.37) % 1; this.put(puffTex("s" + col, col, null), x + Math.sin(k * 3 + u * 4) * 1.2, y + u * rise, z, 2 + u * 4, 2 + u * 4); };
    const steam = (x: number, y: number, z: number, k: number, sz = 1, sp = 0.6) => { const u = (t * sp + k * 0.31) % 1; this.put(puffTex("steam", "#f4f6fa", "#b9c4d6"), x + Math.sin(k * 5 + u * 3) * 0.5 * sz, y + u * 3.2 * sz, z, (0.8 + u * 1.4) * sz, (0.8 + u * 1.4) * sz); };
    const walk = (ph: number) => ({ step: Math.sin(ph * Math.PI * 2), bob: Math.abs(Math.sin(ph * Math.PI * 2)) * 0.07 });
    const tourists = (looking: boolean) => { const P: [number, number][] = [[-3.4, 9.4], [-1.6, 8.6], [1.9, 9.0], [3.6, 10.2]];
      this.tourists.forEach((a, i) => a.set(P[i][0], P[i][1], { face: face(i, i === 2 ? "happy" : "flat"), prop: i % 2 ? null : "phone", aR: i % 2 ? 12 : 60, eR: i % 2 ? 0 : 100, look: looking ? 0 : (i < 2 ? 1 : -1) }, { flip: i > 1 })); };

    switch (id) {
      case 1: tourists(true); this.put(crowTex(false), 0.2, by + 8.05, 0.2, 0.9, 0.9); break;
      case 2: {
        const up = eo(t, T.hookBucket - 0.1, T.hookBucket + 0.2), thr = ss(t, T.hookSplash - 0.12, T.hookSplash + 0.08);
        this.guards[0].set(1.4, 9.5, { face: thr > 0.5 ? "strain" : face(0, "flat"), prop: thr > 0.6 ? "bucket" : "bucketFull", aR: 20 + 70 * up + 60 * thr, eR: 30 * up - 60 * thr, aL: 14 }, { tilt: -0.12 * thr });
        if (t > T.hookSplash) { const u = eo(t, T.hookSplash, T.hookSplash + 0.5); this.put(splashTex(), 1.4 - 1.8 * u, 2.2 + 1.2 * u - 2.4 * u * u, 9.4 - 1.5 * u, 1.2 + 2.4 * u, 1.2 + 2.4 * u, { rot: 0.5 }); }
        break;
      }
      case 3: case 4: {
        this.motorin.set(-4.6, 8.8, { face: face(1, t > 9.3 ? "happy" : "smug"), aL: id === 4 && t > 9.3 ? 150 : 14, eL: id === 4 && t > 9.3 ? -20 : 0, aR: 30, eR: 100 }, { flip: true });
        this.crafts[0].set(3.2, 8.2, { face: face(2, "flat"), prop: "hammer", aR: 30, eR: 60 }); this.crafts[1].set(5.0, 9.3, { face: face(3, "flat") }, { flip: true });
        break;
      }
      case 5: {
        const rows = [7, 7, 6, 6, 5, 4, 3, 2]; let k = 0;
        rows.forEach((nr, r) => { for (let i = 0; i < nr; i++, k++) { const m = this.elephants[k], pop = eo(t, 10.62 + k * 0.012, 10.8 + k * 0.012);
          m.visible = pop > 0; m.position.set(-21 + (i - (nr - 1) / 2) * 1.42, 0.58 + r * 0.98 * pop, 0.2 - r * 0.02); m.scale.set((k % 2 ? -1 : 1) * pop, pop, 1);
          (m.material as THREE.MeshBasicMaterial).map = elephantTex(((fr + k * 13) % 50) < 4); m.rotation.set(0, Math.atan2(cam.position.x - m.position.x, cam.position.z - m.position.z), 0); } });
        this.motorin.set(-4.6, 8.8, { face: "smug" }, { flip: true });
        break;
      }
      case 6: {
        const tap = (k: number) => { const u = (t * 2.6 + k * 0.5) % 1; return u < 0.5 ? u * 2 : 1 - (u - 0.5) * 2; };
        this.crafts[0].set(-1.4, 4.0, { face: face(2, "flat"), prop: "hammer", aR: 40 + 60 * tap(0), eR: 70 - 30 * tap(0), aL: 30, eL: 60 }, { y: -PITD });
        this.crafts[1].set(1.5, 3.9, { face: face(3, "flat"), prop: "hammer", aR: 40 + 60 * tap(1), eR: 70 - 30 * tap(1) }, { y: -PITD, flip: true });
        for (const k of [0, 1]) { const u = (t * 2.6 + k * 0.5) % 1; if (u < 0.22 && t > 12.3) this.put(burstTex(), k ? 1.0 : -0.9, 0.45, 3.55, 0.55, 0.55, { rot: fr }); }
        this.motorin.set(2.3, 8.6, { face: blink(1) || (t % 2.2) < 0.9 ? "blink" : "flat", aL: 30, eL: 110, aR: 30, eR: 110 }, { flip: true });
        if (t > 13.0 && t < 14.2) this.put(zzzTex(), 2.7, 2.25 + 0.2 * Math.sin(t * 3), 8.6, 0.7, 0.35);
        break;
      }
      case 7: case 8: case 9: case 10: {
        const g7 = eo(t, T.fire - 0.5, T.fire + 0.9);
        this.houses.forEach(([x, , z], i) => { if (id >= 10 && i % 2) return; flame(x - 1.6, 3.4, z, 6 + (i % 3) * 1.5, i, id === 7 ? g7 * (i < 7 ? 1 : 0.6) : 1); flame(x + 2, 4.2, z + 1, 3.2, i + 9, id === 7 ? g7 : 1); smoke(x, 8, z, i); smoke(x + 1, 6, z - 1, i + 5.5); });
        const sg = id === 7 ? 0 : id === 8 ? eo(t, T.scaffoldFire, T.scaffoldFire + 1.0) : id === 9 ? 1 - 0.85 * ss(t, T.throw + 0.25, 25.2) : 0;
        const C = 5.6;
        ([[C, 9, C], [-C, 9, C], [C, 9, -C], [-C, 9, -C], [0, 9, C], [C, 5.2, 0], [-C, 5.2, 0], [0, 12, 0], [C, 3, C], [-C, 3.5, C], [2.8, 10.6, 2.8], [-2.8, 10.6, 2.8], [0, 5.2, C]] as V3[])
          .forEach(([x, y, z], i) => flame(x, y - (camO ? 0 : 0.4), z, 1.9 + (i % 3) * 0.5, i + 20, sg * clamp01((t - T.scaffoldFire) * 3 - i * 0.12 + (id > 8 ? 9 : 0))));
        if (id === 8) for (let i = 0; i < 4; i++) smoke(Math.sin(i * 2) * 3, 11, Math.cos(i * 2) * 3, i + 30);
        if (id === 9) {
          const run = t < 23.95;
          this.guards.forEach((a, i) => {
            if (run) { const x = lerp(9.8, 3.2, ss(t, 22.2, 24.1)) + i * 1.05, w = walk(t * 3.1 + i * 0.3); if (i < 3) a.set(x, 9.6 + (i % 2) * 0.4, { face: "shock", prop: "bucketFull", aR: 40, eR: 50, aL: 40 + 30 * w.step, step: w.step }, { bob: w.bob, tilt: 0.1 }); }
            else { const side = i < 2 ? -1 : 1, x = [-2.3, -1.0, 1.0, 2.3][i], z = 7.4 + (i % 2) * 0.5, tt = T.throw + i * 0.13, thr = ss(t, tt - 0.1, tt + 0.12);
              a.set(x, z, { face: thr > 0.3 ? "strain" : "shock", prop: thr > 0.5 ? "bucket" : "bucketFull", aR: 30 + 120 * thr, eR: 60 - 80 * thr, aL: 20 }, { flip: side < 0, tilt: -side * 0.1 * thr });
              if (t > tt) { const u = clamp01((t - tt) / 0.35); if (u < 1) this.put(splashTex(), lerp(x, x * 0.6, u), 2.6 + 3.4 * u - 3 * u * u, lerp(z - 0.3, 3.5, u), 1.2 + 1.8 * u, 1.2 + 1.8 * u, { rot: -side * (0.4 + u) }); }
            }
          });
          if (t > T.throw + 0.3) for (let i = 0; i < 9; i++) steam(Math.sin(i * 0.9 - 0.5) * 3.2, 1.6 + (i % 3) * 1.2, Math.cos(i * 0.9 - 0.5) * 3.2 + 0.3, i, 1.7 * eo(t, T.throw + 0.3, T.throw + 0.8), 0.9);
        }
        if (id === 10) {
          for (let i = 0; i < 6; i++) steam(Math.sin(i * 0.8 + 0.2) * 3.2, 1.2 + (i % 3) * 1.3, Math.cos(i * 0.8 + 0.2) * 3.2 + 0.2, i, 1.3 * (1 - 0.5 * ss(t, 27, 29)), 0.7);
          const bu = (t - T.crack) * FPS; if (bu >= 0 && bu < 5) this.put(burstTex(), 3.6, 1.2, 2.9, 2.2 + bu * 0.5, 2.2 + bu * 0.5, { rot: bu * 0.4, glow: 1.4 });
          const d = t - T.thud; if (d >= 0 && d < 0.9) for (let i = 0; i < 5; i++) this.put(puffTex("dust", "#cdb89a", "#8a7358"), 4.6 + Math.sin(i * 1.4) * (1 + d * 3), -0.5 + d * 1.6 + (i % 2) * 0.3, 3.6 + Math.cos(i * 1.4) * (1 + d * 3), 1 + d * 1.6, 1 + d * 1.6);
        }
        break;
      }
      case 11: case 12: {
        this.guards.forEach((a, i) => a.set(-2.6 + i * 1.75, 8.8 + (i % 2) * 0.35, id === 11
          ? { face: face(i, i === 1 ? "happy" : "smug"), prop: "bucket", aR: 14, aL: i === 2 ? 150 : 14, eL: i === 2 ? -30 : 0 }
          : { face: t > 32.3 ? face(i, "sad") : "flat", prop: "bucket", aR: 14, look: 1 }, { flip: i > 1 }));
        for (let i = 0; i < 4; i++) steam(Math.sin(i * 1.5) * 2.6, 3 + i * 0.6, Math.cos(i * 1.5) * 2.6, i, 1.2, 0.35);
        if (id === 12) this.motorin.set(8.6, 6.4, { face: t > 32.6 ? "sad" : "shock", aL: t > 32.6 ? 150 : 60, eL: t > 32.6 ? -140 : 40, aR: 60, eR: 40 }, { flip: true });
        break;
      }
      case 13: {
        const hot = 1 - ss(t, 38.9, T.burst), burst = t >= T.burst, lvl = clamp01((t - T.pour - 0.25) / 3.2), d = t - T.burst;
        const jx = lerp(9, 1.75, eo(t, 33.7, 34.5)), tilt = 1.15 * ss(t, T.pour - 0.5, T.pour) * (1 - ss(t, 39.1, 39.5));
        this.jug.position.set(jx, 7.9, 0); this.jug.rotation.z = tilt; this.jug.visible = true;
        this.glass.visible = !burst; this.glassMat.emissive.setRGB(1, 0.2, 0.03); this.glassMat.emissiveIntensity = burst ? 0 : (0.55 + 0.2 * Math.sin(t * 9)) * hot;
        this.glassMat.opacity = 0.62;
        this.water.visible = lvl > 0 && !burst; this.water.scale.y = Math.max(0.02, lvl * 1.65); this.water.position.y = 4.1 + lvl * 1.65 / 2;
        const pouring = t > T.pour && t < 39.2;
        this.stream.visible = pouring; if (pouring) { const top = V(jx - 1.7, 7.75, 0), bot = V(0.05, 4.2 + lvl * 1.6, 0), dv = top.clone().sub(bot); this.stream.position.copy(bot).addScaledVector(dv, 0.5); this.stream.scale.set(1, dv.length(), 1); this.stream.quaternion.setFromUnitVectors(V(0, 1, 0), dv.normalize()); }
        this.shards.forEach((sh, i) => { sh.visible = burst; if (burst) { const a = (i + 0.5) / 7 * 6.283, u = eo(t, T.burst, T.burst + 0.45), fall = Math.min(1, d * 1.6) ** 2; sh.position.set(Math.sin(a) * u * 2.6, 5 + u * 0.9 - fall * 1.6, Math.cos(a) * u * 1.6); sh.rotation.set(Math.cos(a) * u * 1.2, 0, -Math.sin(a) * u * 1.3); } });
        this.spill.visible = burst; if (burst) this.spill.scale.set(1 + 3.2 * eo(t, T.burst, T.burst + 0.6), 1, 1 + 2 * eo(t, T.burst, T.burst + 0.6));
        if (!burst) for (let i = 0; i < 3; i++) steam(KX + (i - 1) * 0.5, 6.1, 0.1, i, 0.75 * (0.4 + 0.6 * hot), 0.5);
        if (burst && d * FPS < 6) this.put(burstTex(), KX, 5.2, 0.9, 3 + d * 20, 3 + d * 20, { rot: d * 9, glow: 1.3 });
        this.cook.set(KX - 1.7, -5.7, { face: burst ? "shock" : face(5, t > T.cold ? "smug" : "flat"), look: 1 });
        break;
      }
      case 14: {
        this.motorin.set(7.6, 7.4, { face: face(1, "sad"), aL: 150, eL: -140, aR: 14 }, { flip: true });
        break;
      }
      case 15: {
        this.put(crowTex(((t * 2) % 1) < 0.3), 0.2, by + 6.75, 0.2, 0.9, 0.9);
        break;
      }
      case 16: {
        const snapped = t >= T.snap, pull = 0.5 + 0.5 * Math.sin(t * 7), d = t - T.snap;
        this.napoleon.set(0.3, 12.8, { face: snapped ? (d > 0.5 ? "sad" : "shock") : face(6, "flat"), aR: 20, eR: 130, aL: snapped ? 14 : 100, eL: snapped ? 0 : -30 });
        const GP: [number, number][] = [[-2.5, 10.2], [-1.6, 11.4], [-2.7, 12.6]];
        const hand = V(-2.5, 1.25, 10.25), top = V(0, by + 5.9, 0);
        this.grens.forEach((a, i) => { const fall = snapped ? eo(t, T.snap, T.snap + 0.35) : 0;
          a.set(GP[i][0] - fall * 0.5 - (snapped ? 0 : 0.05 * pull), GP[i][1] + fall * 0.5, { face: snapped ? "shock" : "strain", aL: 80, eL: 20, aR: 80, eR: 20, step: snapped ? 0 : (i % 2 ? 1 : -1) * pull }, { tilt: snapped ? 0.2 + fall * 1.25 : 0.2 + 0.05 * pull, y: fall * 0.3 }); });
        this.rope.visible = true; const sl = eo(t, T.snap, T.snap + 0.3), end = snapped ? V(-2.5 - 0.6 * sl, lerp(1.25, 0.12, sl), 10.25 + sl) : hand, a0 = snapped ? V(-1.0 * sl, lerp(by + 5.9, 0.12, sl), 6.6 * sl) : top, dv = end.clone().sub(a0);
        this.rope.position.copy(a0).addScaledVector(dv, 0.5); this.rope.scale.set(1, dv.length(), 1); this.rope.quaternion.setFromUnitVectors(V(0, 1, 0), dv.normalize());
        if (snapped && d * FPS < 5) this.put(burstTex(), -1.2, 3.6, 5, 1.8, 1.8, { rot: d * 20 });
        this.put(crowTex(false), 0.2, by + 6.75, 0.2, 0.9, 0.9);
        break;
      }
      case 17: {
        this.ropes.forEach((r, i) => { const a = (i / 4) * 6.283 + 0.78, b = V(Math.sin(a) * 0.5, by + 5.9, Math.cos(a) * 0.5), top = V(0, 12.2, 0), dv = top.clone().sub(b); r.visible = t < T.land + 0.6; r.position.copy(b).addScaledVector(dv, 0.5); r.scale.set(1, dv.length(), 1); r.quaternion.setFromUnitVectors(V(0, 1, 0), dv.normalize()); });
        const pull = Math.sin(t * 8) * (t < T.land ? 1 : 0);
        this.crafts.forEach((a, i) => a.set(i ? 8.6 : -8.4, 7.4 + i, { face: t < T.land ? "strain" : "happy", aL: t < T.land ? 150 + 20 * pull : 160, aR: t < T.land ? 150 - 20 * pull : 160, eL: -20, eR: -20 }, { flip: !i, tilt: (i ? -1 : 1) * 0.12 * (t < T.land ? 1 : 0) }));
        const d = t - T.land; if (d >= 0 && d < 0.9) for (let i = 0; i < 8; i++) this.put(puffTex("dust", "#cdb89a", "#8a7358"), Math.sin(i * 0.8) * (4.6 + d * 4), 0.6 + d * 1.5, Math.cos(i * 0.8) * (4.6 + d * 4), 1.2 + d * 2, 1.2 + d * 2);
        break;
      }
      case 18: case 19: {
        tourists(t < 54.6);
        const caw = id === 18 && t > T.crow && t < 54.6 && ((t * 3) % 1) < 0.5;
        this.put(crowTex(caw), 0.2, by + 8.05, 0.2, 0.9, 0.9);
        if (id === 19) { const k = ss(t, T.knock - 0.25, T.knock) * (1 - ss(t, T.knock + 0.1, T.knock + 0.4)); this.tourists[2].set(2.6 + 0.9 * 0, 6.3, { face: t > T.knock + 0.3 ? "flat" : "happy", aR: 60 + 50 * k, eR: 60, look: 0 }, { flip: true }); }
        break;
      }
    }
    // billboards
    for (const a of this.actors) if (a.group.visible) a.face(cam);
    for (let i = 0; i < this.fxN; i++) { const m = this.fx[i]; m.quaternion.copy(cam.quaternion); m.rotateZ(m.userData.rot); }
    return focus;
  }
}
