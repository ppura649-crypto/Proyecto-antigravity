# Facts, distillation (checked 2026-09-26)

- Anthropic threat report, published Thu 10 Sep 2026: seven China-based labs, nearly 200M exchanges across the campaigns.
  Sources: techcrunch.com/2026/09/10/anthropic-details-distillation-campaigns-from-alibaba-moonshot-ai-and-deepseek ;
  thehackernews.com/2026/09/anthropic-says-seven-china-based-ai.html ; qz.com (151M, May to July)
- Alibaba (campaign GTG-16005): 151 million exchanges, May to July 2026, peak ~3 million a day, 3,500+ fraudulent
  accounts, one fixed prompt, attributed to training Alibaba's Qwen family. "Largest distillation attack we have ever measured."
- Target: chain-of-thought reasoning transcripts of Claude Opus 4.6 and 4.7 (the "thinking").
- Countermeasure: Claude now summarizes its internal reasoning before responding (summarized thinking).
- Distillation = teacher model's outputs used to train a student (legitimate technique; illicit when done covertly via fake accounts).
- Mechanics in the script (tokens, next-token scores, weights nudged by training, overfitting) are standard and simplified, not claims from the report.

Wording notes:
- "questions" = Anthropic's "exchanges" (one request + one answer).
- "copy it" is Anthropic's allegation; the script attributes it ("Anthropic released a report saying").

## v2 (his transcript, light edits, 2026-09-26)
- "only shows the token it picked, not its full probabilities": the Claude Messages API returns text only, no logprobs.
- "hidden states stay inside Claude": true of any closed API model.
- "full probabilities tell the student the teacher was hesitating": the soft-label idea from classic knowledge distillation (Hinton et al. 2015).
- "That's why Alibaba went after Claude's thinking": the reported target is chain-of-thought transcripts; the "why" is our explanation, not a quote from the report.
- "three months": the report says May to July 2026.

## Primary source read 2026-09-26: anthropic.com/threat-intelligence-report-september-2026
Title "Countering misuse of AI: September 2026". Section "GTG 16005: Chain-of-thought distillation and AI R&D campaign
by Alibaba (Qwen / Tongyi Lab)". Quotes: "Operators affiliated with Alibaba ran the largest distillation attack we have
ever measured." ... "injected a fixed prompt into each request that forced Claude to write out its reasoning traces
inside inline text tags before providing its final answer" ... "used to distill Claude's capabilities into Qwen 3.5,
3.6, and 3.7" ... "peaked at nearly 3 million exchanges per day launched from more than 3,500 fraudulent accounts" ...
"Scale of distillation attacks attributable to Alibaba between May and July 2026: over 151 million exchanges observed."
Safeguard: "Claude now summarizes its internal reasoning before responding, which makes stolen transcripts less useful
for training another model." Definition: teacher generates responses, exchanges train a smaller student to mimic it.

- On screen the report page shows its visible H1, "Detecting and countering misuse of AI: September 2026" ("Countering misuse of AI: September 2026" is the browser-tab title).
