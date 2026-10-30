// "Ok so here's what just happened: A developer just proved that AliExpress and Alibaba are spying on us and we
// don't really know what they're using it for or what they're doing."
// The Chrome window from the hook parks as a tile (HANDOFF.tileWindow) and stays. The developer's real post rises
// under it and lands on "happened:", title first. "developer" lights the author line (text only, no face);
// "proved" selects "WebAudio fingerprinting" in the title; the AliExpress and Alibaba marks dock beside the tile on
// their words; on "spying" the post scrolls, Apple-smooth, to the two script names, which select; on "using" it
// scrolls to the developer's own sentence, selected line by line, the last line finishing on "doing.".
import React from "react";
import { Easing } from "remotion";
import { Travel, arrive, prog, useScene } from "../../../src/engine";
import { ChromeWindow, HANDOFF } from "./parts";
import { AliMark, AliPage, AlibabaMark, HW } from "./HookBits";
import { BlogPost, DOC } from "./BlogPost";

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const PANEL = { left: 90, top: 790, width: 900, height: 650 };
const MARK = 150;
const apple = Easing.bezier(0.32, 0.72, 0, 1); // a long, soft landing, like a trackpad fling
const SCROLL = 46;
const DRIFT = 0.22; // px per frame the page keeps gliding after it lands: the idle floor while a line is read

/** the tile: the hook's window, identical, shrinking from full size to a third, top left */
const Tile: React.FC = () => {
  const { f, scene } = useScene();
  const t = HANDOFF.tileWindow;
  const k = arrive(f, scene.from, 30);
  return (
    <div style={{ position: "absolute", left: lerp(HW.left, t.left, k), top: lerp(HW.top, t.top, k), transform: `scale(${lerp(1, t.scale, k).toFixed(4)})`, transformOrigin: "0 0" }}>
      <ChromeWindow width={HW.width} height={HW.height} mode="dark" favicon={<AliMark size={32} />} tabTitle="AliExpress" url="aliexpress.com">
        <AliPage />
      </ChromeWindow>
    </div>
  );
};

/** the post's scroll position in document px: two Apple-like glides, each landing on its word, with a slow drift */
function useScroll(land: number) {
  const { f, cue, endsOn } = useScene();
  const s1 = endsOn("spying", SCROLL - 6);
  const s2 = endsOn("using", SCROLL - 6);
  const at = (fr: number) => {
    const drift = DRIFT * Math.max(0, fr - land);
    const t1 = DOC.scripts - 40 - DRIFT * (s1 + SCROLL - land);
    const t2 = DOC.quote - 20 - DRIFT * (s2 + SCROLL - land);
    return drift + t1 * prog(fr, s1, SCROLL, apple) + (t2 - t1) * prog(fr, s2, SCROLL, apple);
  };
  return { y: at(f), v: Math.abs(at(f) - at(f - 1)), s1, s2, spying: cue("spying") };
}

const Post: React.FC = () => {
  const { f, cue, endsOn } = useScene();
  const rise = endsOn("happened", 30);
  const sc = useScroll(rise + 30);
  const doing = cue("doing");
  const q0 = cue("using");
  const half = (doing - q0) / 2;
  const blur = Math.min(9, sc.v * 0.16);
  return (
    <Travel at={rise} from="bottom" dist={1100} dur={26} curve="measured" style={{ position: "absolute", left: PANEL.left, top: PANEL.top }}>
      <div style={{ width: PANEL.width, height: PANEL.height, borderRadius: 16, overflow: "hidden", background: "#333333", boxShadow: "0 30px 80px rgba(0,0,0,0.28)", position: "relative" }}>
        {blur > 0.4 && (
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <filter id="post-scroll" x="-5%" y="-10%" width="110%" height="120%">
              <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
            </filter>
          </svg>
        )}
        <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${(-sc.y).toFixed(2)}px)`, filter: blur > 0.4 ? "url(#post-scroll)" : undefined }}>
          <BlogPost
            m={{
              byline: prog(f, cue("developer"), 12),
              proof: prog(f, cue("proved"), 12),
              collina: prog(f, sc.spying, 10),
              fireye: prog(f, sc.spying + 8, 10),
              alibaba: prog(f, cue("us"), 12),
              quote: [prog(f, q0, half), prog(f, q0 + half, doing - q0 - half)],
            }}
          />
        </div>
      </div>
    </Travel>
  );
};

/** the two companies, docked beside the tile on their words: a short L1 slide from the right, sharp on the word */
const Dock: React.FC = () => {
  const { f, cue } = useScene();
  const t = HANDOFF.tileWindow;
  const cy = t.top + (HW.height * t.scale) / 2;
  const slide = (at: number): React.CSSProperties => {
    const k = arrive(f, at, 18);
    return { position: "absolute", top: cy - MARK / 2, opacity: prog(f, at, 3), transform: `translateX(${((1 - k) * 300).toFixed(1)}px)`, filter: k < 0.97 ? `blur(${((1 - k) * 14).toFixed(2)}px)` : undefined };
  };
  const ae = cue("AliExpress") - 10;
  const ab = cue("Alibaba") - 10;
  return (
    <>
      {f >= ae && <div style={{ ...slide(ae), left: 560 }}><AliMark size={MARK} /></div>}
      {f >= ab && <div style={{ ...slide(ab), left: 770 }}><AlibabaMark size={MARK} /></div>}
    </>
  );
};

export const Developer: React.FC = () => (
  <div style={{ position: "absolute", inset: 0 }}>
    <Post />
    <Tile />
    <Dock />
  </div>
);
