// Timeline of «Колокол, который молчит»: shots timed to the voice words (shorts/tsar-bell/voice/words.json).
// All times are SECONDS of the final video; frames = t * FPS. Cameras glide (smootherstep) and every hold creeps.
export const FPS = 30;
export const DUR = 59.6;
export const TOTAL = Math.round(DUR * FPS);
export type V3 = [number, number, number];
export type Light = "day" | "golden" | "fire";
export type State = "pit" | "ped" | "kitchen";
export type Shot = { id: number; a: number; b: number; light: Light; state: State };

// word times (s)
export const T = {
  hookBucket: 3.18, hookSplash: 3.5, flash: 4.1,
  elephants: 10.55, tap: 14.32,
  fire: 16.5, scaffoldFire: 19.0, glow: 20.87,
  run: 22.44, throw: 24.1, crack: 25.5, fall: 26.6, thud: 27.2,
  pour: 35.6, cold: 36.5, burst: 39.9,
  napoleon: 45.75, snap: 47.95, raise: 49.7, land: 51.6,
  crow: 53.5, knock: 57.9,
};

export const SHOTS: Shot[] = [
  { id: 1, a: 0, b: 2.5, light: "day", state: "ped" },
  { id: 2, a: 2.5, b: 4.22, light: "day", state: "pit" },
  { id: 3, a: 4.22, b: 7.5, light: "day", state: "pit" },
  { id: 4, a: 7.5, b: 10.45, light: "day", state: "pit" },
  { id: 5, a: 10.45, b: 12.0, light: "day", state: "pit" },
  { id: 6, a: 12.0, b: 16.1, light: "day", state: "pit" },
  { id: 7, a: 16.1, b: 18.7, light: "fire", state: "pit" },
  { id: 8, a: 18.7, b: 22.4, light: "fire", state: "pit" },
  { id: 9, a: 22.4, b: 25.4, light: "fire", state: "pit" },
  { id: 10, a: 25.4, b: 29.2, light: "fire", state: "pit" },
  { id: 11, a: 29.2, b: 31.35, light: "day", state: "pit" },
  { id: 12, a: 31.35, b: 33.62, light: "day", state: "pit" },
  { id: 13, a: 33.62, b: 40.8, light: "day", state: "kitchen" },
  { id: 14, a: 40.8, b: 43.0, light: "day", state: "pit" },
  { id: 15, a: 43.0, b: 45.75, light: "day", state: "pit" },
  { id: 16, a: 45.75, b: 49.6, light: "day", state: "pit" },
  { id: 17, a: 49.6, b: 52.85, light: "day", state: "ped" },
  { id: 18, a: 52.85, b: 56.6, light: "day", state: "ped" },
  { id: 19, a: 56.6, b: DUR + 1, light: "golden", state: "ped" },
];
export const shotAt = (t: number) => SHOTS.find((s) => t < s.b) ?? SHOTS[SHOTS.length - 1];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** smootherstep of t between a and b */
export const ss = (t: number, a: number, b: number) => { const u = clamp01((t - a) / (b - a)); return u * u * u * (u * (u * 6 - 15) + 10); };
/** ease-out */
export const eo = (t: number, a: number, b: number) => { const u = clamp01((t - a) / (b - a)); return 1 - (1 - u) ** 3; };

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { t: number; pos: V3; look: V3; fov?: number; roll?: number; dur?: number };
const K = 400; // kitchen set origin (x)
/** camera keys per shot: the first key is the cut; later keys are glides starting at t over dur seconds (default 0.8) */
const CAMS: Record<number, Key[]> = {
  1: [{ t: 0, pos: [7, 1.3, 25], look: [0, 4.6, 0], fov: 42 }, { t: 0.1, dur: 2.4, pos: [4.2, 1.2, 17.5], look: [0, 4.9, 0], fov: 42, roll: -0.03 }],
  2: [{ t: 2.5, pos: [2.9, 1.5, 13.4], look: [1.4, 1.42, 9.5], fov: 34 }, { t: 3.1, dur: 0.5, pos: [2.5, 1.5, 12.6], look: [1.4, 1.5, 9.5], fov: 34, roll: 0.05 }],
  3: [{ t: 4.22, pos: [40, 34, 70], look: [0, 8, -14], fov: 44 }, { t: 4.3, dur: 3.0, pos: [15, 8, 31], look: [0, 3.4, 0], fov: 42 }],
  4: [{ t: 7.5, pos: [-3.2, 1.55, 13.0], look: [-4.6, 1.45, 8.8], fov: 32 }, { t: 9.2, dur: 0.8, pos: [-8.5, 0.8, 15.5], look: [-1.2, 3.3, 1], fov: 46, roll: -0.05 }],
  5: [{ t: 10.45, pos: [-2, 3.2, 34], look: [0, 2.6, 0], fov: 30 }, { t: 10.5, dur: 0.33, pos: [-10, 3.4, 30], look: [-21, 3.7, 0], fov: 31 }],
  6: [{ t: 12.0, pos: [1.2, 2.6, 17], look: [0, 0.6, 3.4], fov: 40 }, { t: 14.2, dur: 0.45, pos: [0.4, 0.7, 7.8], look: [-1.25, 0.3, 4.0], fov: 32, roll: 0.03 }],
  7: [{ t: 16.1, pos: [12, 4.5, 30], look: [-16, 5, -4], fov: 46 }, { t: 17.3, dur: 0.6, pos: [8, 4.2, 25], look: [-18, 5.5, -2], fov: 44, roll: -0.06 }],
  8: [{ t: 18.7, pos: [10, 2.2, 17], look: [0, 6.4, 0], fov: 46 }, { t: 20.7, dur: 0.8, pos: [6.2, 2.4, 11.5], look: [0, 2.6, 0], fov: 40, roll: 0.04 }],
  9: [{ t: 22.4, pos: [8, 1.5, 17.5], look: [9, 1.3, 9.6], fov: 40 }, { t: 22.45, dur: 1.5, pos: [4.5, 1.5, 17], look: [4.3, 1.3, 9.6], fov: 40 },
    { t: 23.95, dur: 0, pos: [0, 3.0, 19], look: [0, 2.2, 0], fov: 44 }],
  10: [{ t: 25.4, pos: [10.5, 3.0, 9.6], look: [2.6, 0.5, 1.7], fov: 34 }, { t: 26.5, dur: 0.6, pos: [12.5, 3.6, 11.6], look: [3.2, 0.1, 2.1], fov: 36, roll: -0.05 }],
  11: [{ t: 29.2, pos: [-8.5, 1.55, 13.5], look: [-1.5, 1.45, 8.6], fov: 34 }],
  12: [{ t: 31.35, pos: [14, 2.6, 13], look: [3.4, 0.9, 3.2], fov: 40 }],
  13: [{ t: 33.62, pos: [K + 2.2, 6.4, 13.5], look: [K + 0.6, 5.3, 0], fov: 34 }, { t: 36.4, dur: 0.7, pos: [K + 0.9, 5.7, 9], look: [K, 5.0, 0], fov: 30 },
    { t: 39.75, dur: 0.3, pos: [K + 0.6, 5.9, 11.5], look: [K - 0.6, 5.1, 0], fov: 36, roll: 0.05 }],
  14: [{ t: 40.8, pos: [12.4, 1.7, 11.8], look: [6.3, 1.3, 6.0], fov: 36 }],
  15: [{ t: 43.0, pos: [15, 11, 27], look: [0, 1.6, 0], fov: 40 }],
  16: [{ t: 45.75, pos: [-1.3, 1.6, 21.5], look: [-1.0, 2.4, 6], fov: 54 }],
  17: [{ t: 49.6, pos: [8, 1.8, 19], look: [0, 2.6, 0], fov: 44 }, { t: 49.9, dur: 1.7, pos: [8, 2.0, 19], look: [0, 4.6, 0], fov: 44 }],
  18: [{ t: 52.85, pos: [-5.5, 1.3, 15.5], look: [0, 4.3, 0], fov: 46 }, { t: 54.6, dur: 0.6, pos: [-2.4, 1.5, 13.2], look: [-1.4, 1.5, 8.6], fov: 34 }],
  19: [{ t: 56.6, pos: [3.5, 2.2, 15.5], look: [0, 4.4, 0], fov: 42 }, { t: 56.7, dur: 2.9, pos: [14, 17, 40], look: [0, 7, -8], fov: 42 }],
};
/** impact shakes: [time, strength] */
export const KICKS: [number, number][] = [[T.hookSplash, 0.7], [T.crack, 1.2], [T.thud, 1.5], [T.burst, 1.2], [T.snap, 1.0], [T.land, 1.4], [T.knock, 0.3]];
const mix3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

export function camAt(id: number, t: number): Cam {
  const keys = CAMS[id];
  let c: Cam = { pos: keys[0].pos, look: keys[0].look, fov: keys[0].fov ?? 40, roll: keys[0].roll ?? 0 };
  let last = keys[0].t;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t < k.t) break;
    const u = k.dur === 0 ? 1 : ss(t, k.t, k.t + (k.dur ?? 0.8));
    c = { pos: mix3(c.pos, k.pos, u), look: mix3(c.look, k.look, u), fov: lerp(c.fov, k.fov ?? c.fov, u), roll: lerp(c.roll, k.roll ?? 0, u) };
    last = k.t + (k.dur ?? 0.8);
  }
  // creeping push-in on every hold: ~0.2 % of the distance per frame
  const hold = Math.max(0, t - last), push = 1 - Math.exp(-0.06 * hold);
  c.pos = mix3(c.pos, c.look, push);
  // impact shake: flips sign every frame, decays over 7 frames
  for (const [kt, s] of KICKS) {
    const n = Math.round((t - kt) * FPS);
    if (n >= 0 && n < 7) { const a = s * (1 - n / 7) * (n % 2 ? -1 : 1); c.look = [c.look[0] + 0.05 * a, c.look[1] + 0.09 * a, c.look[2]]; c.roll += 0.006 * a; }
  }
  return c;
}

/** lens blur per shot: circle of confusion at infinity (px at 1080 wide), 0 = sharp */
const DOF: Record<number, number> = { 2: 13, 4: 9, 11: 11, 14: 10 };
export const dofAt = (id: number, t: number) => {
  if (id === 4) return lerp(9, 0, ss(t, 9.2, 9.9));
  if (id === 6) return t < 14.2 ? 0 : 9;
  if (id === 18) return lerp(0, 9, ss(t, 54.6, 55.1));
  return DOF[id] ?? 0;
};

/** cover still: the guards dousing the red-hot bell, framed low so the title has the upper third */
export const COVER: { t: number; cam: Cam } = { t: 24.3, cam: { pos: [0, 1.6, 19], look: [0, 4.85, 0], fov: 46, roll: 0 } };
