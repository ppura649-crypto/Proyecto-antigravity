# Visual plan, chrome-fingerprinting (US Snap + FR Simon, one plan for both)

approved: (waiting)

Read the right-hand column alone: it should retell the script. Every event is tied to a spoken word ("lands on" = one
event on the word, "ends on" = a build that finishes on it). Times are the US take (FR runs about 1 s earlier by the
end); they are only there to find the passage. Facts and sources: `facts.md`. The script is his, verbatim.

## Once for the reel

- **The continuous thing: one Chrome window with an AliExpress tab.** It opens in the hook, the hidden sound is found
  inside that tab, the fingerprint is computed from it, and at the end the window is the thing the viewer is told to
  switch. Every scene is something happening in or to that window.
- **The second continuous thing: a row of four real browser marks** (Chrome, Safari, Firefox, Brave), born on
  "browser" in `choose`, one empty verdict slot reserved under each. `browsers` fills Firefox and Brave, `chrome`
  answers Chrome and Safari. It is the scoreboard and the progress bar of the last third.
- **Pinned chrome: none.**
- **Grounds:** dark for the hidden machinery (hook, sound, fingerprint, Chrome's verdict); light for documents and
  choices (the developer's post, the history, the browser row, the ask).
- **The one big move:** on "fingerprint" (end of `fingerprint`), the whole audio graph collapses into one line of text,
  the hash, stamped under the laptop. Nothing else is that loud.
- **No invented data.** The audio graph, the hash values, the dates and the release-note line are real (sources in
  `facts.md`). Where a number is not in a source, none is drawn.
- Real marks only, fetched with logo.dev: Chrome, Safari, Firefox, Brave, AliExpress, Alibaba, Instagram. Interfaces
  are redrawn at their real geometry: Chrome's tab strip and address bar, the developer's blog header, Instagram's
  profile header.

## Scene by scene

### 1. `hook`, dark, 0.1 to 3.9 s
"Google Chrome is just another spyware, let me tell you exactly why:"

| Word | What changes |
|---|---|
| first frame | a Chrome window is mid-entrance, centred, empty new tab, address bar with a blinking caret |
| Chrome | lands on: the real Chrome mark pops in the address bar's left slot |
| spyware, | lands on: the window's frame turns the reel's one red for 10 frames and a red `spyware` label stamps across the tab strip |
| why: | ends on: `aliexpress.com` types into the address bar and the tab title becomes the real AliExpress favicon + `AliExpress` |

### 2. `developer`, light, 4.0 to 12.6 s
"Ok so here's what just happened: A developer just proved that AliExpress and Alibaba are spying on us and we don't really know what they're using it for or what they're doing."

| Word | What changes |
|---|---|
| happened: | the Chrome window shrinks to a small tile top-left (it stays all reel); the developer's real blog post arrives: its header and title, "AliExpress webpage keeping multipoint Bluetooth headphones active with WebAudio fingerprinting", date 20 August 2026 |
| developer | lands on: the byline row lights (name, blog name). No face: there is no public portrait of this developer, so the row is text only, not an invented face |
| AliExpress | lands on: the real AliExpress mark docks on the post's right edge; `Alibaba` docks under it on "Alibaba" |
| spying | lands on: the post scrolls to its code section: the two real script names, `collina.js` and `fireyejs.js`, highlight |
| using | ends on "doing.": the post scrolls to the developer's own sentence, which highlights line by line: "I cannot see what AliExpress does with the resulting data after it reaches their servers." |

### 3. `sound`, dark, 12.7 to 23.9 s
"Basically, when you open AliExpress or Alibaba on your computer, it starts playing a sound. But you can't hear it, because the volume is set to zero. It's running inside your browser, and it's used to recognize your device."

| Word | What changes |
|---|---|
| open | the Chrome tile grows back to full size, AliExpress homepage loading in it (redrawn: header, search bar, three product cards, no real product photos needed) |
| sound. | lands on: the page goes translucent and the real audio chain from the developer's post draws under it, node by node: `Sawtooth oscillator → Analyser → Script processor → Gain → Speakers`, a sawtooth wave flowing through the first nodes |
| can't | lands on: a speaker at the end of the chain; the wave reaches it flat |
| zero. | lands on: the Gain node's value rolls down to `0` on the word; the wave after it is a flat line |
| browser, | lands on: the whole chain shrinks into the tab, a small live wave glyph stays on the tab title |
| recognize | ends on "device.": a laptop card slides out of the tab with an empty `device ID` field, caret blinking in it |

### 4. `fingerprint`, dark, 24.0 to 38.7 s
"And this is what's called fingerprinting. Every computer processes that audio signal a little differently, depending on the processor, sound card, drivers, and operating system. We're talking about tiny differences. Nothing you'd ever notice, but enough to create a fingerprint for your computer."

| Word | What changes |
|---|---|
| fingerprinting. | lands on: the word itself types into the laptop card's title |
| Every computer | the laptop becomes three laptops side by side (the same card, copied from its own position), the same sawtooth entering each |
| differently, | lands on: each laptop's analyser output draws as a bar spectrum; the three look identical at this size |
| processor, sound card, drivers, operating system | four rows light one per word on a spec strip under the laptops, in his words |
| tiny | lands on: a loupe drops onto the three outputs: each is a long decimal number, identical except for its last digits, which turn mint. The numbers are the published example from Fingerprint's audio-fingerprinting article, verified before build; if they cannot be verified, the loupe shows the three digit columns without values |
| notice, | the loupe lifts, the numbers blur back to bars |
| fingerprint | **the one big move**, lands on: the graph, the spectrum and the numbers collapse into one line under the middle laptop, a real value measured by the Firefox engineer on Alibaba's code: `sha256:9a388c0d…`, and it fills the `device ID` field |

### 5. `known`, light, 38.8 to 43.9 s
"This is actually a well-known technique. It's been around for years, and plenty of companies do the same thing."

| Word | What changes |
|---|---|
| well-known | a horizontal timeline draws, left to right |
| years, | ends on: dated pins drop in order, each a real source: 2023-11-05 `Mozilla bug: AliExpress audio keeps the PC awake`, 2026-08-20 `the developer's post`. An older first-discovery pin is added only if verified before build |
| plenty | lands on: the open-source FingerprintJS GitHub card slides onto the timeline, stars counting to their real value on the day of the build |
| thing. | the timeline dims, ready to hand over |

### 6. `choose`, light, 44.0 to 53.2 s
"But the only way to protect yourself is through your browser. Which browser you choose matters. Because this technique is so well known, a lot of browsers have already taken steps to stop it."

| Word | What changes |
|---|---|
| browser. | lands on: the Chrome tile moves down into the first slot of a row; Safari, Firefox and Brave marks pop into the next three slots |
| matters. | lands on: an empty verdict slot opens under each mark (dashed outline, the slots the next scenes fill) |
| stop | ends on "it.": the laptop's hash line from scene 4 slides in above the row, the thing every verdict is about |

### 7. `browsers`, light, 53.3 to 61.8 s
"Firefox, for example, has blocked audio fingerprinting since 2023. Brave adds a little random noise to the results, so the fingerprint changes each time."

| Word | What changes |
|---|---|
| Firefox, | lands on: Firefox lifts out of the row, the others dim |
| 2023. | lands on: its slot fills with a tag `Firefox 118 · 2023` and the release note's own line types under it: "Web Audio now uses the FDLIBM math library on all systems"; the hash line above goes grey (the same for everyone) |
| Brave | lands on: Firefox settles back, Brave lifts |
| noise | lands on: the hash line jitters, its characters scrambling |
| changes | lands on: the hash line re-rolls into a different string, and Brave's slot fills `random noise` |

### 8. `chrome`, dark, 61.9 to 65.8 s
"Unfortunately, Chrome and Safari don't offer anything comparable by default."

| Word | What changes |
|---|---|
| Chrome | lands on: the ground turns dark; the Chrome mark lifts; its slot stays empty, the dashed outline turning red |
| Safari | lands on: Safari lifts; its slot stays empty too |
| comparable | ends on "default.": the original hash `sha256:9a388c0d…` stamps back above both, unchanged |

### 9. `cta`, light, 65.9 to 69.8 s
"So switch browsers. And if you want more tips like this, follow me."

| Word | What changes |
|---|---|
| switch | lands on: a cursor clicks Firefox's mark; the Chrome window's frame swaps to the Firefox window (same object, same position) |
| tips | the browser row slides down and fades; Instagram's profile header arrives: the creator, his real profile photo, name, follower count as shown on his profile |
| follow | lands on: the cursor taps `Follow`, it turns `Following`, the follower count ticks +1 |
| last frame | the profile header holding, `Following` visible, readable if paused |

## What I need from you

1. Approve this plan in words, or change it.
2. The first passage I would build alone for you to judge: `sound`, 12.7 to 23.9 s (the AliExpress tab, the hidden
   audio chain, the gain rolling to zero). It is the core of the reel and the hardest to make readable.
