import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

const processes = [
  spawn(process.execPath, [path.join(projectRoot, 'server', 'index.js')], {
    cwd: projectRoot,
    stdio: 'inherit',
  }),
  // Launch the Vite JavaScript entry point with Node instead of spawning
  // `npx.cmd`, which throws spawn EINVAL on some Windows/Node combinations.
  spawn(process.execPath, [viteCli, '--host', '0.0.0.0'], {
    cwd: projectRoot,
    stdio: 'inherit',
  }),
];

let stopping = false;
function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  for (const child of processes) child.kill(signal);
}

for (const child of processes) {
  child.on('error', error => {
    console.error(`Unable to start a development process: ${error.message}`);
    stop();
    process.exitCode = 1;
  });
  child.on('exit', code => {
    if (!stopping && code) process.exitCode = code;
    stop();
  });
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
