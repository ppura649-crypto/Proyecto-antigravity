import {accountLabel} from './account-identity.js';

const platforms = {instagram:'Instagram',tiktok:'TikTok',youtube:'YouTube'};
export function onboardingRoute(path, state) {
  if (!state) return path;
  if (state.done && /^\/onboarding(?:\/|$)/.test(path)) return '/';
  if (!state.done && path === '/') return state.stage === 'prompt' ? '/onboarding/prompt' : '/onboarding';
  return path;
}
export function setupPrompt(state = {}) {
  return ['/start',state.handle ? `${platforms[state.platform] || 'Instagram'}: ${accountLabel(state)}.` : ''].filter(Boolean).join('\n');
}
export function onboardingView(step, snapshot, {esc,icon}, entry = true) {
  const state = snapshot.onboarding || {}, prefix = entry ? '/onboarding' : '/account';
  const action = (label, name, kind = '', symbol = '') => `<button type="button" class="btn ${kind}" data-onboarding-action="${name}">${esc(label)}${symbol ? icon(symbol) : ''}</button>`;
  const route = (label, path, kind = '') => `<a class="btn ${kind}" href="${path}" data-route="${path}">${esc(label)}</a>`;
  const heading = (title, subtitle) => `<div class="onb-intro"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>`;
  const exit = action(entry ? 'Do this later' : 'Back to Home','complete','ghost');
  let content;
  if (step === 'welcome') {
    content = heading('Your next reel starts here.','A few things to make Keyframes yours.') + `<div class="onb-benefits"><div>${icon('chart')}<strong>We learn your voice</strong><p>In the background.</p></div><div>${icon('montage')}<strong>You start creating</strong><p>Pick any of your formats.</p></div></div><div class="onb-actions">${route('Let’s get started',prefix+'/account','primary')}${exit}</div>`;
  } else if (step === 'account') {
    content = heading('Make this yours.','Your account helps us understand your content.') + `<form id="onboarding-form"><fieldset class="onb-platforms"><legend class="sr-only">Your platform</legend>${Object.entries(platforms).map(([id,label])=>`<label><input type="radio" name="onboarding-platform" value="${id}" ${state.platform === id ? 'checked' : ''}><span>${label}</span></label>`).join('')}</fieldset><label class="onb-field" for="onboarding-handle">Handle or channel link<input id="onboarding-handle" value="${esc(state.handle)}" placeholder="@yourname" maxlength="180" autocomplete="off" autocapitalize="off" spellcheck="false"></label><p class="onb-note" id="onboarding-platform-note">${platformNote(state.platform)}</p><div class="onb-key"><div class="onb-key-label"><label for="onboarding-key">Composio API key</label><a href="https://dashboard.composio.dev/" target="_blank" rel="noopener noreferrer">Get a key ↗</a></div><p>Choose your workspace → project → API Keys.</p><input id="onboarding-key" type="password" placeholder="${state.hasKey ? 'Key already saved. Leave blank to keep it.' : 'Paste your key, or add it later'}" autocomplete="off" spellcheck="false" aria-describedby="onboarding-key-help"><p id="onboarding-key-help">Saved on your computer. Never in your chat.</p></div><div class="onb-actions"><button type="submit" class="btn primary">Get my setup prompt ${icon('arrow')}</button>${exit}</div></form>`;
  } else {
    content = heading('One prompt. Then you’re in.','Open your Keyframes folder in the agent you already use.') + `<p class="onb-prompt-label">${icon('agent')}Paste into your agent chat</p><div class="onb-prompt-summary"><pre id="prompt-text">${esc(setupPrompt(state))}</pre></div><div class="onb-actions">${action('Copy prompt','copy','','copy')}${action('Go to Home','complete','primary','arrow')}</div>`;
  }
  const back = step === 'welcome' ? '' : route('Back',step === 'account' ? entry ? '/onboarding' : '/account' : entry ? '/onboarding/account' : '/account/connect','ghost');
  const steps = ['Your account','One prompt','Home'];
  const track = entry && step !== 'welcome' ? `<ol class="onb-track" aria-label="Getting started">${steps.map((label,i)=>`<li ${i === (step === 'account' ? 0 : 1) ? 'aria-current="step"' : ''}>${label}</li>`).join('')}</ol>` : '';
  return `${entry ? `<header class="onb-mast"><a class="onb-brand" href="/" data-onboarding-action="complete"><span class="kf-mark" aria-hidden="true"></span>Keyframes</a>${action('Go to Home','complete','ghost')}</header>${track}` : ''}<div class="onb-stage ${entry ? '' : 'onb-in-account'}"><section class="onb-screen ${step === 'welcome' ? 'onb-welcome' : ''}">${back ? `<div class="onb-back">${back}</div>` : ''}${content}<p class="onb-error" id="onboarding-error" role="alert" hidden></p></section></div>`;
}
function platformNote(platform) {
  return platform === 'instagram' ? 'Use your own Instagram Business or Creator account.' : `${platforms[platform] || 'This platform'} account reading is not available yet. Save your handle and keep creating.`;
}
export async function writeOnboarding(input) {
  const response = await fetch('/api/onboarding', {method:'POST',headers:{'Content-Type':'application/json','X-Keyframes-Write':'onboarding'},body:JSON.stringify(input),signal:AbortSignal.timeout(10000)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Your setup could not be saved. Try again.');
  return result;
}
export function mountOnboarding(host, {snapshot, entry, navigate, saved, copy, toast}) {
  const events = new AbortController();
  let busy = false, leaving = false;
  const showError = error => {const el = host.querySelector('#onboarding-error'); if (el) {el.textContent = error.message || 'Your setup could not be saved. Try again.'; el.hidden = false;}};
  const clearKey = () => {const key = host.querySelector('#onboarding-key'); if (key) key.value = '';};
  const complete = async () => {
    if (leaving) return;
    leaving = true;
    try {const state = await writeOnboarding({action:'complete'}); saved(state); clearKey(); navigate('/',true);}
    catch (error) {leaving = false; showError(error);}
  };
  host.addEventListener('click',async event => {
    const control = event.target.closest('[data-onboarding-action]');
    if (!control) return;
    event.preventDefault();
    if (control.dataset.onboardingAction === 'complete') return complete();
    if (control.dataset.onboardingAction === 'copy') {
      const prompt = setupPrompt(snapshot.onboarding);
      await copy(prompt,'Copied. Paste into your agent chat.');
    }
  }, {signal:events.signal});
  host.addEventListener('change',event => {
    if (event.target.name === 'onboarding-platform') host.querySelector('#onboarding-platform-note').textContent = platformNote(event.target.value);
  }, {signal:events.signal});
  host.addEventListener('submit',async event => {
    if (event.target.id !== 'onboarding-form') return;
    event.preventDefault(); if (busy || leaving) return;
    busy = true;
    const button = event.target.querySelector('[type="submit"]'); button.disabled = true; button.textContent = 'Saving…';
    try {
      const state = await writeOnboarding({action:'details',platform:host.querySelector('[name="onboarding-platform"]:checked')?.value || 'instagram',handle:host.querySelector('#onboarding-handle').value,key:host.querySelector('#onboarding-key').value});
      if (events.signal.aborted) return;
      saved(state); clearKey();
      if (!leaving) navigate(entry ? '/onboarding/prompt' : '/account/setup-prompt');
    } catch (error) {if (!events.signal.aborted) showError(error);}
    finally {busy = false; button.disabled = false; button.textContent = 'Get my setup prompt';}
  }, {signal:events.signal});
  return {destroy(){events.abort(); clearKey();}};
}
