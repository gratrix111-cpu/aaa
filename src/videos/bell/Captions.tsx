// Word-timed captions (reference style: one to two words at a time, white bold sans, black outline, lower-middle,
// hard swaps). Timings come straight from the narration's word boundaries.
import React, { useMemo, useState, useEffect } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import "@fontsource/montserrat/cyrillic-900.css";
import "@fontsource/montserrat/latin-900.css";
import words from "../../../shorts/tsar-bell/voice/words.json";
import { FPS } from "./story";

type Word = { w: string; t0: number; t1: number; line: number };
type Chunk = { text: string; t0: number; t1: number };

/** short function words ride with the next word; a chunk never crosses a script line */
export function chunks(ws: Word[]): Chunk[] {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({ text: cur.map((x) => x.w).join(" "), t0: cur[0].t0, t1: cur[cur.length - 1].t1 }); cur = []; };
  ws.forEach((w, i) => {
    if (cur.length && cur[0].line !== w.line) flush();
    cur.push(w);
    const next = ws[i + 1], len = cur.reduce((n, x) => n + x.w.length, 0);
    const glue = w.w.length <= 3 && next && next.line === w.line && next.t0 - w.t1 < 0.2 && len + next.w.length <= 15 && cur.length < 3;
    if (!glue) flush();
  });
  flush();
  out.forEach((c, i) => { const n = out[i + 1]; c.t1 = n && n.t0 - c.t1 < 0.45 ? n.t0 : c.t1 + 0.25; });
  return out;
}

export const Captions: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const list = useMemo(() => chunks(words as Word[]), []);
  const [handle] = useState(() => delayRender("caption font"));
  useEffect(() => { document.fonts.load("900 80px Montserrat", "Колокол").then(() => continueRender(handle), () => continueRender(handle)); }, [handle]);
  const c = list.find((x) => t >= x.t0 - 0.02 && t < x.t1);
  if (!c) return null;
  const age = Math.round((t - c.t0) * FPS), pop = age <= 0 ? 0.9 : age === 1 ? 1.06 : 1;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
      <div style={{
        marginBottom: 380, padding: "0 60px", fontFamily: "Montserrat, 'DejaVu Sans', sans-serif", fontWeight: 900, fontSize: c.text.length > 12 ? 76 : 92,
        lineHeight: 1.05, color: "#ffffff", textTransform: "uppercase", textAlign: "center", letterSpacing: 1, transform: `scale(${pop})`,
        WebkitTextStroke: "14px #16101c", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(22,16,28,0.55)",
      }}>{c.text}</div>
    </AbsoluteFill>
  );
};
