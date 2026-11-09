import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {getEncoding} from 'js-tiktoken';
import {fileURLToPath} from 'node:url';
import {prepareGitFixture} from './git-fixture.mjs';

const bench=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const app=path.dirname(bench);
const out=bench+'/results';
await fs.mkdir(out+'/cases',{recursive:true});
await fs.mkdir(out+'/native',{recursive:true});
const env={...process.env,NO_COLOR:'1',FORCE_COLOR:'0',CI:'1',LC_ALL:'C'};
const enc=getEncoding('o200k_base'),alt=getEncoding('cl100k_base');
function run(args,{input,cwd=app,allowed=[0]}={}){
 const r=spawnSync('rtk',args,{cwd,env,input,encoding:'utf8',maxBuffer:64*1024*1024,timeout:180000});
 if(r.error||!allowed.includes(r.status))throw new Error(JSON.stringify({args,code:r.status,error:r.error?.message,stderr:r.stderr?.slice(-1600)}));
 return {stdout:r.stdout,stderr:r.stderr,status:r.status,text:r.stdout+(r.stderr?'\n'+r.stderr:'')};
}
const raw=args=>run(['proxy',...args]).stdout;
const ast=bench+'/node_modules/.bin/ast-grep',repomix=bench+'/node_modules/.bin/repomix';
async function filesBelow(dir){
 const entries=await fs.readdir(app+'/'+dir,{withFileTypes:true});
 const nested=await Promise.all(entries.map(e=>e.isDirectory()?filesBelow(dir+'/'+e.name):Promise.resolve([dir+'/'+e.name])));
 return nested.flat().filter(f=>/\.(tsx?|jsx?|json|kt|swift|gradle|plist)$/.test(f)).sort();
}
const appFiles=['App.tsx',...await filesBelow('src')];
const screenFiles=appFiles.filter(x=>x.startsWith('src/screens/'));
const nativeFiles=['android/settings.gradle','android/build.gradle','android/gradle.properties','android/app/build.gradle','android/app/src/main/AndroidManifest.xml','android/app/src/main/java/com/tokensavingsrn/MainActivity.kt','android/app/src/main/java/com/tokensavingsrn/MainApplication.kt','ios/Podfile','ios/TokenSavingsRN/AppDelegate.swift','ios/TokenSavingsRN/SceneDelegate.swift','ios/TokenSavingsRN/Info.plist'];
const configFiles=['package.json','tsconfig.json','babel.config.js','metro.config.js','jest.config.js','app.json','android/app/src/main/AndroidManifest.xml','ios/TokenSavingsRN/Info.plist'];
const concat=async files=>(await Promise.all(files.map(async file=>`\n// FILE: ${file}\n`+await fs.readFile(app+'/'+file,'utf8')))).join('\n');
const cases=[];
async function add({id,tool,dataType,task,before,after,beforeCommand,afterCommand,check,primary=false,expectedSemanticFailure=false,meta={}}){
 if(!before.length)throw new Error(id+' has an empty baseline');
 const verified=await check(after);
 if(verified!==true&&!expectedSemanticFailure)throw new Error(id+': semantic check failed');
 const beforeTokens=enc.encode(before).length,afterTokens=enc.encode(after).length;
 const result={id,tool,dataType,task,primary,beforeCommand,afterCommand,beforeTokens,afterTokens,savingPct:Number((100*(1-afterTokens/beforeTokens)).toFixed(1)),cl100k:{before:alt.encode(before).length,after:alt.encode(after).length},beforeBytes:Buffer.byteLength(before),afterBytes:Buffer.byteLength(after),verified,expectedSemanticFailure,...meta};
 await fs.writeFile(out+'/cases/'+id+'.before.txt',before);await fs.writeFile(out+'/cases/'+id+'.after.txt',after);
 cases.push(result);console.log(JSON.stringify(result));
}
function contains(...needles){return text=>needles.every(n=>text.includes(n));}
function jsonEquals(expected){return text=>JSON.stringify(JSON.parse(text))===JSON.stringify(expected);}

// Generate and retain real tool outputs once. Filters consume the same capture.
const jest=run(['proxy','npx','jest','--runInBand','--verbose','--json','--outputFile',out+'/jest.json']);
await fs.writeFile(out+'/jest.log',jest.text);
const jestReport=JSON.parse(await fs.readFile(out+'/jest.json','utf8'));
if(jestReport.numFailedTests||jestReport.numPassedTests!==40)throw new Error('Application tests did not pass');
const config=run(['proxy','npx','react-native','config']).stdout;
await fs.writeFile(out+'/autolinking.json',config);
const autolink=JSON.parse(config);
const tree=raw(['npm','ls','--depth=0','--json']);await fs.writeFile(out+'/dependencies.json',tree);
// Reuse the real captured API response and reconstruct the original Git
// change set in a temporary repository, leaving the user's checkout untouched.
let tasks=JSON.parse(await fs.readFile(bench+'/captures/tasks-api.json','utf8'));
if(process.env.BENCH_LIVE_API==='1'){
 const api=await fetch('https://jsonplaceholder.typicode.com/todos?_limit=20');
 if(!api.ok)throw new Error('Public demo API fetch failed');
 tasks=await api.json();
}
await fs.writeFile(out+'/tasks-api.json',JSON.stringify(tasks,null,2));
const historical=JSON.parse(await fs.readFile(bench+'/snapshots/2026-11-09/benchmarks.json','utf8'));
const historicalStatus=historical.cases.find(c=>c.id==='rtk-status');
const gitFixture=await prepareGitFixture(app,historicalStatus);
const status=run(['proxy','git','status'],{cwd:gitFixture}).stdout;
const compactStatus=run(['git','status'],{cwd:gitFixture}).stdout;
const visiblePaths=historicalStatus.checkedPaths;
await add({id:'rtk-status',tool:'RTK',dataType:'Git working tree',task:'Оцінити обсяг змін у RN-проєкті',primary:true,before:status,after:compactStatus,beforeCommand:'git status (temporary RN change-set fixture)',afterCommand:'rtk git status (same temporary RN change-set fixture)',check:t=>visiblePaths.every(file=>t.includes(file)),meta:{controlledGitFixture:true,porcelainEntries:visiblePaths.length,checkedPaths:visiblePaths,baselineCommit:historicalStatus.baselineCommit}});
const intentBefore=await fs.readFile(bench+'/captures/git-intent.before.txt','utf8'),intentAfter=await fs.readFile(bench+'/captures/git-intent.after.txt','utf8');
const intentPaths=Array.from(intentBefore.matchAll(/new file:\s+([^\n]+)/g),m=>m[1].trim());
await add({id:'rtk-status-intent',tool:'RTK',dataType:'Git intent-to-add counterexample',task:'Перевірити видимість нових файлів після git add -N',before:intentBefore,after:intentAfter,beforeCommand:'git status (captured real intent-to-add state)',afterCommand:'rtk git status (same state)',check:t=>intentPaths.every(file=>t.includes(file)),expectedSemanticFailure:true,meta:{missingPaths:intentPaths.filter(file=>!intentAfter.includes(file)),excludedFromRecommendations:true,caveat:'Compact status omitted intent-to-add files in this installed RTK build. Inspect raw status/porcelain.'}});
const gitDiff=run(['proxy','git','diff','--','App.tsx','babel.config.js','ios/Podfile'],{cwd:gitFixture}).stdout;
const compactDiff=run(['pipe','--filter','git-diff'],{input:gitDiff}).stdout;
await add({id:'rtk-diff',tool:'RTK',dataType:'Unified diff',task:'Огляд змін у root providers, Babel і Podfile',before:gitDiff,after:compactDiff,beforeCommand:'git diff -- App.tsx babel.config.js ios/Podfile (temporary RN fixture)',afterCommand:'git diff ... | rtk pipe --filter git-diff',check:contains('App.tsx','Podfile'),meta:{controlledGitFixture:true}});
const compactJest=run(['test','node','benchmarks/scripts/replay.mjs',out+'/jest.log']).stdout;
await add({id:'rtk-jest',tool:'RTK',dataType:'Jest pass log',task:'Перевірити підсумок реального запуску 40 тестів',before:jest.text,after:compactJest,beforeCommand:'npx jest --runInBand --verbose --json --outputFile results/jest.json',afterCommand:'rtk test node benchmarks/scripts/replay.mjs results/jest.log',check:t=>/40/.test(t)&&/pass|success|ok|✓/i.test(t),meta:{replay:true,sourceExitCode:0,tests:40}});
const tscFailure=await fs.readFile(bench+'/captures/tsc-initial-failure.log','utf8');
const tscSmall=run(['pipe','--filter','tsc'],{input:tscFailure}).stdout;
await add({id:'rtk-tsc-errors',tool:'RTK',dataType:'TypeScript diagnostics',task:'Зберегти обидві помилки з реальної початкової перевірки',before:tscFailure,after:tscSmall,beforeCommand:'npx tsc --noEmit (initial failure capture)',afterCommand:'rtk pipe --filter tsc < initial-failure.log',check:contains('TS2304','TS2322','taskApi.test.ts','TaskListScreen.tsx'),meta:{replay:true,sourceExitCode:2,filterExitCode:0,caveat:'Standalone stdin filter has exit 0. Preserve producer status with pipefail or use rtk tsc.'}});
const iosFailure=await fs.readFile(bench+'/captures/ios-initial-failure.log','utf8');
await fs.writeFile(out+'/native/ios-initial-failure.log',iosFailure);
const iosSmall=run(['err','node','benchmarks/scripts/replay.mjs',out+'/native/ios-initial-failure.log','65'],{allowed:[1,65]}).text;
await add({id:'rtk-ios-error',tool:'RTK',dataType:'Xcode build failure',task:'Знайти помилку deployment target та статус невдалого build',before:iosFailure,after:iosSmall,beforeCommand:'xcodebuild ... build (actual captured initial failure)',afterCommand:'rtk err node benchmarks/scripts/replay.mjs results/native/ios-initial-failure.log 65',check:contains('deployment target','AsyncStorage'),meta:{replay:true,sourceExitCode:65}});

// Text search on complete, bounded source scopes. No node_modules dump.
await add({id:'rg-navigation',tool:'ripgrep',dataType:'TypeScript / TSX',task:'Знайти декларацію native stack',primary:true,before:await concat(appFiles),after:raw(['rg','-n','-C','3','createNativeStackNavigator<','src']),beforeCommand:'cat App.tsx src/**/*.{ts,tsx} (sorted explicit manifest)',afterCommand:"rg -n -C 3 'createNativeStackNavigator<' src",check:contains('RootNavigator.tsx','createNativeStackNavigator<RootStackParamList>')});
await add({id:'rg-manifest',tool:'ripgrep',dataType:'Android XML',task:'Перевірити INTERNET permission',before:await fs.readFile(app+'/android/app/src/main/AndroidManifest.xml','utf8'),after:raw(['rg','-n','-F','android.permission.INTERNET','android/app/src/main/AndroidManifest.xml']),beforeCommand:'cat android/app/src/main/AndroidManifest.xml',afterCommand:"rg -n -F 'android.permission.INTERNET' android/app/src/main/AndroidManifest.xml",check:contains('android.permission.INTERNET')});
await add({id:'rg-worklets',tool:'ripgrep',dataType:'Babel JavaScript config',task:'Перевірити наявність Worklets plugin і його позицію',before:await fs.readFile(app+'/babel.config.js','utf8'),after:raw(['rg','-n','-C','2','react-native-worklets/plugin','babel.config.js']),beforeCommand:'cat babel.config.js',afterCommand:"rg -n -C 2 'react-native-worklets/plugin' babel.config.js",check:contains('react-native-worklets/plugin',"],")});
await add({id:'rg-ios-platform',tool:'ripgrep',dataType:'Podfile / Swift / Gradle',task:'Знайти iOS minimum і місце виправлення Pod targets',before:await concat(nativeFiles),after:raw(['rg','-n','-C','2','platform :ios|IPHONEOS_DEPLOYMENT_TARGET|Gem::Version','ios/Podfile']),beforeCommand:'cat (11 explicit native configuration files)',afterCommand:"rg -n -C 2 'platform :ios|IPHONEOS_DEPLOYMENT_TARGET|Gem::Version' ios/Podfile",check:contains('min_ios_version_supported','IPHONEOS_DEPLOYMENT_TARGET')});

// JSON from the actual CLI, lockfile, Jest and network response.
const jqDeps='.dependencies | to_entries | map({name:.key, ios:(.value.platforms.ios != null), android:(.value.platforms.android != null)}) | sort_by(.name)';
const expectedDeps=Object.entries(autolink.dependencies).map(([name,d])=>({name,ios:d.platforms.ios!==null&&d.platforms.ios!==undefined,android:d.platforms.android!==null&&d.platforms.android!==undefined})).sort((a,b)=>a.name.localeCompare(b.name));
await add({id:'jq-autolinking',tool:'jq',dataType:'React Native config JSON',task:'Оглянути autolinked native modules і платформи',primary:true,before:config,after:raw(['jq','-c',jqDeps,out+'/autolinking.json']),beforeCommand:'npx react-native config',afterCommand:"npx react-native config | jq -c '.dependencies | to_entries | map({name:.key,ios:(.value.platforms.ios!=null),android:(.value.platforms.android!=null)}) | sort_by(.name)'",check:jsonEquals(expectedDeps),meta:{nativeModules:expectedDeps.length}});
const lock=await fs.readFile(app+'/package-lock.json','utf8');const lockJson=JSON.parse(lock);const declared=JSON.parse(await fs.readFile(app+'/package.json','utf8')).dependencies;
const lockQuery='.packages[""] .dependencies | to_entries | map({name:.key,version:.value}) | sort_by(.name)';
const direct=Object.entries(declared).map(([name,version])=>({name,version})).sort((a,b)=>a.name.localeCompare(b.name));
await add({id:'jq-lockfile',tool:'jq',dataType:'npm package-lock JSON',task:'Витягти лише прямі runtime dependencies',before:lock,after:raw(['jq','-c',lockQuery,'package-lock.json']),beforeCommand:'cat package-lock.json',afterCommand:"jq -c '.packages[\"\"].dependencies | to_entries | map({name:.key,version:.value}) | sort_by(.name)' package-lock.json",check:jsonEquals(direct),meta:{lockPackages:Object.keys(lockJson.packages).length}});
const reportText=await fs.readFile(out+'/jest.json','utf8');const jestQuery='{numTotalTests,numPassedTests,numFailedTests,numPassedTestSuites,numFailedTestSuites,success}';
const reportExpected=Object.fromEntries(['numTotalTests','numPassedTests','numFailedTests','numPassedTestSuites','numFailedTestSuites','success'].map(k=>[k,jestReport[k]]));
await add({id:'jq-jest-report',tool:'jq',dataType:'Jest report JSON',task:'Прочитати підсумок тестів, не їхні timings і stack metadata',before:reportText,after:raw(['jq','-c',jestQuery,out+'/jest.json']),beforeCommand:'cat benchmarks/results/jest.json',afterCommand:"jq -c '{numTotalTests,numPassedTests,numFailedTests,numPassedTestSuites,numFailedTestSuites,success}' results/jest.json",check:jsonEquals(reportExpected)});
const completed=tasks.filter(t=>t.completed).map(({id,title})=>({id,title}));
await add({id:'jq-api',tool:'jq',dataType:'Public demo API JSON',task:'Витягти id та title завершених задач з реальної HTTP-відповіді',before:await fs.readFile(out+'/tasks-api.json','utf8'),after:raw(['jq','-c','[.[] | select(.completed) | {id,title}]',out+'/tasks-api.json']),beforeCommand:'curl https://jsonplaceholder.typicode.com/todos?_limit=20 (captured response)',afterCommand:"jq -c '[.[] | select(.completed) | {id,title}]' results/tasks-api.json",check:jsonEquals(completed),meta:{apiRecords:tasks.length,selectedRecords:completed.length,apiIsPublicDemo:true}});

// Structural searches are checked against ast-grep's machine-readable matches.
async function astCase({id,task,files,pattern,language,primary=false}){
 const args=['run','-p',pattern,'-l',language,...files,'--color','never'];
 const found=JSON.parse(raw([ast,'run','-p',pattern,'-l',language,...files,'--json']));
 if(!found.length)throw new Error(id+' has no real AST matches');
 const after=raw([ast,...args]);
 await add({id,tool:'ast-grep',dataType:language==='tsx'?'React TSX AST':'TypeScript AST',task,primary,before:await concat(files),after,beforeCommand:'cat '+files.join(' '),afterCommand:`ast-grep run -p '${pattern}' -l ${language} ${files.join(' ')} --color never`,check:t=>found.every(m=>t.includes(m.text.split('\n')[0].trim())),meta:{matches:found.length}});
}
await astCase({id:'ast-navigation',task:'Знайти всі виклики navigation.navigate на екранах',files:screenFiles,pattern:'navigation.navigate($$$ARGS)',language:'tsx',primary:true});
await astCase({id:'ast-query',task:'Прочитати фактичну конфігурацію useQuery',files:['src/hooks/useTasks.ts'],pattern:'useQuery($$$ARGS)',language:'ts'});
await astCase({id:'ast-schema',task:'Знайти обидві Zod object-схеми',files:['src/domain/task.ts'],pattern:'z.object($$$ARGS)',language:'ts'});
await astCase({id:'ast-pressable',task:'Знайти Pressable з onPress та accessibility props',files:appFiles.filter(f=>f.endsWith('.tsx')),pattern:'<Pressable $$$ATTRS>$$$CHILDREN</Pressable>',language:'tsx'});

async function bundle(id,files,compress){
 const output=out+'/cases/'+id+'.xml';
 // A separate config prevents the agent's repository config from adding its
 // app include list or enabling compression in the uncompressed control.
 const configFile=out+'/cases/'+id+'.config.json';
 await fs.writeFile(configFile,JSON.stringify({include:files,output:{filePath:output,style:'xml',compress},ignore:{useGitignore:true,useDefaultPatterns:true},security:{enableSecurityCheck:true}},null,2));
 run(['proxy',repomix,'--config',configFile,'--quiet']);
 const text=await fs.readFile(output,'utf8');
 const packedPaths=Array.from(text.matchAll(/<file path="([^"]+)"/g),m=>m[1]).sort();
 if(JSON.stringify(packedPaths)!==JSON.stringify([...files].sort()))throw new Error(id+': packed files differ from the baseline scope');
 return text;
}
const rawApp=await concat(appFiles),packedApp=await bundle('rep-app',appFiles,true),fullApp=await bundle('rep-full',appFiles,false);
const exported=Array.from(rawApp.matchAll(/export (?:async )?function ([\w]+)/g),m=>m[1]);
await add({id:'rep-app',tool:'Repomix',dataType:'RN app TypeScript / TSX',task:'Огляд структури та exported API застосунку',primary:true,before:rawApp,after:packedApp,beforeCommand:'cat (same 14 app source files, explicit manifest)',afterCommand:'repomix --include "App.tsx,src/**/*" --style xml --compress',check:t=>appFiles.every(f=>t.includes('path="'+f+'"'))&&exported.every(n=>t.includes(n)),meta:{files:appFiles.length,exportedFunctions:exported.length,caveat:'Function implementations are intentionally removed; this cannot replace source for debugging.'}});
await add({id:'rep-default-overhead',tool:'Repomix',dataType:'RN app TypeScript / TSX',task:'Порівняти звичайний bundle із читанням тих самих файлів',before:rawApp,after:fullApp,beforeCommand:'cat (same app source manifest)',afterCommand:'repomix --include "App.tsx,src/**/*" --style xml (without --compress)',check:t=>appFiles.every(f=>t.includes('path="'+f+'"')),meta:{files:appFiles.length,negativeControl:true}});
const packedNative=await bundle('rep-native',nativeFiles,true);
await add({id:'rep-native',tool:'Repomix',dataType:'Swift / Kotlin / Ruby / Gradle / XML',task:'Огляд однакового набору native files',before:await concat(nativeFiles),after:packedNative,beforeCommand:'cat (11 native source/config files)',afterCommand:'repomix --include (same 11 native files) --style xml --compress',check:t=>nativeFiles.every(f=>t.includes('path="'+f+'"')),meta:{files:nativeFiles.length,caveat:'Mixed/unsupported formats may yield little reduction or a larger bundle.'}});
const packedConfig=await bundle('rep-config',configFiles,true);
await add({id:'rep-config',tool:'Repomix',dataType:'JSON / JS config / XML / plist',task:'Огляд конфігурації запуску та платформи',before:await concat(configFiles),after:packedConfig,beforeCommand:'cat (8 configuration files)',afterCommand:'repomix --include (same 8 config files) --style xml --compress',check:t=>configFiles.every(f=>t.includes('path="'+f+'"')),meta:{files:configFiles.length,caveat:'Added packaging metadata can outweigh code compression.'}});

const appPackage=JSON.parse(await fs.readFile(app+'/package.json','utf8'));
const versions={reactNative:appPackage.dependencies['react-native'],react:appPackage.dependencies.react,node:process.version,rtk:raw(['rtk','--version']).trim(),ripgrep:raw(['rg','--version']).split('\n')[0],jq:raw(['jq','--version']).trim(),astgrep:raw([ast,'--version']).trim(),repomix:raw([repomix,'--version']).trim(),tokenizer:'js-tiktoken 1.0.21',primaryEncoding:'o200k_base',crossCheckEncoding:'cl100k_base'};
const files=await Promise.all([...appFiles,...nativeFiles].map(async file=>({file,sha256:createHash('sha256').update(await fs.readFile(app+'/'+file)).digest('hex')})));
const result={createdAt:new Date().toISOString(),project:'TokenSavingsRN',projectPath:'.',initialization:'npx @react-native-community/cli@20.2.0 init TokenSavingsRN --version 0.88.1 --directory rn-token-lab --skip-install --skip-git-init --install-pods false',method:'Real RN CLI project. Complete text inputs/outputs counted locally; no model calls, LLM usage or subscription billing measured. Replay cases filter one real captured output, avoiding cold/warm-run variation. Every case has a task-specific semantic check. Different questions and lossy structure compression must not be averaged into session or billing savings.',versions,dependencies:appPackage.dependencies,sourceManifest:files,tests:{passed:jestReport.numPassedTests,total:jestReport.numTotalTests},cases};
await fs.writeFile(out+'/benchmarks.json',JSON.stringify(result,null,2));
await fs.writeFile(out+'/benchmarks.csv','id,tool,data_type,before_tokens,after_tokens,saving_pct,verified\n'+cases.map(c=>[c.id,c.tool,JSON.stringify(c.dataType),c.beforeTokens,c.afterTokens,c.savingPct,c.verified].join(',')).join('\n')+'\n');
console.log(JSON.stringify({complete:true,cases:cases.length,primary:cases.filter(c=>c.primary).map(c=>({id:c.id,before:c.beforeTokens,after:c.afterTokens,saving:c.savingPct})),file:out+'/benchmarks.json'}));
