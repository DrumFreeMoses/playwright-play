#!/usr/bin/env node
const { exec } = require('child_process');
const port = process.argv[2] || 3000;

exec(`lsof -ti tcp:${port}`, (err, stdout) => {
  if (err) {
    console.error('Error running lsof:', err.message || err);
    process.exit(1);
  }
  const pids = stdout.split(/\s+/).filter(Boolean);
  if (!pids.length) {
    console.log(`No process found on port ${port}`);
    process.exit(0);
  }
  pids.forEach(pid => {
    try {
      process.kill(Number(pid), 'SIGTERM');
      console.log(`Killed PID ${pid} on port ${port}`);
    } catch (e) {
      console.error('Failed to kill PID', pid, e.message || e);
    }
  });
});
