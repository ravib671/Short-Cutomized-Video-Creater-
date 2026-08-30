import { spawn } from 'node:child_process';

const processes = [
  spawn(process.execPath, ['server/index.js'], { stdio: 'inherit' }),
  spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--host', '0.0.0.0'], { stdio: 'inherit' }),
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
