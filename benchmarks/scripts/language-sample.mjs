import {getEncoding} from 'js-tiktoken';
const samples=[
 {id:'navigation',task:'Navigation calls',en:'Find every navigation.navigate call in src/screens. Return file paths and line numbers.',uk:'Знайди всі виклики navigation.navigate у src/screens. Поверни шляхи файлів і номери рядків.'},
 {id:'autolinking',task:'Native modules',en:'Check the eight native modules from React Native config. Return each module name and whether iOS and Android are supported.',uk:'Перевір вісім нативних модулів із React Native config. Поверни назву кожного модуля та чи підтримуються iOS і Android.'},
 {id:'validation',task:'Zod validation',en:'In src/domain/task.ts, find both Zod object schemas. Return their names and required fields. Do not change files.',uk:'У src/domain/task.ts знайди обидві Zod object-схеми. Поверни їхні назви й обов’язкові поля. Не змінюй файли.'},
 {id:'command',task:'Identical command',en:'rtk proxy node tools/agent-autolinks.mjs',uk:'rtk proxy node tools/agent-autolinks.mjs'}
];
const enc=getEncoding('o200k_base'),alt=getEncoding('cl100k_base');
console.log(JSON.stringify({note:'Local token counts of manually matched RN task prompts. No model output, quality, provider usage, or billing measured. Translation wording affects counts; no universal language multiplier is claimed.',tokenizer:'js-tiktoken 1.0.21',samples:samples.map(s=>({...s,o200k_base:{en:enc.encode(s.en).length,uk:enc.encode(s.uk).length},cl100k_base:{en:alt.encode(s.en).length,uk:alt.encode(s.uk).length}}))},null,2));
