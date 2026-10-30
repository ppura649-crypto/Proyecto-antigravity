// Shared voice choices. The key input never enters a saved draft or prompt.
export const PRODUCT_VOICE_VERSION = 1;
export const productVoiceProviders = [
  {id:'openai',name:'OpenAI',key:'OPENAI_API_KEY',note:'Uses your OpenAI API credit.',url:'https://platform.openai.com/api-keys',pricing:'https://developers.openai.com/api/docs/pricing'},
  {id:'elevenlabs',name:'ElevenLabs',key:'ELEVENLABS_API_KEY',note:'A paid plan is needed for commercial films.',url:'https://elevenlabs.io/app/developers/api-keys',pricing:'https://elevenlabs.io/pricing'},
  {id:'fish',name:'Fish Audio',key:'FISH_API_KEY',note:'A free API model is available; other models are paid.',url:'https://fish.audio/app/developers/',pricing:'https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits'},
  {id:'other',name:'Another service',note:'Your agent checks its access and pricing.'},
  {id:'none',name:'No voiceover',note:'Tell the story through animation and on-screen words.'},
];
export function productVoiceKeyName(provider) {
  return productVoiceProviders.find(p=>p.id===provider)?.key || (provider==='other'?'PRODUCT_DEMO_VOICE_API_KEY':null);
}
export async function writeProductVoiceKey(provider,key,{fetcher=fetch}={}) {
  let response;
  try{response=await fetcher('/api/product-demo/key',{method:'POST',headers:{'Content-Type':'application/json','X-Keyframes-Write':'voice-key'},body:JSON.stringify({provider,key}),signal:AbortSignal.timeout(10000)});}
  catch{throw Error('Could not reach your workspace. Your key is still here. Try again.');}
  let value;
  try{value=await response.json();}catch{}
  if(!response.ok){
    if([404,405].includes(response.status))throw Error('The workspace needs an update. Ask your agent to reopen it, then try again.');
    throw Error(typeof value?.error==='string'?value.error:'Your key could not be saved. Try again.');
  }
  if(value?.ok!==true||!value.keys||value.keys[provider]!==true&&provider!=='other')throw Error('Your key save was not confirmed. Try again.');
  return {keys:value.keys};
}
export function normalizeProductVoice(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Choose a voice service.');
  // Reject accidental secrets instead of allowing them into the saved preferences.
  if (Object.keys(input).some(key=>!['provider','voice','service'].includes(key))) throw Error('Paste API keys in the API key field.');
  if (!productVoiceProviders.some(p=>p.id===input.provider)) throw Error('Choose a voice service.');
  const text = value => typeof value === 'string' ? value.trim() : '';
  const voice = text(input.voice), service = text(input.service);
  if (voice.length>500 || service.length>200 || /[\r\n\u2014\u2013]/.test(voice+service)) throw Error('Keep the voice and service names short, on one line.');
  if (/\b(?:sk-|sk_|Bearer\s)/i.test(voice+service)) throw Error('Paste API keys in the API key field.');
  if (input.provider==='other'&&!service) throw Error('Name your voice service.');
  return {provider:input.provider,voice:input.provider==='none'?'':voice,service:input.provider==='other'?service:''};
}
export function productVoiceReady(f) {
  if (!f?.setup?.done || f.setup.version<PRODUCT_VOICE_VERSION) return false;
  try { normalizeProductVoice(f.answers?.voice); return Boolean(f.answers?.voice); } catch { return false; }
}
export function productVoiceDraft(f,d) {
  if(!d.setupDraft&&f.answers?.voice){d.productVoiceProvider=f.answers.voice.provider;d.productVoiceName=f.answers.voice.voice||'';d.productVoiceService=f.answers.voice.service||'';}
  d.productVoiceProvider ??= f.answers?.voice?.provider || productVoiceProviders.find(p=>p.key&&f.productVoice?.keys?.[p.id])?.id || 'openai';
  d.productVoiceName ??= f.answers?.voice?.voice || '';
  d.productVoiceService ??= f.answers?.voice?.service || '';
  return {provider:d.productVoiceProvider,voice:d.productVoiceName,service:d.productVoiceService};
}
export function productVoiceLabel(voice) {
  return voice?.provider==='other'?voice.service:productVoiceProviders.find(p=>p.id===voice?.provider)?.name || 'Your voice service';
}
export function productVoicePrompt(voice) {
  voice=normalizeProductVoice(voice);
  return '/product-demo setup\n'+(voice.provider==='none'?'Save my Product Demo preference: no voiceover.':`Use ${JSON.stringify(productVoiceLabel(voice))} for my Product Demo narration${voice.voice?', with voice '+JSON.stringify(voice.voice):', with a voice you choose'}.`)+
    ' '+(voice.provider==='none'?'Keep this for future films and open the product form.':'Use my saved access, save this voice choice for future films, then open the product form.');
}
export function productVoicePage(f,d,{esc,heading,field,button,link},sub) {
  const choice=productVoiceDraft(f,d),provider=productVoiceProviders.find(p=>p.id===choice.provider)||productVoiceProviders[0];
  let saved=false;
  try{saved=productVoiceReady(f)&&JSON.stringify(normalizeProductVoice(f.answers.voice))===JSON.stringify(normalizeProductVoice(choice));}catch{}
  if(sub==='setup/prompt'){
    if(saved)d.setupDraft=false;
    let prompt;try{prompt=productVoicePrompt(choice);}catch{return productVoicePage(f,d,{esc,heading,field,button,link},'setup');}
    return `<div class="center-flow product-demo-flow">${heading(saved?'Your voice is saved.':'Set up your voice.',saved?'This choice will be used for your next films.':'Paste this in chat to save your voice choice.')}<pre class="prompt-box product-demo-prompt" id="prompt-text">${esc(prompt)}</pre><div class="flow-footer">${link('Back','/formats/product-demo/setup','ghost')}${saved?link('Continue','/formats/product-demo/new','primary','arrow'):button('Copy setup prompt','copy-prompt','primary','copy')}</div></div>`;
  }
  return `<div class="center-flow product-demo-flow">${heading('Choose your voice service.','Set it once. We write and generate the narration.')}<form id="product-demo-voice-form">
    <label class="field"><span>Voice service</span><select data-field="productVoiceProvider" aria-label="Voice service">${productVoiceProviders.map(p=>`<option value="${p.id}" ${choice.provider===p.id?'selected':''}>${p.name}${f.productVoice?.keys?.[p.id]?' · Key saved':''}</option>`).join('')}</select></label>
    <p class="product-demo-voice-note">${esc(provider.note)}${provider.pricing?` <a href="${esc(provider.pricing)}" target="_blank" rel="noopener noreferrer">Pricing ↗</a>`:''}</p>
    ${choice.provider==='other'?field('Service name or website','productVoiceService',choice.service,'Your voice service'):''}
    ${choice.provider!=='none'?field('Voice (optional)','productVoiceName',choice.voice,'Choose for me, or paste a voice name or link'):''}
    ${productVoiceKeyName(choice.provider)?`<div class="onb-key"><div class="onb-key-label"><label for="product-demo-key">${esc(provider.id==='other'?'API key (optional)':provider.name+' API key')}</label>${provider.url?`<a href="${esc(provider.url)}" target="_blank" rel="noopener noreferrer">Get a key ↗</a>`:''}</div><input id="product-demo-key" type="password" placeholder="${f.productVoice?.keys?.[provider.id]?'Key already saved. Leave blank to keep it.':'Paste your API key'}" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="8192" aria-describedby="product-demo-key-help"><p id="product-demo-key-help">Saved on your computer. Never in your chat.</p></div>`:''}
    <p class="inline-alert" id="form-error" role="alert"></p><div class="flow-footer">${link('Back','/formats/product-demo','ghost')}<button type="submit" class="btn primary">Get setup prompt</button></div>
    </form></div>`;
}
