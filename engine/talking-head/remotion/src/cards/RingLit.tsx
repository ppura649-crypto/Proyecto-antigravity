import React from "react";
import type { CardProps } from "./props";
import { RingScene } from "./Ring";

// "AND WE'VE SEEN IT GENUINELY HELP A LOT OF PEOPLE AROUND US."
// The ring from "for both ourselves and for the creators we know", twelve seconds later
// and unchanged: the same two founders inside the same ring with the same eight creators
// standing on it, complete at frame 0, held while the creator says "we've seen it". It is a
// callback, so nothing re-pops. Then it changes: on "genuinely" the creators light to the
// accent one after another and a reel pops over each head (they made videos with it); on
// "a lot" a wider ring of ten arrives already lit, reels and all, at the same size as the
// eight (nobody shrinks: the crowd grows outward into the card, it does not pull away); on
// "around" the two in the middle turn white, so the ring that is now terracotta reads as
// the crowd around them and not as them.

const ALWAYS = -1e9;

export type RingLitData = { us?: string; outer: number; wider: number };

export const RingLit: React.FC<CardProps & { data: RingLitData }> = ({
  tMs, w, h, fps, beats, data,
}) => {
  const lit = beats.genuinely ?? (beats.help ?? 0) - 480;
  const lot = beats.lot ?? lit + 870;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <RingScene
        tMs={tMs} w={w} h={h} fps={fps} us={data.us ?? "US"}
        centreAt={ALWAYS} tagAt={ALWAYS} ringAt={ALWAYS}
        outerAt={ALWAYS} outerStep={0} outerN={data.outer ?? 8}
        litAt={lit} litStep={100}
        widerAt={lot} widerStep={40} widerN={data.wider ?? 10}
        flipAt={beats.around}
      />
    </div>
  );
};
