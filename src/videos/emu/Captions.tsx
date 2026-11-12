// Word-timed captions (reference style: one to three words at a time, white bold sans, black outline, lower-middle,
// hard swaps). Timings come from the draft narration's word boundaries; a chunk never crosses a sentence.
import React, { useMemo, useState, useEffect } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import "@fontsource/montserrat/cyrillic-900.css";
import "@fontsource/montserrat/latin-900.css";
import words from "../../../shorts/emu-war/voice/words.json";
import { FPS, SHOTS } from "./story";

type Word = { w: string; t0: number; t1: number; line: number };
type Chunk = { text: string; t0: number; t1: number; line: number };

/** word groups shown as one caption: [spoken words, caption]. Numbers are spoken as words but read faster as digits;
 *  the rest keeps set phrases together. */
const GROUPS: [string, string][] = [
  ["в тысяча девятьсот тридцать втором году", "в 1932 году"],
  ["двадцать тысяч", "20 000"],
  ["десять тысяч", "10 000"],
  ["тысяча птиц", "1000 птиц"],
  ["десять патронов", "10 патронов"],
  ["при первых же", "при первых же"],
  ["выстояла бы", "выстояла бы"],
  ["а эму", "а эму"],
  ["до сих пор", "до сих пор"],
];
export function groups(ws: Word[]): Word[] {
  const out: Word[] = [];
  for (let i = 0; i < ws.length;) {
    const hit = GROUPS.map(([from, to]) => ({ p: from.split(" "), to })).find(({ p }) => p.every((x, k) => ws[i + k]?.line === ws[i].line && ws[i + k].w.toLowerCase() === x));
    if (hit) { out.push({ w: hit.to, t0: ws[i].t0, t1: ws[i + hit.p.length - 1].t1, line: ws[i].line }); i += hit.p.length; }
    else out.push(ws[i++]);
  }
  return out;
}

/** short function words ride with the next word; a chunk never crosses a script line */
export function chunks(ws: Word[]): Chunk[] {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({ text: cur.map((x) => x.w).join(" "), t0: cur[0].t0, t1: cur[cur.length - 1].t1, line: cur[0].line }); cur = []; };
  ws.forEach((w, i) => {
    if (cur.length && cur[0].line !== w.line) flush();
    cur.push(w);
    const next = ws[i + 1], len = cur.reduce((n, x) => n + x.w.length, 0);
    const glue = w.w.length <= 3 && next && next.line === w.line && next.t0 - w.t1 < 0.2 && len + next.w.length <= 15 && cur.length < 3;
    if (!glue) flush();
  });
  flush();
  out.forEach((c, i) => {
    const n = out[i + 1];
    if (n && n.line === c.line) { c.t1 = n.t0 - c.t1 < 0.45 ? n.t0 : c.t1 + 0.25; return; }
    // the last words of a sentence never hang over the cut that follows them
    const cut = SHOTS.find((s) => s.b > c.t1 - 0.05)?.b ?? Infinity;
    c.t1 = Math.min(c.t1 + 0.3, cut, n ? n.t0 : Infinity);
  });
  return out;
}

export const Captions: React.FC<{ t: number }> = ({ t }) => {
  const list = useMemo(() => chunks(groups(words as Word[])), []);
  const [handle] = useState(() => delayRender("caption font"));
  useEffect(() => { document.fonts.load("900 80px Montserrat", "Эму 50 км/ч").then(() => continueRender(handle), () => continueRender(handle)); }, [handle]);
  const c = list.find((x) => t >= x.t0 - 0.02 && t < x.t1);
  if (!c) return null;
  const age = Math.round((t - c.t0) * FPS), pop = age <= 0 ? 0.9 : age === 1 ? 1.06 : 1;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
      <div style={{
        marginBottom: 380, padding: "0 60px", fontFamily: "Montserrat, 'DejaVu Sans', sans-serif", fontWeight: 900, fontSize: c.text.length > 12 ? 78 : 96,
        lineHeight: 1.05, color: "#ffffff", textTransform: "uppercase", textAlign: "center", letterSpacing: 1, transform: `scale(${pop})`,
        WebkitTextStroke: "15px #16101c", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(22,16,28,0.55)",
      }}>{c.text}</div>
    </AbsoluteFill>
  );
};
