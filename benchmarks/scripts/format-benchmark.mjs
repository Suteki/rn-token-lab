import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {getEncoding} from 'js-tiktoken';
const bench=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const root=path.dirname(bench),snapshot=path.join(bench,'snapshots/2026-11-09');
const require=createRequire(path.join(bench,'format-tools/package.json'));
const {encode,decode}=await import(pathToFileURL(require.resolve('@toon-format/toon')).href);
const sha=data=>createHash('sha256').update(data).digest('hex');
const enc=getEncoding('o200k_base'),alt=getEncoding('cl100k_base');
const verify=process.argv.includes('--verify');
const out=verify?path.join(snapshot,'formats'):path.join(bench,'results/formats');
if(verify){
 const report=JSON.parse(await fs.readFile(path.join(out,'results.json'),'utf8'));
 for(const c of report.cases){
  const original=JSON.parse(await fs.readFile(path.join(out,c.id+'.pretty.json'),'utf8'));
  for(const variant of c.variants){
   const text=await fs.readFile(path.join(out,variant.file),'utf8');
   assert.equal(sha(text),variant.sha256,variant.file+' hash');
   assert.equal(enc.encode(text).length,variant.o200k_base,variant.file+' tokens');
   assert.equal(alt.encode(text).length,variant.cl100k_base,variant.file+' alternate tokens');
   assert.deepEqual(variant.format==='toon'?decode(text):JSON.parse(text),original,variant.file+' round trip');
  }
 }
 console.log(JSON.stringify({cases:report.cases.length,variants:report.cases.length*3,hashes:'verified',tokenCounts:'verified',roundTrips:'verified'}));
 process.exit(0);
}
await fs.mkdir(out,{recursive:true});
const configBytes=await fs.readFile(path.join(snapshot,'autolinking.json'));
const tasksBytes=await fs.readFile(path.join(snapshot,'tasks-api.json'));
const lockBytes=await fs.readFile(path.join(root,'package-lock.json'));
const config=JSON.parse(configBytes),tasks=JSON.parse(tasksBytes),lock=JSON.parse(lockBytes);
const inputs=[
 {id:'native-modules',task:'List every native module and its supported platforms',source:'benchmarks/snapshots/2026-11-09/autolinking.json',sourceSha256:sha(configBytes),data:Object.entries(config.dependencies).map(([name,d])=>({name,ios:d.platforms.ios!==null,android:d.platforms.android!==null})).sort((a,b)=>a.name.localeCompare(b.name))},
 {id:'demo-tasks',task:'Preserve all 20 demo tasks and all their fields',source:'benchmarks/snapshots/2026-11-09/tasks-api.json',sourceSha256:sha(tasksBytes),data:tasks},
 {id:'direct-dependencies',task:'Preserve every direct runtime dependency and version',source:'package-lock.json',sourceSha256:sha(lockBytes),data:Object.entries(lock.packages[''].dependencies).map(([name,version])=>({name,version})).sort((a,b)=>a.name.localeCompare(b.name))},
 {id:'full-autolinking',task:'Preserve the complete nested RN configuration',source:'benchmarks/snapshots/2026-11-09/autolinking.json',sourceSha256:sha(configBytes),data:config},
];
const cases=[];
for(const c of inputs){
 const variants=[];
 for(const [format,text] of [['pretty',JSON.stringify(c.data,null,2)+'\n'],['compact',JSON.stringify(c.data)+'\n'],['toon',encode(c.data)+'\n']]){
  assert.deepEqual(format==='toon'?decode(text):JSON.parse(text),c.data,c.id+' '+format+' round trip');
  const file=c.id+'.'+(format==='toon'?'toon':format+'.json');
  await fs.writeFile(path.join(out,file),text);
  variants.push({format,file,bytes:Buffer.byteLength(text),o200k_base:enc.encode(text).length,cl100k_base:alt.encode(text).length,sha256:sha(text),roundTrip:true});
 }
 cases.push({id:c.id,task:c.task,source:c.source,sourceSha256:c.sourceSha256,records:Array.isArray(c.data)?c.data.length:null,variants});
}
const report={date:new Date().toISOString(),tool:'@toon-format/toon',version:'4.4.0',tokenizer:'js-tiktoken 1.0.21',method:'Complete strings including final newline; identical JSON values in three serializations; decode round trip checked. No model calls, provider cache, billing, model output or answer-quality measurements. Format instructions and tool-protocol overhead are excluded.',cases};
await fs.writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
const rows=cases.map(c=>{const by=Object.fromEntries(c.variants.map(v=>[v.format,v]));return `| ${c.id} | ${by.pretty.o200k_base} | ${by.compact.o200k_base} | ${by.toon.o200k_base} | ${(100*(1-by.toon.o200k_base/by.compact.o200k_base)).toFixed(1)}% |`;});
await fs.writeFile(path.join(out,'RESULTS.md'),'# TOON on real RN data\n\n'+report.method+'\n\nTOON 4.4.0; o200k_base; all 12 round trips pass. A negative saving means more text tokens.\n\n| Case | Pretty JSON | Compact JSON | TOON | Saving vs compact |\n| --- | ---: | ---: | ---: | ---: |\n'+rows.join('\n')+'\n');
console.log(JSON.stringify({out,cases:cases.map(c=>({id:c.id,records:c.records,counts:Object.fromEntries(c.variants.map(v=>[v.format,v.o200k_base]))}))},null,2));
