#!/usr/bin/env node
const { startServer } = require('./server');

const requestedPort = process.env.PORT ? Number(process.env.PORT) : 43210; // use stable nonstandard port by default // 0 = ephemeral port
const fallback = process.env.FALLBACK_TO_EPHEMERAL === '1' || process.env.FALLBACK_TO_EPHEMERAL === 'true';

startServer(requestedPort, { fallbackOnEaddrinuse: fallback })
  .then(({ port, server, stop }) => {
    console.log(`MoSight running: http://localhost:${port}`);
    // Emit a machine-readable line so spawned processes (tests) can parse the bound port
    console.log(JSON.stringify({ port }));
    const shutdown = () => {
      console.log('Shutting down MoSight server...');
      stop().then(() => process.exit(0)).catch(() => process.exit(1));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch(err => {
    console.error('Failed to start MoSight server:', err && err.message ? err.message : err);
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${requestedPort} already in use. To fallback to an ephemeral port set FALLBACK_TO_EPHEMERAL=1`);
    }
    process.exit(1);
  });
