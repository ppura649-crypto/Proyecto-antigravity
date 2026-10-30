// Full Visual in the workspace: three steps, one prompt each. The page writes nothing about the video itself; the
// agent's files say where it is (research.md, transcript.md, then the video in workspace/output/<id>/).
import {productVoiceProviders} from './product-demo-voice.js';

export const fullVisualSteps = [
  ['research', 'Research', 'We find the facts.'],
  ['transcript', 'Transcript', 'We write what the voice says.'],
  ['video', 'Video', 'We animate it, word by word.'],
];
const voices = ['elevenlabs', 'openai', 'fish'].map(id => productVoiceProviders.find(p => p.id === id));
const today = () => { const d = new Date(); return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map(n => String(n).padStart(2, '0')).join('-'); };

export function fullVisualSlug(subject) {
  const words = String(subject || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  let slug = '';
  for (const word of words) { if ((slug + '-' + word).length > 48) break; slug = slug ? slug + '-' + word : word; }
  return slug || 'video';
}
export const fullVisualTitle = subject => String(subject || '').trim().split('\n')[0].slice(0, 80);
export const fullVisualId = (subject, date = today()) => `${date}-full-visual-${fullVisualSlug(subject)}`;
const folder = id => `workspace/projects/${id}`;

export function fullVisualResearchPrompt(d, id = fullVisualId(d.fvSubject)) {
  const subject = fullVisualTitle(d.fvSubject);
  if (!subject) throw Error('Write your subject first.');
  const notes = String(d.fvNotes || '').trim();
  return `/research\nNew Full Visual video: ${JSON.stringify(subject)}\nResearch it for a short explainer. Check every fact today.\nFolder: ${folder(id)}/\nSave research.md there, and project.json with {"format":"full-visual","title":${JSON.stringify(subject)}}.` +
    (notes ? `\n\nMy links and notes:\n${notes}` : '');
}
export function fullVisualTranscriptPrompt(id, own = '') {
  own = String(own || '').trim();
  return own
    ? `/full-visual-script\nUse my own transcript, word for word. Only point out facts that look wrong.\nFolder: ${folder(id)}/\nSave it there as transcript.md.\n\n${own}`
    : `/full-visual-script\nWrite the transcript from research.md.\nFolder: ${folder(id)}/\nSave only the spoken words there as transcript.md.`;
}
export const fullVisualVideoPrompt = id => `/full-visual\nMake the video from transcript.md.\nFolder: ${folder(id)}/\nSave the video, caption.txt and cover.jpg in workspace/output/${id}/.`;
export const fullVisualHasVoice = f => Object.values(f?.voiceKeys || {}).some(Boolean);

function track(current) {
  return `<nav class="onboarding-track" aria-label="Video steps">${fullVisualSteps.map(([id, label], i) => `${i ? '<span class="track-line" aria-hidden="true"></span>' : ''}<span ${current === id ? 'aria-current="step" class="current"' : ''}>${label}</span>`).join('')}</nav>`;
}
const promptBlock = (text, esc, button) => `<pre class="prompt-box product-demo-prompt" id="prompt-text">${esc(text)}</pre>${button('Copy prompt', 'copy-prompt', 'primary', 'copy')}<p class="helper-note">Paste it in the chat open in your Keyframes folder.</p>`;

// The format page: the first video, or the videos so far.
export function fullVisualOverview(f, snapshot, {esc, link, projectRows, outputCards}) {
  const active = snapshot.projects.filter(p => p.format === f.id && !p.completed);
  const outputs = snapshot.outputs.filter(o => o.format === f.id);
  if (!active.length && !outputs.length) return `<div class="product-demo-project fv-first"><h2>Make your first video.</h2><p class="muted">Pick any subject. We research it, write it and animate it.</p><ol class="fv-steps">${fullVisualSteps.map(([, label, text], i) => `<li><span class="fv-number">${i + 1}</span><div><strong>${label}</strong><span>${text}</span></div></li>`).join('')}</ol><div class="button-row">${link('New video', '/formats/full-visual/new', 'primary', 'plus')}</div></div>`;
  return `${active.length ? `<section class="active-videos"><div class="section-title">In progress <span>${active.length}</span></div>${projectRows(active)}</section>` : ''}${outputs.length ? `<section class="recent-outputs"><div class="section-title">Your videos</div>${outputCards(outputs)}</section>` : ''}`;
}

// New video: the subject, then the first prompt.
export function fullVisualNew(d, sub, {esc, heading, button, link}) {
  if (sub === 'new/prompt' && fullVisualTitle(d.fvSubject)) {
    return `<div class="center-flow product-demo-flow fv-flow">${track('research')}${heading('Start the research.', 'Paste this in your chat. Your video then shows up on this page.')}${promptBlock(fullVisualResearchPrompt(d), esc, button)}<div class="flow-footer">${link('Back', '/formats/full-visual/new', 'ghost')}${button('Done', 'fv-done', '', 'check')}</div></div>`;
  }
  return `<div class="center-flow product-demo-flow fv-flow">${track('research')}${heading('What’s your video about?', 'One subject is enough.')}<form id="fv-new-form">
    <label class="field"><span>Your subject</span><textarea data-field="fvSubject" rows="2" placeholder="How do noise-cancelling headphones work?">${esc(d.fvSubject)}</textarea></label>
    <details class="product-demo-options" ${d.fvNotes ? 'open' : ''}><summary>Add links or notes</summary><label class="field"><span>Links or notes (optional)</span><textarea data-field="fvNotes" placeholder="Articles, a report, anything to use">${esc(d.fvNotes)}</textarea></label></details>
    <p class="inline-alert" id="form-error" role="alert"></p>
    <div class="flow-footer">${link('Back', '/formats/full-visual', 'ghost')}<button type="submit" class="btn primary">Continue</button></div></form></div>`;
}

function voiceForm(f, d, esc) {
  const chosen = voices.find(v => v.id === d.fvVoice) || voices[0];
  return `<form id="fv-voice-form" class="fv-voice"><label class="field"><span>Voice service</span><select data-field="fvVoice">${voices.map(v => `<option value="${v.id}" ${v.id === chosen.id ? 'selected' : ''}>${v.name}${v.id === 'elevenlabs' ? ' (best, with emotion)' : ''}</option>`).join('')}</select></label>
    <div class="onb-key"><div class="onb-key-label"><label for="fv-key">${esc(chosen.name)} key</label><a href="${esc(chosen.url)}" target="_blank" rel="noopener noreferrer">Get a key ↗</a></div><input id="fv-key" type="password" placeholder="Paste your key" autocomplete="off" spellcheck="false"><p>It stays on this computer.</p></div>
    <p class="inline-alert" id="form-error" role="alert"></p><button type="submit" class="btn primary">Save key</button></form>`;
}

// One video: the three steps, and the prompt for the one that is next.
export function fullVisualProject(p, f, d, pd, {esc, heading, button, link}) {
  const read = name => p.files?.find(file => file.path === `${p.path}/${name}`);
  const video = p.completed && p.files?.find(file => p.outputPaths?.includes(file.path));
  const caption = p.files?.find(file => file.path === `${p.outputPath}/caption.txt`);
  const current = p.completed ? null : p.progress?.current || 'research';
  const rows = fullVisualSteps.map(([id, label], i) => {
    const step = p.steps?.find(s => s.id === id), done = step?.status === 'done', file = id !== 'video' && done && read(id + '.md');
    return `<li data-state="${done ? 'done' : id === current ? 'current' : 'later'}"><span class="fv-number">${done ? '✓' : i + 1}</span><div><strong>${label}</strong><span>${done ? 'Done' : id === current ? 'Now' : 'Next'}</span></div>${file ? link('Read', '/files?file=' + encodeURIComponent(file.path), 'small-btn ghost') : ''}</li>`;
  }).join('');
  let panel = '';
  if (video) {
    // Finished: the video is the page. The research and transcript stay one click away.
    const cover = p.files?.find(file => file.path === `${p.outputPath}/cover.jpg`);
    const notes = ['research', 'transcript'].map(n => read(n + '.md')).filter(Boolean).map(file => link('Read the ' + file.name.replace('.md', ''), '/files?file=' + encodeURIComponent(file.path), 'ghost small-btn')).join('');
    return `<div class="fv-project">${heading(p.name, 'Your video is ready.')}<video class="product-demo-video fv-video" src="${esc(video.url)}" ${cover ? `poster="${esc(cover.url)}"` : ''} controls playsinline preload="metadata" aria-label="${esc(p.name)}"></video><div class="button-row"><a class="btn primary" href="${esc(video.url)}" download>Download video</a>${caption ? button('Copy caption', 'fv-caption:' + p.id, '', 'copy') : ''}</div><div class="button-row fv-notes">${notes}</div>${link('Back to Full Visual', '/formats/full-visual', 'ghost fv-back')}</div>`;
  }
  else if (current === 'research') panel = `<h2>Research comes first.</h2>${promptBlock(fullVisualResearchPrompt({fvSubject: p.name}, p.id), esc, button)}`;
  else if (current === 'transcript') panel = `<h2>Now the transcript.</h2><p class="muted">${pd.own ? 'Paste your transcript. We keep your words.' : 'We write it from your research.'}</p>${pd.own ? `<label class="field"><span>Your transcript</span><textarea data-fv-text="${esc(p.id)}" rows="8" placeholder="Paste what the voice should say">${esc(pd.text)}</textarea></label>` : ''}${promptBlock(fullVisualTranscriptPrompt(p.id, pd.own ? pd.text : ''), esc, button)}${button(pd.own ? 'Write it for me instead' : 'I have my own transcript', 'fv-own:' + p.id, 'ghost small-btn')}`;
  else if (!fullVisualHasVoice(f)) panel = `<h2>Add a voice first.</h2><p class="muted">Your video needs a voice. ElevenLabs sounds best, with real emotion.</p>${voiceForm(f, d, esc)}`;
  else panel = `<h2>Now the video.</h2><p class="muted">We add the voice, the captions and the visuals.</p>${promptBlock(fullVisualVideoPrompt(p.id), esc, button)}`;
  return `<div class="fv-project">${heading(p.name, p.completed ? 'Your video is ready.' : '')}<ol class="fv-steps fv-progress">${rows}</ol><section class="fv-panel">${panel}</section>${link('Back to Full Visual', '/formats/full-visual', 'ghost fv-back')}</div>`;
}
