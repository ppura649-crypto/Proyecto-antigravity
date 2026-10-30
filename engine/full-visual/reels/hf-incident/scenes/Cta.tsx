// cta, light, 113.5-116.0 s: 'Comment "SWARM" and I'll send you the full reports.'
// First frame: Instagram's comment sheet rising under the reel, empty ("No comments yet"). "Comment": the cursor taps
// the input; "SWARM": typed key by key, the blue send button pops, the cursor sends it and the comment lands in the
// list. "and": your.handle's DM drops in as the in-app banner ("here are the full reports", Instagram mark); its three
// report cards (OpenAI, Hugging Face, METR, titles from facts.md section 8) pop in, the last one on "reports".
// Adapted from reels/desert-ant-us/scenes/Cta.tsx.
import React from "react";
import { Column, Cursor, Travel, blurIn, ease, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { CTA_BLUE, CTA_GREY, CTA_INK, CTA_INPUT, CTA_SHEET, CTA_VIEWER, CtaAvatar, CtaComment, CtaDm } from "./CtaBits";

type CT = { comment: number; typeAt: number; post: number; dm: number; cards: number };
const WORD = "SWARM";

const CtaInput: React.FC<{ t: CT }> = ({ t }) => {
  const { f } = useScene();
  const I = CTA_INPUT;
  const n = f < t.typeAt ? 0 : Math.min(WORD.length, 1 + Math.floor((f - t.typeAt) / 4));
  const focused = f >= t.comment + 10 && f < t.post;
  const text = focused ? WORD.slice(0, n) : "";
  const caret = focused && (Math.floor(f / 18) % 2 === 0 || n < WORD.length);
  const send = focused && n > 0;
  return (
    <>
      <div style={{ position: "absolute", left: 30, top: I.y + 4 }}>
        <CtaAvatar src={CTA_VIEWER.face} size={68} />
      </div>
      <div style={{ position: "absolute", left: I.x, top: I.y, width: I.w, height: I.h, borderRadius: 38, boxShadow: `inset 0 0 0 2px ${focused ? "#A8A8A8" : "#DBDBDB"}`, display: "flex", alignItems: "center", padding: "0 28px", fontFamily: "Inter", fontSize: 36, fontWeight: text ? 600 : 400, color: text ? CTA_INK : CTA_GREY, whiteSpace: "pre" }}>
        {text || (focused ? "" : "Add a comment...")}
        {caret && <span style={{ display: "inline-block", width: 3, height: 40, background: CTA_BLUE, marginLeft: 2 }} />}
      </div>
      {send && (
        <div style={{ position: "absolute", left: I.x + I.w - 66, top: I.y + 10, width: 56, height: 56, borderRadius: 28, background: CTA_BLUE, display: "flex", alignItems: "center", justifyContent: "center", transform: f >= t.post - 4 ? "scale(0.88)" : undefined, ...pop(f, t.typeAt, { dur: 8 }) }}>
          <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        </div>
      )}
    </>
  );
};

const CtaList: React.FC<{ t: CT }> = ({ t }) => {
  const { f } = useScene();
  const empty = 1 - prog(f, t.post, 6, ease.linear);
  return (
    <>
      {empty > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: "Inter", opacity: empty }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: CTA_INK }}>No comments yet</div>
          <div style={{ fontSize: 32, color: CTA_GREY, marginTop: 12 }}>Start the conversation.</div>
        </div>
      )}
      {f >= t.post && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 136, ...blurIn(f, t.post, { dur: 8, rise: 30 }) }}>
          <CtaComment face={CTA_VIEWER.face} handle={CTA_VIEWER.handle} text={WORD} />
        </div>
      )}
    </>
  );
};

export const Cta: React.FC = () => {
  const { cue, scene } = useScene();
  const t0 = scene.from - LEAD;
  const t: CT = { comment: cue("comment"), typeAt: cue("swarm") - 8, post: cue("swarm") + 20, dm: cue("and"), cards: cue("reports") - 12 };
  const S = CTA_SHEET;
  const field = { x: S.x + CTA_INPUT.x + 200, y: S.y + CTA_INPUT.y + 20 };
  const sendB = { x: S.x + CTA_INPUT.x + CTA_INPUT.w - 42, y: S.y + CTA_INPUT.y + 30 };
  return (
    <Column>
      <Travel at={t0} from="bottom" dist={1000} dur={22} curve="measured" style={{ position: "absolute", left: S.x, top: S.y }}>
        <div style={{ position: "relative", width: S.w, height: S.h, borderRadius: 40, background: "#FFFFFF", overflow: "hidden", boxShadow: "0 40px 90px rgba(20,24,40,0.16), 0 0 0 1.5px rgba(0,0,0,0.06)" }}>
          <div style={{ position: "absolute", left: S.w / 2 - 40, top: 16, width: 80, height: 9, borderRadius: 5, background: "#C7C7CC" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 42, textAlign: "center", fontFamily: "Inter", fontSize: 36, fontWeight: 700, color: CTA_INK }}>Comments</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 108, height: 1.5, background: "#DBDBDB" }} />
          <CtaList t={t} />
          <div style={{ position: "absolute", left: 0, right: 0, top: CTA_INPUT.y - 12, height: 1.5, background: "#DBDBDB" }} />
          <CtaInput t={t} />
          <CtaDm at={t.dm} cards={t.cards} />
        </div>
      </Travel>
      <Cursor
        path={[
          { f: t.comment - 6, x: 760, y: 1370 },
          { f: t.comment + 8, x: field.x, y: field.y },
          { f: t.typeAt + 14, x: field.x + 50, y: field.y + 24 },
          { f: t.post - 5, x: sendB.x - 8, y: sendB.y - 8 },
          { f: t.post + 5, x: sendB.x - 8, y: sendB.y - 8 },
          { f: t.post + 30, x: 640, y: 1300 },
          { f: t.post + 900, x: 640, y: 1300 },
        ]}
      />
    </Column>
  );
};
