// Hook X3, dark, 0.1-3.7 s: "How do Chinese AI companies copy Anthropic models?"
// THE COUNTERFEIT CAST. A forge in the dark. At f1 the real Claude mark, a heavy metal die, is already falling onto a
// bed of hot soft material. "Chinese": it slams in (flash, sparks with gravity, a shock ring, a lip of material
// thrown up, the camera jolted). "AI companies": it is torn free and lifted away, leaving a perfect glowing starburst
// imprint; violet drips start falling. "copy": molten violet metal (Qwen's colour) pours into the imprint, spreads
// from the centre, splashes and steams. "Anthropic": the pour cuts off, the metal flashes white-hot and cools through
// the colours of real hot metal, a hiss of steam. "models": the cast is torn out, stands up to the lens and turns
// over: the other face is the real Qwen mark, edges still orange-hot, cooling to violet. Heat haze over the bed.
import React from "react";
import { Column, ease, prog } from "../../../src/engine";
import { Bed, Die, Fill, Imprint } from "./HookX3Forge";
import { Embers, Flash, Sparks, Steam, Stream } from "./HookX3Fx";
import { Cast } from "./HookX3Cast";
import { Bed3D, CX, H, Preload, T, TOP, W, useTimes } from "./HookX3Space";

const decay = (f: number, at: number, dur: number) => (f >= at ? Math.max(0, 1 - (f - at) / dur) : 0);

/** the heat haze: turbulence rising over the bed, spiking with the slam and the pour, calm for the payoff */
const Haze: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const s = 3 + 22 * decay(f, t.ch, 26) + 7 * prog(f, t.copy - 4, 10, ease.out) * (1 - prog(f, t.an + 20, 30, ease.inOut)) + 5 * decay(f, t.an, 20);
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <filter id="x3haze" x="-5%" y="-5%" width="110%" height="170%">
        <feTurbulence type="fractalNoise" baseFrequency={`${(0.008 + 0.0006 * Math.sin(f / 40)).toFixed(5)} 0.024`} numOctaves={2} seed={3} result="n" />
        <feOffset in="n" dy={-f * 2.2} result="m" />
        <feDisplacementMap in="SourceGraphic" in2="m" scale={s.toFixed(2)} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
};

/** the camera: jolted by the slam, nudged by the pour and by the cast tearing free, pushing in on the payoff */
function camera(t: T) {
  const { f } = t;
  const q = 20 * decay(f, t.ch, 20) + 5 * decay(f, t.copy, 12) + 3 * decay(f, t.an, 10) + 5 * decay(f, t.mo - 6, 12);
  const dx = Math.sin(f * 2.3) * q;
  const dy = Math.cos(f * 3.1) * q * 1.2;
  const sc = 1.02 + 0.03 * prog(f, t.from, t.mo - t.from, ease.linear) + 0.04 * prog(f, t.mo - 6, 40, ease.inOut);
  return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sc.toFixed(4)})`;
}

export const HookX3: React.FC = () => {
  const t = useTimes();
  const fade = "linear-gradient(to bottom, transparent 0, #000 90px, #000 840px, transparent 930px)";
  const fadeX = "linear-gradient(to right, transparent 0, #000 60px, #000 840px, transparent 900px)";
  return (
    <Column>
      <Preload />
      <Haze t={t} />
      <div style={{ position: "absolute", left: 0, top: TOP, width: W, height: H, overflow: "hidden", WebkitMaskImage: `${fade}, ${fadeX}`, WebkitMaskComposite: "source-in", maskImage: `${fade}, ${fadeX}`, maskComposite: "intersect" }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${CX}px 480px`, transform: camera(t) }}>
          <div style={{ position: "absolute", inset: 0, filter: "url(#x3haze)" }}>
            <Bed3D>
              <Bed t={t} />
              <Imprint t={t} />
              <Fill t={t} />
            </Bed3D>
            <Steam t={t} />
            <Stream t={t} />
          </div>
          <Bed3D>
            <Die t={t} />
          </Bed3D>
          <Flash t={t} />
          <Embers t={t} />
          <Cast t={t} />
          <Steam t={t} front />
          <Sparks t={t} />
        </div>
      </div>
    </Column>
  );
};
