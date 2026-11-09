import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const bench=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tools=[['RTK','rtk',['--version']],['ripgrep','rg',['--version']],['jq','jq',['--version']],['ast-grep',bench+'/node_modules/.bin/ast-grep',['--version']],['Repomix',bench+'/node_modules/.bin/repomix',['--version']]];
let missing=false;
console.log('Node '+process.version+'; platform '+process.platform+' '+process.arch);
for(const [name,exe,args]of tools){
 const r=spawnSync(exe,args,{encoding:'utf8'});
 if(r.error||r.status!==0){console.error(name+': missing or failed');missing=true;}
 else console.log(name+': '+r.stdout.trim().split('\n')[0]);
}
console.log('Reference: RTK 0.40.0, ripgrep 15.1.0, jq 1.8.1, ast-grep 0.51.1, Repomix 1.19.0. Other versions may change results.');
if(missing)process.exitCode=1;
