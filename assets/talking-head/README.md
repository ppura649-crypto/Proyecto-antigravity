# Assets shipped with Talking Head

The pack carries its fonts and reusable assets. The optional sound pass also supports approved recordings fetched from their original sources into the buyer library.

## fonts/

Nineteen faces with their OFL licence text beside each one, and `fonts.json` saying what each is for.

`board` names the ten the setup page offers, in the order it offers them: Zen Dots, Unbounded, Russo One, Big Shoulders Display, Boldonse, Geist, Space Grotesk, Chakra Petch, Orbitron and Krona One. They came off the type board these reels were chosen from, and every one of them carries a caption over footage at 62 px cap without the shadow having to work. Ten is the limit because everything on that page is compared against everything else at a glance, and past about ten nobody compares anything.

The other nine (Montserrat, Poppins, Inter, Archivo Black, Anton, Bebas Neue, League Spartan, Bricolage Grotesque, Instrument Serif) stay shipped because a buyer may name one and because a replica of a real thing keeps its own face. They are not on the page. A face named off fonts.google.com that we do not ship is downloaded into `workspace/library/fonts/` at build time.

Every entry carries measured numbers, not guesses: the font size that gives this format's 62 px cap height, read off the face's own cap height, and how many characters of one real sentence fit inside the caption's maximum width of 0.77 of a 1080 frame at that size. Every face is measured the same way, so the numbers compare. Big Shoulders fits twenty eight characters where Zen Dots fits fifteen, and that single number is most of what picking a face decides.

## sfx/

The closed palette contains 34 recordings selected by listening. `sfx.md` gives the model one sentence per sound; `sfx.json` gives the mixer the same IDs, file hashes and measured peak offsets. The rejected and unrated sounds are outside this palette. No metallic riser or other hook accent is required.

Eighteen generated recordings and four Kenney CC0 recordings ship here with their provenance. Twelve Mixkit recordings are fetched from the original source into `workspace/library/talking-head-sfx/` when the optional sound pass needs them. Those recordings are licensed for use in videos and are not standalone assets in the sellable zip. Each downloaded file must match the exact recording that was auditioned.

Talking Head's sound pattern (`05-sound.md`) names its own palette, in `engine/talking-head/sfx/`. A recording from this folder enters a video only after the creator has heard it and approved it.

## No previews

There were five, one rendered frame per look, from before the setup page drew on the buyer's own clip. The page now pulls five stills out of that clip and draws every look on them, so a shipped frame of somebody else's face is a worse answer to the same question, and a stale one the moment a preset's face changes. Deleted 2026-09-06.

## reference/

The reference clip and render we own, for the setup example and for the skill's "open the reference first". TODO(week 6). No footage of the reference creators ships.

Logos are fetched per project from the mark's own source (see `engine/library/README.md`), never bundled.
