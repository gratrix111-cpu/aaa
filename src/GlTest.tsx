import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { EffectComposer } from "@react-three/postprocessing";
import { ToneMappingEffect, ToneMappingMode } from "postprocessing";

const tone = new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });
export const GlTest: React.FC<{ post?: boolean; ms?: number; ub?: boolean }> = ({ post, ms = 4, ub }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#204060" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 40, position: [0, 0, 6] }}>
        <ambientLight intensity={1} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <mesh rotation={[0.4, f * 0.05, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshLambertMaterial color="#e0803a" />
        </mesh>
        {post ? <EffectComposer multisampling={ms} frameBufferType={ub ? THREE.UnsignedByteType : THREE.HalfFloatType}><primitive object={tone} dispose={null} /></EffectComposer> : null}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
