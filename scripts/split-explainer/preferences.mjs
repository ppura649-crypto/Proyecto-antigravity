// Save explicit presentation decisions, with scope, evidence and reason. No reference creator defaults become memory.
import path from 'node:path';
import fs from 'node:fs';
import {read,write,rootOf} from './lib.mjs';
const[cmd,workspace,file,projectArg]=process.argv.slice(2);const root=rootOf(workspace??'.');
const target=path.join(root,'workspace/library/split-explainer.json');
if(cmd==='save'){
 const input=read(path.resolve(file));
 if(input.scope!=='format'&&input.scope!=='project')throw Error('State whether this is a format preference or a project exception.');
 if(!input.evidence||!input.reason)throw Error('Save the actual instruction and its reason.');
 if(!input.look||typeof input.look!=='object')throw Error('Save the resolved look.');
 const destination=input.scope==='project'?path.join(path.resolve(projectArg??''),'presentation.json'):target;
 if(input.scope==='project'&&!projectArg)throw Error('Project-scoped choices need a project folder.');
 const at=new Date().toISOString();const value={...input,done:true,version:1,at,answers:input.look,setup:{done:true,version:1,at}};write(destination,value);
 const page=destination.replace(/\.json$/,'.preferences.md');
 fs.writeFileSync(page,`# Presentation\n\n${input.reason}\n\nScope: ${input.scope}.\n\nCurrent explicit instruction: ${input.evidence}\n\nThe structured look beside this page is current. Superseded values were replaced, not appended. Local choices do not change standing preferences.\n`);
 console.log(destination);
}else if(cmd==='resolve'){
 const project=path.resolve(file);const local=path.join(project,'presentation.json');const value=fs.existsSync(local)?read(local):fs.existsSync(target)?read(target):null;
 if(!value?.done)throw Error('Presentation is unknown. Ask once using the visual setup examples, then save the actual choices.');
 write(path.join(project,'resolved-presentation.json'),value);console.log(JSON.stringify(value,null,2));
}else throw Error('preferences.mjs save <workspace> <choice.json> [project] | resolve <workspace> <project>');
