import {getEncoding} from 'js-tiktoken';

// Both variants request the same fields; this example measures wording only.
// It replaces the earlier bilingual sample to keep repository content in English.
const samples = [
  {
    id: 'navigation',
    task: 'Navigation calls',
    concise: 'Find every navigation.navigate call in src/screens. Return file paths and line numbers.',
    expanded: 'Please inspect the files in src/screens and find every call to navigation.navigate. For each call that you find, return its file path and line number.',
  },
  {
    id: 'autolinking',
    task: 'Native modules',
    concise: 'Check the eight native modules from React Native config. Return each module name and whether iOS and Android are supported.',
    expanded: 'Please check the React Native configuration for the eight native modules. For every module, provide its name and indicate whether it supports iOS and whether it supports Android.',
  },
  {
    id: 'validation',
    task: 'Zod validation',
    concise: 'In src/domain/task.ts, find both Zod object schemas. Return their names and required fields. Do not change files.',
    expanded: 'Please read src/domain/task.ts and locate both Zod object schemas defined there. For each schema, return its name and list its required fields. Leave all files unchanged.',
  },
  {
    id: 'command',
    task: 'Identical command control',
    concise: 'rtk proxy node tools/agent-autolinks.mjs',
    expanded: 'rtk proxy node tools/agent-autolinks.mjs',
  },
];
const enc = getEncoding('o200k_base');
const alt = getEncoding('cl100k_base');
console.log(JSON.stringify({
  note: 'Local token counts of concise and expanded English RN task prompts. No model output, answer quality, provider usage or billing measured. This does not reproduce the former bilingual sample or establish a universal language multiplier.',
  tokenizer: 'js-tiktoken 1.0.21',
  samples: samples.map(sample => ({
    ...sample,
    o200k_base: {concise: enc.encode(sample.concise).length, expanded: enc.encode(sample.expanded).length},
    cl100k_base: {concise: alt.encode(sample.concise).length, expanded: alt.encode(sample.expanded).length},
  })),
}, null, 2));
