// Hook X2, the machine: a gunmetal copier body with thickness, a dark glass scan bed with drifting reflections, the
// real Claude mark lying on the glass (lit where the lamp crosses it, fading a little with every copy taken), the
// lamp carriage (a hard bar, its light spill on the glass, and a standing curtain of light rising off it), and the
// output tray where the Qwen pile grows. Everything is a child of the tilted world (preserve-3d), in world units.
import React from "react";
import { CLAUDE, Logo, QWEN, asset } from "./parts";
import { BX, H, MS, PX, PY, W } from "./HookX2Plan";

const P3: React.CSSProperties = { position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d" };
/** a plane of size w x h centred on world (x, y) at height z */
export const at = (x: number, y: number, z: number, w: number, h: number): React.CSSProperties => ({
  ...P3, width: w, height: h, transform: `translate3d(${(x - w / 2).toFixed(1)}px, ${(y - h / 2).toFixed(1)}px, ${z.toFixed(1)}px)`,
});

/** the lamp's colour: cool white while idle, a hard violet-white once armed */
export const lampCol = (cool: number) => (cool > 0.5 ? "#CFE4FF" : "#8F8BFF");

export const Body: React.FC<{ f: number; heat: number }> = ({ f, heat }) => {
  const bw = W + 70;
  const bh = H + 70;
  const glint = ((f * 3.2) % 1400) - 500;
  const side = (w: number, rot: string, origin: string, bg: string): React.CSSProperties => ({
    position: "absolute", width: w, height: 56, transformOrigin: origin, transform: rot, background: bg,
  });
  return (
    <div style={at(BX, 0, -2, bw, bh)}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "linear-gradient(160deg, #2A2C33 0%, #16171C 55%, #0C0D10 100%)", boxShadow: "inset 0 0 0 2px #3A3D46, inset 0 3px 0 #4B4F5A" }} />
      {/* front and right faces give the slab its thickness */}
      <div style={{ ...side(bw, "rotateX(-90deg)", "50% 0%", "linear-gradient(to bottom, #25272E, #0A0A0C)"), left: 0, top: bh }} />
      <div style={{ ...side(bh, "rotateZ(90deg) rotateX(-90deg)", "0% 0%", "linear-gradient(to bottom, #1C1D23, #08080A)"), left: bw, top: 0 }} />
      {/* the glass */}
      <div style={{ position: "absolute", left: 35, top: 35, width: W, height: H, borderRadius: 6, overflow: "hidden", background: "linear-gradient(180deg, #0B0D14 0%, #11131D 60%, #0A0B10 100%)", boxShadow: `inset 0 0 0 1.5px #FFFFFF30, inset 0 0 40px #000, 0 0 ${(20 + 40 * heat).toFixed(0)}px ${QWEN}${heat > 0.3 ? "55" : "22"}` }}>
        <div style={{ position: "absolute", left: glint, top: -200, width: 180, height: 900, transform: "rotate(28deg)", background: "linear-gradient(to right, transparent, #FFFFFF10 40%, #FFFFFF1C 50%, #FFFFFF10 60%, transparent)" }} />
        <div style={{ position: "absolute", left: glint * 0.6 + 300, top: -200, width: 60, height: 900, transform: "rotate(28deg)", background: "linear-gradient(to right, transparent, #FFFFFF0E, transparent)" }} />
        {/* the ruler ticks along the far edge, as on a real platen */}
        {Array.from({ length: 27 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 14 + i * 19, top: 0, width: 2, height: i % 5 === 0 ? 16 : 8, background: "#FFFFFF33" }} />
        ))}
      </div>
    </div>
  );
};

/** the output tray the copies land in: a dark plate with a violet rim that warms as the pile grows */
export const Tray: React.FC<{ heat: number; n: number }> = ({ heat, n }) => {
  const g = Math.min(1, 0.25 + 0.1 * n + 0.4 * heat);
  return (
    <div style={at(PX, PY, -2, 330, 330)}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: "radial-gradient(circle at 50% 50%, #1B1A2C 0%, #0E0E16 70%)", boxShadow: `inset 0 0 0 2px ${QWEN}${Math.round(40 + 120 * g).toString(16)}, 0 0 ${(30 + 60 * g).toFixed(0)}px ${QWEN}${Math.round(30 + 80 * g).toString(16)}` }} />
    </div>
  );
};

/** the original: the real Claude mark lying on the glass; the lamp line lights the band it is crossing */
export const Original: React.FC<{ lampY: number; power: number; taken: number; col: string }> = ({ lampY, power, taken, col }) => {
  const fade = Math.max(0.28, 1 - 0.085 * taken);
  const band = ((lampY + MS / 2) / MS) * 100;
  const mask = `url(${asset("logo-claude.png")}) center / contain no-repeat`;
  return (
    <div style={at(BX, 0, 1, MS, MS)}>
      <div style={{ position: "absolute", inset: 0, opacity: fade, filter: `saturate(${fade.toFixed(2)}) drop-shadow(0 0 18px ${CLAUDE}66)` }}>
        <Logo name="claude" size={MS} />
      </div>
      <div style={{ position: "absolute", inset: 0, WebkitMask: mask, mask, opacity: power, background: `linear-gradient(to bottom, transparent ${band - 16}%, ${col}AA ${band - 5}%, #FFFFFF ${band}%, ${col}AA ${band + 5}%, transparent ${band + 16}%)` }} />
    </div>
  );
};

/** the carriage: the bar, the spill it throws on the glass, a standing curtain of light, and a trail when it is fast */
export const Lamp: React.FC<{ y: number; prevY: number; power: number; heat: number; cool: number }> = ({ y, prevY, power, heat, cool }) => {
  const col = lampCol(cool);
  const len = W + 40;
  const speed = Math.min(1, Math.abs(y - prevY) / 60);
  const curtain = 230 + 90 * heat;
  const trailH = Math.abs(y - prevY) * 1.6 + 30;
  return (
    <>
      {/* spill on the glass, stretched behind the bar when it moves fast */}
      <div style={{ ...at(BX, (y + prevY) / 2, 0.6, len, trailH + 200), opacity: power * (0.55 + 0.3 * heat), background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${col}88 0%, ${col}33 40%, transparent 72%)` }} />
      <div style={{ ...at(BX, y, 2, len, 12), borderRadius: 6, opacity: Math.min(1, 0.4 + power), background: `linear-gradient(to right, transparent, ${col} 8%, #FFFFFF 30%, #FFFFFF 70%, ${col} 92%, transparent)`, boxShadow: `0 0 ${(18 + 30 * power).toFixed(0)}px ${(4 + 8 * power).toFixed(0)}px ${col}, 0 0 90px 20px ${col}66` }} />
      {/* the curtain: a plane standing up on the bar, bright at its foot, fading into the dark */}
      <div style={{ ...at(BX, y, 0, len, curtain), transform: `translate3d(${(BX - len / 2).toFixed(1)}px, ${(y - curtain).toFixed(1)}px, 0px) rotateX(-90deg)`, transformOrigin: "50% 100%", opacity: power * (0.5 + 0.35 * heat + 0.3 * speed), background: `radial-gradient(ellipse 52% 100% at 50% 100%, ${col}CC 0%, ${col}44 25%, ${col}14 55%, transparent 100%)` }} />
    </>
  );
};

/** a flare that always faces the lens, standing on the lamp: an anamorphic streak and a hot core */
export const Flare: React.FC<{ y: number; power: number; heat: number; cool: number; face: string; hit: number }> = ({ y, power, heat, cool, face, hit }) => {
  const col = lampCol(cool);
  const k = power * (0.55 + 0.45 * heat + hit);
  return (
    <div style={{ ...at(BX + 60, y, 8, 0, 0) }}>
      <div style={{ position: "absolute", transform: face, transformStyle: "preserve-3d" }}>
        <div style={{ position: "absolute", left: -90, top: -90, width: 180, height: 180, borderRadius: "50%", opacity: 0.7 * k, background: `radial-gradient(circle, #FFFFFF 0%, ${col}AA 18%, ${col}22 45%, transparent 70%)` }} />
      </div>
    </div>
  );
};
