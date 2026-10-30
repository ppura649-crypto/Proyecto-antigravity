// Embed the same agent controls in a standalone page, including offline file pages.
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const moduleURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
export function promptPageAssets(){
  const logos=moduleURL(read('./workspace-ui/agent-logos.js'));
  const source=read('./workspace-ui/agent-prompts.js').replace("'./agent-logos.js'",JSON.stringify(logos));
  const css=read('./page.css').match(/\/\* Agent prompts:[\s\S]*?\/\* \/Agent prompts \*\//)?.[0];
  if(!css)throw Error('The shared agent prompt styles are missing.');
  return {css,script:`<script type="module">import {watchAgentPrompts,syncAgentPrompts} from ${JSON.stringify(moduleURL(source))};watchAgentPrompts(document);syncAgentPrompts(document);</script>`};
}
