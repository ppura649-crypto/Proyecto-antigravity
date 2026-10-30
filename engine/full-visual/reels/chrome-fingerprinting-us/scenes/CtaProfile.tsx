// Instagram's profile header for the creator, redrawn at the layout instagram.com uses in a narrow window: the round
// portrait, the three counts, the handle and bio, the Follow / Message buttons. Counts and bio are an
// invented stand-in account: 132 posts, 48,030 followers, 180 following.
import React from "react";
import { Img } from "remotion";
import { blurIn, ease, mix, on, pop, prog, stagger, useScene } from "../../../src/engine";
import { asset } from "./parts";

export const IG_BLUE = "#0095F6";
export const PROFILE = { avatar: 176, pad: 44, statsTop: 52, nameTop: 236, btnTop: 346, btnH: 72, btnW: 394, height: 462 };
const STATS = [
  { n: "132", label: "posts" },
  { n: "48K", label: "followers" },
  { n: "180", label: "following" },
];
export const statX = (i: number) => 360 + i * 205; // centre of each count, page coordinates

export const Profile: React.FC<{ at: number; tap: number }> = ({ at, tap }) => {
  const { f, theme } = useScene();
  const ink = "#0C1014";
  const followed = f >= tap + 2;
  const press = on(f, tap, tap + 6) ? 0.94 : 1;
  const plus = prog(f, tap + 4, 40, ease.out);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", fontFamily: theme.font.ui }}>
      <Img
        src={asset("avatar-creator.png")}
        style={{ position: "absolute", left: PROFILE.pad, top: 34, width: PROFILE.avatar, height: PROFILE.avatar, borderRadius: 999, objectFit: "cover", ...pop(f, at, { dur: 10, from: 0.7 }) }}
      />
      {STATS.map((s, i) => (
        <div key={s.label} style={{ position: "absolute", left: statX(i) - 100, width: 200, top: PROFILE.statsTop, textAlign: "center", ...blurIn(f, stagger(at + 3, i, 4), { dur: 8, rise: 12 }) }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: ink, lineHeight: "52px" }}>{s.n}</div>
          <div style={{ fontSize: 32, color: ink, lineHeight: "40px" }}>{s.label}</div>
        </div>
      ))}
      {/* the follow lands as Instagram shows it: 48,031 still rounds to 48K, so the count holds and a +1 rises off it */}
      {on(f, tap + 4, tap + 48) && (
        <div style={{ position: "absolute", left: statX(1) + 56, top: PROFILE.statsTop - 6 - 34 * plus, fontSize: 36, fontWeight: 800, color: IG_BLUE, opacity: 1 - prog(f, tap + 30, 16), ...pop(f, tap + 4, { dur: 8, from: 0.5 }) }}>
          +1
        </div>
      )}
      <div style={{ position: "absolute", left: PROFILE.pad, top: PROFILE.nameTop, ...blurIn(f, at + 10, { dur: 8, rise: 12 }) }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: ink, lineHeight: "44px" }}>your.handle</div>
        <div style={{ fontSize: 34, color: ink, lineHeight: "44px", marginTop: 4 }}>Building with AI daily</div>
      </div>
      <div style={{ position: "absolute", left: PROFILE.pad, top: PROFILE.btnTop, display: "flex", gap: 24, ...blurIn(f, at + 14, { dur: 8, rise: 12 }) }}>
        <div
          style={{
            width: PROFILE.btnW, height: PROFILE.btnH, borderRadius: 16, background: mix(f, tap + 1, 6, IG_BLUE, "#EFEFEF"),
            color: followed ? ink : "#FFFFFF", fontSize: 34, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transform: `scale(${press})`,
          }}
        >
          {followed ? "Following" : "Follow"}
          {followed && (
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </div>
        <div style={{ width: PROFILE.btnW, height: PROFILE.btnH, borderRadius: 16, background: "#EFEFEF", color: ink, fontSize: 34, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Message
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: "#DBDBDB" }} />
    </div>
  );
};
