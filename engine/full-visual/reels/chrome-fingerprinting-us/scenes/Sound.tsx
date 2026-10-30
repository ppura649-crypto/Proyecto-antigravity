// "Basically, when you open AliExpress or Alibaba on your computer, it starts playing a sound. But you can't hear it,
// because the volume is set to zero. It's running inside your browser, and it's used to recognize your device."
// The Chrome tile grows back to full size and AliExpress loads in it; Alibaba opens in a second tab. On "sound." the
// window deepens, the page goes translucent and the real audio graph from the developer's post draws beneath it, a
// live sawtooth running through it. The Gain rolls to 0 on "zero." and everything after it goes flat. On "browser,"
// the graph folds back into the tab (a small live wave stays on the title), and on "device." the laptop card slides
// out from under the window with an empty device ID field. Ends exactly on HANDOFF.soundWindow + HANDOFF.device.
import React from "react";
import { Travel, arrive, blurOut, countTo, ease, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { ChromeWindow, DeviceCard, HANDOFF, Logo, WAVE } from "./parts";
import { AliPage, Throbber } from "./SoundPage";
import { SoundChain } from "./SoundChain";

const BAR = 162; // the window's tab strip + toolbar, above the page
const FAV = { x: 178, y: 47 }; // the favicon's centre, in window pixels: where the graph folds to

/** the small live wave that stays on the tab title once the graph has folded into it */
const TabWave: React.FC<{ at: number }> = ({ at }) => {
  const { f } = useScene();
  const k = prog(f, at, 10);
  const x0 = -((f * 1.2) % 14);
  let d = "";
  for (let x = x0; x < 44; x += 14) d += `M${x.toFixed(1)},20 L${(x + 14).toFixed(1)},6 L${(x + 14).toFixed(1)},20 `;
  return (
    <svg width={44} height={26} style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 14, opacity: k, transform: `scale(${0.6 + 0.4 * k})` }}>
      <path d={d} fill="none" stroke={WAVE} strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
};

/** the second site of the sentence, as Chrome's inactive tab next to the active one */
const AlibabaTab: React.FC<{ at: number; out: number }> = ({ at, out }) => {
  const { f, theme } = useScene();
  if (f < at) return null;
  const style = f < out ? pop(f, at, { dur: 10, from: 0.7 }) : blurOut(f, out, { dur: 8 });
  return (
    <div style={{ position: "absolute", left: 536, top: 16, height: 62, width: 300, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", boxSizing: "border-box", transformOrigin: "left center", fontFamily: theme.font.ui, ...style }}>
      <div style={{ position: "absolute", left: 0, top: 16, width: 2, height: 30, background: "#5F6368" }} />
      <Logo name="alibaba" size={32} />
      <div style={{ fontSize: 28, color: "#BDC1C6", whiteSpace: "nowrap" }}>Alibaba.com</div>
    </div>
  );
};

export const Sound: React.FC = () => {
  const { f, cue, endsOn, scene } = useScene();
  const mount = scene.from - LEAD;
  const openAt = cue("open");
  const alibabaAt = cue("Alibaba");
  const computerAt = cue("computer,");
  const soundAt = cue("sound.");
  const cantAt = cue("can't");
  const volumeAt = cue("volume");
  const zeroAt = cue("zero.");
  const browserAt = cue("browser,");
  const shrinkAt = cue("used") - 4;
  const cardAt = endsOn("device.", 22);

  // the window: tile -> full size (arrives from the first frame), deepens for the graph, then parks at half size
  const k1 = arrive(f, mount, 34);
  const k3 = arrive(f, shrinkAt, 30);
  const tile = HANDOFF.tileWindow;
  const full = HANDOFF.hookWindow;
  const end = HANDOFF.soundWindow;
  const s1 = tile.scale + (1 - tile.scale) * k1;
  const scale = s1 + (end.scale - s1) * k3;
  const top = tile.top + (full.top - tile.top) * k1 + (end.top - full.top) * k3;
  const left = tile.left + (full.left - tile.left) * k1 + (end.left - full.left) * k3;
  const deep = prog(f, soundAt - 12, 14, ease.inOut) - prog(f, browserAt + 10, 16, ease.inOut);
  const height = full.height + 240 * deep;

  // the page: loads on "open", goes translucent on "sound.", comes back as the graph folds away
  const x = prog(f, soundAt, 8) - prog(f, browserAt + 14, 12);
  const pageStyle: React.CSSProperties = { position: "absolute", inset: 0, opacity: prog(f, openAt - 2, 5) * (1 - 0.9 * x), filter: x > 0.01 ? `blur(${(5 * x).toFixed(2)}px)` : undefined };

  // the graph: node by node from "sound.", the speaker on "can't", the Gain rolling to exactly 0 on "zero."
  const nodes = [soundAt, soundAt + 8, soundAt + 16, soundAt + 24, cantAt];
  const gain = countTo(f, endsOn("zero.", 34), 34, 1, 0, ease.in);
  const ring = prog(f, volumeAt, 8) * (1 - prog(f, zeroAt + 30, 20));
  const fold = prog(f, browserAt, 14, ease.in);

  const favicon = f < openAt ? <Throbber /> : <Logo name="aliexpress" size={32} style={{ borderRadius: 6 }} />;
  const title = (
    <span>
      AliExpress
      {f >= browserAt + 10 && <TabWave at={browserAt + 10} />}
    </span>
  );

  return (
    <>
      {/* the laptop card slides out from under the window, device ID empty, caret waiting */}
      <Travel curve="measured" at={cardAt} from="top" dist={170} dur={22} style={{ position: "absolute", left: HANDOFF.device.left, top: HANDOFF.device.top }}>
        <DeviceCard value="" caret />
      </Travel>

      <div style={{ position: "absolute", left, top, width: full.width, height, transform: `scale(${scale.toFixed(4)})`, transformOrigin: "top left" }}>
        <ChromeWindow mode="dark" height={height} favicon={favicon} tabTitle={title} url="aliexpress.com">
          {f >= openAt - 2 && (
            <div style={pageStyle}>
              <AliPage at={openAt} scrollAt={computerAt} />
            </div>
          )}
        </ChromeWindow>
        <AlibabaTab at={alibabaAt} out={browserAt} />
        {f >= soundAt && fold < 1 && (
          <div
            style={{
              position: "absolute", left: 0, top: BAR, width: full.width, height: height - BAR,
              transformOrigin: `${FAV.x}px ${FAV.y - BAR}px`,
              transform: `scale(${(1 - 0.96 * fold).toFixed(4)})`,
              opacity: 1 - prog(f, browserAt + 6, 8),
            }}
          >
            <SoundChain at={nodes} gain={gain} ring={ring} />
          </div>
        )}
      </div>
    </>
  );
};
