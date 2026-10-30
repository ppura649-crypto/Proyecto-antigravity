import React from "react";
import type { CardProps } from "../props";
import { ACCENT, BAR_GREY, INK, MONO_FONT, MUTED } from "../theme";
import { at, easeOut, lerp, pop } from "./CKit";

// reference edit J V16 (kind `cthree`), the three kinds of file the tool watches, in their three words.
// Three empty slots draw, each fills with the real file that kind lives in, and then the
// verdict stamps: one changed, two did not.
//   "If" 59000        three empty slots draw
//   "hook," 59337     .claude/settings.json fills, with its SessionStart line
//   "task," 59857     .vscode/tasks.json, with runOn: folderOpen
//   "command" 60590   .mcp.json, with its "command" line
//   "changed" 60890   a terracotta ~ stamps the first and its line reddens
//   "or" 61190        grey = marks stamp the other two, and the picture holds through "not."

export type CThreeFile = { dir: string; file: string; dim: string; line: string; atMs: number; mark: string; markAtMs: number; hot?: boolean };
export type CThreeData = { files: CThreeFile[] };

export const CThree: React.FC<CardProps & { data: CThreeData }> = ({ tMs, w, h, beats, data }) => {
  const s = w / 1037;
  const files = data.files ?? [];
  const PAD = 16 * s;
  const GAP = 14 * s;
  const CW = (w - 2 * PAD - 2 * GAP) / 3;
  const CH = 400 * s;
  const top = (h - CH) / 2;
  const bIf = beats.if ?? 0;

  const mono = (px: number, color: string): React.CSSProperties => ({
    fontFamily: MONO_FONT, fontSize: px, color, whiteSpace: "pre", lineHeight: `${px * 1.34}px`,
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {files.map((f, i) => {
        const x = PAD + i * (CW + GAP);
        const k = easeOut(at(tMs, f.atMs, 260));
        const slotK = easeOut(at(tMs, bIf + i * 70, 220));
        const mk = at(tMs, f.markAtMs, 260);
        const hotK = f.hot ? easeOut(at(tMs, f.markAtMs, 200)) : 0;
        return (
          <React.Fragment key={f.file}>
            {/* the empty slot, drawn on "If" and handed to the file on its own word */}
            <div
              style={{
                position: "absolute", left: x, top, width: CW, height: CH,
                border: `${2.6 * s}px dashed ${MUTED}`, backgroundColor: "#0E1014", boxSizing: "border-box",
                opacity: 0.62 * slotK * (1 - k), transform: `scaleY(${lerp(0.86, 1, slotK)})`,
              }}
            />
            {/* the file itself */}
            <div
              style={{
                position: "absolute", left: x, top, width: CW, height: CH,
                opacity: k, transform: `scale(${lerp(0.94, 1, k)})`, transformOrigin: "50% 50%",
              }}
            >
              {/* the tab that makes it a file */}
              <div style={{ position: "absolute", left: 0, top: -14 * s, width: 96 * s, height: 16 * s, backgroundColor: "#14161B", borderLeft: `${1.6 * s}px solid ${BAR_GREY}`, borderTop: `${1.6 * s}px solid ${BAR_GREY}`, borderRight: `${1.6 * s}px solid ${BAR_GREY}` }} />
              <div style={{ position: "absolute", inset: 0, backgroundColor: "#14161B", border: `${1.6 * s}px solid ${BAR_GREY}`, boxSizing: "border-box" }} />

              <div style={{ position: "absolute", left: 16 * s, top: 14 * s, right: 16 * s }}>
                <div style={mono(24 * s, MUTED)}>{f.dir}</div>
                <div style={mono(26 * s, INK)}>{f.file}</div>
              </div>
              <div style={{ position: "absolute", left: 16 * s, right: 16 * s, top: 96 * s, height: 1.4 * s, backgroundColor: BAR_GREY }} />

              <div style={{ position: "absolute", left: 16 * s, top: 118 * s, right: 16 * s }}>
                <div style={mono(24 * s, MUTED)}>{f.dim}</div>
                <div style={{ position: "relative" }}>
                  <span style={{ ...mono(24 * s, INK), opacity: 1 - hotK }}>{f.line}</span>
                  <span style={{ ...mono(24 * s, ACCENT), position: "absolute", left: 0, top: 0, opacity: hotK }}>{f.line}</span>
                </div>
              </div>

              {/* the rest of the file, which nobody reads */}
              {[0.82, 0.6, 0.74, 0.42, 0.66].map((wf, b) => (
                <div key={b} style={{ position: "absolute", left: 16 * s, top: (208 + b * 30) * s, width: (CW - 32 * s) * wf, height: 8 * s, backgroundColor: BAR_GREY, opacity: 0.5 }} />
              ))}

              {/* the verdict */}
              <div
                style={{
                  position: "absolute", right: 14 * s, top: 8 * s,
                  fontFamily: MONO_FONT, fontWeight: 700, fontSize: 54 * s, lineHeight: 1,
                  color: f.hot ? ACCENT : MUTED,
                  opacity: easeOut(mk),
                  transform: `scale(${pop(mk)}) rotate(${f.hot ? -8 * (1 - easeOut(mk)) - 8 : 0}deg)`,
                  transformOrigin: "50% 50%",
                }}
              >
                {f.mark}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
