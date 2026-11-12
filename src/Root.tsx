import React from "react";
import { Composition } from "remotion";
import { BellShort, BELL_FRAMES } from "./videos/bell/Bell";

export const Root: React.FC = () => (
  <>
    <Composition id="BellShort" component={BellShort} durationInFrames={BELL_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
