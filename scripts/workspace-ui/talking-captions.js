// Your captions, for both Talking Head styles: copy a video you like, or describe it. The agent measures every detail
// and shows it on your own footage before saving. Only the captions change, never the visuals or the method.
const details = 'the font and its weight, the size, capitals or not, the colour of a word already said, the word being said and the words still to come, how key words stand out (colour, box, size, emoji), how many words show at once and on how many lines, where they sit on screen and away from my face, how each word appears and on which frame of the voice, outline, shadow or background, and what happens between sentences';

import {talkingStyleSkill} from './talking-style.js';

export function talkingCaptionsPrompt(f, d) {
  const skill = talkingStyleSkill(f), split = skill !== 'talking-head';
  const link = String(d.capLink || '').trim(), text = String(d.capText || '').trim();
  const source = d.capMode === 'describe'
    ? `Here is how I want my captions:\n${text || '(write it above)'}`
    : `Copy the captions of this video exactly:\n${link || '(paste the link above, or attach the video with this prompt)'}`;
  return [
    split ? '/' + skill : '/talking-head-customization',
    source,
    `Work out every detail: ${details}. Watch it frame by frame, then rebuild it on a still of my own footage and show me before saving.`,
    split ? 'This is my caption look for this style, not a new video. Save it as my standing choice, the way the skill saves a presentation.' : 'This is my Talking Head caption look, not a new video. Save it with its reasons, the way the skill saves a look.',
    'Change only the captions. The visuals, the motion, the method and its patterns stay as they are.',
  ].join('\n\n');
}

export function talkingCaptionsPage(f, d, {esc, heading, button}) {
  const describe = d.capMode === 'describe';
  const field = describe
    ? `<label class="field"><span>Describe your captions</span><textarea data-cap="capText" rows="5" placeholder="Big white words, two at a time, in the middle of the screen. The key word in yellow. Each word pops in when it is said.">${esc(d.capText)}</textarea></label>`
    : `<label class="field"><span>Link to a video whose captions you like</span><input data-cap="capLink" type="url" placeholder="https://www.instagram.com/reel/..." value="${esc(d.capLink)}"></label><p class="helper-note">Have it as a file? Attach it in chat with the prompt.</p>`;
  return `<div class="center-flow th-captions">${heading('Your captions.', 'Show us captions you like, or describe them. We copy every detail.')}
    <div class="th-cap-switch" role="tablist">${button('Copy a video', 'cap-mode:copy', describe ? 'ghost' : 'primary')}${button('Describe them', 'cap-mode:describe', describe ? 'primary' : 'ghost')}</div>
    ${field}
    <pre class="prompt-box" id="prompt-text">${esc(talkingCaptionsPrompt(f, d))}</pre>${button('Copy prompt', 'copy-prompt', 'primary', 'copy')}
    <p class="helper-note">Paste it in the chat open in your Keyframes folder. You see your captions on your own footage before anything is saved. Skip this and we use ours.</p></div>`;
}
