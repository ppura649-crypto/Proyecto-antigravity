# The hook: the first three seconds

## Goal

The first three seconds decide whether anyone watches the rest. The hook is the trailer of the
video: one physical, cinematic move, built for this exact story, that the viewer cannot scroll past.

## Shape

Unless the creator's saved choice says otherwise:

1. The presenter says the opening phrase on the full frame (their own voice and face carry the claim).
2. On the next phrase the presenter moves down into the lower panel in one smooth move
   (`look.presenter.animate`), and the visual bursts in above as they drop. A third of a second in,
   the viewer must already be hooked.
3. The visual performs the claim: one big move with weight, depth and inertia, landed on the key word,
   the payoff held, and handed over by a move into the next scene.

## The bar

Study the story's real material first: the product marks, the interface, the number, the object the
claim is about. Then make that real material physically transform. Examples of the level expected, to
understand and never to copy:

- **A mark becomes an army.** On a near-black ground, the real OpenAI mark hangs in the centre with a
  soft glow. On the number word it unravels: its strokes break into 700 tiny identical agent robots
  that fly out on curved paths with motion streaks, filling a receding 3D hall on a perspective floor,
  while the camera pushes in and sways slightly and a counter races to 700. On "hacking" a red wave
  spreads through the swarm by distance from the centre, every robot's eyes turning red. The target's
  real mark appears lit at the far end and cracks, light bursting through the cracks, a small shake
  and a shockwave ring on the impact word.
- **A mark copied by a laser.** A glowing coral mark lies on a dark glass slab; a violet scan line
  sweeps across it, each pass lifting a thin layer of light that travels over and assembles, pass by
  pass, into a second mark beside it, while a counter of copied exchanges climbs into the millions.
- **A particle storm into a counter.** The real mark sits in a cloud of thousands of drifting particles
  with a live counter spinning below it (4 million, 25 million, 57 million ... 151 million exchanges);
  on "copy" the cloud streams sideways into a second mark that forms from it.
- **Two spotlights.** Two real marks on a dark stage, each under its own cone of light with reflections
  on the floor; on the key word one mark pulls the other's light across and its own cone brightens.
- **An exploded phone.** A phone on a warm dark ground bursts into its layers (glass, screen, frame,
  board) in 3D, the camera dives to the lit chip, then the layers slam back together with weight and
  the real app is on screen.
- **A ring of agents.** Hundreds of agents orbit a real mark in a tightening ring that spins faster as
  it closes, like a skater pulling in, banking with inertia, before it snaps into formation.

What they share: a ground chosen for the story (often dark, so light and luminous objects carry the mood), real marks, depth and a
camera, particles and light with a purpose, a number that counts, a colour or state flip exactly on
the key word, nothing flat, nothing small, nothing generic. What loses: a literal UI story (a Finder
row and a cursor, a form being filled), a feed, a pile of cards, an effect that could open any video,
anything that "looks vibe coded".

## Process: one hook director, five builders

The hook gets its own creative owner, separate from the planner and the scene builders.

1. **The hook director** (one focused agent, given this file, `motion.md`, `feedback.md`, the research,
   the opening words with their frames, the real marks and assets, and the scene that follows the hook).
   It studies the story until it can say in one line why this claim is surprising, then invents at
   least eight concepts, each one physical transformation of this story's real material, and keeps the
   five strongest and most different from each other. Each concept is one paragraph: the world and its
   ground, the hero, the one big move and the word it lands on, the counter or number if any, the flip
   on the key word, the payoff held, and how it hands over into the next scene. One of the five may be
   the director's wildest idea. It rejects anything a viewer has seen open another video.
2. **Five hook builders** in parallel, one per concept, each owning `visuals/HookV<n>.tsx` (and helpers
   `HookV<n>-*.tsx`), each given `motion.md`, this file, its concept, the word table and the exact region
   and frames. Each may improve its concept if it finds a stronger move. Each checks its stills on every
   key word, three consecutive frames mid-move, and a short `--range` before reporting.
3. The director judges each against five questions, on a phone-sized replay: Would I stop scrolling in
   the first half second? Does it look like a filmed shot of real objects, or like code? Is it about
   this story and no other? Is there one hero and one big move, landed on its word? Is every word
   readable and the payoff held? Judge motion, not only stills. Any "no" goes back to its builder with precise notes.
4. Render each variant over the delivered export: only the hook scene changes, so render that
   opening range with the variant in place and splice it onto `final.mp4` at the scene's end, keeping
   the export's voice and every frame after the cut. Check each file has the export's frame count.
   Save them as `<project>/hooks/<Family>.mp4`, give the creator every full path; they choose. Keep the
   delivered export untouched.

Hook variants are part of the first delivery unless the creator declined them. They never delay the
checked main export: deliver `final.mp4` first, then the variants.
