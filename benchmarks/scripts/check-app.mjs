import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const bench=path.dirname(path.dirname(fileURLToPath(import.meta.url))),app=path.dirname(bench);
const out=path.join(bench,'results/native');
await fs.mkdir(out,{recursive:true});
const steps=[['typecheck',['proxy','npm','run','typecheck']],['lint',['proxy','npm','run','lint']],['jest',['proxy','npm','test','--','--runInBand','--verbose']]];
const checks=[];
for(const [name,args]of steps){
 const r=spawnSync('rtk',args,{cwd:app,encoding:'utf8',maxBuffer:16*1024*1024,env:{...process.env,CI:'1',NO_COLOR:'1'}});
 await fs.writeFile(path.join(out,name+'.log'),(r.stdout??'')+'\n'+(r.stderr??''));
 checks.push({name,exitCode:r.status,error:r.error?.message});
 console.log(name+': '+(r.status===0?'PASS':'FAIL; see benchmarks/results/native/'+name+'.log'));
 if(r.status!==0){process.exitCode=1;break;}
}
await fs.writeFile(path.join(out,'checks.json'),JSON.stringify(checks,null,2)+'\n');
