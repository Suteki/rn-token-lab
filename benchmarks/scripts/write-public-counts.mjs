import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {getEncoding} from 'js-tiktoken';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../snapshots/2026-11-09');
const target=path.join(root,'published-counts.json');
try { await fs.access(target); throw new Error('Published counts already exist; do not overwrite a frozen snapshot.'); } catch(e) { if(e.code!=='ENOENT')throw e; }
const original=JSON.parse(await fs.readFile(path.join(root,'benchmarks.json'),'utf8'));
const enc=getEncoding('o200k_base'),alt=getEncoding('cl100k_base');
const cases=[];
for(const c of original.cases){
 const result={id:c.id};
 for(const side of ['before','after']){
  const text=await fs.readFile(path.join(root,'cases',c.id+'.'+side+'.txt'),'utf8');
  result[side]={o200k_base:enc.encode(text).length,cl100k_base:alt.encode(text).length,bytes:Buffer.byteLength(text),sha256:createHash('sha256').update(text).digest('hex')};
 }
 cases.push(result);
}
await fs.writeFile(target,JSON.stringify({note:'Counts for published text AFTER personal path redaction. Historical pre-redaction slide counts are in benchmarks.json. No provider usage or billing measured.',tokenizer:'js-tiktoken 1.0.21',cases},null,2)+'\n');
console.log('Wrote published counts for '+cases.length+' pairs.');
