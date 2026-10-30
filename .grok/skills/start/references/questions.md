# What start reads, and the few things it may still ask

Start knows before it asks. Read the saved answers and account notes first. Ask only when the missing answer changes what we can make. The workspace shows one short question at a time, then reads the answers back in five lines. Setup corrections and confirmation go through chat. Account Markdown can also be edited and saved directly.

The audience and what they need help with belong to the person, once, across every format. Save them in `context/answers.json` as `audience.for` and `audience.need`, with their origin in `read`, and explain them in `context/profile.md`. Use question ids `audience` and `audience_need`. Ask "Who are your videos for?" or "What do they need help with?" only when that fact is still unknown. Offer up to three relevant suggestions and always allow their own words. Account setup need not wait for a detailed content direction; a topic format can add a missing answer later and all formats reuse it.

An answered question disappears from the workspace even if an older questions file still contains it. To explicitly revisit a fact the buyer wants to change, set `revisit: true` on that question. A draft on a page is never a saved answer. The shared context row says what is already saved and links to the account where it can be reviewed.

## The page contract

The agent writes `context/questions.json`: `{ questions: [{ id, ask, options?: [string] }], readback: [string] }`. `questions` contains only unresolved questions, at most three, with stable ids naming the fact they resolve. Each ask is one short sentence. Include choices only when they are meaningful; a free answer remains possible. Remove a question as soon as its answer is saved in `context/answers.json`, retaining that file's `read` provenance. An empty array means there is nothing to ask, not that account setup is complete.

`/setup/questions` reads that file and prepares a prompt. Typing, choosing or copying setup answers does not save them. Once the prompt reaches chat, the agent updates `context/answers.json`, any affected account notes and `context/questions.json`. Reread account Markdown before updating it; Save on a Markdown page already wrote the buyer's edits to the real file. Keep its `readback` to five brief lines containing only facts actually known. When readings finish, share `/setup/readback` for correction or confirmation through chat. Only the agent writes `context/start.json` done, after the readings and confirmation are complete.

## The reading

| Fact | Read from | Confident when | Otherwise |
|---|---|---|---|
| Comment automation exists and is live on reels | Share of the last 20 captions whose first line is "Comment WORD" (quotes allowed, any case) | Over 60 percent (yes) or under 20 percent (no) | Ask: "Do you run a comment-to-DM automation on reels?" |
| What the DM carries | The promises in those first lines: "the links", "the guide", "the full breakdown" | At least three such lines | Ask, only when automation is yes: "What do you send people: links, a guide, a list?" |
| Where people go after Instagram | The bio link, or none | Always | Never asked |
| Who it is for, who it is not for | Saved answers, the bio and recurring subjects in recent posts | The intended audience is stated or already confirmed | Ask: "Who are your videos for?" |
| What that audience needs help with | Saved answers, the buyer's own guides and recurring questions or problems in captions | A concrete need is stated or confirmed | For a topic reel only, ask: "What do they need help with?" |
| What the buyer is credible for | Follower count, the bio, the claims the captions make in first person, the results named | Twenty posts or more | Ask: "What are you credible for: numbers, jobs, results, a named method?" |
| The voice | Measured on captions from the last 90 days into `context/voice.md` | Twenty captions or more | Written from the bio and the buyer's answers, marked as thin |
| What they post | Captions and up to 12 thumbnails from the last 90 days | A recurring subject or presentation is visible | Record uncertainty; exact format study belongs to Trial Reels |
| Language | The captions | Always | Never asked |
| Rhythm | The posting history | Always | Never asked |

## What changes with each fact

The automation decides the first line of every caption and whether a keyword and a DM text are written. The deliverable decides what the caption carries in full and what the DM adds. The destination decides whether "link in bio" is ever written. The audience decides the theme every format picks. The credibility decides which claims may be stated in first person. The voice and the formats decide everything else.

## Never asked

The tool behind the automation (ManyChat, Instagram's own: nothing we make changes with it; the keyword and the DM text are files the buyer pastes), the goal, where the footage lives (a format's own setup asks that when it needs a file), how many posts a week, face or no face, music or silent, language, platforms, colours, fonts.

## Reading it back

Five lines, in the buyer's words, one per fact that matters: "You run a comment automation and it sends links, sometimes a guide. No link in bio. Your posts are for developers and founders who run open source AI on their own machine. You are credible for 67,912 followers on that subject and for testing every tool yourself. Two formats carry the account, the look-up and the desk; the look-up reaches ten times more per post." Then: "Correct anything here, or say go."
