# The visual bar: direct it like a film

Read by the lead before planning and pasted, as written, into every builder brief and every hook brief.
The builder already knows motion design. It needs the register and the freedom, not recipes: frame
counts, move menus and one easing for everything make every video look like the last one.

## Why this bar

A card that shows a thing is read once and dropped. A picture where something is happening to that
thing (a month sweeping past, a plan becoming a list that keeps growing, a counter racing, a lock
opening) is watched to its end, because the viewer wants to see where it lands. Retention holds on
action. The creator's corrections all point the same way: pictures that are real, clear and alive
win; flat stand-in cards, blur, clutter and dead holds lose.

## The brief (give it to every builder as it is written)

> **Direct it like a film.** Before anything moves, imagine the sentence as a shot. What would it look
> like if it were real and you had a camera in the room? Build that world, fresh for this video.
>
> - **Make the abstract physical.** Every idea becomes an object with weight that someone could hold,
>   open, break or hand over: a turnstile, a locker, a pass turning gold, a shelf filling, a vacuum
>   lifting text off a page. Prefer the object that performs the mechanism over a symbol for the word.
> - **Real where it exists.** Real product marks (fetched, never drawn), real interfaces redrawn at
>   their own geometry with real copy, real numbers. A redrawn interface has content in every row,
>   never grey bars or placeholder blocks.
> - **Believable.** It should look like a real object or a real screen, lit and filmed, never like a
>   diagram, a wireframe or something vibe coded.
> - **Make numbers literal.** Show the scale itself, counting, filling, multiplying, landing exact on
>   its word.
> - **Cause and effect in one shot.** The picture answers why, not only what.
> - **A cast, not slides.** One character or object runs through the whole video as a small thread and
>   changes with the story. The main picture of each idea is new: never the same pair of marks again,
>   never the same interface as the hero twice.
> - **Light is emotion.** Ground colour, glow, darkness and colour temperature tell the viewer how to
>   feel before the words do. Adapt the ground to the story; a dark ground makes luminous objects read.
> - **Clear for anyone.** A viewer who knows nothing about the topic gets it in one glance with the
>   sound off. No axes, gridlines, log lines, JSON, dashboards or dense tables unless reading them is
>   the point. One hero, few words, big.
>
> Ask what nobody else would think of for this exact sentence, then make it inevitable.
>
> **Then move it.** Work like the senior motion designer on an Apple keynote film or a Stripe or Linear
> launch video: every move is motivated by the sentence, and the eye is led, never chased.
>
> - **Animate the verb.** Find the action in the sentence and perform it on the real thing.
> - **Constantly in motion.** No frame of the video is dead. Scenes hand over by a move, never a
>   blank; a finished state still breathes (a slow push, a drift, a live number, light moving across
>   a surface) while it is read.
> - **One move at a time.** One big move per idea, landed on its word, then the finished state holds
>   long enough to be read (about 0.7 s or more) before the next change. Lively but followable: never
>   so fast the viewer misses the end of an animation.
> - **Staging.** One hero per moment, big and centred, a clear silhouette. At most five to seven things
>   on screen. Everything else supports it or gets out of the way.
> - **Timing and spacing.** Confident ease-out into rest, ease-in to leave, never linear, never floaty.
>   Landings are critically damped, with overshoot only where the material would give it.
> - **Weight.** Mass and inertia, anticipation before a big move, follow-through and overlapping action
>   after it, secondary action on the parts.
> - **Arcs.** Anything thrown, swung or dealt travels on an arc.
> - **Depth.** Real z-space and perspective, parallax between layers, contact shadows that soften with
>   height, one consistent light.
> - **Motion blur** only while something is truly fast, along its direction of travel.
> - **Continuity.** The thing on screen becomes the next thing. A change of state happens to the object
>   already there; nothing is swapped for a new card, and no ghost copy is left behind at a handover.
> - **Rhythm.** Build, land, breathe. Offset and cascade siblings; never everything on one beat.
> - **Material.** Paper, glass, metal, a real screen: rendered with finish, gradients, shadow and
>   light. Square card corners; real interface parts keep their own shape.
> - **Restraint.** Calm confidence over spectacle. Readable at phone width: body text 28 px or more,
>   key words 40 px or more, objects 900 px wide or more in a 1080 px frame.
>
> These are the words, not the answer. Invent the move this sentence deserves, surprise us, and make
> it smooth.

## Sync

Every change belongs to a spoken word. Give builders the words of their scenes with their master
frames (from `aligned-words.json`) and have them compute each move from the word, never from a typed
number. A single event lands on its word; a build starts early enough to end on its word; a counter
reaches its exact figure on its word. If the cut changes, the moves follow the words.

## Traps the creator rejected

- A pile of cards, a feed, a notification scene, a split-screen story, a UI narrated click by click.
- Coloured bars, grey rows, redacted lines, a line-art device, a generic card that could be any topic.
- Blur or frost as the main event of a scene: it hides the idea instead of explaining it.
- Reusing the previous scene's hero as the next scene's hero.
- Three things competing for attention in one passage.
- Jitter, shake and bounce as decoration; everything arriving on one frame.
- A visual that changes before its animation has finished and been seen.
- A finished picture frozen with nothing alive in it.
- Copying a move from an earlier video because it worked there.
