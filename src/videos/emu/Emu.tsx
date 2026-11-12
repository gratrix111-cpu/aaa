// «Война, которую выиграли птицы»: a ~60 s short about the 1932 Emu War in the flat-characters-in-a-3D-toon-world style.
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain:
//   InkPass -> [lens blur, off in this short] -> [bloom + NEUTRAL tone map + grade], MSAA 4. Captions are a DOM layer on top.
// The picture stays sharp everywhere (no depth of field), so the WebGL buffer is rendered at the full 1080x1920.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { CARD_K } from "./cardshade";
import { FPS, TOTAL, COVER, STICKER, Cam, shotAt, dofAt, pop } from "./story";
import { Captions } from "./Captions";
import { CoverTitle } from "./Cover";

export const EMU_FRAMES = TOTAL;
/** keys: seconds to preview with the EmuKeys composition (one frame per entry) */
export type EmuProps = { dpr?: number; captions?: boolean; lens?: boolean; ink?: boolean; bloom?: boolean; ms?: number; keys?: number[] };
const props = (): Required<EmuProps> => ({ dpr: 1, captions: true, lens: false, ink: true, bloom: true, ms: 4, keys: [], ...(getInputProps() as EmuProps) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 5, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((960 * w) / Math.max(h, 1)), 960);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC<{ p: Required<EmuProps>; t: number; cam?: Cam; dof?: number }> = ({ p, t, cam: camO, dof }) => {
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={p.ms}>
      {p.ink ? <primitive object={fx.ink} dispose={null} /> : <></>}
      {p.lens ? <primitive object={fx.lens.pre} dispose={null} /> : <></>}
      {p.lens ? <primitive object={fx.lens.main} dispose={null} /> : <></>}
      {p.bloom ? <primitive object={fx.bloom} dispose={null} /> : <></>}
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
    </EffectComposer>
  ), [fx, p]);
  const cam = camera as THREE.PerspectiveCamera;
  CARD_K.uPx.value = p.dpr;
  const s = shotAt(t);
  fpt.copy(world.update(t, cam, scene, p.dpr, camO));
  noInkFallback(world.root);
  cam.getWorldDirection(fwd);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = dof ?? dofAt(s.id, t);
  gradeFor(fx.grade, s.light);
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

const Stage: React.FC<{ p: Required<EmuProps>; t: number; cam?: Cam; dof?: number }> = ({ p, t, cam, dof }) => (
  <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} dpr={p.dpr} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner p={p} t={t} cam={cam} dof={dof} />
    </ThreeCanvas>
  </AbsoluteFill>
);

/** the one on-screen fact that is not narrated: how fast the bird runs */
const Sticker: React.FC<{ t: number }> = ({ t }) => {
  if (t < STICKER.t0 || t >= STICKER.t1) return null;
  const k = pop(t, STICKER.t0, 0.2);
  return (
    <AbsoluteFill style={{ alignItems: "flex-end" }}>
      <div style={{
        marginTop: 400, marginRight: 70, padding: "14px 38px 18px", background: "#ffd21e", border: "12px solid #16101c", borderRadius: 34,
        fontFamily: "Montserrat, 'DejaVu Sans', sans-serif", fontWeight: 900, fontSize: 104, lineHeight: 1, color: "#16101c",
        transform: `rotate(-7deg) scale(${k})`, boxShadow: "0 12px 0 rgba(22,16,28,0.55)",
      }}>{STICKER.text}</div>
    </AbsoluteFill>
  );
};

export const EmuShort: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const p = useMemo(props, []);
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      <Stage p={p} t={t} />
      <Sticker t={t} />
      {p.captions ? <Captions t={t} /> : null}
    </AbsoluteFill>
  );
};

/** look checks: frame i shows second keys[i] of the short (SHORT_PROPS='{"keys":[1.2,5.5]}'), with the time in the corner */
export const EmuKeys: React.FC = () => {
  const f = useCurrentFrame();
  const p = useMemo(props, []);
  const t = p.keys[Math.min(f, p.keys.length - 1)] ?? 0;
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      <Stage p={p} t={t} />
      <Sticker t={t} />
      {p.captions ? <Captions t={t} /> : null}
      <div style={{ position: "absolute", left: 20, top: 16, font: "700 64px monospace", color: "#fff", background: "#000", padding: "0 14px" }}>{t.toFixed(2)} · {shotAt(t).id}</div>
    </AbsoluteFill>
  );
};

/** cover image (render one still): the scene at COVER.t from the cover camera with the title on top */
export const EmuCover: React.FC = () => {
  const p = useMemo(() => ({ ...props(), lens: true }), []);
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      <Stage p={p} t={COVER.t} cam={COVER.cam} dof={COVER.dof} />
      <CoverTitle />
    </AbsoluteFill>
  );
};
