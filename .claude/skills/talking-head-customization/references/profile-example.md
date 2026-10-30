# How to record a choice

This is a fictional illustration, not the creator's profile or a shipped default. Add decisions
under descriptive keys such as `hook.layout`, `captions.body`, `palette`, `cards.surface`,
`sound.added`, `pacing`, `cta` and `post_caption`.
Use only keys for choices actually discussed. Complex values can be structured objects.

```json
{
  "palette": {
    "status": "confirmed",
    "scope": "creator/channel/talking-head",
    "value": {
      "caption_text": "#FFFFFF",
      "caption_emphasis": "#3B82F6",
      "card_background": "#0B1220",
      "card_text": "#FFFFFF",
      "card_accent": "#3B82F6",
      "accent_relationship": "shared"
    },
    "goal": "Make the key point readable and keep the authored look consistent.",
    "rationale": "The creator asked for the same blue on important words and designed visuals.",
    "rationale_source": "user_explicit",
    "example": "The payload word and the highlighted authored chart series use the same blue.",
    "boundaries": "Real app interfaces, marks and source images keep their own colors.",
    "evidence": {
      "user_words": "Use blue on the important words and the same blue for my visuals.",
      "reference": "onboarding conversation, exact message identifier when available"
    }
  }
}
```

Use `user_explicit` only when the stated reason came from the user. Otherwise use
`editorial_interpretation`; do not present that interpretation as a quote. A user may confirm
the proposed interpretation in the final read-back. A `delegated` decision records what the
agent may choose and the boundaries; it does not pretend a suggested hex was a user pick.

The adjacent preferences page might say:

> They want clear explanations for viewers who are learning the tools. White captions and a
> single blue accent make the key idea easy to spot. Designed visuals share that accent, while
> recognizable app interfaces keep their own appearance.

If a later note says "only this card should be white", store it with the project and fix that
card. The global palette above stays unchanged. If it says "I want white cards from now on",
update that decision, increase `revision`, preserve the previous value as superseded evidence,
and rewrite the relevant paragraph without losing the goal or untouched preferences.

Before reporting a saved profile: parse the JSON, verify binding and referenced paths, check
that every confirmed decision has evidence, and compare all unrelated decisions with the
previous revision. `setup.status: complete` needs an actual confirmation or an explicit user
instruction to save those defaults. Implementation status remains separate from preference
status: a confirmed request can still need a new style in the renderer.
