import fs from 'node:fs';
const [file,code='0']=process.argv.slice(2);
process.stdout.write(fs.readFileSync(file));
process.exitCode=Number(code);
