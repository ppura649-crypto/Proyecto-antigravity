// Talking Head comes in styles. The person picks once, after watching a real video of each, or creates their own
// from videos they love (the create-my-own skill); a style they created shows up here beside ours.
export const talkingStyleCards = [
  ['classic', 'Classic', 'You talk the whole time. The visuals appear above you, on your words.', 'Best for one strong idea, a product or a story.', 'classic'],
  ['split', 'Split explainer', 'The screen splits: you at the bottom, the visuals on top. Sometimes the visuals take the whole screen.', 'Best for explaining how something works.', 'split-explainer'],
];
const example = name => `/media/assets/talking-head/examples/${name}`;
export const talkingStyleName = f => talkingStyleCards.find(c => c[0] === f.style)?.[1] || f.styles?.find(s => s.id === f.style)?.name || '';
// The skill a style runs on: ours, or the one create-my-own made.
export const talkingStyleSkill = (f, id = f.style) => id === 'split' ? 'split-explainer' : id === 'classic' || !id ? 'talking-head' : f.styles?.find(s => s.id === id)?.skill || 'talking-head';

export function talkingStylePage(f, {esc, heading, button, link}) {
  const card = (id, name, what, video, poster) => `<article class="th-style${f.style === id ? ' chosen' : ''}">
    ${video ? `<video src="${esc(video)}" ${poster ? `poster="${esc(poster)}"` : ''} controls playsinline preload="metadata" aria-label="${esc(name)} example"></video>` : '<div class="th-style-empty" aria-hidden="true"></div>'}
    <h2>${esc(name)}</h2><p>${esc(what)}</p>
    ${button(f.style === id ? 'Keep ' + name : 'Use ' + name, 'th-style:' + id, f.style === id ? '' : 'primary', f.style === id ? 'check' : '')}</article>`;
  const ours = talkingStyleCards.map(([id, name, what, , file]) => card(id, name, what, example(file + '.mp4'), example(file + '.jpg')));
  const theirs = (f.styles || []).map(s => card(s.id, s.name, s.what || 'Your own format.', s.example));
  const create = `<article class="th-style th-style-create"><div class="th-style-empty th-style-plus" aria-hidden="true">+</div><h2>Create my own</h2><p>Paste links to videos you love. We study every frame and build your own style.</p>${link('Create my own', '/formats/talking-head/create', '')}</article>`;
  return `<div class="th-style-page">${heading('Pick your style.', f.style ? 'Your next videos use it. Videos already started keep theirs.' : 'Watch them. You choose once, and you can switch later.')}<div class="th-style-grid">${[...ours, ...theirs, create].join('')}</div>${f.style ? `<div class="flow-footer">${link('Back', '/formats/talking-head', 'ghost')}</div>` : ''}<p class="inline-alert" id="form-error" role="alert"></p></div>`;
}

export function talkingCreatePrompt(d) {
  const links = String(d.ownLinks || '').split(/\s+/).filter(l => /^https?:\/\//.test(l));
  const love = String(d.ownLove || '').trim();
  return ['/create-my-own', 'Create my own Talking Head style from these videos:', links.length ? links.join('\n') : '(paste your links above)', love ? `What I love about them: ${love}` : '', 'Study every video frame by frame, tell me what you found before building, then build the style and test it on one of my recordings.'].filter(Boolean).join('\n\n');
}

export function talkingCreatePage(f, d, {esc, heading, button, link}) {
  return `<div class="center-flow th-create">${heading('Create my own.', 'Paste 3 to 10 links of one format you love. 5 or more is best.')}
    <label class="field"><span>Links, one per line</span><textarea data-own="ownLinks" rows="6" placeholder="https://www.instagram.com/reel/...&#10;https://www.tiktok.com/@.../video/...&#10;https://youtube.com/shorts/...">${esc(d.ownLinks)}</textarea></label>
    <label class="field"><span>What do you love about them? (optional)</span><input data-own="ownLove" placeholder="The zooms on every key word, the yellow captions" value="${esc(d.ownLove)}"></label>
    <pre class="prompt-box" id="prompt-text">${esc(talkingCreatePrompt(d))}</pre>${button('Copy prompt', 'copy-prompt', 'primary', 'copy')}
    <p class="helper-note">Paste it in the chat open in your Keyframes folder. It takes a while: every video is studied in depth. Your style then shows up under Pick your style.</p>
    <div class="flow-footer">${link('Back', '/formats/talking-head/style', 'ghost')}</div></div>`;
}

export async function writeTalkingStyle(style, {fetcher = fetch} = {}) {
  let response;
  try { response = await fetcher('/api/talking-head/style', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Keyframes-Write': 'talking-style'}, body: JSON.stringify({style}), signal: AbortSignal.timeout(10000)}); }
  catch { throw Error('Your choice could not be saved. Try again.'); }
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(value.error || 'Your choice could not be saved. Try again.');
  return value;
}
