// The developer's post, redrawn from the live page (blog.laserphile.com, read 2026-09-25): Blogger's dark "Simple"
// theme, the blog header, the date header, the title, then excerpts in the post's own order and words. Lines are
// broken by hand so a highlight can run one line at a time. Everything is in document px; the caller scrolls it.
import React from "react";
import { useScene } from "../../../src/engine";

export const BLOG = { bg: "#333333", text: "#CCCCCC", head: "#EEEEEE", link: "#DD7700", quote: "#BBBBBB", rule: "#454545" };
const PAD = 44;
const FONT = "Arial, Helvetica, sans-serif";

/** where each section starts in the document: the scroll targets */
export const DOC = { top: 0, scripts: 870, audio: 1500, quote: 1920 };

/** a text selection drawn left to right: p 0..1 */
export const Hl: React.FC<{ p: number; children: React.ReactNode; pad?: number }> = ({ p, children, pad = 4 }) => (
  <span style={{ position: "relative", display: "inline-block" }}>
    <span style={{ position: "absolute", left: -pad, right: -pad, top: 2, bottom: 0, background: "rgba(138,180,255,0.42)", borderRadius: 4, transform: `scaleX(${p.toFixed(4)})`, transformOrigin: "0 50%" }} />
    <span style={{ position: "relative" }}>{children}</span>
  </span>
);

const Lines: React.FC<{ top: number; lines: React.ReactNode[]; size?: number; lh?: number; color?: string; indent?: number; weight?: number; mono?: boolean }> = ({ top, lines, size = 32, lh = 46, color = BLOG.text, indent = 0, weight = 400, mono }) => {
  const { theme } = useScene();
  return (
    <div style={{ position: "absolute", left: PAD + indent, top, fontFamily: mono ? theme.font.mono : FONT, fontSize: size, lineHeight: `${lh}px`, color, fontWeight: weight, whiteSpace: "pre" }}>
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};

/** Blogger's orange mark, as it sits beside each contributor */
const BloggerIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none" }}>
    <rect width={24} height={24} rx={4} fill="#F57D00" />
    <path d="M8 6h5.2a2.8 2.8 0 0 1 2.8 2.8v.4c0 .5.4.8.9.8h.3c.5 0 .8.4.8.8v4.4a2.8 2.8 0 0 1-2.8 2.8H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" fill="#FFFFFF" />
    <rect x={8.6} y={8.8} width={4.6} height={1.8} rx={0.9} fill="#F57D00" />
    <rect x={8.6} y={13.4} width={6.8} height={1.8} rx={0.9} fill="#F57D00" />
  </svg>
);

export type PostMarks = { byline: number; proof: number; collina: number; fireye: number; alibaba: number; quote: [number, number] };

export const BlogPost: React.FC<{ m: PostMarks }> = ({ m }) => {
  const url = (dir: string, name: string, p: number) => [
    <span key="a">https://assets.aliexpress-media.com/g/AWSC/</span>,
    <span key="b">
      {dir}
      <span style={{ fontSize: 34, fontWeight: 700, color: "#FFFFFF" }}>
        <Hl p={p}>{name}</Hl>
      </span>
    </span>,
  ];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 900, height: 2700, background: BLOG.bg }}>
      {/* the blog header and the rule under it */}
      <div style={{ position: "absolute", left: PAD, top: 26, fontFamily: FONT, fontSize: 84, color: BLOG.head, letterSpacing: -1 }}>laserphile</div>
      <div style={{ position: "absolute", left: PAD, right: 0, top: 150, height: 2, background: BLOG.rule }} />
      <Lines top={176} size={32} lh={40} weight={700} lines={["Thursday, 20 August 2026"]} />
      <Lines
        top={234}
        size={46}
        lh={58}
        color="#DDDDDD"
        lines={["AliExpress webpage keeping multipoint", "Bluetooth headphones active with", <Hl key="t" p={m.proof}>WebAudio fingerprinting</Hl>]}
      />
      {/* the author line, text only: there is no public portrait of this developer */}
      <div style={{ position: "absolute", left: PAD, top: 424, display: "flex", alignItems: "center", gap: 16, fontFamily: FONT, fontSize: 34, color: BLOG.text }}>
        <BloggerIcon size={40} />
        <Hl p={m.byline} pad={8}>
          Posted by <span style={{ color: BLOG.link, fontWeight: 700 }}>Matt Callaghan</span>
        </Hl>
      </div>
      <Lines
        top={500}
        lines={[
          "Recently I ran into a strange problem with my",
          "Bluetooth headphones. They support multipoint",
          "Bluetooth audio, so they can be connected to my",
          "PC and phone at the same time. Normally the PC",
          "takes priority playing audio, with my phone",
          "being able to play audio when nothing is playing",
          "on the PC.",
        ]}
      />
      {/* the two scripts */}
      <Lines top={DOC.scripts} lines={["The constructor stack traces pointed to two", "scripts:"]} />
      <Lines top={DOC.scripts + 110} indent={40} size={28} lh={46} color={BLOG.quote} lines={url("uab/1.140.0/", "collina.js", m.collina)} />
      <Lines top={DOC.scripts + 216} indent={40} size={28} lh={46} color={BLOG.quote} lines={url("fireyejs/1.231.67/", "fireyejs.js", m.fireye)} />
      <Lines
        top={DOC.scripts + 334}
        lines={[
          "The first context was created by collina.js,",
          "while the second came from fireyejs.js. Both",
          "sit under an AWSC directory and appear to be",
          <span key="a">part of <Hl p={m.alibaba}>Alibaba's browser security</Hl> and</span>,
          "anti-abuse tooling.",
        ]}
      />
      {/* the audio graph: texture on the way down, the next scene draws it for real */}
      <Lines top={DOC.audio} size={40} lh={50} weight={700} color="#DDDDDD" lines={["What the audio code does"]} />
      <Lines top={DOC.audio + 70} lines={["Both scripts build a WebAudio graph resembling", "this:"]} />
      <Lines
        top={DOC.audio + 176}
        indent={40}
        size={28}
        lh={40}
        color={BLOG.quote}
        lines={["Sawtooth oscillator", "    -> AnalyserNode", "    -> ScriptProcessorNode", "    -> GainNode set to zero", "    -> AudioContext.destination"]}
      />
      {/* the developer's own sentence */}
      <Lines top={DOC.quote} size={40} lh={50} weight={700} color="#DDDDDD" lines={["This looks like fingerprinting"]} />
      <Lines
        top={DOC.quote + 74}
        lines={[
          "Audio fingerprinting works because small",
          "differences in browser versions, operating",
          "systems, audio libraries, and hardware can",
          "produce slightly different results from the",
          "same generated signal.",
        ]}
      />
      <Lines
        top={DOC.quote + 336}
        size={36}
        lh={54}
        color="#E6E6E6"
        lines={[
          <Hl key="1" p={m.quote[0]}>I cannot see what AliExpress does with the</Hl>,
          <Hl key="2" p={m.quote[1]}>resulting data after it reaches their servers.</Hl>,
          "It may be used as a persistent device",
          "identifier, but it could also be one input into",
          "a fraud or bot-detection score.",
        ]}
      />
    </div>
  );
};
