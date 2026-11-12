// Title layer of the cover image: same lettering as the captions (Montserrat 900, dark outline), kept inside the
// centre 4:5 area so it survives the crop of a Shorts grid.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import "@fontsource/montserrat/cyrillic-900.css";
import "@fontsource/montserrat/latin-900.css";

const line = (size: number, color: string): React.CSSProperties => ({
  fontSize: size, lineHeight: 1.02, color, WebkitTextStroke: `${Math.round(size * 0.17)}px #16101c`, paintOrder: "stroke fill",
  textShadow: `0 ${Math.round(size * 0.08)}px 0 rgba(22,16,28,0.6)`,
});

export const CoverTitle: React.FC = () => {
  const [handle] = useState(() => delayRender("cover font"));
  useEffect(() => { document.fonts.load("900 120px Montserrat", "200 ТОНН").then(() => continueRender(handle), () => continueRender(handle)); }, [handle]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(18,10,34,0.6) 0%, rgba(18,10,34,0.3) 24%, rgba(18,10,34,0) 40%)" }} />
      <AbsoluteFill style={{ alignItems: "center", fontFamily: "Montserrat, 'DejaVu Sans', sans-serif", fontWeight: 900, textTransform: "uppercase", textAlign: "center", letterSpacing: 1 }}>
        <div style={{ marginTop: 215, transform: "rotate(-3deg)" }}>
          <div style={line(168, "#ffd21e")}>200 тонн</div>
          <div style={{ ...line(112, "#ffffff"), marginTop: 18 }}>сломало</div>
          <div style={{ ...line(112, "#8fe3ff"), marginTop: 10 }}>ведро воды</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
