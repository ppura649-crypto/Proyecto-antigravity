// The hook: "Google Chrome is just another spyware, let me tell you exactly why:"
// The real Chrome mark spins in big and centred and is named; a Chrome window rises under it; on "just" the mark
// flies into the omnibox as Chrome's own page chip. On "spyware," the frame turns red, shakes, and SPYWARE slams onto
// the empty tab; on "let" the stamp shrinks into a red badge on the tab strip. A cursor clicks the omnibox,
// aliexpress.com types and finishes on "why:", and the tab becomes AliExpress. Ends on HANDOFF.hookWindow.
import React from "react";
import { Cursor, Travel, arrive, blurIn, blurOut, ease, on, pop, prog, typeOn, useScene } from "../../../src/engine";
import { ChromeWindow, Logo, RED } from "./parts";
import { AliMark, AliPage, HW, OMNI, SpyStamp } from "./HookBits";

const URL = "aliexpress.com";
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const HERO = { cx: 540, cy: HW.top + 372, size: 290 };

/** the times of the hook, all from words */
function useBeats() {
  const { scene, cue, endsOn, fps } = useScene();
  const typeDur = Math.ceil((URL.length * 36 * fps) / 1000);
  const why = cue("why");
  return {
    born: scene.from + 3, // f3: the first stage object, right after the first caption word
    win: scene.from + 5,
    google: cue("Google"),
    chrome: cue("Chrome"),
    fly: cue("just") - 2,
    spy: cue("spyware"),
    park: cue("let"),
    click: endsOn("why", typeDur + 9),
    type: endsOn("why", typeDur),
    why,
  };
}

/** the real Chrome mark: spins in big at centre, is named, then flies into the omnibox and becomes its page chip */
const Mark: React.FC = () => {
  const { f, theme } = useScene();
  const b = useBeats();
  const spin = arrive(f, b.born, 28);
  const k = arrive(f, b.fly, 22);
  const size = lerp(HERO.size, 36, k);
  const cx = lerp(HERO.cx, OMNI.iconCx, k);
  const cy = lerp(HERO.cy, OMNI.cy, k);
  const rot = (1 - spin) * -340 + k * 360;
  const gone = prog(f, b.click, 8);
  const chip = prog(f, b.fly + 14, 8);
  return (
    <>
      {/* Chrome's own page chip for a chrome:// page: the mark and the word, in the omnibox's left slot */}
      {on(f, b.fly + 14) && (
        <div style={{ position: "absolute", left: OMNI.left + 8, top: OMNI.top + 4, height: OMNI.height - 8, width: 176, borderRadius: 99, background: "#303134", opacity: chip * (1 - gone), display: "flex", alignItems: "center", paddingLeft: 60, boxSizing: "border-box", fontFamily: theme.font.ui, fontSize: 30, color: "#E8EAED" }}>
          Chrome
        </div>
      )}
      <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size, opacity: prog(f, b.born, 5) * (1 - gone), transform: `rotate(${rot.toFixed(1)}deg) scale(${(0.22 + 0.78 * spin).toFixed(3)})` }}>
        <Logo name="chrome" size={size} />
      </div>
      {/* the name, big, under the mark, word by word with the voice */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: HERO.cy + HERO.size / 2 + 34, display: "flex", justifyContent: "center", gap: 20, fontFamily: theme.font.ui, fontSize: 64, fontWeight: 800, color: "#FFFFFF", transform: `translateX(${((1 - prog(f, b.chrome, 12)) * 128).toFixed(1)}px)`, ...(f >= b.fly ? blurOut(f, b.fly, { dur: 8 }) : {}) }}>
        <span style={blurIn(f, b.google + 3, { dur: 6, rise: 14 })}>Google</span>
        <span style={blurIn(f, b.chrome, { dur: 6, rise: 14 })}>Chrome</span>
      </div>
    </>
  );
};

/** the window's content by beat: an empty new tab, then AliExpress once the url is in */
const Window: React.FC = () => {
  const { f, fps } = useScene();
  const b = useBeats();
  const typed = typeOn(URL, f, b.type, fps);
  const loaded = f >= b.why;
  // the red hit: the whole frame turns the reel's red for 10 frames and shakes, then settles back
  const red = f < b.spy ? 0 : f < b.spy + 10 ? 1 : 1 - prog(f, b.spy + 10, 10);
  const shake = on(f, b.spy, b.spy + 12) ? Math.sin((f - b.spy) * 2.3) * 12 * (1 - (f - b.spy) / 12) : 0;
  const caret = f < b.fly + 10 || (f >= b.click && !loaded);
  return (
    <Travel at={b.win} from="bottom" dist={1380} dur={26} curve="measured" style={{ position: "absolute", left: HW.left, top: HW.top }}>
      <div style={{ transform: `translateX(${shake.toFixed(2)}px)` }}>
        <ChromeWindow
          width={HW.width}
          height={HW.height}
          mode="dark"
          tint={{ color: RED, amount: red }}
          favicon={loaded ? <div style={pop(f, b.why, { dur: 10, from: 0.4 })}><AliMark size={32} /></div> : undefined}
          tabTitle={loaded ? <span style={blurIn(f, b.why, { dur: 6 })}>AliExpress</span> : "New Tab"}
          url={f >= b.click ? (loaded ? URL : typed.text) : ""}
          caret={caret}
        >
          {loaded && <AliPage at={b.why + 2} />}
        </ChromeWindow>
      </div>
    </Travel>
  );
};

/** the click: a focus ring on the omnibox while the url is typed */
const Focus: React.FC = () => {
  const { f } = useScene();
  const b = useBeats();
  if (!on(f, b.click, b.why + 8)) return null;
  const o = prog(f, b.click, 4, ease.linear) * (1 - prog(f, b.why, 8));
  return <div style={{ position: "absolute", left: OMNI.left - 3, top: OMNI.top - 3, width: OMNI.width + 6, height: OMNI.height + 6, borderRadius: 99, border: "3px solid #8AB4F8", boxSizing: "border-box", opacity: o }} />;
};

/** Chrome's suggestion popup under the omnibox while the url is typed: the site is suggested as it is typed */
const Suggest: React.FC = () => {
  const { f, fps, theme } = useScene();
  const b = useBeats();
  if (!on(f, b.click + 4, b.why + 8)) return null;
  const typed = typeOn(URL, f, b.type, fps).text;
  const rows = [typed.length > 0 ? `${typed} - Google Search` : null, typed.length >= 4 ? URL : null].filter(Boolean) as string[];
  const style = f >= b.why ? blurOut(f, b.why, { dur: 8 }) : blurIn(f, b.click + 4, { dur: 7, rise: -10 });
  return (
    <div style={{ position: "absolute", left: OMNI.left, top: OMNI.top + OMNI.height + 8, width: OMNI.width, borderRadius: 22, background: "#303134", padding: rows.length ? "10px 0" : 0, boxShadow: "0 18px 40px rgba(0,0,0,0.5)", fontFamily: theme.font.ui, ...style }}>
      {rows.map((r, i) => (
        <div key={i} style={{ height: 64, display: "flex", alignItems: "center", gap: 20, padding: "0 26px", fontSize: 30, color: "#E8EAED", background: i === rows.length - 1 && rows.length > 1 ? "#3C4043" : undefined, ...(i === 1 ? pop(f, b.type + 11, { dur: 8, from: 0.94 }) : {}) }}>
          <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#9AA0A6" strokeWidth={2}>
            {i === 0 ? <><circle cx={10.5} cy={10.5} r={6.5} /><path d="M15.5 15.5L21 21" strokeLinecap="round" /></> : <><circle cx={12} cy={12} r={9} /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></>}
          </svg>
          {r}
        </div>
      ))}
    </div>
  );
};

export const Hook: React.FC = () => {
  const { f } = useScene();
  const b = useBeats();
  const tx = OMNI.left + 290;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Window />
      <Focus />
      <Suggest />
      <Mark />
      <SpyStamp at={b.spy} park={b.park} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - prog(f, b.why + 4, 10) }}>
      <Cursor
        path={[
          { f: b.click - 22, x: 820, y: 1330 },
          { f: b.click - 1, x: tx, y: OMNI.cy - 6 },
          { f: b.why + 6, x: tx + 30, y: OMNI.cy + 90 },
        ]}
        until={b.why + 14}
      />
      </div>
    </div>
  );
};
