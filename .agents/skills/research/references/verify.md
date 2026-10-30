# What counts as verified

A claim is verified when, at build time, you saw the value at its source and wrote down where and when.

- A repository: name, stars, last push, open issues, license, fetched live; flag archived, disabled, forks, and anything with no push in 180 days.
- A number: the figure, the page it sits on, the date on that page.
- A quote: the exact words and the page or recording they come from.
- A person's method or claim: their own page, book or talk, not a summary of it.
- A price: the pricing page today.
- The buyer's own claim: their answer in `context/answers.json` under credibility, or their own post.

Unverifiable means unused. Say so in the brief rather than softening the sentence.

## Recording sources in brief.md

```
## Sources
- Author, Book title, chapter 1: lead with the answer, then the reasons. Read 2026-09-03.
- github.com/owner/name: 2,338 stars, pushed 2026-08-29, MIT. Fetched 2026-09-03.
- Buyer, answers.json credibility: "placed 200 people in 4 years".
```

One line per claim. The format's check reads this list; a claim on screen or in the caption without a line here fails the build.
