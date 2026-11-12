// «Колокол, который молчит»: an original ~60 s short in the flat-characters-in-a-3D-toon-world style.
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain as in the bridge short:
//   InkPass -> lens blur pre + main -> [bloom + NEUTRAL tone map + grade], MSAA 4. Captions are a DOM layer on top.
// RENDER_DPR < 1 renders the WebGL buffer below 1080x1920 (software GL on a 2-core box); captions stay at full size.
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
import { FPS, TOTAL, T, shotAt, dofAt } from "./story";
import { Captions } from "./Captions";

export const BELL_FRAMES = TOTAL;
type Props = { dpr?: number; captions?: boolean; lens?: boolean; ink?: boolean; bloom?: boolean; ms?: number };
const props = (): Required<Props> => ({ dpr: 0.8333, captions: true, lens: true, ink: true, bloom: true, ms: 4, ...(getInputProps() as Props) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 5, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((960 * w) / Math.max(h, 1)), 960);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC<{ p: Required<Props> }> = ({ p }) => {
  const f = useCurrentFrame(), t = f / FPS;
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
  fpt.copy(world.update(t, cam, scene, p.dpr));
  noInkFallback(world.root);
  cam.getWorldDirection(fwd);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = dofAt(s.id, t);
  gradeFor(fx.grade, s.light === "day" ? "day" : "golden");
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

export const BellShort: React.FC = () => {
  const f = useCurrentFrame();
  const p = useMemo(props, []);
  const k = f - Math.round(T.flash * FPS);
  const flash = k >= 0 && k < 4 ? [1, 0.75, 0.45, 0.2][k] : 0;
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      <AbsoluteFill>
        <ThreeCanvas width={1080} height={1920} dpr={p.dpr} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
          camera={{ fov: 40, near: 0.2, far: 1500 }}>
          <Inner p={p} />
        </ThreeCanvas>
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {p.captions ? <Captions /> : null}
    </AbsoluteFill>
  );
};
