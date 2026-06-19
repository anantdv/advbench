import { spawn } from 'node:child_process';

const api = spawn(process.execPath, ['scripts/erpnext-api.mjs'], {
  stdio: 'inherit',
});

const vite = spawn('npm', ['run', 'dev:vite'], {
  stdio: 'inherit',
  shell: true,
});

const shutdown = () => {
  api.kill('SIGTERM');
  vite.kill('SIGTERM');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

vite.on('exit', (code) => {
  api.kill('SIGTERM');
  process.exit(code ?? 0);
});

api.on('exit', (code) => {
  vite.kill('SIGTERM');
  process.exit(code ?? 0);
});
