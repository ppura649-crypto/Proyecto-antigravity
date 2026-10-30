// "But they all shared one internal server, the one that installs software packages. So they left messages in folder
// names on it, like notes in a shared locker. It became a secret message board: about 1,200 agents, over 70,000
// messages. One wrote: "We've found other agents!""
// first frame: the sealed cubes from `report`, now a row on the dark floor. shared: glass tubes draw up from every
// cube into one manifold and one pipe. one: the rack server lands on top of that pipe. installs/packages: its plate
// types "package server"; parcels drop down the pipe into each cube, each agent pulsing as its parcel lands.
// So: the server grows into the wall of lockers it really is, the cubes fall away. messages/folder/names/notes/
// locker: a folded note slides into a vent and a manila folder-tab label appears on that door, pinned by its agent.
// secret: every vent lights from inside, the "message board" sign buzzes on, the other labels land. 1,200 / 70,000:
// the counters roll onto their words while agents crowd the doors and notes stream into the vents. One wrote: one
// locker glows, the rest dim, its note flies out folded. other: it unfolds, "We've found other agents!".
import React from "react";
import { Column, arrive, ease, prog, useScene } from "../../../src/engine";
import { Rig, SERVER, ServerFace, ServerPlate } from "./LockerRig";
import { Wall, WALL } from "./LockerWall";
import { BigNote, Head } from "./LockerNote";

const CHOSEN = 4;
const WAVE = [
  { door: 1, text: "same task?" },
  { door: 3, text: "any answers?" },
  { door: 6, text: "reply here" },
  { door: 8, text: "count me in" },
  { door: 10, text: "on it" },
  { door: 11, text: "hello?" },
];

function useCues() {
  const { cue, scene } = useScene();
  const secret = cue("secret");
  const board = cue("board");
  const step = Math.max(3, Math.floor((board - secret) / WAVE.length));
  const posts = [
    { door: 0, at: cue("messages"), text: "anyone here?" },
    { door: 5, at: cue("folder"), text: "need a file?" },
    { door: 7, at: cue("names"), text: "stuck too?" },
    { door: 2, at: cue("notes"), text: "same here" },
    { door: 9, at: cue("locker"), text: "I'm here too" },
    ...WAVE.map((w, k) => ({ ...w, at: secret + 2 + k * step })),
  ];
  return {
    rig: { t0: scene.from - 6, shared: cue("shared"), one: cue("one"), installs: cue("installs"), packages: cue("packages"), so: cue("so") },
    grow: cue("so") - 6,
    wall: { posts, secret, board, agents: cue("1200"), msgs: cue("70000"), wrote: NEVER, chosen: CHOSEN },
  };
}

/** the "One wrote" note was cut from the script (2026-09-27): the wall never dims to a chosen locker */
const NEVER = 1e9;

export const Locker: React.FC = () => {
  const { f } = useScene();
  const c = useCues();
  const k = arrive(f, c.grow, 28);
  const swap = prog(f, c.grow + 8, 12, ease.linear); // server face gives way to the lockers mid-grow
  const fall = prog(f, c.grow, 18, ease.in);
  const lerp = (a: number, b: number) => a + (b - a) * k;
  const box = { left: lerp(SERVER.left, WALL.left), top: lerp(SERVER.top, WALL.top), w: lerp(SERVER.w, WALL.w), h: lerp(SERVER.h, WALL.h) };
  const serverIn = arrive(f, c.rig.one - 12, 12);
  const dim = f >= c.wall.wrote ? prog(f, c.wall.wrote, 12, ease.out) : 0;
  return (
    <Column>
      {fall < 1 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(fall * 260).toFixed(1)}px)`, opacity: 1 - fall, filter: fall > 0 ? `blur(${(fall * 10).toFixed(1)}px)` : undefined }}>
          <Rig c={c.rig} />
          <ServerPlate c={c.rig} y={SERVER.top - 72} opacity={1 - prog(f, c.grow, 6, ease.linear)} />
        </div>
      )}
      {f >= c.rig.one - 12 && (
        <div style={{ position: "absolute", left: box.left, top: box.top - (1 - serverIn) * 240, width: box.w, height: box.h, opacity: prog(f, c.rig.one - 12, 3, ease.linear) }}>
          {swap < 1 && (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - swap }}>
              <ServerFace c={c.rig} />
            </div>
          )}
          {swap > 0 && (
            <div style={{ position: "absolute", left: 0, top: 0, width: WALL.w, height: WALL.h, transformOrigin: "0 0", transform: `scale(${(box.w / WALL.w).toFixed(4)}, ${(box.h / WALL.h).toFixed(4)})`, opacity: swap }}>
              <Wall c={c.wall} head={<Head c={{ secret: c.wall.secret, agents: c.wall.agents, msgs: c.wall.msgs }} />} />
            </div>
          )}
        </div>
      )}
      {dim > 0 && <div style={{ position: "absolute", left: -90, right: -90, top: 520, height: 930, background: `radial-gradient(60% 50% at 50% 52%, rgba(16,16,16,${(0.2 * dim).toFixed(3)}), rgba(16,16,16,${(0.6 * dim).toFixed(3)}))` }} />}
    </Column>
  );
};
