// One remembered agent choice controls prompt display and copying across formats.
import {AGENT_LOGOS} from './agent-logos.js';
export const PROMPT_AGENTS = [
  {id:'codex',name:'Codex',prefix:'$'},
  {id:'claude',name:'Claude Code',prefix:'/'},
  {id:'grok',name:'Grok',prefix:'/'},
  {id:'cursor',name:'Cursor',prefix:'/'},
  {id:'copilot',name:'Copilot CLI',prefix:'/'},
  {id:'gemini',name:'Gemini CLI',prefix:''},
  {id:'other',name:'Another agent',prefix:''},
];
const agentStorageKey='keyframes:prompt-agent';
const promptSkills=new Set(['start','add','product-demo','talking-head','trial-reels','quick-cuts','new-format','captions','footage','measuring','research','setup','stages','full-visual','full-visual-script','full-visual-customization','split-explainer','talking-head-customization','create-my-own']);
let selectedAgent;
export function registerPromptSkills(formats=[]) {
  for(const f of formats){const name=f.command?.match(/^[/\$]([a-z0-9-]+)(?=\s|$)/)?.[1];if(name)promptSkills.add(name);for(const st of f.styles||[])if(/^[a-z0-9-]+$/.test(st.skill))promptSkills.add(st.skill);}
}
export function promptAgent() {
  if(!selectedAgent){try{selectedAgent=globalThis.localStorage?.getItem(agentStorageKey);}catch{}}
  return PROMPT_AGENTS.some(a=>a.id===selectedAgent)?selectedAgent:'codex';
}
export function setPromptAgent(id) {
  selectedAgent=PROMPT_AGENTS.some(a=>a.id===id)?id:'codex';
  try{globalThis.localStorage?.setItem(agentStorageKey,selectedAgent);}catch{}
  return selectedAgent;
}
export function agentPrompt(text,agent=promptAgent()) {
  text=String(text??'');
  const direct=text.match(/^(\s*)[/\$]([a-z0-9-]+)(?=\s|$)/);
  const plain=direct?null:text.match(/^(\s*)Use the ([a-z0-9-]+) skill[.:](?=\s|$)/);
  const match=direct||plain;
  if(!match||!promptSkills.has(match[2]))return text;
  const target=PROMPT_AGENTS.find(a=>a.id===agent)||PROMPT_AGENTS[0],suffix=text.slice(match[0].length);
  return match[1]+(target.prefix?target.prefix+match[2]:'Use the '+match[2]+' skill'+(!suffix||/^[\r\n]/.test(suffix)?'.':':'))+suffix;
}
export function agentPicker({global=false}={}) {
  return `<div class="prompt-agent${global?' prompt-agent-global':''}" role="group" aria-label="Choose your chat agent">${PROMPT_AGENTS.map(a=>`<button type="button" data-prompt-agent="${a.id}" aria-label="${a.name}" title="${a.name}" aria-pressed="${a.id===promptAgent()}">${AGENT_LOGOS[a.id]}</button>`).join('')}</div>`;
}
const promptSelector='pre.prompt-box,pre#prompt-text,pre.lr-prompt,pre[data-bm-prompt],#beat-preparation-prompt,pre[data-agent-prompt]';
const displayedPrompts=new WeakMap();
export function syncAgentPrompts(root=document) {
  const nodes=[...root.querySelectorAll(promptSelector)];
  for(const node of nodes){
    const previous=displayedPrompts.get(node),current=node.textContent;
    const raw=previous&&current===previous.shown?previous.raw:current,shown=agentPrompt(raw);
    displayedPrompts.set(node,{raw,shown});
    if(current!==shown)node.textContent=shown;
    if(!node.previousElementSibling?.classList.contains('prompt-agent'))node.insertAdjacentHTML('beforebegin',agentPicker());
    const hidden=node.hidden||!shown.trim();
    if(node.previousElementSibling.hidden!==hidden)node.previousElementSibling.hidden=hidden;
  }
  for(const button of root.querySelectorAll('[data-prompt-agent]')){
    const pressed=String(button.dataset.promptAgent===promptAgent());
    if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
  }
  const hasVisiblePrompt=nodes.some(node=>node.textContent.trim()&&(node.checkVisibility?node.checkVisibility():node.getClientRects().length&&!node.closest('details:not([open])')));
  for(const picker of root.querySelectorAll('.prompt-agent-global'))if(picker.hidden!==hasVisiblePrompt)picker.hidden=hasVisiblePrompt;
}
export function watchAgentPrompts(root=document) {
  const choose=event=>{
    const button=event.target.closest?.('[data-prompt-agent]');if(!button)return;
    event.preventDefault();setPromptAgent(button.dataset.promptAgent);syncAgentPrompts(root);
  };
  root.addEventListener('click',choose);
  let pending=false;
  const observer=new MutationObserver(records=>{
    if(!records.some(record=>record.target.parentElement?.closest(promptSelector)||record.target.matches?.(promptSelector)||record.type==='attributes'&&record.target.querySelector?.(promptSelector)||[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches(promptSelector)||node.querySelector(promptSelector)))))return;
    if(pending)return;pending=true;
    queueMicrotask(()=>{pending=false;syncAgentPrompts(root);});
  });
  observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','open']});
  return ()=>{observer.disconnect();root.removeEventListener('click',choose);};
}
