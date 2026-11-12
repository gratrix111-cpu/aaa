import React from "react";
import { Composition } from "remotion";
import { BellShort, BellCover, BELL_FRAMES } from "./videos/bell/Bell";
import { EmuShort, EmuKeys, EmuCover, EmuProps, EMU_FRAMES } from "./videos/emu/Emu";

export const Root: React.FC = () => (
  <>
    <Composition id="BellShort" component={BellShort} durationInFrames={BELL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BellCover" component={BellCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="EmuShort" component={EmuShort} durationInFrames={EMU_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="EmuCover" component={EmuCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="EmuKeys" component={EmuKeys} durationInFrames={1} fps={30} width={1080} height={1920}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, ((props as EmuProps).keys ?? []).length) })} />
  </>
);
