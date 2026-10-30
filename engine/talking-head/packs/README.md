# Style packs

A reel is cut once (stage 1) and can be dressed in any pack. A pack is everything that is
per-creator: the caption system, the title, the hook grammar, the card language, the SFX
palette, the pacing preset. The standing laws (the visual argues the sentence, ≤ 3 s, never the
same object twice, the hook complete at frame 0 and locked, geometry measured, real marks only,
their words on every label) hold in every pack and live in the talking-head skill, not here.

```
packs/<name>/
  pack.json             what the pack is made of (pointers, never copies)
  hook.template.json    the hook.json shape for this pack: title face/size/place, stack grammar, reveal law
```

`pack.json`:

| key | meaning |
|---|---|
| `format` | the caption/format preset the project's `format.json` is seeded from (`formats/<x>.json`); geometry values are then overwritten from `geometry.json` |
| `style` | the `remotion/src/styles.ts` key (`creator-format-1`, `creator-format-2`) that picks the look |
| `overlay` | `creator-format-1` (cards in `remotion/src/cards/`) or `soft` (`remotion/src/soft/`) |
| `hookGrammar` | the measured hook file (`formats/creator-format-1-hook.md`, `formats/creator-format-2-hook.md`) |
| `visualGrammar` | the measured visual file (`formats/creator-format-1-visuals.md`, ...) |
| `cardLanguage` | the plate/frame rules in one line, so a builder knows before reading the grammar |
| `families` | which card families the pack may use (kinds in `library/README.md` or `soft/`) |
| `sfx` | the palette this pack draws from (`05-sound.md` for Creator Format 1 and guest-flat; Creator Format 2 has none yet) |
| `pacing` | the `cut_variants.py` preset |
| `skill` | the skill that owns the method when it is not talking-head itself |

Existing packs: `creator-format-1` (their own reels), `guest-flat` (the guest spec, Avenir Next Bold 46 px
uppercase, white heroes), `creator-format-2` (Creator Format 2's grammar, the `creator-format-2-style` skill).
Older ids a saved profile or plan may still carry (legacy alias): `chris` is `creator-format-1`, `softgirl` is `creator-format-2`.

A new pack is built the way Creator Format 2 was, never by re-skinning an existing one: 5-10 of the
creator's reels read frame by frame under `library/styles/PROTOCOL.md`, the synthesis written to
`formats/<name>-{system,hook,visuals}.md` + `formats/<name>.json`, the families drawn from scratch
against a transcript, a copy project rendered and judged against the creator's own frames.
"you just changed the colors, not the actual visuals, the UI the font" (2026-09-03) is the
rejection every re-skin earns.
