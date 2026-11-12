// The paddock of the Emu War short + per-frame posing. Two places in one world:
//   "farm" = wheat paddock behind a wire fence, homestead, dirt road (x from -170 to 170),
//   "pond" = the farm dam of the ambush, built far away at x = PX so the haze hides one from the other.
import * as THREE from "three";
import { TONE, CHAR, untone } from "./shade";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { NOINK } from "./ink";
import { cloudHD } from "./paint";
import { Actor, Look, Pose, Face, fxCard, drawTex, drawHat, puffTex, burstTex, tracerTex, streakTex, bangTex, springTex, caseTex, splinterTex } from "./chars";
import { Emu, EmuPose, EFace, crowdTex } from "./emu";
import { V, lam, mk, buildGround, buildWheat, buildFence, buildHouse, buildWindmill, buildGum, buildBush, buildGun, buildTruck, buildCrate, buildCartridge, buildPond, buildBoard } from "./set";
import { FPS, SHOTS, T, PX, V3, Cam, camAt, shotAt, ss, eo, pop, lerp, clamp01, emuX, truckX, leaveX, bumpTimes } from "./story";

// ---- cast ----
const SKIN = ["#f6d7b4", "#eec39a", "#f9e0c4", "#d9a878", "#f2cba6"];
const KHAKI = "#b3a064", HATK = "#93834c";
const GUNNER: Look = { id: "gunner", skin: SKIN[0], body: KHAKI, hat: "slouch", hatCol: HATK, belts: "#e6dfbc", hair: "#6a4a2c" };
const MATE: Look = { id: "mate", skin: SKIN[3], body: KHAKI, hat: "slouch", hatCol: HATK, belts: "#e6dfbc", hair: "#2e2420" };
const MAJOR: Look = { id: "major", skin: SKIN[2], body: "#a8935a", hat: "slouch", hatCol: HATK, strap: "#7a4a26", mustache: "#7a4f2a", tabs: "#c8383a", epaulettes: true, coat: true, hair: "#7a4f2a" };
const FARMER1: Look = { id: "farmer1", skin: SKIN[1], body: "#c9553f", hat: "slouch", hatCol: "#8c7a52", apron: "#4f6fa3", beard: "#b06a2c", hair: "#b06a2c" };
const FARMER2: Look = { id: "farmer2", skin: SKIN[4], body: "#6f9f78", hat: "straw", hatCol: "#e6c878", apron: "#7b5234", hair: "#3a2c28" };

const hatTex = () => drawTex("hatfly", 480, 240, (g) => { g.translate(-56, -92); drawHat(g, { id: "h", skin: "#fff", body: "#fff", hat: "slouch", hatCol: HATK }); });
const sunTex = () => drawTex("sunglow", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 6, 128, 128, 126); gr.addColorStop(0, "rgba(255,246,214,1)"); gr.addColorStop(0.16, "rgba(255,226,160,0.95)"); gr.addColorStop(0.4, "rgba(255,190,120,0.35)"); gr.addColorStop(1, "rgba(255,170,110,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});

const featherTex = () => drawTex("feather", 96, 192, (g) => {
  g.strokeStyle = "#241726"; g.lineWidth = 7; g.lineJoin = "round"; g.fillStyle = "#806850";
  g.beginPath(); g.moveTo(48, 8); g.bezierCurveTo(88, 50, 84, 130, 50, 176); g.bezierCurveTo(14, 130, 10, 50, 48, 8); g.closePath(); g.fill(); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.moveTo(48, 20); g.lineTo(50, 188); g.stroke();
});

// geography of the shooting: the flock stands in front of the wheat, the gun on open ground aims at it
const F: [number, number] = [2, -1.5], GUN: [number, number] = [6.7, 7.3], DIR: [number, number] = [-0.472, -0.882], GYAW = 2.062;
const FLOCK: [number, number][] = [[2.0, -1.2], [0.55, -2.5], [3.6, -2.9], [-0.6, -4.6], [4.6, -5.0], [2.6, -5.6], [5.4, -0.9], [-1.4, -0.8], [0.9, 0.9], [3.3, 0.6], [-2.6, -3.0], [6.2, -3.6], [1.4, -4.0], [-0.2, 1.8]];
// where the bullets land: between the birds
const MISS: V3[] = [[1.2, 0, 0.5], [2.9, 0, -0.1], [0.2, 0, -1.3], [3.3, 0, -1.9], [1.3, 0, -3.3], [4.3, 0, -3.7], [-0.7, 0, -2.6], [2.3, 0, 1.5]];
const AWAY: V3[] = [0, 1, 2, 3, 4].map((k) => [GUN[0] + DIR[0] * 14 + (k - 2) * 0.9, 0, GUN[1] + DIR[1] * 14 + (k - 2) * 0.5] as V3);
const ridgeY = (x: number, z: number) => Math.max(0, -3 + 10 * Math.sqrt(Math.max(0, 1 - (x / 330) ** 2 - ((z + 150) / 46) ** 2)));
/** sun azimuth / elevation overrides per shot (camera-relative, see lights.ts) */
const SUN: Record<number, [number, number]> = { 11: [124, 46], 14: [60, 55], 26: [128, 11], 27: [146, 17] };

export class World {
  root = new THREE.Group();
  private sky!: THREE.Mesh; private skyMat!: THREE.ShaderMaterial; private fog = new THREE.Fog("#bccbec", 25, 420);
  private hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1); private sun = new THREE.DirectionalLight("#fff0d6", 2.6);
  private clouds: THREE.Mesh[] = []; private sunCard!: THREE.Mesh;
  private wheel!: THREE.Group; private gap!: { gposts: THREE.Group[]; gwires: THREE.Group[] }; private hide: THREE.Group[] = [];
  private truck = buildTruck(); private gunA = buildGun(); private gunB = buildGun(); private gunT = buildGun();
  private crates: THREE.Mesh[] = []; private rounds: THREE.Group[] = []; private board = buildBoard(); private strips: THREE.Mesh[] = [];
  private fx: THREE.Mesh[] = []; private fxN = 0;
  private gunner = new Actor(GUNNER); private mate = new Actor(MATE, 1.7); private major = new Actor(MAJOR, 1.8);
  private farmer1 = new Actor(FARMER1); private farmer2 = new Actor(FARMER2, 1.68); private actors: Actor[];
  private emus: Emu[] = []; private lead = new Emu(2.02, [0.9, 0.88, 0.9], true);
  private sunDirs = new Map<number, THREE.Vector3>(); private bt = bumpTimes();
  private pa = V(); private pb = V();

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
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudHD(i % 4, LOOK.day.cloud), color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const a = i * 0.785 + 0.3, d = 430 + (i % 3) * 90; m.position.set(Math.sin(a) * d, 120 + (i % 4) * 38, -Math.cos(a) * d); m.scale.set(210 + (i % 3) * 60, 90 + (i % 2) * 30, 1);
      m.layers.set(NOINK); m.frustumCulled = false; this.clouds.push(m); R.add(m);
    }
    this.sunCard = fxCard(sunTex(), 1, 1, 1.6, true); this.sunCard.renderOrder = -0.5; R.add(this.sunCard);

    // ---------- the set ----------
    buildGround(R); buildWheat(R); this.gap = buildFence(R);
    const house = buildHouse(); house.position.set(-27, 0, 3); house.rotation.y = 0.45; R.add(house);
    const wm = buildWindmill(); wm.group.position.set(-18.5, 0, -3.2); wm.group.rotation.y = 0.3; wm.group.scale.setScalar(0.8); R.add(wm.group); this.wheel = wm.wheel;
    ([[-37, -3, 1.25], [-23, 13.5, 1.0], [24, 4.5, 1.15], [38, -2.5, 1.0], [-46, 22, 1.3], [60, 31, 1.2], [96, -3.5, 1.1], [150, 31, 1.2], [-70, 6, 1.1], [18, 31, 1.3], [-12, 40, 1.2]] as V3[])
      .forEach(([x, z, s], i) => { const g = buildGum(i + 1, s); g.position.set(x, 0, z); R.add(g); });
    ([[-33, 9], [-20, -4.5], [31, 6], [-5, 28], [-55, 12], [22, 30], [70, 30], [110, 31]] as [number, number][])
      .forEach(([x, z], i) => { const g = buildBush(i + 1); g.position.set(x, 0, z); R.add(g); });
    // the bumps the truck meets on the road, exactly where its wheels are at each bump time
    const mound = lam({ color: "#b96d40" });
    for (const tb of this.bt) for (const dz of [-0.92, 0.92]) { const b = mk(new THREE.SphereGeometry(0.62, 10, 6), mound, truckX(tb) + 1.6, -0.02, 15 + dz, R); b.scale.set(1.25, 0.42, 0.9); b.castShadow = false; }
    // the dam
    const pond = buildPond(10); pond.position.set(PX, 0, -14); R.add(pond);
    ([[PX - 1.7, 4.3], [PX + 0.1, 4.0], [PX + 2.4, 4.4], [PX - 3.6, 5.2], [PX + 4.3, 5.0]] as [number, number][]).forEach(([x, z], i) => { const g = buildBush(i + 20); g.position.set(x, 0, z); g.scale.setScalar(1.25); R.add(g); if (i < 3) this.hide.push(g); });
    ([[PX - 17, -6, 1.2], [PX + 16, -24, 1.1], [PX - 8, -34, 1.3], [PX + 22, 8, 1.2], [PX - 20, 12, 1.1]] as V3[]).forEach(([x, z, s], i) => { const g = buildGum(i + 30, s); g.position.set(x, 0, z); R.add(g); });
    // props
    this.board.group.position.set(10, 0, 11.5); this.board.group.scale.setScalar(0.72); R.add(this.board.group);
    R.add(this.truck.group, this.gunA.group, this.gunB.group);
    this.gunT.legs.visible = false; this.gunT.group.position.copy(this.truck.mount).add(V(0, -1.08, 0)); this.truck.body.add(this.gunT.group);
    for (let i = 0; i < 15; i++) { const c = buildCrate(); R.add(c); this.crates.push(c); }
    for (let i = 0; i < 10; i++) { const c = buildCartridge(); R.add(c); this.rounds.push(c); }
    for (let i = 0; i < 5; i++) {
      const tx = crowdTex().clone(); tx.repeat.set(12, 1); tx.needsUpdate = true;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(560, 3.4), new THREE.MeshBasicMaterial({ map: tx, alphaTest: 0.5, color: new THREE.Color(0.75, 0.7, 0.68) }));
      m.layers.set(NOINK); m.visible = false; R.add(m); this.strips.push(m);
    }
    // ---------- cards ----------
    const tints: [number, number, number][] = [[1, 1, 1], [0.92, 0.9, 0.87], [1.06, 1.0, 0.94], [0.86, 0.85, 0.84], [1.0, 0.95, 0.88]];
    for (let i = 0; i < 72; i++) { const e = new Emu(1.66 + ((i * 7) % 5) * 0.06, tints[i % 5]); R.add(e.group); this.emus.push(e); }
    R.add(this.lead.group);
    for (let i = 0; i < 170; i++) { const m = fxCard(burstTex(), 1, 1); R.add(m); this.fx.push(m); }
    this.actors = [this.gunner, this.mate, this.major, this.farmer1, this.farmer2];
    for (const a of this.actors) R.add(a.group);
  }

  private shotSun(id: number, L: LightPreset) {
    let d = this.sunDirs.get(id);
    if (!d) {
      const s = SHOTS[id - 1], c = camAt(id, s.a + 0.01), f = V(c.look[0] - c.pos[0], 0, c.look[2] - c.pos[2]).normalize(), r = V(-f.z, 0, f.x);
      const az = THREE.MathUtils.degToRad(SUN[id]?.[0] ?? L.az), el = THREE.MathUtils.degToRad(SUN[id]?.[1] ?? L.el);
      d = f.multiplyScalar(Math.cos(az)).addScaledVector(r, Math.sin(az)).multiplyScalar(Math.cos(el)); d.y = Math.sin(el); d.normalize();
      this.sunDirs.set(id, d);
    }
    return d;
  }

  /** effect card: texture at a world position, w x h metres, facing the camera */
  private put(t: THREE.Texture, x: number, y: number, z: number, w: number, h: number, o: { glow?: number; rot?: number } = {}) {
    const m = this.fx[this.fxN++]; if (!m) return;
    const mat = m.material as THREE.MeshBasicMaterial;
    mat.map = t; mat.color.setScalar(o.glow ?? 1); m.visible = true; m.position.set(x, y, z); m.scale.set(w, h, 1); m.userData.rot = o.rot ?? 0;
  }

  update(tSec: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, pxScale: number, camO?: Cam) {
    const t = tSec, s = shotAt(t), id = s.id, L = LIGHTS[s.light], K = LOOK[s.light];
    const c = camO ?? camAt(id, t);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert(); cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    const right = V(1, 0, 0).applyQuaternion(cam.quaternion);
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
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) { m.lookAt(cam.position.x, m.position.y, cam.position.z); const mm = m.material as THREE.MeshBasicMaterial; mm.map = cloudHD(this.clouds.indexOf(m) % 4, K.cloud); mm.color.setScalar(s.light === "golden" ? 1.0 : 1.1); }
    this.sunCard.visible = false;
    if (this.sunCard.visible) { this.sunCard.position.copy(cam.position).addScaledVector(sunDir, 900); this.sunCard.scale.set(260, 260, 1); this.sunCard.quaternion.copy(cam.quaternion); }

    // ---- reset ----
    for (let i = 0; i < this.fxN; i++) this.fx[i].visible = false; this.fxN = 0;
    for (const a of this.actors) a.group.visible = false;
    for (const m of this.emus) m.group.visible = false; this.lead.group.visible = false;
    for (const m of this.crates) m.visible = false; for (const m of this.rounds) m.visible = false; for (const m of this.strips) m.visible = false;
    this.truck.group.visible = false; this.gunA.group.visible = false; this.gunB.group.visible = false; this.board.group.visible = id === 27;
    for (const g of [this.gunA, this.gunB, this.gunT]) { g.head.rotation.set(0, 0, 0); g.head.position.x = 0; }
    this.wheel.rotation.z = -t * 1.3;
    const broken = (id === 9 && t >= T.fence) || (id > 9 && id < 26);
    const brk = id === 9 ? eo(t, T.fence, T.fence + 0.3) : broken ? 1 : 0, swing = id === 9 && t > T.fence ? 0.25 * Math.sin((t - T.fence) * 14) * Math.exp(-(t - T.fence) * 3) : 0;
    const fly = id === 9 ? clamp01((t - T.fence) / 0.62) : broken ? 1 : 0; // the middle post is knocked out and lands in front
    this.gap.gposts.forEach((p, i) => {
      if (i === 1) { p.position.set(0.3 * fly, 5.2 * fly * (1 - fly), 2.4 * fly); p.rotation.set(Math.PI * 2.5 * fly, 0, 0.5 * Math.sin(fly * Math.PI)); }
      else { p.rotation.x = 0.3 * brk; p.rotation.z = (i - 1) * -0.32 * brk; }
    });
    this.gap.gwires.forEach((w, i) => { w.rotation.z = (i % 2 ? 1 : -1) * (1.05 + 0.1 * (i % 3)) * brk + swing; });
    for (const b of this.hide) b.visible = id !== 16;

    // ---- helpers ----
    const fr = Math.floor(t * FPS + 1e-6), E = this.emus;
    const blink = (k: number) => ((fr + k * 37) % (52 + (k % 5) * 9)) < 4;
    const pf = (k: number, f: Face): Face => (blink(k) && (f === "flat" || f === "smug" || f === "sad" || f === "happy") ? "blink" : f);
    const ef = (k: number, f: EFace = "flat"): EFace => (blink(k + 3) && f !== "wide" ? "blink" : f);
    const flipFor = (vx: number, vz: number) => vx * right.x + vz * right.z < 0;
    const ang = (a: THREE.Vector3, b: THREE.Vector3) => { this.pa.copy(a).project(cam); this.pb.copy(b).project(cam); return Math.atan2((this.pb.y - this.pa.y) * 1920, (this.pb.x - this.pa.x) * 1080); };
    const dustT = puffTex("dust", "#f0d6ae", "#b98a62"), smokeT = puffTex("smoke", "#d9d6dc", "#8f8a98");
    const dust = (x: number, y: number, z: number, sz: number, k = 0) => this.put(dustT, x, y, z, sz, sz, { rot: k });
    /** head goes down to the ground and comes back: 0..1 cycle -> neck value */
    const peck = (k: number, lo = 3.9, sp = 0.45) => { const u = (t * sp + k * 0.37) % 1; return u < 0.2 ? lerp(1, lo, ss(u, 0, 0.2)) : u < 0.55 ? lo + 0.12 * Math.sin(t * 22 + k) : u < 0.75 ? lerp(lo, 1, ss(u, 0.55, 0.75)) : 1; };
    const runPose = (k: number, face: EFace = "flat"): EmuPose => ({ n: 2, gait: "run", ph: t * 4.3 + k * 0.31, face });
    const runBob = (k: number) => 0.07 * Math.abs(Math.sin((t * 4.3 + k * 0.31) * Math.PI * 2));
    const walkPose = (k: number, sp = 1.7, n = 1.15): EmuPose => ({ n: n + 0.12 * Math.sin((t * sp + k * 0.29) * Math.PI * 4), gait: "walk", ph: t * sp + k * 0.29, face: ef(k) });
    /** gun fire: flash, tracers into the dirt, dust where they land, flying cases; returns true while the gun speaks */
    const fire = (gun: { group: THREE.Group; head: THREE.Group; muzzle: THREE.Vector3 }, bursts: [number, number][], targets: V3[]) => {
      gun.group.updateWorldMatrix(true, true);
      const mz = gun.head.localToWorld(gun.muzzle.clone()), hw = gun.head.localToWorld(V()), on = bursts.some(([a, b]) => t >= a && t < b);
      if (on) { gun.head.position.x = fr % 2 ? -0.07 : 0; if (fr % 2 === 0) this.put(burstTex(), mz.x, mz.y, mz.z, 0.95, 0.95, { rot: fr * 1.3, glow: 1.5 }); }
      for (let k = 0; k < 8; k++) {
        const n = Math.floor(t * 15 + 1e-6) - k, tk = n / 15;
        if (!bursts.some(([a, b]) => tk >= a && tk < b)) continue;
        const tg = targets[((n * 7) % targets.length + targets.length) % targets.length], u = (t - tk) / 0.15, q = V(tg[0], 0.05, tg[2]);
        if (u < 1) { const p = mz.clone().lerp(q, u); this.put(tracerTex(), p.x, p.y, p.z, 1.0, 0.25, { rot: ang(mz, q), glow: 1.3 }); }
        else if (u < 3.0) dust(q.x, 0.2 + 0.2 * (u - 1), q.z, 0.3 + 0.3 * (u - 1), n);
        const v = (t - tk) / 0.45; if (v < 1) this.put(caseTex(), hw.x + right.x * (0.3 + 1.3 * v), hw.y + 0.25 + 1.6 * v - 2.6 * v * v, hw.z + right.z * (0.3 + 1.3 * v), 0.09, 0.2, { rot: v * 9 + n });
      }
      return on;
    };
    const placeTruck = (x: number, z: number, heading: number, by = 0, pitch = 0, spin = 0) => {
      const g = this.truck; g.group.visible = true; g.group.position.set(x, 0, z); g.group.rotation.y = heading;
      g.body.position.y = by; g.body.rotation.z = pitch; for (const w of g.wheels) w.rotation.z = -spin;
    };
    /** stand an actor on the truck (local point of the sprung body) */
    const ride = (a: Actor, p: THREE.Vector3, pose: Pose, hopY = 0, o: { flip?: boolean; tilt?: number } = {}) => {
      this.truck.group.updateWorldMatrix(true, true);
      const w = this.truck.body.localToWorld(p.clone()); a.set(w.x, w.z, pose, { y: w.y + hopY, ...o });
    };
    const spring = (tt: number) => { let y = 0, p = 0; for (const tb of this.bt) { const d = tt - tb; if (d > 0 && d < 1.2) { const k = Math.exp(-d * 6.5); y += 0.2 * k * Math.sin(d * 24); p += 0.06 * k * Math.cos(d * 24); } } return [y, p]; };
    const hop = (tt: number, lag = 0) => { let h = 0; for (const tb of this.bt) { const u = (tt - tb - lag) / 0.33; if (u > 0 && u < 1) h = Math.max(h, 4 * u * (1 - u)); } return h; };
    const aim = (g: { group: THREE.Group }, x: number, z: number, yaw = Math.PI / 2) => { g.group.visible = true; g.group.position.set(x, 0, z); g.group.rotation.y = yaw; g.group.scale.setScalar(1); };

    const chew = (sp = 7) => [0, 1, 2, 1][Math.floor(t * sp) % 4];
    const gx = GUN[0] - DIR[0], gz = GUN[1] - DIR[1]; // the gunner stands behind the gun
    switch (id) {
      case 1: case 12: {
        // the army: one soldier hammering away with a Lewis gun
        const bursts: [number, number][] = id === 1 ? [[0.25, 1.25], [1.6, 2.5], [2.75, 3.3]] : [[23.25, 24.6]];
        aim(this.gunA, GUN[0], GUN[1], GYAW + 0.04 * Math.sin(t * 7));
        const on = fire(this.gunA, bursts, AWAY);
        this.gunner.set(gx, gz, { face: "strain", aR: 40, eR: -100, aL: 40, eL: -100 }, { bob: on && fr % 2 ? 0.025 : 0, tilt: on ? 0.015 * (fr % 2 ? 1 : -1) : 0 });
        break;
      }
      case 2: case 3: {
        // the enemy does not care
        aim(this.gunA, GUN[0], GUN[1], GYAW); if (id === 2) fire(this.gunA, [[3.25, 3.95], [4.15, 4.8]], MISS);
        const still = t > T.lost - 0.05 && t < T.lost + 0.3;
        E[0].set(FLOCK[0][0], FLOCK[0][1], { front: true, stalk: true, chew: still ? 0 : chew(), face: id === 3 && t > 5.85 && t < 6.0 ? "blink" : still ? "smug" : id === 2 ? ef(0) : "flat" });
        if (id === 2) for (let i = 1; i < 6; i++) { E[i].set(FLOCK[i][0], FLOCK[i][1], { n: i % 2 ? peck(i) : 1 + 0.1 * Math.sin(t * 1.3 + i), face: ef(i) }, { flip: i % 2 === 0 }); }
        break;
      }
      case 4: {
        this.farmer1.set(-12.2, 5.6, { face: pf(1, "happy"), aL: 42, eL: -118, aR: 42, eR: -118 });
        break;
      }
      case 5: case 6: {
        // the paddock fills up; then the farmer and who is standing behind him
        const cols = [6, 8, 10, 12, 12, 12]; let k = 0;
        cols.forEach((nc, r) => { for (let i = 0; i < nc; i++, k++) {
          const z0 = -9.6 - r * 4.6, x0 = -9.4 + (i - (nc - 1) / 2) * (1.9 + r * 0.25) + ((k * 13) % 7 - 3) * 0.14;
          const u = id === 5 ? eo(t, 9.6 + r * 0.1, 11.0 + r * 0.12) : 1, z = z0 - 40 * (1 - u), moving = u < 0.985;
          if (id === 6 && r === 0 && Math.abs(x0 + 9.4) < 2.4) continue;
          E[k].set(x0, z, moving ? walkPose(k, 2.4, 1.5) : { n: k % 3 ? 1.0 + 0.08 * Math.sin(t * 2 + k) : peck(k, 2.6), face: ef(k), stalk: k % 4 === 0 }, { flip: k % 2 === 0, y: ridgeY(x0, z), bob: moving ? 0.05 * Math.abs(Math.sin((t * 2.4 + k * 0.29) * Math.PI * 2)) : 0 });
        } });
        this.strips.forEach((m, i) => { const z = [-52, -74, -100, -118, -133][i], rise = id === 5 ? eo(t, 9.7 + i * 0.12, 10.9 + i * 0.15) : 1; m.visible = true; m.position.set(-9.4 + i * 3.1, Math.max(0, ridgeY(0, z)) + 1.5 - 3.6 * (1 - rise), z); });
        if (id === 6) {
          this.farmer1.set(-9.4, -4.6, { face: "shock", aL: 150, aR: 150, eL: -10, eR: -10 }, { bob: 0.012 * Math.sin(t * 46) });
          ([[-10.85, -8.5, 0], [-9.4, -9.4, 0.42], [-7.95, -8.6, 0]] as number[][]).forEach(([x, z, y], i) => E[60 + i].set(x, z, { front: true, stalk: i !== 1, chew: chew(6 + i), face: ef(i + 5) }, { y }));
        }
        break;
      }
      case 7: {
        // as tall as a man
        const cmp = ss(t, T.tall - 0.15, T.tall + 0.2) * (1 - ss(t, 13.6, 13.85));
        this.farmer1.set(-0.7, -3.2, { face: t > 13.5 ? pf(1, "sad") : pf(1, "flat"), look: t > 13.5 ? 0 : 1, aR: lerp(14, 158, cmp), eR: lerp(0, -70, cmp), aL: 14 });
        E[0].set(0.75, -3.3, { n: 0.45, face: ef(0) }, { flip: true });
        ([[-3.4, -10], [2.9, -11], [-0.2, -13.5], [5.2, -12.5]] as [number, number][]).forEach(([x, z], i) => E[1 + i].set(x, z, { n: peck(i, 2.62, 0.7), face: ef(i), stalk: i % 2 === 1 }, { flip: i % 2 === 0 }));
        break;
      }
      case 8: {
        // eating the crop
        ([[-1.05, -13.0, 0], [0.95, -13.9, 1], [-2.9, -16.4, 0], [2.7, -17, 1]] as number[][]).forEach(([x, z, fl], i) => E[i].set(x, z, { n: peck(i, 2.62, 1.1), face: ef(i), stalk: (t * 1.1 + i * 0.37) % 1 > 0.55 }, { flip: !!fl }));
        E[4].set(-0.1, -16.6, { front: true, stalk: true, chew: chew(), face: ef(4) });
        break;
      }
      case 9: {
        // three birds walk straight through the wire, beside the lens
        ([[4.3, -10.5, 6.6, 4.5], [6.2, -12.2, 8.4, 3.0], [5.2, -14.5, 2.9, 1.0]] as number[][]).forEach(([x0, z0, x1, z1], i) => {
          const u = clamp01((t - 14.7 - i * 0.12) / 1.7), x = lerp(x0, x1, u), z = lerp(z0, z1, u);
          E[i].set(x, z, u > 0 && u < 1 ? { n: 1.6, gait: "run", ph: t * 3.0 + i * 0.4, face: "flat" } : { n: 1, face: ef(i + 6) }, { flip: i === 2, bob: u > 0 && u < 1 ? runBob(i) * 0.6 : 0 });
        });
        ([[1.6, -13], [8.6, -15], [3.5, -19]] as [number, number][]).forEach(([x, z], i) => E[5 + i].set(x, z, { n: peck(i + 1, 2.62, 0.6), face: ef(i + 1), stalk: i % 2 === 0 }, { flip: i % 2 === 0 }));
        const d = t - T.fence; if (d >= 0 && d < 0.17) this.put(burstTex(), 5, 0.9, -6.4, 2.0 + d * 6, 2.0 + d * 6, { rot: d * 12 });
        if (d >= 0 && d < 0.7) for (let i = 0; i < 6; i++) { const a = -0.9 + i * 0.36; this.put(splinterTex(), 5 + Math.sin(a) * 4.2 * d, 0.9 + (3.4 + (i % 3)) * d - 6.5 * d * d, -6.3 + 1.6 * d, 0.2, 0.5, { rot: d * (9 + i * 2) * (i % 2 ? 1 : -1) }); }
        if (d >= 0 && d < 0.6) for (let i = 0; i < 3; i++) dust(3.9 + i * 1.1, 0.2 + d * 0.4, -6.1 + (i % 2) * 0.4, 0.35 + d * 0.5, i);
        break;
      }
      case 10: {
        this.farmer1.set(4.2, -2.2, { face: "angry", prop: "post", aR: 148 + 8 * Math.sin(t * 13), eR: -24, aL: 30, eL: 30 });
        this.farmer2.set(5.7, -2.4, { face: "angry", aL: 146 + 10 * Math.sin(t * 13 + 2), eL: -30, aR: 20 }, { flip: true });
        ([[1.4, -10], [8.9, -9.6], [5.4, -13.5], [3.6, -17], [10.6, -15]] as [number, number][]).forEach(([x, z], i) => E[i].set(x, z, { n: peck(i, 2.62, 0.7), face: ef(i), stalk: i % 2 === 1 }, { flip: i % 2 === 0 }));
        break;
      }
      case 11: {
        // the truck pulls up, then the list arrives item by item
        const arr = eo(t, 18.35, 18.85);
        placeTruck(lerp(-12, -3.0, arr), 9.4, -0.5, 0.03 * Math.sin(t * 40) * (1 - arr), 0, arr * 14);
        if (t < 19.2) for (let i = 0; i < 3; i++) dust(lerp(-12, -3.0, arr) - 2.8 - i * 0.9, 0.35 + (t - 18.35) * 0.5 + i * 0.1, 9.9 - i * 0.3, 0.6 + (t - 18.35) * 0.8, i);
        const pm = pop(t, T.major - 0.06), p1 = pop(t, T.two - 0.04), p2 = pop(t, T.two + 0.22);
        if (pm > 0) this.major.set(0, 14.5, { face: pf(2, "smug"), prop: "stick", aR: 34, eR: 62, aL: 14 }, { s: pm });
        const g1 = pop(t, T.guns - 0.02, 0.24), g2 = pop(t, T.guns + 0.2, 0.24);
        if (p1 > 0) this.gunner.set(-0.92, 14.1, g1 > 0 ? { face: pf(0, "flat"), prop: "lewis", aR: 30, eR: -120 } : { face: pf(0, "flat") }, { s: g1 > 0 ? 0.88 + 0.12 * g1 : p1 });
        if (p2 > 0) this.mate.set(0.92, 14.1, g2 > 0 ? { face: pf(3, "happy"), prop: "lewis", aR: 30, eR: -120 } : { face: pf(3, "happy") }, { s: g2 > 0 ? 0.88 + 0.12 * g2 : p2, flip: true });
        this.crates.forEach((c, i) => {
          const row = Math.floor(i / 3), col = i % 3, land = T.crates + 0.33 + row * 0.19, u = clamp01((t - land + 0.4) / 0.4);
          c.visible = t > land - 0.4; c.position.set((col - 1) * 1.04 + (row % 2 ? 0.05 : -0.05), 0.275 + row * 0.55 + 7 * (1 - u * u), 12.3); c.rotation.y = ((i * 7) % 5 - 2) * 0.03;
          const d = t - land; if (d >= 0 && d < 0.3 && row === 0) dust((col - 1) * 1.3, 0.25 + d * 0.6, 12.9, 0.5 + d * 1.2, i);
        });
        break;
      }
      case 13: {
        // the flock explodes outwards
        aim(this.gunA, GUN[0], GUN[1], GYAW + 0.3 * Math.sin(t * 6)); fire(this.gunA, [[24.5, 25.9]], MISS);
        for (let i = 0; i < FLOCK.length; i++) {
          const [x, z] = FLOCK[i], run = t - T.scatter - i * 0.012;
          if (run > 0) {
            const dx = x - F[0] + (i % 3 - 1) * 0.6 + (i === 9 ? 2.2 : 0), dz = z - F[1] + (i % 2 ? 0.8 : -0.8), l = Math.hypot(dx, dz) || 1, d = (13 * run * run) / (run + 0.2); // bird 9 would run through the lens
            const px = x + (dx / l) * d, pz = z + (dz / l) * d;
            E[i].set(px, pz, runPose(i, "wide"), { flip: flipFor(dx, dz), bob: runBob(i) });
            if (run < 1.0) dust(px - (dx / l) * 1.1, 0.24, pz - (dz / l) * 1.1, 0.4 + 0.1 * (i % 3), i);
            if (run < 0.3) dust(x, 0.25 + run * 0.6, z, 0.4 + 0.9 * run, i + 3);
          } else E[i].set(x, z, { n: 0.2, face: "wide" }, { flip: i % 2 === 0 });
        }
        if (t < T.scatter + 0.2) this.put(bangTex(), F[0], 2.7, F[1], 0.42, 0.84);
        if (t > 25.15) { const u = t - 25.15; this.put(featherTex(), 2.2 + 0.45 * Math.sin(u * 3.4), 2.3 - 1.25 * u, -1.0, 0.24, 0.48, { rot: 0.6 * Math.sin(u * 3.4 + 1) }); }
        break;
      }
      case 14: {
        // from above: every way at once
        aim(this.gunA, GUN[0], GUN[1], GYAW + 0.5 * Math.sin(t * 5)); fire(this.gunA, [[26.1, 26.9], [27.1, 27.9]], [[-3, 0, 3], [6, 0, -2], [1, 0, -6], [-4, 0, -3], [7, 0, -6]]);
        this.gunner.set(gx, gz, { back: true, aR: 40, eR: -100, aL: 40, eL: -100 }, { full: true });
        for (let i = 0; i < 52; i++) {
          const a = i * 2.399 + 0.4, dx = Math.cos(a), dz = Math.sin(a), d = 2.4 + (i % 6) * 1.1 + 5.6 * (t - 26.02), x = F[0] + dx * d, z = F[1] + dz * d;
          if (Math.hypot(x - gx, z - gz) < 2.2) continue;
          E[i].set(x, z, runPose(i, "wide"), { flip: flipFor(dx, dz), full: true });
          dust(x - dx * 1.3, 0.3, z - dz * 1.3, 0.7, i); dust(x - dx * 2.4, 0.3, z - dz * 2.4, 0.45, i + 1);
        }
        break;
      }
      case 15: case 16: case 17: {
        // the dam: birds on the far bank and all around, the gun crew behind the bushes
        const rings = [10.9, 12.6, 14.5, 16.6, 19, 21.6]; let k = 0;
        rings.forEach((rad, r) => { const nr = 9 + r; for (let i = 0; i < nr; i++, k++) {
          const a = Math.PI * (1.02 + 0.96 * ((i + 0.5 + (r % 2) * 0.5) / nr)), u = id === 15 ? eo(t, 27.6 + r * 0.05, 29.5 + r * 0.12) : 1, d = rad + 16 * (1 - u);
          const x = PX + Math.cos(a) * d, z = -14 + Math.sin(a) * d * 0.98, stare = id === 16 && t > T.jam + 0.25;
          if (id === 17) E[k].set(x, z, { front: true, face: t < 32.62 ? "wide" : "flat" });
          else E[k].set(x, z, u < 0.985 ? walkPose(k, 2.2, 1.3) : stare ? { n: 0.25, face: "flat" } : { n: r === 0 ? peck(k, 3.95, 0.5) : k % 3 ? 1.05 + 0.08 * Math.sin(t * 2 + k) : peck(k, 3.9, 0.4), face: ef(k) }, { flip: Math.cos(a) > 0 });
        } });
        this.strips.forEach((m, i) => { m.visible = i < 3; m.position.set(PX + i * 4, 1.6, [-42, -52, -63, 0, 0][i]); });
        if (id === 17) { E[69].set(PX - 0.78, -2.4, { front: true, face: t < 32.62 ? "wide" : "flat" }); E[70].set(PX + 0.84, -3.0, { front: true, stalk: true, face: t < 32.62 ? "wide" : "flat" }); }
        if (id === 15) {
          aim(this.gunA, PX + 1.3, 5.6, Math.PI / 2 + 0.05);
          this.major.set(PX - 0.85, 6.9, { back: true, aR: t > 29.9 ? 165 : 20, eR: t > 29.9 ? -8 : 0, aL: 14 });
          this.gunner.set(PX + 0.4, 6.7, { back: true, aR: 74, eR: -24, aL: 24, eL: -40 });
        } else if (id === 16) {
          const j = t - T.jam;
          aim(this.gunA, PX + 0.75, 5.2, Math.PI / 2 + 0.1); this.gunA.head.rotation.z = j > 0 ? -0.3 * eo(t, T.jam, T.jam + 0.25) : 0;
          fire(this.gunA, [[31.14, 31.3]], [[PX + 1.4, 0, -2]]);
          this.gunner.set(PX + 0.45, 6.0, { face: j > 0.55 ? "sad" : j > 0 ? "shock" : "strain", aL: 74, eL: 30, aR: 24, eR: 40 }, { bob: j > 0 && j < 0.2 ? 0.05 : 0 });
          this.major.set(PX - 0.3, 6.5, { face: j > 0.45 ? pf(2, "flat") : pf(2, "smug"), look: j > 0.45 ? -1 : 0, prop: "binoc", aR: j > 0.45 ? 30 : 150, eR: j > 0.45 ? 30 : -140 });
          if (j > 0) { this.gunA.group.updateWorldMatrix(true, true); const p = this.gunA.head.localToWorld(V(0.02, 0.3, 0)), up = eo(t, T.jam, T.jam + 0.22), wob = Math.sin(j * 30) * Math.exp(-j * 4);
            this.put(springTex(), p.x, p.y + 0.42 * up + 0.05 * wob, p.z, 0.3, 0.2 + 0.62 * up + 0.1 * wob, { rot: 0.12 * wob });
            for (let i = 0; i < 3; i++) { const u = (j * 0.9 + i * 0.33) % 1; this.put(smokeT, p.x + 0.5 + 0.2 * Math.sin(i * 3 + u * 4), p.y + 0.2 + u * 1.3, p.z, 0.35 + u * 0.6, 0.35 + u * 0.6, { rot: i }); }
            if (j < 0.16) this.put(burstTex(), p.x, p.y, p.z + 0.2, 1.2 + j * 5, 1.2 + j * 5, { rot: j * 14 }); }
        }
        break;
      }
      case 18: {
        const go = Math.max(0, t - 34.85), x = -4.5 + 7 * go * go, idle = 0.014 * Math.sin(t * 88);
        placeTruck(x, 15, 0, idle + 0.05 * Math.sin(go * 9) * Math.min(1, go * 3), -0.04 * Math.min(1, go * 4), 14 * go * go);
        this.gunT.head.rotation.z = 0.12;
        ride(this.mate, this.truck.cab, { face: pf(3, "happy") });
        ride(this.gunner, this.truck.tray, { face: pf(0, "smug"), aR: 120, eR: -50, aL: 120, eL: -50 });
        ride(this.major, V(-2.5, 1.15, -0.25), { face: pf(2, "smug"), prop: "stick", aR: 162, eR: -8, aL: 14 });
        for (let i = 0; i < 4; i++) { const u = (t * 1.7 + i * 0.25) % 1; this.put(smokeT, x - 3.1 - u * 1.6, 0.6 + u * 0.9, 15.9, 0.3 + u * 0.7, 0.3 + u * 0.7, { rot: i }); }
        break;
      }
      case 19: {
        // legs: a bird at full speed, the camera runs with it
        const x = emuX(t);
        E[0].set(x, 15, runPose(0), { bob: runBob(0) });
        E[1].set(x + 2.9, 12.4, runPose(1), { bob: runBob(1) }); E[2].set(x - 3.1, 13.2, runPose(2), { bob: runBob(2) }); E[3].set(x - 1.2, 10.6, runPose(3), { bob: runBob(3) });
        for (let i = 0; i < 5; i++) { const u = (t * 3.2 + i * 0.2) % 1; dust(x - 1.0 - u * 2.6, 0.22 + u * 0.5, 15.25, 0.35 + u * 0.75, i); }
        for (let i = 0; i < 9; i++) { const px = ((i * 3.7 - t * 34) % 15 + 15) % 15 - 7.5; this.put(streakTex(), x + px, 0.35 + (i % 5) * 0.42, 16.6 + (i % 3) * 0.5, 1.5, 0.07); }
        break;
      }
      case 20: case 21: {
        const x = emuX(t), tx = truckX(t), [by, pitch] = spring(t);
        if (id === 20) {
          ([[0, 15], [-2.5, 13.7], [1.9, 16.3], [-4.9, 15.9], [3.6, 13.4]] as [number, number][]).forEach(([dx, z], i) => { E[i].set(x + dx, z, runPose(i), { bob: runBob(i) }); const u = (t * 3.2 + i * 0.2) % 1; dust(x + dx - 1.0 - u * 2.2, 0.22 + u * 0.5, z + 0.2, 0.35 + u * 0.7, i); });
        }
        placeTruck(tx, 15.2, 0, 0.04 + by, pitch, tx / 0.5);
        const hg = hop(t) * 0.5, hm = hop(t, 0.13) * 0.42, off = t > T.hatOff;
        this.gunT.head.rotation.z = 0.55 * Math.sin(t * 9.5) + 0.3 * Math.sin(t * 23);
        ride(this.mate, this.truck.cab, { face: "strain" }, hop(t, 0.05) * 0.14);
        ride(this.gunner, this.truck.tray, { face: hg > 0.18 ? "shock" : "strain", aR: 128, eR: -52, aL: 128, eL: -52, hatOff: off }, hg, { tilt: 0.1 * Math.sin(t * 9.5) });
        ride(this.major, V(-2.5, 1.15, -0.25), { face: "shock", aR: 152, eR: -146, aL: 60, eL: 40 }, hm, { tilt: -0.12 * Math.sin(t * 9.5 + 1) });
        for (let i = 0; i < 4; i++) { const u = (t * 2.6 + i * 0.25) % 1; dust(tx - 3.0 - u * 2.4, 0.3 + u * 0.7, 15.9, 0.5 + u * 1.0, i); }
        if (off && t < T.hatOff + 0.95) { const u = t - T.hatOff; this.put(hatTex(), tx - 1.4 - 4.6 * u, 3.3 + 3.2 * u - 3.4 * u * u, 15.4, 0.86, 0.43, { rot: u * 7 }); }
        break;
      }
      case 22: {
        const x = leaveX(t);
        placeTruck(x, 15, 0, 0.03 * Math.sin(t * 30), 0, x / 0.5);
        ride(this.gunner, this.truck.tray, { face: pf(0, "sad"), hatOff: true, aL: 14, aR: 14 });
        ride(this.major, V(-2.5, 1.15, -0.25), { face: pf(2, "sad"), aL: 14, aR: 14 });
        for (let i = 0; i < 5; i++) { const u = (t * 1.4 + i * 0.2) % 1; dust(x - 3.2 - u * 3.5, 0.4 + u * 1.2, 15 + Math.sin(i * 2) * 0.5, 0.7 + u * 1.6, i); }
        const turn = t > 43.2;
        E[0].set(117.4, 16.25, turn ? { front: true, hat: true, face: t > 43.55 && t < 43.7 ? "blink" : "flat" } : { n: 0.6, hat: true, face: ef(0) });
        E[1].set(118.6, 17.6, { n: 0.9, face: ef(1) }, { flip: true });
        break;
      }
      case 23: {
        // the report: one bird, ten rounds
        const down = ss(t, 45.9, 46.4);
        E[0].set(-0.75, 0.4, { n: lerp(1, 2.35, down), hat: true, face: ef(0) });
        this.major.set(1.05, -0.9, { face: pf(2, "sad"), prop: "notebook", aR: 62 + (t < 45.2 ? 6 * Math.sin(t * 16) : 0), eR: 84, aL: 40, eL: 100, look: -1 });
        this.rounds.forEach((c, i) => { const u = pop(t, T.ten + i * 0.085, 0.2); c.visible = u > 0; c.position.set(-0.88 + (i % 5) * 0.44, 0, i < 5 ? 1.9 : 2.7); c.scale.setScalar(Math.max(0.01, u)); });
        break;
      }
      case 24: {
        const sal = ss(t, T.admit - 0.1, T.admit + 0.2);
        this.major.set(0, 0, { face: pf(2, "sad"), aR: lerp(14, 150, sal), eR: lerp(0, -128, sal), aL: 14 });
        ([[-2.6, -9.5], [2.9, -10.5]] as [number, number][]).forEach(([x, z], i) => E[i].set(x, z, { n: peck(i, 2.62, 0.6), face: ef(i) }, { flip: i === 0 }));
        break;
      }
      case 25: {
        // the division: ranks in slouch hats, in step
        const adv = 1.7 * (t - 48.65), ph = t * 1.75; let k = 0;
        for (let r = 0; r < 13; r++) for (let f = 0; f < 4; f++, k++)
          E[k].set(2.2 - r * 1.75 + adv, 13.7 + f * 0.86, { n: 0.75, gait: "walk", ph, hat: true, face: "flat" }, { bob: 0.05 * Math.abs(Math.sin(ph * Math.PI * 2)) });
        this.lead.set(5.0 + adv, 15.0, { n: 0.5, gait: "walk", ph, hat: true, face: "flat" }, { bob: 0.05 * Math.abs(Math.sin(ph * Math.PI * 2)) });
        break;
      }
      case 26: {
        ([[-10.6, -10.2, 1], [-8.2, -11.8, 0], [-9.9, -15, -1], [-7.4, -17, 0], [-12.5, -19, 1], [-6.5, -24, -1], [-10, -30, 0], [-4.5, -21, 1]] as number[][]).forEach(([x, z, dir], i) => {
          if (dir) E[i].set(x + dir * 0.55 * (t - 52.4), z, walkPose(i, 0.9, 1.1), { flip: dir < 0 });
          else E[i].set(x, z, { n: peck(i, 2.62, 0.5), face: ef(i), stalk: i === 1 }, { flip: i % 2 === 0 });
        });
        break;
      }
      case 27: {
        // the board with the coat of arms; the bird in the major's hat walks in, looks up, then looks at us
        const u = ss(t, 54.95, 56.55), x = lerp(15.2, 10.7, u), front = t >= T.winners - 0.12;
        E[0].set(x, 13.5, front ? { front: true, hat: true, stalk: true, chew: t > T.blink - 0.5 ? 0 : chew(6), face: t > T.blink && t < T.blink + 0.16 ? "blink" : "flat" }
          : u < 1 ? { n: 1.1, gait: "walk", ph: t * 1.5, hat: true, face: "flat" } : { n: 0.15, hat: true, face: ef(0) }, { flip: true, bob: u < 1 ? 0.04 * Math.abs(Math.sin(t * 1.5 * Math.PI * 2)) : 0 });
        E[1].set(5.6, 9.2, { n: peck(1, 3.9, 0.4), face: ef(1) }); E[2].set(15.4, 8.4, { n: 1 + 0.1 * Math.sin(t), face: ef(2) }, { flip: true });
        break;
      }
    }
    // billboards
    for (const a of this.actors) if (a.group.visible) a.face(cam);
    for (const m of this.emus) if (m.group.visible) m.face(cam);
    if (this.lead.group.visible) this.lead.face(cam);
    for (let i = 0; i < this.fxN; i++) { const m = this.fx[i]; m.quaternion.copy(cam.quaternion); m.rotateZ(m.userData.rot); }
    for (const m of this.strips) if (m.visible) m.rotation.y = 0;
    return focus;
  }
}
