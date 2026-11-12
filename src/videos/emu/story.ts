// Timeline of «Война, которую выиграли птицы»: shots timed to the draft narration (shorts/emu-war/voice/words.json).
// All times are SECONDS of the final video; frames = t * FPS. Cameras glide (smootherstep) and every hold creeps.
export const FPS = 30;
export const DUR = 59.8;
export const TOTAL = Math.round(DUR * FPS);
export type V3 = [number, number, number];
export type Light = "day" | "golden";
export type State = "farm" | "pond";
export type Shot = { id: number; a: number; b: number; light: Light; state: State };

/** x of the farm dam set (far from the paddock, behind the haze) */
export const PX = 420;

// word and action times (s)
export const T = {
  lost: 5.03, emus: 10.54, tall: 13.11, eat: 14.01, fence: 15.12,
  call: 17.04, major: 18.87, two: 19.83, guns: 20.74, crates: 21.67,
  shots: 23.3, scatter: 24.6, roach: 26.12,
  ambush: 28.61, jam: 31.52,
  truck: 34.47, legs: 37.13, behind: 38.38, bumps: 39.17, hatOff: 40.5,
  recall: 42.31, ten: 46.2, admit: 47.99, division: 48.73,
  still: 53.48, arms: 55.87, winners: 57.66, blink: 59.05,
};

export const SHOTS: Shot[] = [
  { id: 1, a: 0, b: 3.25, light: "day", state: "farm" },       // hook: the army = a soldier hammering away with a machine gun
  { id: 2, a: 3.25, b: 4.82, light: "day", state: "farm" },    // the enemy: emus, not impressed
  { id: 3, a: 4.82, b: 6.25, light: "day", state: "farm" },    // "...and lost": the emu chews
  { id: 4, a: 6.25, b: 9.95, light: "day", state: "farm" },    // the farm, the ex-soldier and his wheat
  { id: 5, a: 9.95, b: 11.65, light: "day", state: "farm" },   // the paddock fills with emus
  { id: 6, a: 11.65, b: 12.65, light: "day", state: "farm" },  // the farmer, and who is behind him
  { id: 7, a: 12.65, b: 13.98, light: "day", state: "farm" },  // as tall as a man
  { id: 8, a: 13.98, b: 14.95, light: "day", state: "farm" },  // eating the crop
  { id: 9, a: 14.95, b: 16.4, light: "day", state: "farm" },   // through the fence
  { id: 10, a: 16.4, b: 18.35, light: "day", state: "farm" },  // the farmers call the army
  { id: 11, a: 18.35, b: 23.15, light: "day", state: "farm" }, // the major, two soldiers, two guns, ten thousand rounds
  { id: 12, a: 23.15, b: 24.5, light: "day", state: "farm" },  // the first shots
  { id: 13, a: 24.5, b: 26.02, light: "day", state: "farm" },  // the flock explodes
  { id: 14, a: 26.02, b: 28.1, light: "day", state: "farm" },  // ...like cockroaches, from above
  { id: 15, a: 28.1, b: 30.75, light: "day", state: "pond" },  // the ambush at the dam
  { id: 16, a: 30.75, b: 32.35, light: "day", state: "pond" }, // the gun jams
  { id: 17, a: 32.35, b: 32.95, light: "day", state: "pond" }, // a thousand birds look up
  { id: 18, a: 32.95, b: 35.5, light: "day", state: "farm" },  // luckily: the truck
  { id: 19, a: 35.5, b: 37.8, light: "day", state: "farm" },   // unluckily: legs
  { id: 20, a: 37.8, b: 39.45, light: "day", state: "farm" },  // the truck falls behind
  { id: 21, a: 39.45, b: 41.45, light: "day", state: "farm" }, // bumps: the gunner cannot fire
  { id: 22, a: 41.45, b: 43.85, light: "day", state: "farm" }, // the army leaves
  { id: 23, a: 43.85, b: 47.65, light: "day", state: "farm" }, // ten rounds per bird
  { id: 24, a: 47.65, b: 48.65, light: "day", state: "farm" }, // the major admits
  { id: 25, a: 48.65, b: 52.4, light: "day", state: "farm" },  // a division of such birds
  { id: 26, a: 52.4, b: 54.95, light: "golden", state: "farm" }, // they still walk the same fields
  { id: 27, a: 54.95, b: DUR + 1, light: "golden", state: "farm" }, // the coat of arms
];
export const shotAt = (t: number) => SHOTS.find((s) => t < s.b) ?? SHOTS[SHOTS.length - 1];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** smootherstep of t between a and b */
export const ss = (t: number, a: number, b: number) => { const u = clamp01((t - a) / (b - a)); return u * u * u * (u * (u * 6 - 15) + 10); };
/** ease-out */
export const eo = (t: number, a: number, b: number) => { const u = clamp01((t - a) / (b - a)); return 1 - (1 - u) ** 3; };
/** pop-in with a small overshoot: 0 before t0, ~1.12 at 60 %, 1 after d seconds */
export const pop = (t: number, t0: number, d = 0.22) => { const u = (t - t0) / d; return u <= 0 ? 0 : u >= 1 ? 1 : 1 + 0.5 * Math.sin(u * Math.PI) * (1 - u) - (1 - u) ** 3; };

// ---- the chase along the road (z = 15): emus run at 48 km/h, the truck cannot keep up ----
export const RUN = 13.3;
export const emuX = (t: number) => 30 + RUN * (t - 35.5);
export const truckX = (t: number) => emuX(37.8) - 7.5 + 9.6 * (t - 37.8);
export const leaveX = (t: number) => 124 + 7.5 * (t - 41.45);
/** bumps of the rough ride (shot 16): one every 0.36 s */
export const BUMP = 0.36;
export const bumpTimes = () => { const out: number[] = []; for (let t = 37.9; t < 41.45; t += BUMP) out.push(t); return out; };

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { t: number; pos: V3; look: V3; fov?: number; roll?: number; dur?: number };
/** camera keys per shot: the first key is the cut; later keys are glides starting at t over dur seconds (default 0.8).
 *  Shots listed in FOLLOW add a moving anchor (x) to every key. */
const CAMS: Record<number, Key[]> = {
  1: [{ t: 0, pos: [0.9, 1.5, 4.0], look: [6.35, 1.25, 6.85], fov: 36 }, { t: 0.05, dur: 3.1, pos: [1.5, 1.48, 4.4], look: [6.35, 1.27, 6.85], fov: 36 }],
  2: [{ t: 3.25, pos: [2.4, 1.45, 5.9], look: [2.0, 1.2, -2], fov: 40 }, { t: 3.3, dur: 1.5, pos: [2.3, 1.45, 5.3], look: [2.0, 1.2, -2], fov: 40 }],
  3: [{ t: 4.82, pos: [2.15, 1.72, 3.1], look: [2.0, 1.5, -1.2], fov: 30 }],
  4: [{ t: 6.25, pos: [2, 13, 36], look: [-18, 3, -4], fov: 40 }, { t: 6.3, dur: 2.5, pos: [-9.6, 1.5, 12.6], look: [-14.6, 3.2, 0], fov: 46 }],
  5: [{ t: 9.95, pos: [-9.4, 5.8, 15], look: [-9.4, 0.4, -24], fov: 28 }, { t: 10.0, dur: 1.6, pos: [-9.4, 5.6, 14], look: [-9.4, 0.4, -24], fov: 28 }],
  6: [{ t: 11.65, pos: [-9.2, 1.62, -0.6], look: [-9.4, 1.55, -4.6], fov: 36 }],
  7: [{ t: 12.65, pos: [0.1, 1.35, 4.4], look: [0.05, 1.05, -3.2], fov: 38 }],
  8: [{ t: 13.98, pos: [-0.4, 2.0, -8.3], look: [-0.2, 1.0, -13.4], fov: 40 }],
  9: [{ t: 14.95, pos: [4.2, 1.5, 6.0], look: [5.0, 0.9, -6.6], fov: 50 }],
  10: [{ t: 16.4, pos: [4.95, 1.6, 3.6], look: [4.95, 1.36, -2.3], fov: 36 }],
  11: [{ t: 18.35, pos: [0, 1.6, 20.9], look: [0, 1.32, 14.5], fov: 38 }, { t: 21.4, dur: 1.2, pos: [0, 1.75, 21.9], look: [0, 1.5, 14.5], fov: 38 }],
  12: [{ t: 23.15, pos: [1.5, 1.48, 4.4], look: [6.35, 1.27, 6.85], fov: 33 }],
  13: [{ t: 24.5, pos: [4.4, 1.7, 8.2], look: [1.6, 1.0, -2], fov: 46 }],
  14: [{ t: 26.02, pos: [5.3, 30, 4.7], look: [3.42, 0, 1.15], fov: 46 }, { t: 26.05, dur: 2.0, pos: [5.3, 33, 4.7], look: [3.42, 0, 1.15], fov: 46 }],
  15: [{ t: 28.1, pos: [PX + 1.3, 2.7, 15.2], look: [PX + 0.2, 1.1, -10], fov: 30 }, { t: 28.15, dur: 2.5, pos: [PX + 1.1, 2.55, 14.2], look: [PX + 0.2, 1.1, -10], fov: 30 }],
  16: [{ t: 30.75, pos: [PX + 0.3, 1.75, 2.0], look: [PX + 0.3, 1.32, 5.8], fov: 40 }],
  17: [{ t: 32.35, pos: [PX, 1.7, 3.5], look: [PX, 1.35, -9], fov: 34 }],
  18: [{ t: 32.95, pos: [3.8, 2.5, 22.5], look: [-5.0, 2.0, 15], fov: 38 }, { t: 34.9, dur: 0.6, pos: [4.4, 2.5, 22.8], look: [-3.2, 2.0, 15], fov: 40 }],
  19: [{ t: 35.5, pos: [0.8, 1.15, 22.6], look: [0.5, 0.95, 15], fov: 36 }],
  20: [{ t: 37.8, pos: [7.5, 1.7, 21.5], look: [-6.5, 1.35, 14.7], fov: 34 }],
  21: [{ t: 39.45, pos: [-0.4, 2.2, 24], look: [-1.0, 2.05, 15], fov: 40 }],
  22: [{ t: 41.45, pos: [108, 1.75, 17.3], look: [140, 1.55, 15], fov: 32 }],
  23: [{ t: 43.85, pos: [0.2, 2.3, 9.6], look: [0, 0.95, 1.2], fov: 36 }, { t: 45.9, dur: 0.6, pos: [0.2, 2.0, 8.6], look: [0, 0.8, 1.6], fov: 36 }],
  24: [{ t: 47.65, pos: [-0.3, 1.62, 4.2], look: [0, 1.5, 0], fov: 32 }],
  25: [{ t: 48.65, pos: [6.2, 3.0, 24], look: [0.8, 1.2, 14.5], fov: 38 }, { t: 48.7, dur: 3.6, pos: [5.4, 2.2, 22.6], look: [0.8, 1.25, 14.5], fov: 38 }],
  26: [{ t: 52.4, pos: [-9.9, 1.9, -2.4], look: [-9.7, 1.3, -12], fov: 40 }, { t: 52.45, dur: 2.5, pos: [-9.3, 1.9, -2.6], look: [-9.5, 1.3, -12], fov: 40 }],
  27: [{ t: 54.95, pos: [10.5, 1.5, 24], look: [10.2, 3.0, 11.5], fov: 40 }, { t: 57.3, dur: 0.9, pos: [10.7, 1.5, 19.6], look: [10.6, 2.2, 13.4], fov: 38 }],
};
/** moving anchors (x only) for the tracking shots */
const FOLLOW: Record<number, (t: number) => number> = { 19: emuX, 20: emuX, 21: truckX };
export const followX = (id: number, t: number) => (FOLLOW[id] ? FOLLOW[id](t) : 0);

/** impact shakes: [time, strength] */
export const KICKS: [number, number][] = [
  [T.fence, 0.7], [T.crates + 0.33, 0.5], [T.crates + 0.52, 0.5], [T.crates + 0.71, 0.6], [T.crates + 0.9, 0.6], [T.crates + 1.09, 0.7],
  [T.jam, 0.5], ...bumpTimes().filter((t) => t > 39.45).map((t) => [t, 0.55] as [number, number]),
];
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
  const ax = followX(id, t);
  if (ax) { c.pos = [c.pos[0] + ax, c.pos[1], c.pos[2]]; c.look = [c.look[0] + ax, c.look[1], c.look[2]]; }
  // impact shake: flips sign every frame, decays over 7 frames
  for (const [kt, s] of KICKS) {
    const n = Math.round((t - kt) * FPS);
    if (n >= 0 && n < 7) { const a = s * (1 - n / 7) * (n % 2 ? -1 : 1); c.look = [c.look[0] + 0.05 * a, c.look[1] + 0.09 * a, c.look[2]]; c.roll += 0.006 * a; }
  }
  return c;
}

/** lens blur per shot (circle of confusion at infinity, px at 1080 wide): this short stays sharp everywhere */
export const dofAt = (_id: number, _t: number) => 0;

/** on-screen sticker (DOM layer): the speed of a running emu */
export const STICKER = { t0: 36.35, t1: 37.75, text: "50 км/ч" };

/** cover still: the bird in the major's hat staring into the lens, the board behind it */
export const COVER: { t: number; cam: Cam } = { t: 58.4, cam: { pos: [10.9, 1.62, 17.3], look: [10.7, 1.7, 13.5], fov: 34, roll: 0 } };
