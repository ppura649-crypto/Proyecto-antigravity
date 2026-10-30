import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import {
  BFolderBack, BFolderFlap, BCheck, BRepoGlyph, FOLDER_R, FLAP_TOP,
  easeIO, easeOut, swell, at, mono, INK, MUTED, PANEL, RULE,
} from "./BShared";

// V2 "last month I pulled a project from GitHub that I thought was safe."
// The folder is BORN here. Top right, under the GitHub mark, a repo tile in GitHub's own
// grammar. On "pulled" it detaches and falls across the card, on "a project" it posts itself
// into the folder's mouth and is gone behind the flap, and the name it carried is now the
// folder's. On "GitHub" the mark pops brighter, on "safe." a green shield stamps the front.
// Everything the folder wears for the rest of the video starts here.

export type BornData = { repo?: string; stars?: string; updated?: string };

const TILE_W = 340, TILE_H = 146, TILE_X = 560, TILE_Y = 126;
const FOLD_W = 400, FOLD_X = 70, FOLD_Y = 240;
const FOLD_H = FOLD_W * FOLDER_R;
const MOUTH = FOLD_Y + FOLD_H * FLAP_TOP;   // the top edge of the front flap

export const BBorn: React.FC<CardProps & { data: BornData }> = ({ tMs, w, beats, assets, data }) => {
  const k = w / 972;
  const P = (v: number) => v * k;
  const repo = data.repo ?? "awesome-project";
  const stars = data.stars ?? "1.2k";
  const updated = data.updated ?? "Updated last week";

  const bPulled = beats.pulled ?? 4568;
  const bProject = beats.project ?? 5048;
  const bGithub = beats.github ?? 5468;
  const bSafe = beats.safe ?? 6728;

  const drop = easeIO(at(tMs, bPulled, 430));
  const into = easeOut(at(tMs, bProject, 280));
  const nameP = easeOut(at(tMs, bProject + 220, 240));
  const markPop = swell(at(tMs, bGithub, 360));
  const shield = at(tMs, bSafe, 300);

  // it lifts off its row and crosses the card into the folder's mouth. The clip at the flap's
  // top edge is what swallows it, so its type never shrinks below reading size.
  const lift = 18 * Math.sin(Math.PI * drop);
  const restX = TILE_X, intoX = FOLD_X + (FOLD_W - TILE_W) / 2;
  const x = restX + (intoX - restX) * drop;
  const restBottom = TILE_Y + TILE_H;
  const bottom = restBottom + (MOUTH + 6 - restBottom) * drop - lift + (TILE_H + 16) * into;
  const tilt = -7 * Math.sin(Math.PI * drop);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* the mark, nothing behind it */}
      <Img
        src={staticFile(assets[0])}
        style={{
          position: "absolute", left: P(TILE_X + TILE_W / 2 - 57), top: P(6), height: P(110), width: "auto",
          opacity: 0.86 + 0.14 * markPop,
          transform: `scale(${1 + 0.16 * markPop})`, transformOrigin: "50% 50%",
        }}
      />

      {/* the folder's back plate and tab */}
      <div style={{ position: "absolute", left: P(FOLD_X), top: P(FOLD_Y), width: P(FOLD_W), height: P(FOLD_H) }}>
        <BFolderBack w={P(FOLD_W)} open={0} uid="born" />
      </div>

      {/* everything above the mouth: the tile lives here and is clipped away as it goes in */}
      <div style={{ position: "absolute", left: 0, top: 0, width: P(972), height: P(MOUTH), overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", left: P(x), top: P(bottom - TILE_H),
            width: P(TILE_W), height: P(TILE_H),
            backgroundColor: PANEL, border: `${Math.max(1, P(2))}px solid ${RULE}`, boxSizing: "border-box",
            transformOrigin: "50% 100%", transform: `rotate(${tilt}deg)`,
            filter: drop > 0.02 ? `drop-shadow(0 ${P(16)}px ${P(26)}px rgba(0,0,0,0.75))` : undefined,
          }}
        >
          <div style={{ position: "absolute", left: P(16), top: P(18) }}><BRepoGlyph size={P(24)} /></div>
          <div style={{ position: "absolute", left: P(48), top: P(16), ...mono(P(28), INK) }}>{repo}</div>
          <div style={{ position: "absolute", left: P(16), top: P(60), ...mono(P(26), MUTED) }}>{`★ ${stars}`}</div>
          <div style={{ position: "absolute", left: P(292), top: P(56) }}><BCheck size={P(28)} /></div>
          <div style={{ position: "absolute", left: P(16), top: P(104), ...mono(P(26), MUTED) }}>{updated}</div>
        </div>
      </div>

      {/* the flap closes over whatever went in */}
      <div style={{ position: "absolute", left: P(FOLD_X), top: P(FOLD_Y), width: P(FOLD_W), height: P(FOLD_H) }}>
        <BFolderFlap w={P(FOLD_W)} open={0} uid="born" shield={shield} />
      </div>

      {/* the name the folder took from the tile */}
      <div
        style={{
          position: "absolute", left: P(FOLD_X - 60), top: P(FOLD_Y + FOLD_H + 10), width: P(FOLD_W + 120),
          textAlign: "center", ...mono(P(34), INK), lineHeight: 1.3,
          opacity: nameP, transform: `translateY(${P(10 * (1 - nameP))}px)`,
        }}
      >
        {repo}
      </div>
    </div>
  );
};
