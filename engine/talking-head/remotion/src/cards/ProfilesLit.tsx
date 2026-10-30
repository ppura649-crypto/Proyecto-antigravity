import React from "react";
import type { CardProps } from "./props";
import { ProfilesScene, type ProfilesData } from "./Profiles";

// V11 (edit-g-b): "AND WE'VE SEEN IT GENUINELY HELP A LOT OF PEOPLE AROUND US."
// The picture from "for both ourselves and for the creators we know", twelve seconds later
// and complete at frame 0: the same two real profiles, the same ring, the same eight grey
// creators standing on it. It is a callback, so nothing re-pops and nothing re-draws. Then
// it changes, and only it changes: on "genuinely" the eight take the accent one after
// another, each swelling as it lights, and on "a lot" ten more arrive on a wider ellipse
// already lit, at exactly the same size, so the crowd grows outward into the card instead
// of the picture pulling away from it. Then it holds under "around us".

const ALWAYS = -1e9;

export type ProfilesLitData = ProfilesData & { wider: number };

export const ProfilesLit: React.FC<CardProps & { data: ProfilesLitData }> = ({
  tMs, w, h, fps, beats, assets, data,
}) => {
  const lit = beats.genuinely ?? (beats.help ?? 0) - 480;
  const lot = beats.lot ?? lit + 870;
  return (
    <ProfilesScene
      tMs={tMs} w={w} h={h} fps={fps}
      left={data.left} right={data.right} assets={assets}
      cardsAt={ALWAYS} ringAt={ALWAYS}
      innerAt={ALWAYS} innerStep={0} innerN={data.outer ?? 8}
      litAt={lit} litStep={100}
      widerAt={lot} widerStep={60} widerN={data.wider ?? 10}
    />
  );
};
