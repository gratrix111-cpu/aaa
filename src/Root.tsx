import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { GlTest } from "./GlTest";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="GlTest" component={GlTest} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={{ post: false }} />
    <Composition id="GlTestPost" component={GlTest} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={{ post: true }} />
    <Composition id="GlTestMs0" component={GlTest} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={{ post: true, ms: 0 }} />
    <Composition id="GlTestUb" component={GlTest} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={{ post: true, ub: true }} />
    <Composition id="GlTestMs0Ub" component={GlTest} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={{ post: true, ms: 0, ub: true }} />
  </>
);
