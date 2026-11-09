import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
const bench=path.dirname(path.dirname(new URL(import.meta.url).pathname));
const app=path.dirname(bench);
await fs.mkdir(bench+'/results/setup',{recursive:true});
const core=[
 '@react-navigation/native@7.5.1','@react-navigation/native-stack@7.21.0',
 'react-native-reanimated@4.7.1','react-native-gesture-handler@3.5.0',
 '@react-native-async-storage/async-storage@3.1.1','@tanstack/react-query@5.107.1',
 'zustand@5.1.0','react-hook-form@7.91.0','zod@4.6.7','react-native-svg@15.16.1',
 '@react-native-community/netinfo@12.0.1'
];
const support=['react-native-screens@4.30.1','react-native-safe-area-context@5.11.1','react-native-worklets@0.13.1','@hookform/resolvers@7.0.5'];
const step=process.argv[2]??'app';
const args=step==='tools'?['proxy','npm','install','--no-audit','--no-fund']:['proxy','npm','install','--save-exact','--no-audit','--no-fund',...core,...support];
const cwd=step==='tools'?bench:app;
const child=spawn('rtk',args,{cwd,env:{...process.env,CI:'1',NO_COLOR:'1'},stdio:['ignore','pipe','pipe']});
const chunks=[];child.stdout.on('data',b=>chunks.push(b));child.stderr.on('data',b=>chunks.push(b));
const code=await new Promise(r=>child.on('close',r));
const output=Buffer.concat(chunks).toString();
await fs.writeFile(bench+'/results/setup/'+step+'-install.log',output);
await fs.writeFile(bench+'/results/setup/'+step+'-install.json',JSON.stringify({step,args,cwd,exitCode:code,createdAt:new Date().toISOString()},null,2));
console.log(JSON.stringify({step,exitCode:code,tail:output.slice(-2200)}));process.exitCode=code??1;
