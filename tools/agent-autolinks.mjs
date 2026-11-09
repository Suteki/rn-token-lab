import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const options = {cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024};
const producer = spawnSync('rtk', ['proxy', 'npx', '--no-install', 'react-native', 'config'], options);
if (producer.error) throw producer.error;
if (producer.stderr) process.stderr.write(producer.stderr);
if (producer.status !== 0) process.exit(producer.status ?? 1);

const filter = spawnSync('rtk', ['proxy', 'jq', '-c', '-f', 'tools/jq/autolink.jq'], {
  ...options,
  input: producer.stdout,
});
if (filter.error) throw filter.error;
if (filter.stderr) process.stderr.write(filter.stderr);
if (filter.stdout) process.stdout.write(filter.stdout);
process.exitCode = filter.status ?? 1;
