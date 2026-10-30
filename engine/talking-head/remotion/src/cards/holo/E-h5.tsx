import React from "react";
import { Easing } from "remotion";
import { Bubble, ClaudeFrame, Composer, Reply, contentBottom, type Line } from "./E-claude";
import { Checklist, RV, peelSet } from "./E-todo";
import { HoloHandover, flyInto } from "./E-holo";
import { calm, mix, pick, ramp, type BeatsE } from "./E-util";
// reference edit K hook 5 (family E): "If your marketing plan from Claude just became another to-do list, you need to
// watch this." + the hook-4 bridge. Opens mid-conversation (unlike hook 4's empty chat): Claude is already
// streaming a markdown 30-Day Marketing Plan. BECAME: the bullets peel into a checklist; TO-DO: it keeps
// growing; it sits at 0 done; HAND: the list lifts; WHOLE: it flies into Holo -> the URL field.

export const PROMPT5 = "Make me a 30-day marketing plan";
const W: [string, string[]][] = [
  ["Week 1: Foundation", ["Define your ideal customer", "Audit your top 3 competitors", "Write your brand voice guide",
    "Set up tracking on your site", "Pick 2 channels to focus on", "Build a content calendar"]],
  ["Week 2: Content", ["Write 5 Instagram posts", "Shoot 3 short product videos", "Design 4 ad creatives",
    "Draft a welcome email sequence", "Write 2 blog posts for SEO", "Collect 3 customer reviews"]],
  ["Week 3: Launch", ["Launch your first Meta ads", "Post daily on both channels", "Send your first newsletter",
    "Reply to every comment and DM", "Test 2 headlines per ad"]],
  ["Week 4: Optimize", ["Review ad results every week", "Pause the ads that underperform", "Double down on the best post",
    "Retarget your site visitors", "Plan next month's content", "Share the results with your team"]],
];
export const LINES5: Line[] = [
  { k: "h1", t: "30-Day Marketing Plan" }, { k: "p", t: "Built around your brand, week by week:" },
  ...W.flatMap(([h, items]) => [{ k: "h2" as const, t: h }, ...items.map((t) => ({ k: "li" as const, t }))]),
];
const WIN = { x: 40, y: 17, w: 1000, h: 600 };
const COMP_Y = WIN.h - 142 - 22, VH = COMP_Y - RV.top - 14;
const N0 = 64; // on frame 0 the title and the intro are there and Week 1 is starting to stream
const streamed = (t: number) => N0 + Math.max(0, t) * 0.05;
const scrollAt = (n: number) => Math.max(0, contentBottom(LINES5, n) + 56 - VH);

export const Hook5: React.FC<{ t: number; fps: number; b: BeatsE; assets: string[] }> = ({ t, fps, b, assets }) => {
  const spark = pick(assets, "famE-claude.png");
  const nB = streamed(b.became!);
  const n = Math.min(streamed(t), nB);           // the stream stops where the peel starts
  const peel = peelSet(LINES5, nB, scrollAt(nB), VH);
  const after = t >= b.became!;
  const chatOut = ramp(t, b.became! + 80, b.became! + 420);
  const push = 1 + 0.03 * ramp(t, -200, b.hand!, Easing.linear);
  const lift = calm(t, b.hand!, fps);
  const sc = push * mix(1, 0.92, lift);
  if (t >= b.whole! + 470) return <HoloHandover t={t} fps={fps} b={b} assets={assets} />;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <HoloHandover t={t} fps={fps} b={b} assets={assets} />
      <div style={{ position: "absolute", inset: 0, ...flyInto(t, b, 540, 317) }}>
        <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, transformOrigin: "50% 50%",
          transform: `scale(${sc}) translateY(${-10 * lift}px)` }}>
          {chatOut < 1 && (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - chatOut }}>
              <ClaudeFrame spark={spark} w={WIN.w} h={WIN.h}>
                <div style={{ position: "absolute", right: 40, top: 92 }}><Bubble text={PROMPT5} /></div>
                <div style={{ position: "absolute", left: RV.left, right: RV.left, top: RV.top }}>
                  <Reply lines={LINES5} skip={after ? peel : undefined}
                    n={n} vh={VH} spark={spark} rot={(t / 1000) * 90} streaming={!after} scroll={scrollAt(n)} />
                </div>
                <div style={{ position: "absolute", left: 60, top: COMP_Y }}><Composer w={880} /></div>
              </ClaudeFrame>
            </div>
          )}
          {after && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", boxShadow: chatOut >= 1 ? `0 ${26 + 20 * lift}px ${60 + 20 * lift}px rgba(0,0,0,0.5)` : undefined }}>
              <Checklist t={t} b={b} lines={LINES5} peel={peel} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
