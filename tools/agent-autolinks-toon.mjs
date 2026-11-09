import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require=createRequire(path.join(root,'benchmarks/format-tools/package.json'));
const {encode}=await import(pathToFileURL(require.resolve('@toon-format/toon')).href);
const result=spawnSync(process.execPath,['tools/agent-autolinks.mjs'],{cwd:root,encoding:'utf8'});
if(result.error)throw result.error;
if(result.status!==0){process.stderr.write(result.stderr);process.exit(result.status??1);}
const modules=JSON.parse(result.stdout);
if(!Array.isArray(modules)||modules.length!==8)throw new Error('Expected eight native module records');
process.stdout.write(encode(modules)+'\n');
