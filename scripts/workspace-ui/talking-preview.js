// The setup preview shares the format's 1080 by 1920 geometry and font measurements.
// It only changes the browser draft. Saving and building belong to the buyer's chat.
const CARDS = ['plate', 'paper', 'glass'];
const OPENINGS = [
  ['sentence-captions', 'Sentence + captions'],
  ['sentence-big', 'Sentence + big words'],
  ['big-visuals', 'Big words + picture'],
  ['visuals', 'Picture + captions'],
];
const ACCENTS = [['#E07850', 'Terracotta'], ['#F2C94C', 'Gold'], ['#A4D68A', 'Sage'], ['#8CBFFF', 'Blue'], ['#D8AFF2', 'Lilac']];
const CARD_STYLES = {plate:{background:'#08080A',text:'#F2F2F2',accent:'#E07850',corner:0},paper:{background:'#F6F3EC',text:'#14161F',accent:'#E07850',corner:28},glass:{background:'#141418',text:'#FFFFFF',accent:'#E07850',corner:32}};
const defaultCaptionMode = opening => ['sentence-captions', 'visuals'].includes(opening) ? 'normal' : 'emphasized';
const loadedFonts = new Map();
let nextId = 0;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const title = value => value.charAt(0).toUpperCase() + value.slice(1);
const fontFamily = id => `keyframes-look-${String(id).replace(/[^a-z0-9-]/gi, '')}`;
const shortName = name => String(name ?? '').replace(/\s+(ExtraBold|SemiBold|ExtraLight|Bold|Black|Regular|Light|Medium|Thin)$/, '');

/** Map browser draft values to the existing talking-head.json answers contract. */
export function talkingLookAnswers(value = {}) {
  const picked = normalize(value);
  return { dress: picked.card, wordFont: picked.font, wordFonts: picked.fonts, customFonts: picked.customFonts, cardStyle:picked.cardStyle||null, onscreen: picked.opening, captionMode: picked.captionMode, accent: picked.accent };
}

function normalize(value = {}, fonts = []) {
  if((value.font??value.wordFont)==='google'&&value.googleFont){
    try {const custom=googleFontFromUrl('https://fonts.google.com/specimen/'+encodeURIComponent(value.googleFont.trim()).replace(/%20/g,'+'));value={...value,font:custom.id,wordFont:custom.id,fonts:(value.fonts??value.wordFonts??['google']).map(id=>id==='google'?custom.id:id),customFonts:[...(value.customFonts||[]).filter(font=>font.id!==custom.id),custom]};}catch{}
  }
  const card = value.card ?? value.dress;
  const font = value.font ?? value.wordFont ?? 'poppins';
  const selected = [...new Set([...(value.fonts ?? value.wordFonts ?? []), font])];
  const opening = value.opening ?? value.onscreen;
  return {
    card: [...CARDS,'own'].includes(card) ? card : 'plate',
    font, fonts: selected, customFonts: Array.isArray(value.customFonts)?value.customFonts:[],
    ...(value.cardStyle?{cardStyle:{...value.cardStyle}}:{}),
    opening: OPENINGS.some(([id]) => id === opening) ? opening : 'sentence-big',
    captionMode: ['normal', 'emphasized'].includes(value.captionMode) ? value.captionMode : defaultCaptionMode(opening),
    accent: /^#[0-9a-f]{6}$/i.test(value.accent) ? value.accent.toUpperCase() : '#E07850',
  };
}

// Only Google Fonts specimen links become remote preview requests.
export function googleFontFromUrl(raw) {
  let url;try {url=new URL(raw.trim());}catch {throw Error('Paste a Google Fonts font link.');}
  const match=/^\/specimen\/([^/]+)\/?$/.exec(url.pathname);
  if(url.protocol!=='https:'||url.hostname!=='fonts.google.com'||url.username||url.password||url.port||!match)throw Error('Use a font link from fonts.google.com.');
  let family;try {family=decodeURIComponent(match[1].replace(/\+/g,' ')).trim().replace(/\s+/g,' ');}catch {throw Error('This font link is incomplete.');}
  if(!/^[A-Za-z0-9][A-Za-z0-9 -]{0,99}$/.test(family))throw Error('Choose a font’s specimen page on Google Fonts.');
  return {id:'google-'+family.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,''),family,url:'https://fonts.google.com/specimen/'+family.split(' ').map(encodeURIComponent).join('+')};
}

function loadFont(font) {
  if (!font?.url) return Promise.reject(new Error('Font file unavailable'));
  const key = `${font.id}:${font.url}`;
  if (!loadedFonts.has(key)) loadedFonts.set(key,(async()=>{
    let faces=[];
    if(font.googleFamily){
      const family=encodeURIComponent(font.googleFamily).replace(/%20/g,'+');
      let response=await fetch('https://fonts.googleapis.com/css2?family='+family+':wght@700&display=block',{credentials:'omit',signal:AbortSignal.timeout(12000)});
      if(!response.ok)response=await fetch('https://fonts.googleapis.com/css2?family='+family+'&display=block',{credentials:'omit',signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw Error(response.status>=500?'Google Fonts is unavailable. Try again.':'Google Fonts could not find that family.');
      const css=await response.text();
      for(const block of css.match(/@font-face\s*\{[^}]+\}/g)||[]){
        const src=/src:\s*url\(([^)]+)\)/.exec(block)?.[1]?.replace(/["']/g,'');
        if(!src||new URL(src).origin!=='https://fonts.gstatic.com')continue;
        const range=/unicode-range:\s*([^;]+);/.exec(block)?.[1];
        faces.push(new FontFace(fontFamily(font.id),`url(${JSON.stringify(src)})`,{weight:'400',display:'block',...(range?{unicodeRange:range}:{})}));
      }
      if(!faces.length)throw Error('This font has no preview file.');
    }else faces=[new FontFace(fontFamily(font.id),`url(${JSON.stringify(font.url)})`,{weight:'400',display:'block'})];
    await Promise.all(faces.map(async face=>{document.fonts.add(await face.load());}));
    await document.fonts.load(`400 100px "${fontFamily(font.id)}"`);
  })().catch(error=>{loadedFonts.delete(key);throw error;}));
  return loadedFonts.get(key);
}

// Other format previews use the same actual-font loader and local registration.
export function loadLookFont(font) { return loadFont(font); }
export function lookFontFamily(id) { return fontFamily(id); }

function wordsFor(sentence) {
  const words = sentence.replace(/[.,?!]/g, '').split(/\s+/).filter(Boolean).slice(0, 12);
  if (words.length < 4) return { small: ['IT', 'TOOK'], middle: 'NINE', hero: 'MONTHS' };
  const candidates = words.map((word, index) => ({ word, index })).filter(({ index }) => index >= 3);
  const { word, index } = candidates.sort((a, b) => b.word.length - a.word.length)[0];
  const lead = words.slice(Math.max(0, index - 4), index);
  const cut = Math.max(2, Math.ceil(lead.length / 2));
  return { small: lead.slice(0, cut).map(text => text.toUpperCase()), middle: lead.slice(cut).join(' ').toUpperCase(), hero: word.toUpperCase() };
}

/**
 * Mount one independent look editor. Fonts use local URLs from the workspace snapshot.
 * value: {card, font, fonts, customFonts, cardStyle, opening, captionMode, accent}; onChange receives that shape.
 * update accepts the same options without remounting footage or interrupting a dialog.
 */
export function mountTalkingLook(element, initial = {}) {
  const id = `th-look-${++nextId}`;
  let options = { fonts: [], sentence: 'The one thing nobody tells you about this', accent: '#E07850', ...initial };
  let fonts = options.fonts;
  let fontCatalogKey = JSON.stringify(fonts);
  let value = normalize({ accent: options.accent, ...options.value }, fonts);
  let moment = 'opening';
  let addingFont = false;
  const availableFonts=()=>[...fonts,...value.customFonts.filter(custom=>!fonts.some(face=>face.id===custom.id)).map(custom=>({...custom,name:custom.family,googleFamily:custom.family}))];
  const selectedFace=()=>availableFonts().find(face=>face.id===value.font);
  const cardStyle=()=>({...CARD_STYLES[value.card]||CARD_STYLES.plate,...value.cardStyle});
  let disposed = false;
  let fontRevision = 0;
  let mediaRevision = 0;
  let mediaKey = null;
  let readyMedia = false;
  let fontReady = false;
  let lastFont = '';
  const events = new AbortController();
  const canvas = document.createElement('canvas');
  const measure = canvas.getContext('2d');

  element.classList.add('th-look');
  element.innerHTML = `
    <div class="th-look-preview-side">
      <div class="th-look-moments" role="group" aria-label="Preview moment">
        <button type="button" data-moment="opening" aria-pressed="true">Hook</button>
        <button type="button" data-moment="card" aria-pressed="false">Card</button>
      </div>
      <div class="th-look-frame" role="img" aria-label="Your talking head preview">
        <div class="th-look-media"></div>
        <div class="th-look-empty"><span aria-hidden="true">+</span><p>Choose footage to preview your look.</p></div>
        <div class="th-look-layers" aria-hidden="true">
          <div class="th-look-title"></div>
          <div class="th-look-stack"><div class="th-look-small"></div><div class="th-look-middle"></div><div class="th-look-hero"></div></div>
          <div class="th-look-caption">and then it finally <span>worked</span></div>
          <div class="th-look-card"><strong>A clearer story</strong><i></i><span>One useful idea.<br>A reason to remember it.</span></div>
        </div>
      </div>
      <p class="th-look-preview-note" role="status" aria-live="polite"></p>
    </div>
    <div class="th-look-controls">
      <fieldset class="th-look-group"><legend>Cards</legend>
        <div class="th-look-card-picks">${CARDS.map(card => `
          <button type="button" class="th-look-card-pick" data-card="${card}" aria-pressed="${value.card === card}">
            <span class="th-look-card-specimen th-look-card-${card}" aria-hidden="true"><span><b>A clearer<br>story.</b><i></i><small>One idea.</small></span></span>
            <span class="th-look-card-name">${title(card)}<span class="th-look-check" aria-hidden="true">✓</span></span>
          </button>`).join('')}
          <button type="button" id="${id}-custom-cards" class="th-look-card-pick th-look-custom-card" data-customize="cards" aria-expanded="${Boolean(value.cardStyle||value.card==='own')}" aria-controls="${id}-card-options">
            <span class="th-look-card-specimen th-look-card-custom" aria-hidden="true"><span><b>Aa</b><span class="th-look-custom-swatches"><i></i><i></i><i></i></span></span></span>
            <span class="th-look-card-name">Customize<span aria-hidden="true">↗</span></span>
          </button>
        </div>
        <p class="th-look-help">Cards when they help. Real articles, images and examples can tell the story too.</p>
        <div id="${id}-card-options" class="th-look-customize" role="region" aria-labelledby="${id}-custom-cards" ${value.cardStyle||value.card==='own'?'':'hidden'}>
          <div class="th-look-card-colors">${[['background','Background'],['text','Text'],['accent','Accent']].map(([key,label])=>`<label><span>${label}</span><input type="color" data-card-color="${key}" aria-label="Card ${label.toLowerCase()}" value="${cardStyle()[key]}"></label>`).join('')}</div>
          <span class="th-look-control-label">Corners</span><div class="th-look-opening-picks" role="group" aria-label="Card corners"><button type="button" data-corner="0">Square</button><button type="button" data-corner="28">Rounded</button></div>
          <label class="th-look-notes-label">Make it yours <textarea data-card-notes rows="2" maxlength="2000" placeholder="E.g. thin borders, editorial diagrams, no shadows">${escape(value.cardStyle?.notes||'')}</textarea></label>
        </div>
      </fieldset>
      <fieldset class="th-look-group"><legend>Fonts</legend>
        <div class="th-look-font-pick"><div class="th-look-selected-fonts"></div><div class="th-look-font-actions"><button type="button" class="th-look-font-add" data-font-open aria-label="Browse all fonts" aria-haspopup="dialog">+</button><button type="button" id="${id}-custom-fonts" class="th-look-font-customize" data-customize="fonts" aria-expanded="false" aria-controls="${id}-font-options">Customize</button></div></div>
        <p class="th-look-help">Pick a few. Tap one to preview.</p>
        <div id="${id}-font-options" class="th-look-customize th-look-google" role="region" aria-labelledby="${id}-custom-fonts" hidden>
          <p class="th-look-help">Find your font on <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer">Google Fonts ↗</a>, then paste its link.</p>
          <label class="th-look-control-label" for="${id}-google">Google Fonts link</label>
          <div class="th-look-google-entry"><input id="${id}-google" type="url" placeholder="https://fonts.google.com/specimen/…" autocomplete="off" spellcheck="false"><button type="button" data-google-add>Add font</button></div>
          <p class="th-look-google-status" role="status" aria-live="polite"></p>
        </div>
      </fieldset>
      <fieldset class="th-look-group"><legend>THE HOOK <span class="th-look-legend-note">(first 2-3 seconds)</span></legend>
        <div class="th-look-opening-picks">${OPENINGS.map(([opening, label]) => `<button type="button" data-opening="${opening}" aria-pressed="${value.opening === opening}">${label}</button>`).join('')}</div>
        <div class="th-look-subgroup"><span class="th-look-control-label" id="${id}-captions">Captions</span>
          <div class="th-look-opening-picks" role="group" aria-labelledby="${id}-captions"><button type="button" data-caption-mode="normal" aria-pressed="${value.captionMode === 'normal'}">Normal <small>Like the rest of the video</small></button><button type="button" data-caption-mode="emphasized" aria-pressed="${value.captionMode === 'emphasized'}">Big words <small>Emphasize the opening</small></button></div>
        </div>
        <div class="th-look-subgroup"><label class="th-look-control-label" for="${id}-accent">Important words</label>
          <div class="th-look-color-picks" role="group" aria-label="Important word color">${ACCENTS.map(([color, name]) => `<button type="button" data-accent="${color}" style="--swatch:${color}" aria-label="${name}" aria-pressed="${value.accent === color}"><span aria-hidden="true">✓</span></button>`).join('')}<label class="th-look-custom-color" title="Choose a color"><input id="${id}-accent" type="color" value="${value.accent}" aria-label="Choose important word color"><span aria-hidden="true">+</span></label></div>
        </div>
      </fieldset>
      <p class="th-look-fit-note">Placement fits your footage after intake.</p>
    </div>
    <dialog class="th-look-font-dialog" aria-labelledby="${id}-title">
      <div class="th-look-dialog-head"><h2 id="${id}-title">Your font collection</h2><button type="button" class="th-look-close" aria-label="Close font library">×</button></div>
      <label class="th-look-search-label" for="${id}-search">Find a font</label><input id="${id}-search" class="th-look-font-search" type="search" placeholder="Search fonts" autocomplete="off">
      <div class="th-look-font-library" aria-label="Available fonts"></div>
      <p class="th-look-font-empty" hidden>No matching fonts.</p><div class="th-look-dialog-foot"><span class="th-look-font-count"></span><button type="button" data-font-done>Done</button></div>
    </dialog>`;

  const $ = selector => element.querySelector(selector);
  const $$ = selector => [...element.querySelectorAll(selector)];
  const frame = $('.th-look-frame');
  const layers = $('.th-look-layers');
  const previewNote = $('.th-look-preview-note');
  const dialog = $('.th-look-font-dialog');
  const search = $('.th-look-font-search');

  function geometry() {
    const fit = options.fit ?? {};
    const cap = Number(options.capHeightPx) || 62;
    const font = selectedFace();
    let size = (Number(font?.sizePx) || 90) * cap / (Number(font?.capPx) || 62);
    if(fontReady&&measure&&value.font.startsWith('google-')){measure.font=`400 100px "${fontFamily(value.font)}"`;const measured=measure.measureText('H').actualBoundingBoxAscent;if(measured>0)size=100*cap/measured;}
    const scaled = name => Number.isFinite(Number(fit[name])) ? Number(fit[name]) : undefined;
    return {
      title: scaled('titleTopFrac') ?? .244,
      stack: scaled('stackTopFrac') ?? .637,
      base: scaled('baselineYFrac') ?? .625,
      cardTop: scaled('cardTopFrac') ?? .05,
      cardBottom: scaled('cardBottomFrac') ?? .33,
      cap, size,
      heroWidth: Number(options.heroWidthFrac) || .66,
      heroMax: Number(options.heroMaxFontPx) || 200,
    };
  }

  function note(text) { previewNote.textContent = text; }

  function paintGeometry() {
    if (disposed) return;
    const G = geometry();
    const scale = frame.clientWidth / 1080;
    const px = number => `${number * scale}px`;
    frame.style.setProperty('--th-unit', `${scale}px`);
    frame.style.setProperty('--th-accent', value.accent);
    const card=$('.th-look-card'),custom=value.cardStyle;
    card.style.background=custom?.background||'';card.style.color=custom?.text||'';card.style.borderColor=custom?.text?custom.text+'35':'';
    card.style.borderRadius=custom?.corner!==undefined?px(custom.corner):'';
    card.querySelector('span').style.color=custom?.text||'';card.querySelector('i').style.background=custom?.accent||'';
    layers.style.fontFamily = `"${fontFamily(value.font)}", sans-serif`;
    const opening = String(options.sentence || 'The one thing nobody tells you about this');
    const selected = selectedFace();
    $('.th-look-title').textContent = selected?.reads === 'upper' ? opening.toUpperCase() : opening;
    $('.th-look-title').style.top = `${G.title * 100}%`;
    // The title uses the format's 52px size; captions use the measured cap size.
    $('.th-look-title').style.fontSize = px(52);
    const stack = wordsFor(opening);
    $('.th-look-small').replaceChildren(...stack.small.map(text => { const span = document.createElement('span'); span.textContent = text; return span; }));
    $('.th-look-middle').textContent = stack.middle;
    $('.th-look-middle').hidden = !stack.middle;
    $('.th-look-hero').textContent = stack.hero;
    $('.th-look-stack').style.top = `${G.stack * 100}%`;
    $('.th-look-small').style.fontSize = px(G.cap);
    $('.th-look-middle').style.fontSize = px(G.cap * 1.25);
    if (fontReady && measure) {
      measure.font = `400 100px "${fontFamily(value.font)}"`;
      const width = measure.measureText(stack.hero).width;
      $('.th-look-hero').style.fontSize = px(Math.min(G.heroMax, 100 * 1080 * G.heroWidth / Math.max(1, width)));
    }
    $('.th-look-caption').style.fontSize = px(G.size);
    $('.th-look-caption').style.top = px(G.base * 1920 - .59 * G.cap);
    $('.th-look-card').style.top = `${(G.cardTop + .012) * 100}%`;
    $('.th-look-card').style.height = `${Math.max(.14, G.cardBottom - G.cardTop - .03) * 100}%`;
    $('.th-look-fit-note').textContent = options.fit?.baselineYFrac ? 'Placement follows your footage.' : 'Placement fits your footage after intake.';
  }

  function paint() {
    if (disposed) return;
    frame.dataset.card = value.card;
    frame.dataset.opening = value.opening;
    frame.dataset.captionMode = value.captionMode;
    frame.dataset.moment = moment;
    layers.hidden = !readyMedia || !fontReady;
    $$('button[data-card]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.card === value.card)));
    $$('button[data-opening]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.opening === value.opening)));
    $$('button[data-caption-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.captionMode === value.captionMode)));
    $$('button[data-accent]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.accent === value.accent)));
    $(`#${id}-accent`).value = value.accent;
    $$('[data-card-color]').forEach(input=>input.value=cardStyle()[input.dataset.cardColor]);
    $$('[data-corner]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.corner)===0?cardStyle().corner===0:cardStyle().corner>0)));
    if(document.activeElement!==$('[data-card-notes]'))$('[data-card-notes]').value=value.cardStyle?.notes||'';
    $$('button[data-moment]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.moment === moment)));
    const font = selectedFace();
    paintSelectedFonts();
    $$('[data-font-id]').forEach(button => button.setAttribute('aria-pressed', String(value.fonts.includes(button.dataset.fontId))));
    $('.th-look-font-count').textContent=`${value.fonts.length} selected`;
    paintGeometry();
  }

  async function activateFont() {
    const font = selectedFace();
    const key = `${value.font}:${font?.url ?? ''}`;
    if (key === lastFont && fontReady) return paint();
    lastFont = key;
    const revision = ++fontRevision;
    fontReady = false;
    paint();
    if (readyMedia) note('Loading your font…');
    try {
      await loadFont(font);
      if (disposed || revision !== fontRevision) return;
      fontReady = true;
      paint();
      if (readyMedia) note('Preview on your footage');
    } catch {
      if (disposed || revision !== fontRevision) return;
      note('This font could not load. Choose another or try again.');
    }
  }

  function toggleCustomization(kind, open) {
    const control=$(`[data-customize="${kind}"]`),panel=document.getElementById(control.getAttribute('aria-controls'));
    const expanded=open??panel.hidden;
    panel.hidden=!expanded;control.setAttribute('aria-expanded',String(expanded));
    if(expanded&&kind==='cards'){moment='card';paint();}
    if(expanded&&kind==='fonts')$(`#${id}-google`).focus({preventScroll:true});
  }

  function choose(change) {
    value = { ...value, ...change };
    if (change.card || change.cardStyle) moment = 'card';
    if (change.opening || change.captionMode || change.accent) moment = 'opening';
    paint();
    if (change.font) activateFont();
    options.onChange?.(structuredClone(value));
  }

  let selectedKey='';
  function paintSelectedFonts(){
    const next=JSON.stringify([value.fonts,value.font,availableFonts().map(face=>[face.id,face.name])]);
    if(next===selectedKey)return;
    selectedKey=next;
    $('.th-look-selected-fonts').innerHTML=value.fonts.map(id=>{const face=availableFonts().find(font=>font.id===id),name=shortName(face?.name||id);return `<span class="th-look-font-chip" data-active="${id===value.font}"><button type="button" class="${id===value.font?'th-look-current-font':''}" data-font-preview="${escape(id)}" aria-pressed="${id===value.font}" title="Preview ${escape(name)}">${escape(name)}</button><button type="button" data-font-remove="${escape(id)}" aria-label="Remove ${escape(name)}" ${value.fonts.length===1?'disabled':''}>×</button></span>`;}).join('');
  }
  function toggleFont(id){
    const selected=value.fonts.includes(id);
    if(selected&&value.fonts.length===1)return;
    const next=selected?value.fonts.filter(font=>font!==id):[...value.fonts,id];
    choose({fonts:next,font:selected?(value.font===id?next[0]:value.font):id});
  }
  async function addGoogle(){
    if(addingFont)return;
    const input=$(`#${id}-google`),status=$('.th-look-google-status'),button=$('[data-google-add]');
    try {
      const custom=googleFontFromUrl(input.value);
      const bundled=fonts.find(face=>shortName(face.name).toLowerCase()===custom.family.toLowerCase());
      const face=bundled||{...custom,name:custom.family,googleFamily:custom.family};
      addingFont=true;button.disabled=true;status.textContent='Loading font…';status.dataset.error='false';input.removeAttribute('aria-invalid');
      await loadFont(face);
      if(disposed)return;
      const customFonts=bundled?value.customFonts:[...value.customFonts.filter(font=>font.id!==custom.id),custom];
      choose({font:face.id,fonts:[...new Set([...value.fonts,face.id])],customFonts});
      renderFonts();input.value='';status.textContent=custom.family+' added.';
    }catch(error){if(!disposed){status.textContent=error.message||'The font could not load. Check the link and try again.';status.dataset.error='true';input.setAttribute('aria-invalid','true');}}
    finally {addingFont=false;if(!disposed)button.disabled=false;}
  }

  function renderFonts() {
    const library = $('.th-look-font-library');
    library.innerHTML = availableFonts().map(font => {
      // Instrument Serif is shipped for headings; the setup choice carries captions too.
      const headingOnly = font.id === 'instrument-serif' || font.captionSafe === false;
      return `<button type="button" data-font-id="${escape(font.id)}" aria-pressed="${value.fonts.includes(font.id)}" ${headingOnly ? 'disabled' : ''}>
        <span class="th-look-font-meta"><span>${escape(shortName(font.name))}</span><small>${headingOnly ? 'Card headings only' : font.reads === 'upper' ? 'Capitals' : ''}</small><span class="th-look-font-tick" aria-hidden="true">✓</span></span>
        <span class="th-look-font-specimen" style="font-family:'${fontFamily(font.id)}',sans-serif">${font.reads === 'upper' ? 'MAKE IT YOURS.' : 'Make it yours.'}</span>
      </button>`;
    }).join('');
    filterFonts();
  }

  function filterFonts() {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    $$('[data-font-id]').forEach(button => {
      button.hidden = !button.textContent.toLocaleLowerCase().includes(query);
      if (!button.hidden) count++;
    });
    $('.th-look-font-empty').hidden = count > 0;
  }

  function openFonts() {
    if (!dialog.open) dialog.showModal();
    search.focus();
    // Load specimens on demand. A custom face is requested only after its link is added.
    Promise.allSettled(availableFonts().map(async font => {
      try {
        await loadFont(font);
        if (disposed) return;
        const button = $$('[data-font-id]').find(item => item.dataset.fontId === font.id);
        if (button) button.dataset.loaded = 'true';
      } catch {
        const button = $$('[data-font-id]').find(item => item.dataset.fontId === font.id);
        if (button) button.querySelector('.th-look-font-meta small').textContent = 'File unavailable';
      }
    }));
  }

  function setMedia() {
    const url = options.mediaUrl || '';
    const type = options.mediaType || (/\.(png|jpe?g|webp|gif)(?:[?#]|$)/i.test(url) ? 'image' : 'video');
    const key = `${type}:${url}`;
    if (key === mediaKey) return;
    mediaKey = key;
    const revision = ++mediaRevision;
    readyMedia = false;
    const container = $('.th-look-media');
    const previous = container.querySelector('video');
    if (previous) { previous.pause(); previous.removeAttribute('src'); previous.load(); }
    container.replaceChildren();
    const empty = $('.th-look-empty');
    empty.hidden = false;
    empty.querySelector('p').textContent = url ? 'Loading your footage…' : 'Choose footage to preview your look.';
    note('');
    paint();
    if (!url) return;
    const media = document.createElement(type === 'image' ? 'img' : 'video');
    if (type === 'image') media.alt = '';
    else { media.muted = true; media.playsInline = true; media.preload = 'auto'; }
    const loaded = () => {
      if (disposed || revision !== mediaRevision) return;
      readyMedia = true;
      empty.hidden = true;
      note(fontReady ? 'Preview on your footage' : 'Loading your font…');
      paint();
    };
    media.addEventListener(type === 'image' ? 'load' : 'loadeddata', loaded, { once: true, signal: events.signal });
    media.addEventListener('error', () => {
      if (disposed || revision !== mediaRevision) return;
      readyMedia = false;
      empty.hidden = false;
      empty.querySelector('p').textContent = 'This file cannot preview in your browser.';
      note('You can still attach the footage in chat.');
      paint();
    }, { once: true, signal: events.signal });
    media.src = url;
    container.append(media);
  }

  element.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !element.contains(button)) return;
    if (button.dataset.customize) toggleCustomization(button.dataset.customize);
    else if (button.dataset.card) {choose({ card: button.dataset.card,cardStyle:undefined });toggleCustomization('cards',false);}
    else if (button.dataset.opening) choose({ opening: button.dataset.opening, captionMode: defaultCaptionMode(button.dataset.opening) });
    else if (button.dataset.captionMode) choose({ captionMode: button.dataset.captionMode });
    else if (button.dataset.accent) choose({ accent: button.dataset.accent });
    else if (button.hasAttribute('data-font-open')) openFonts();
    else if (button.dataset.fontId) toggleFont(button.dataset.fontId);
    else if (button.dataset.fontPreview) choose({font:button.dataset.fontPreview});
    else if (button.dataset.fontRemove) toggleFont(button.dataset.fontRemove);
    else if (button.hasAttribute('data-google-add')) addGoogle();
    else if (button.hasAttribute('data-font-done')) dialog.close();
    else if (button.hasAttribute('data-corner')) choose({cardStyle:{...cardStyle(),corner:Number(button.dataset.corner)}});
    else if (button.dataset.moment) { moment = button.dataset.moment; paint(); }
    else if (button.classList.contains('th-look-close')) dialog.close();
  }, { signal: events.signal });
  $(`#${id}-accent`).addEventListener('input', event => choose({ accent: event.target.value.toUpperCase() }), { signal: events.signal });
  $$('[data-card-color]').forEach(input=>input.addEventListener('input',()=>choose({cardStyle:{...cardStyle(),[input.dataset.cardColor]:input.value.toUpperCase()}}),{signal:events.signal}));
  $('[data-card-notes]').addEventListener('input',event=>choose({cardStyle:{...cardStyle(),notes:event.target.value}}),{signal:events.signal});
  $(`#${id}-google`).addEventListener('input',event=>{if(!addingFont){$('.th-look-google-status').textContent='';$('.th-look-google-status').dataset.error='false';event.target.removeAttribute('aria-invalid');}},{signal:events.signal});
  $(`#${id}-google`).addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();addGoogle();}},{signal:events.signal});
  search.addEventListener('input', filterFonts, { signal: events.signal });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dialog.close(); }
  }, { signal: events.signal });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }, { signal: events.signal });
  const observer = new ResizeObserver(paintGeometry);
  observer.observe(frame);
  renderFonts();
  setMedia();
  activateFont();

  return {
    validate(){return addingFont?'Wait for your font to load.':$(`#${id}-google`).value.trim()?'Add your Google font or clear its link before continuing.':'';},
    update(next = {}) {
      options = { ...options, ...next };
      const oldCustom=JSON.stringify(value.customFonts);
      if (next.value) value = normalize(next.value, fonts);
      if ((next.fonts && JSON.stringify(next.fonts) !== fontCatalogKey)||oldCustom!==JSON.stringify(value.customFonts)) {
        fonts = next.fonts||fonts;
        fontCatalogKey = JSON.stringify(fonts);
        renderFonts();
      }
      setMedia();
      activateFont();
      paint();
    },
    destroy() {
      disposed = true;
      events.abort();
      observer.disconnect();
      if (dialog.open) dialog.close();
      const video = $('.th-look-media video');
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
      element.replaceChildren();
      element.classList.remove('th-look');
    },
  };
}
