# reference edit B visual layer, v3 (ideas before pixels) , SHIPPED

v2 was rejected: **"NEVER USE the same visual twice ... have more visuals, not only text, be
ultra creative. It should visually EXPLAIN PERFECTLY what the current transcript is saying.
So the visuals are highly highly contextualized."** (the creator 2026-09-04)

What v2 got wrong, measured against `references/04-visuals.md`:

- the agent tree ran **three times** (2.2 s, 11.0 s, 47.0 s). Three appearances, one picture.
- 10 cards for **25 ideas**. The skill's law is one visual per idea, not per sentence.
- two cards held **7.3 s** and **8.8 s** against "an animation should never be more than 3-4 s".
- `weigh` and `library` were text on a black plate. The creator asked for pictures, not text.

## The ideas in the narration (not the sentences)

Word times are from `captions.json`, spine time.

| # | idea | trigger word |
|---|---|---|
| 1 | one Claude becomes many | `team` 2166 |
| 2 | it is only two words | (stack owns it) |
| 3 | where you actually type it | `ask` 5879 |
| 4 | almost nobody does this | `few` 7822 |
| 5 | the thing has a name | `subagents` 9994 |
| 6 | delegation = hand off, they report back | `delegation` 11974 |
| 7 | the two literal words | `add,` 14827 |
| 8 | one of them stays in charge | `one` 18067 |
| 9 | the job breaks into pieces | `split` 19908 |
| 10 | one worker per piece | `workers` 22750 |
| 11 | the concrete job: ten real companies | `10` 24297 |
| 12 | one Claude per company, all launched | `copies,` 26827 |
| 13 | they run at the SAME TIME | `same time` 30546 |
| 14 | it costs a bit more | `tokens` 32716 |
| 15 | the payoff dwarfs the cost | `huge` 35007 |
| 16 | one Claude on ten tasks degrades | `7` 38672 |
| 17 | ten Claudes on one task each go deep | `10 agents` 40029 |
| 18 | the answers come home as ONE answer | `merges` 47449 |
| 19 | it is a manager running a team | `manager` 49808 |
| 20 | a real free library exists | `library` 52952 |
| 21 | one line installs it | `install` 55862 |
| 22 | comment TEAM | `link,` 57810 |

## The layer: 14 events, every one a different object

| # | spine | in on | the idea | the picture that proves it | job |
|---|---|---|---|---|---|
| V1 | 2166-5100 | `team` | 1 becomes a team | **agent tree** (approved 09-04): one big claude, three big named agents, connectors draw, a packet runs each branch | TEACHING |
| V2 | 5879-7460 | `ask` | where you type it | **the real Claude Code input box**: the ask types itself, `use subagents` lands on its own line in terracotta and underlines | NAMING |
| V3 | 7822-9440 | `few` | almost nobody | **100 Claude marks in grey, 3 light up terracotta.** No invented number, the picture IS the sentence | STRUCTURE |
| V4 | 10000-12680 | `subagents` | what delegation means | **role legend**: MAIN CLAUDE / holds the plan, SUBAGENT / does one job, and a loop arrow back = reports back | TEACHING |
| Q | 15242-16632 | `add,` | the two literal words | **`"use subagents"` in quotes above their head**, no card (their ask) | - |
| V5 | 18067-23487 | `one` | one stays in charge, then breaks the job up | **split card**, four beats: the claude lands on `one`, the job box on `split`, the pieces fly on `piece`, an agent lands under each on `different`. The separate "lead" card was folded in here: its content was a subset of this one's first beat, which is the same-visual-twice trap | TEACHING |
| V6 | 24297-26827 | `10` | ten real companies | **ten real marks land**, one per beat as the creator counts them, frameless | NAMING |
| V7 | 26827-31144 | `copies,` | ten agents, launched together | **the real Claude Code session** in an ordinary 700x430 terminal: ten `Task(Research <company>)` rows, all Running, the SAME elapsed clock on every row | PROOF |
| V8 | 32716-35450 | `tokens` | small cost, big payoff | **a balance beam**: a short token stack left, a tall quality bar right, the beam tips hard on `huge`. Both numbers real, source under it | PROOF |
| V9 | 36501-39830 | `10 tasks` | one Claude spread thin | **overload**: ten chips pile onto one claude, the quality gauge drains to 7/10 on the word `7` | TEACHING |
| V10 | 40029-45300 | `10 agents` | one task each, goes deep | **spread**: ten claudes in a row, one chip each, a depth bar grows tall under every one, 10/10 | TEACHING |
| V11 | 47449-51141 | `merges` | ten answers become one | **merge**: ten finished answers fan out like a hand of cards, hold long enough to count, then slide together into one on the word `merges` | TEACHING |
| V12 | 52952-56900 | `library` | a real free library, one line | **library**: the count ticks to 202, six real agent names fill in, the real install line types on `install` | PROOF |
| V13 | 57150-59850 | `link,` | the CTA | comment `"TEAM"`, no card | - |

Event rate 1 per 4.0 s (Creator Format 1 measures 3.7-5.5). Longest card 5.3 s (V11, but it lands ten
agents one at a time so nothing holds still). Bare beats on purpose: 12.7-15.2 (the setup for
the head quote), 45.3-47.4 (the turn), 51.1-53.0 ("if you want to go further"), and the last
2.95 s is talking head plus the CTA line.

## Components

Exists, reused: `fanout` (V1, once), `prompt` (V2), `split` (V6), `logos` (V7), `claudecode`
(V8), `library` (V13), `cta` (V14).

New, one per moment that had no picture: `crowd` (V3), `roles` (V4), `scale` (V8),
`overload` (V9), `spread` (V10), `converge` (V11), plus `Head.tsx`, the small-caps header row
every black card wears, measured off the two approved finals.

Deleted from v2: `swarm`, `weigh`, `versus`, and the two extra `fanout` appearances.

## The hook

Their note: "The hook was already good, but now it changed because an AI did a poor job."

The timeline says every move was on their instruction: mid-screen and big (09-04), then "higher
and smaller font size, two sentences max" (0.335 -> 0.235H, 68 -> 52 px), then "put 2 WORDS
TURN 1 CLAUDE INTO A TEAM OF 10." What the machine added on its own is the damage: the words
reveal over 900 ms, so for the first second the screen reads **"2 WORDS TURN 1 CLAUDE / INTO A"**,
a hanging fragment on the most important frame of the video.

Fix, nothing else touched: the line is complete at frame 0 (no reveal), holds to 2.5 s, same
copy, same place, same size.

## Nothing invented

- `~15x more tokens` and `+90.2% over single-agent Claude Opus 4 on the internal research eval`:
  anthropic.com/engineering/multi-agent-research-system.
- `202 agents`, the six agent names, `/plugin marketplace add wshobson/agents`:
  github.com/wshobson/agents, 39,416 stars.
- The ten competitor marks are the real logos, each unmixed off its tile, no box behind any.

## What the stills caught before the full render

- `scale` v1 hung its two value blocks off the pan ends, so `~15x` and `+90.2%` were both
  clipped by the card edges. Laid out from the card IN instead: each side owns a fixed column
  and the pans are placed under the columns.
- `overload` v1 was a pile of solid grey bars, which is the banned content (04-visuals.md).
  Rebuilt as ten outlined `task N` chips landing on one Claude with an output bar draining.
- the session window at 1100x620 put remocn's 16 px type at 15 px on the frame, unreadable on
  a phone. A terminal is resizable, so the session is a 700x430 window: same type, 1.48x on
  the frame, full width still visible, no push and no reflow.
- `converge` v1 let the sheets stack as they arrived, so only three were ever on screen. Now
  all ten fan out first and gather on the word.
- `crowd` v1 scattered the three lit marks across a hundred; scattered reads as noise. Three
  side by side read as "a few".


approved: retroactive 2026-09-05. This layer shipped before the approval line existed; their verdicts are in the talking-head skill timeline (references/00-timeline.md). New plans get the line only after the creator has read the ideas.
