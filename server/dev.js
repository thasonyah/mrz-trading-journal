import { spawn } from 'node:child_process';

const children = [
  spawn('node', ['server/index.js'], { stdio: 'inherit', shell: false }),
  spawn('npx', ['vite', '--host', '127.0.0.1'], { stdio: 'inherit', shell: false })
];

function stop(code = 0) {
  children.forEach((child) => {
    if (!child.killed) child.kill('SIGTERM');
  });
  process.exit(code);
}

children.forEach((child) => child.on('exit', (code) => {
  if (code && code !== 0) stop(code);
}));

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
