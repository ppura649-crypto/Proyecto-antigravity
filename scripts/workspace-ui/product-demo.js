import {productVoiceLabel} from './product-demo-voice.js';
// The page prepares the request. Only the agent's project files record work.
export const productDemoPhases = [
  ['understand', 'Understand the product', 'Explore the app and supplied code, from the problem to the useful result.'],
  ['conceive', 'Find the story', 'Choose the journey that makes its value clear.'],
  ['prove', 'Try the key moment', 'Test the visual idea and motion in a short sample.'],
  ['produce', 'Animate the film', 'Build the scenes, transitions and sound around that story.'],
  ['refine', 'Review and deliver', 'Check the finished video and include the editable project.'],
];

// Finished films a buyer can point at. A pick tells the agent the feel they like, never a layout to copy.
export const productDemoFilms = [
  {id:'spoken-type',title:'Spoken Words',line:'A calm voice, and every word it says lands on screen right on time.'},
  {id:'object-world',title:'Object World',line:'Big glossy objects turn into one another on the beat of the music.'},
  {id:'narrated-launch',title:'Narrated Launch',line:'A friendly voice walks you through it while the screens build around the words.'},
  {id:'continuous-take',title:'One Take',line:'One shot that never cuts. Every beat becomes the next thing.'},
  {id:'chapter-worlds',title:'Chapter Worlds',line:'Told like a short story, each part opens a new place to look at.'},
  {id:'camera-on-card',title:'Close Reading',line:'One card, and a camera that reads it up close like your eye would.'},
  {id:'pixel-glitch',title:'Glitch Energy',line:'Typed words stutter on black, then burst into light and colour.'},
  {id:'interface-clicks',title:'Click Through',line:'A clean walk through the app, one click and one satisfying tick at a time.'},
];
const filmMedia = name => `/media/assets/product-demo/examples/${name}`;
export const productDemoLiked = draft => (draft.productFilms || []).filter(id => productDemoFilms.some(film => film.id === id));

export function productDemoBrief(draft = {}) {
  return Object.fromEntries([
    ['source', draft.productSource?.trim()],
    ['repository', draft.productRepository?.trim()],
    ['brief', draft.productBrief?.trim()],
    ['audience', draft.productAudience?.trim()],
    ['placement', draft.productPlacement?.trim()],
    ['recordings', draft.productRecordings?.split('\n').map(value => value.trim()).filter(Boolean)],
  ].filter(([, value]) => Array.isArray(value) ? value.length : value));
}

export function productDemoPrompt(draft) {
  const brief = productDemoBrief(draft);
  if (!brief.source && !brief.repository && !brief.brief && !brief.recordings?.length) throw Error('Add a product URL, repository or other product details.');
  const sources = [brief.source, brief.repository && `Repo: ${brief.repository}`, ...(brief.recordings || [])].filter(Boolean);
  const liked = productDemoLiked(draft).map(id => productDemoFilms.find(film => film.id === id));
  const notes = [brief.brief, brief.audience && `Audience: ${brief.audience}`, brief.placement && `For: ${brief.placement}`,
    liked.length && `Films I like: ${liked.map(film => `${film.title} (${film.id})`).join(', ')}.${draft.productFilmNote?.trim() ? ' What I like: ' + draft.productFilmNote.trim() : ''} Take the feel from them, never the shots.`].filter(Boolean);
  return '/product-demo' + (sources.length ? ' ' + sources.map(value => JSON.stringify(value)).join(' ') : '') +
    '\nMake an ultra-animated, in-depth product demo showing the problem it solves, how it works and why it matters. Check my computer and any supplied code, use my saved voice choice, then deliver the reviewed video with editable source.' +
    (notes.length ? '\n\n' + notes.join('\n') : '');
}

function productDemoTrack(current) {
  return `<nav class="onboarding-track" aria-label="New film steps">${[['product','Your product'],['films','Films you like'],['process','What happens'],['prompt','Your prompt']].map(([id,label],i)=>`${i?'<span class="track-line" aria-hidden="true"></span>':''}<span ${current===id?'aria-current="step" class="current"':''}>${label}</span>`).join('')}</nav>`;
}

export function productDemoProcess() {
  return `<ol class="product-demo-process">${[
    ['computer','Check your computer','Set up the tools needed to make your film.'],
    ...productDemoPhases,
  ].map(([,title,description],i)=>`<li><span class="product-demo-number" aria-hidden="true">${i+1}</span><div><h2>${title}</h2><p>${description}</p></div></li>`).join('')}</ol>`;
}

export function productDemoForm(draft, {esc, heading, field, button, link}, sub = 'new', format = {}) {
  const requested = sub === 'new/films' ? 'films' : sub === 'new/process' ? 'process' : sub === 'new/prompt' ? 'prompt' : 'product';
  let prompt;
  try { prompt = productDemoPrompt(draft); } catch {}
  const current = requested !== 'product' && !prompt ? 'product' : requested;
  let content;
  if (current === 'product') {
    const hasMore = draft.productRecordings || draft.productBrief || draft.productAudience || draft.productPlacement;
    content = `${heading('Show us your product.','A URL is enough to start.')}
      <form id="product-demo-form">
        <label class="field"><span>Product URL</span><input type="text" inputmode="url" autocomplete="url" data-field="productSource" value="${esc(draft.productSource)}" placeholder="https://your-product.com"></label>
        ${field('GitHub repo or local folder (optional)','productRepository',draft.productRepository,'https://github.com/you/product')}
        <details class="product-demo-options" ${hasMore?'open':''}><summary>Add more details</summary>
          <label class="field"><span>Recordings or designs</span><textarea data-field="productRecordings" placeholder="File or folder paths, one per line">${esc(draft.productRecordings)}</textarea></label>
          <label class="field"><span>Anything to focus on?</span><textarea data-field="productBrief" placeholder="A feature, an audience, a launch…">${esc(draft.productBrief)}</textarea></label>
          ${draft.productAudience?field('Audience','productAudience',draft.productAudience):''}
          ${draft.productPlacement?field('Where it will play','productPlacement',draft.productPlacement):''}
        </details>
        <p class="inline-alert" id="form-error" role="alert"></p>
        <div class="flow-footer">${link('Back','/formats/product-demo','ghost')}<button type="submit" class="btn primary">Continue</button></div>
      </form>`;
  } else if (current === 'films') {
    const liked = productDemoLiked(draft);
    const cards = productDemoFilms.map(film => {
      const on = liked.includes(film.id);
      return `<article class="pd-film${on ? ' chosen' : ''}">
        <video src="${esc(filmMedia(film.id + '.mp4'))}" poster="${esc(filmMedia(film.id + '.jpg'))}" controls playsinline preload="none" aria-label="${esc(film.title)}"></video>
        <h2>${esc(film.title)}</h2><p>${esc(film.line)}</p>
        ${button(on ? 'Liked' : 'I like this', 'product-demo-film:' + film.id, '', on ? 'check' : '')}</article>`;
    }).join('');
    content = `${heading('Pick a film you like.','Optional. We take its feel, never its shots.')}<div class="pd-film-grid">${cards}</div>
      ${liked.length ? `<label class="field"><span>What do you like about it? (optional)</span><input type="text" data-field="productFilmNote" value="${esc(draft.productFilmNote)}" placeholder="The motion, the type, the music…" maxlength="300"></label>` : ''}
      <div class="flow-footer">${link('Back','/formats/product-demo/new','ghost')}${link(liked.length ? 'Continue' : 'Let us choose','/formats/product-demo/new/process','primary','arrow')}</div>`;
  } else if (current === 'process') {
    const liked = productDemoLiked(draft).map(id => productDemoFilms.find(film => film.id === id).title);
    content = `${heading('We take it from here.','Your agent handles these steps once you send the prompt.')}${productDemoProcess()}${format.answers?.voice?`<p class="product-demo-voice-summary">${esc(format.answers.voice.provider==='none'?'No voiceover.':`Narration: ${productVoiceLabel(format.answers.voice)}${format.answers.voice.voice?' · '+format.answers.voice.voice:''}.`)}${liked.length?' '+esc('Inspired by '+liked.join(', ')+'.'):''}</p>`:''}<div class="flow-footer">${link('Back','/formats/product-demo/new/films','ghost')}${link('Get my prompt','/formats/product-demo/new/prompt','primary','arrow')}</div>`;
  } else {
    content = `${heading('Your prompt.','Copy this into your Keyframes chat.')}<pre class="prompt-box product-demo-prompt" id="prompt-text">${esc(prompt)}</pre><div class="flow-footer">${link('Back','/formats/product-demo/new/process','ghost')}${button('Copy prompt','copy-prompt','primary','copy')}</div>`;
  }
  return `<div class="center-flow product-demo-flow">${productDemoTrack(current)}${content}</div>`;
}

export function productDemoProject(project, {esc, heading, link, button}, tasks = []) {
  const phase = productDemoPhases.find(([id]) => id === project.data?.stage);
  const working = tasks.some(task => [project.id,project.path].includes(task.project) && task.status === 'running' && !task.stale);
  const video = project.completed && project.files?.find(file => project.outputPaths?.includes(file.path));
  const source = project.files?.find(file => file.path === project.outputPath + '/editable-project.zip');
  const note = project.data?.progressNote || phase?.[2] || 'Your agent will read the saved work and continue the film.';
  const current = project.completed ? 'Your film is ready.' : phase?.[1] || 'Continue your film';
  const record = project.files?.find(file => file.path === project.path + '/record.md');
  return heading(project.name) + `<div class="product-demo-project">
    ${video?`<video class="product-demo-video" src="${esc(video.url)}" controls playsinline preload="metadata" aria-label="${esc(project.name)}"></video>`:''}
    <h2>${esc(current)}</h2>${project.completed?'':`<p class="muted">${esc(note)}</p>`}
    ${project.completed?'':`<ol class="product-demo-phases" aria-label="Film stages">${productDemoPhases.map(([id,label])=>`<li ${phase?.[0]===id?'aria-current="step"':''}>${esc(label)}</li>`).join('')}</ol>`}
    <div class="button-row">${video?`<a class="btn primary" href="${esc(video.url)}" download>Download video</a>${source?`<a class="btn" href="${esc(source.url)}" download>Editable project</a>`:''}`:working?'<p class="small" role="status">Your agent is working. Progress appears here.</p>':button('Copy continue prompt','resume:'+project.id,'primary','copy')}
    ${record?link('Read the story','/files?file='+encodeURIComponent(record.path),'ghost'):''}</div>
    ${project.completed?`<div class="flow-footer">${link('Back to films','/formats/product-demo','ghost')}${button('Copy revision prompt','revision:'+project.id,'ghost','copy')}</div>`:''}
  </div>`;
}
