# cut-tight visual plan v2 (Jina AI reel, their own cut, 44.1 s)

Spine time = source time (the creator cut it themselves, one continuous file). Framing is
different from reference edit A: head top 0.46H, chin 0.72H, mic 0.80H. So captions sit
under the chin (baseline 0.775H, stacks from 0.735H) and the card band is
0-0.44H, taller than last time (cards up to hFrac 0.34, takeovers hFrac 0.40).

Facts verified 2026-09-02 on jina.ai/reader: prepend r.jina.ai to a URL to get
LLM-friendly text; r.jina.ai is 20 RPM without a key, 500 RPM with a free key;
s.jina.ai returns the top five results with full contents. "500 pages a minute
with a free key" is true.

## First 10 seconds (the ones that matter)

| t | the creator says | caption layer | visual layer, exactly |
|---|---|---|---|
| 0.00-1.30 | "Do you ever feel like AI" | stack DO YOU EVER / FEEL LIKE / AI (terracotta hero, under the chin) | bare until "AI" |
| 0.90-2.58 | "AI doesn't do a good job when it" | word by word | light card pops at 0.90 ON "AI": a ChatGPT answer, "Searched the web" chip, three thin paragraphs with citation pills and a Sources pill, slow scroll + zoom 1.00-1.03 |
| 2.58-3.96 | "searches something for you?" | stack SEARCHES (hero) / SOMETHING / FOR YOU? | card hard-cuts OUT at 2.58 the frame SEARCHES lands. BARE. The punch owns the screen |
| 3.96-4.26 | "That's because" | word by word | bare |
| 4.26-5.58 | "ChatGPT and Claude" | word by word | the real ChatGPT mark pops frameless at 4.26 ON "ChatGPT" (left), the real Claude mark pops beside it at 5.10 ON "Claude". Google favicon API, cropped to the bare mark, nothing behind them |
| 5.58-6.84 | "search the internet" | word by word | light card at 5.58 ON "search": a REAL DuckDuckGo results page for "best open source vector database" (the ChatGPT card's question), fast scroll |
| 6.84-8.10 | "but they barely read it" | word by word | swap at 6.84 ON "barely": the REAL Wikipedia "Vector database" page; at 7.20 ON "read" everything fades to white except three lines, which stay bright with a terracotta tint (`dimread`) |
| 8.10-11.10 | "They only skim pieces from a few pages to save tokens" | word by word | swap at 8.10 ON "skim": four REAL pages pop in (Wikipedia, GitHub chroma, qdrant.tech, weaviate.io); at 8.46 ON "pieces" each greys out except two lines; at 9.42 ON "pages" the eight torn lines fly into one black context window and enlarge on the way so they read as text; the token counter runs and STOPS at 10.44 ON "tokens", turning terracotta (`skim`) |

## 10 s to end (as built, v1 of the full overlay)

| t | the creator says (trigger) | visual, exactly |
|---|---|---|
| 11.16-13.08 | "There's a tool that I use pretty much daily" | BARE, the tease |
| 13.08-14.82 | "fixes exactly this" | dark card ON "fixes": the context window from the skim card again, the entire page (real r.jina.ai markdown) streaming into it, the counter climbing 2,140 to 26,098 (`fill`) |
| 14.82-15.90 | "Jina AI" | JINA AI hero caption; the real Jina mark floats frameless ON "Jina" |
| 15.90-19.20 | "Its whole speciality is internet search, but for AI agents" | light card ON "Its": the REAL jina.ai/reader page, slow scroll + zoom, terracotta sweep on "Convert a URL to LLM-friendly input by prepending r.jina.ai" ON "internet" 17.10 |
| 19.20-24.00 | "instead of snippets, your AI receives the entire page. And it's not slow either" | TAKEOVER on white (`entire`): left a snippet, three real lines of the page, greys and gets struck ON "snippets" 20.10; arrow; right a dark panel under the real address r.jina.ai/https://en.wikipedia.org/wiki/Search_engine, the entire page streams in ON "entire" 21.90 with the ENTIRE PAGE hero |
| 24.36-28.14 | "free key ... 500 pages a minute" | light card ON "free": the rate-limit table rebuilt from jina.ai/reader with the real values (r.jina.ai 20 / 500 / 500 RPM, s.jina.ai block / 100 / 100), credit line; sweep on the free-key 500 RPM row ON "500" 26.10 |
| 28.14-35.90 | "game changer ... deep research work ... enterprise clients ... a task that actually needs good data" | dark terminal ON "game changer" (`term`): a deep-research run streaming, s.jina.ai searches and r.jina.ai reads of real pages with token counts, one line every 300 ms, auto-scrolls |
| 35.90-38.18 | "that's when you'll start to feel the real value" | BARE, the thesis |
| 38.18-40.58 | "The setup only takes about 3 minutes. So if you want the link" | dark terminal ON "setup" (`term`): export JINA_API_KEY, the curl to r.jina.ai/https://example.com, the real response shape (Title, URL Source, Markdown Content) |
| 40.58-44.12 | "the link and some tips and tricks to set it up, comment search and I'll send it over" | CTA line only, just above their head: comment "SEARCH". No cards |

## The bare moments and why

1. 2.58-4.26, the SEARCHES punch. Nothing competes with the turn.
2. 11.16-13.08, the tease before the name.
3. 35.90-38.18, "that's when you'll start to feel the real value". The thesis.
4. 40.58 to the end, the CTA line only, card-free as Creator Format 1 does.

## Asset decisions

- Logos: Google favicon API -> `library/assets/logos/`, cropped to the bare mark by
  `scripts/logo_clean.py`. No background behind any of them.
- Real pages shot with `scripts/shoot_url.mjs` (Wikipedia "Search engine",
  jina.ai/reader). The rate table is a horizontal-scroll table on the real page
  (the 500 RPM cells sit off-screen at every viewport width), so it is rebuilt
  as a light card with the real values and credited.
- The ChatGPT card is a replica of the ChatGPT answer UI (light, citation pills,
  Sources), authored in `assets/src/ai-search.html`; the favicons in it are real.
- The "entire page" panel is the actual r.jina.ai output of the Wikipedia page
  (`assets/src/data/search-engine.r.md`).

## v1 -> v2 (2026-09-02, the creativity correction)

v1 covered "search the internet ... save tokens" with one Wikipedia page scrolling and three
sweeps. Rejected: "i was expecting more visuals, like more creative". v2 gives the sentence
its four pictures: a real results page (search), a page dimming to three lines (barely read),
four pages torn to two lines each flying into a context window with a counter that stops
(skim pieces from a few pages, save tokens). Two new card kinds came out of it, `dimread`
and `skim` (`remotion/src/cards/`).


approved: retroactive 2026-09-05. This layer shipped before the approval line existed; their verdicts are in the talking-head skill timeline (references/00-timeline.md). New plans get the line only after the creator has read the ideas.
