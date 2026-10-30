# Research lanes: story scouting for full-visual reels

Read by the folder's `research` skill when the format asking is Full Visual: here a thing's home is the
primary source (the paper, the lab or company post, the regulator, the report) and its moment is the line or figure
that proves the number. A creator who saved their own lanes or stance in `workspace/library/full-visual/profile.json`
scouts those instead; the rules for sources below stay.

A full-visual reel is one true story told in 60-120 s: a synthetic voice, every sentence drawn as
real-looking objects that move on the word. A good topic has a surprising number in the first 3 s, a clear cause and
effect, and something physical to draw. The creator's stance is pro-AI: the mix
leans toward breakthroughs, how AI works and myth-busting, with incidents and security as the minority.

## The six lanes (one Opus sub-agent each, all in one message)

| Lane | Hunts | Share of the final list |
|---|---|---|
| `breakthroughs` | AI in medicine, biology, drugs, materials, energy, climate, weather, maths, physics, archaeology, animal communication, accessibility, disasters, farming, education | about 30% |
| `eli5` | how current AI training and models actually work, each tied to a recent real paper or launch (distillation, in-context learning, evolution loops, data quality) | about 15% |
| `myth-busting` | a widespread claim about AI that is wrong, exaggerated or out of date, with the real number and one honest caveat (water, energy, jobs, "AI only copies", cost, "AI hit a wall") | about 20% |
| `papers` | startling findings from arXiv, Nature, Science, Cell and lab blogs that the press missed | about 15% |
| `events` | big incidents, lab disclosures, lawsuits, government actions, money moves, AI in the physical world | about 10% |
| `weird-edges` | scams, courts, stories from outside the US that English media missed, strange real-world agent behaviour | about 10% |

A `tools` lane (launches, repos that exploded, how a tool everyone uses really works) is added when the creator asks for it.

## The sub-agent assignment

Give each lane agent the reel description above, today's date, its lane row, and these rules:

- Window: the last three months by default; older only if it is still under-told.
- Open every source. Primary sources first (the paper, the lab or company post, the regulator, the report).
- Never invent a number, name or date. Drop anything uncertain. Say when a number is self-reported or company-funded.
- Private individuals are never named.
- Attacks and misuse are described at news level only: what happened and its scale, never how it was done.
- Return 12-15 candidates, each: a hook title with a number (under 60 characters), the story in 2-3 plain sentences
  with the key numbers, the date, 1-2 URLs opened, what gets drawn, coverage (viral / some / barely), and for
  myth-busting the honest caveat. No em dashes.

## After the swarm

1. Dedupe across lanes (the same story often comes back from two).
2. Pick 30, keeping the lane shares above, and rank the first 8 by: number in the hook, how drawable it is, how
   under-covered it is.
3. Write `workspace/library/full-visual/ideas/<date>-ideas.md` with sources and print its path.
4. The creator's picks go into `workspace/library/full-visual/ideas/bucket.md` (picked on top, candidates below by lane). Never rewrite
   what the creator already picked.
