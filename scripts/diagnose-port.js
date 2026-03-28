#!/usr/bin/env node
const { exec } = require('child_process');
const port = process.argv[2] || 3000;

exec(`lsof -i tcp:${port} -sTCP:LISTEN -P -n`, (err, stdout, stderr) => {
  if (err) {
    if (stderr) console.error(stderr);
    console.error('Error running lsof:', err.message || err);
    process.exit(1);
  }
  if (!stdout.trim()) {
    console.log(`No process listening on port ${port}`);
    process.exit(0);
  }
  console.log(stdout);
});
