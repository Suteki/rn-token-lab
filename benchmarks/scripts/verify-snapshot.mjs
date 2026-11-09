import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {getEncoding} from 'js-tiktoken';

const bench=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const root=path.join(bench,'snapshots/2026-11-09');
const data=JSON.parse(await fs.readFile(path.join(root,'benchmarks.json'),'utf8'));
const published=JSON.parse(await fs.readFile(path.join(root,'published-counts.json'),'utf8'));
const manifest=JSON.parse(await fs.readFile(path.join(root,'redaction-manifest.json'),'utf8'));
const enc=getEncoding('o200k_base'),alt=getEncoding('cl100k_base');
const hash=text=>createHash('sha256').update(text).digest('hex');
assert.equal(data.cases.length,24);
assert.deepEqual(data.cases.filter(c=>!c.verified).map(c=>c.id),['rtk-status-intent']);
for(const file of manifest.files){
 const bytes=await fs.readFile(path.join(bench,file.path));
 assert.equal(hash(bytes),file.publishedSha256,'Published capture changed: '+file.path);
}
for(const c of data.cases){
 const expected=published.cases.find(x=>x.id===c.id);
 for(const side of ['before','after']){
  const text=await fs.readFile(path.join(root,'cases',`${c.id}.${side}.txt`),'utf8');
  assert.equal(enc.encode(text).length,expected[side].o200k_base,c.id+' '+side);
  assert.equal(alt.encode(text).length,expected[side].cl100k_base,c.id+' '+side+' cross-check');
  assert.equal(hash(text),expected[side].sha256,c.id+' '+side+' integrity');
 }
}
console.log(JSON.stringify({snapshot:'2026-11-09',cases:24,taskChecksPassed:23,expectedCounterexample:'rtk-status-intent',publishedTextHashes:'verified',publishedTokenCounts:'verified',note:'Original slide counts predate path redaction. See published-counts.json for reproducible public counts.'},null,2));
