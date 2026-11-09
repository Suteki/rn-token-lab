import fs from 'node:fs/promises';
import {rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

// Reconstruct a real project change set in a disposable repository. Never
// stage, reset, or edit the reader's checkout merely to measure Git output.
export async function prepareGitFixture(app,historicalStatus){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'rn-token-lab-git-'));
 process.on('exit',()=>rmSync(root,{recursive:true,force:true}));
 function run(args,{cwd=root,input}={}){
  const r=spawnSync('rtk',['proxy',...args],{cwd,input,maxBuffer:32*1024*1024,env:{...process.env,LC_ALL:'C',NO_COLOR:'1'}});
  if(r.error||r.status!==0)throw new Error('Git fixture failed: '+args.join(' ')+' '+(r.stderr??'').toString());
  return r.stdout;
 }
 const archive=run(['git','archive',historicalStatus.baselineCommit],{cwd:app});
 run(['tar','-xf','-','-C',root],{input:archive});
 run(['git','init','--initial-branch=main']);
 run(['git','add','.']);
 run(['git','-c','user.name=RN Token Lab','-c','user.email=benchmark@example.invalid','-c','commit.gpgsign=false','commit','-m','Controlled RN baseline']);
 for(const file of historicalStatus.checkedPaths){
  if(path.isAbsolute(file)||file.split('/').includes('..'))throw new Error('Unsafe fixture path');
  const target=path.join(root,file),source=path.join(app,file);
  if(file==='__tests__/App.test.tsx'){await fs.rm(target,{force:true});continue;}
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.cp(source,target,{recursive:true});
 }
 return root;
}
