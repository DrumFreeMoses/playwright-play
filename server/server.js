const express = require('express');
const path = require('path');
const fs = require('fs');
const { runAssessment } = require('./assess');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  app.post('/api/assess', async (req, res) => {
    const { url, weights } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });
    try {
      const report = await runAssessment(url, weights);
      res.json(report);
    } catch (err) {
      console.error('Assessment failed:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/reports/:file', (req, res) => {
    const file = path.join(__dirname, 'reports', req.params.file);
    if (fs.existsSync(file)) return res.sendFile(file);
    res.status(404).send('Report not found');
  });

  return app;
}

/**
 * Start the HTTP server.
 * @param {number} desiredPort - port to bind (0 for ephemeral)
 * @param {object} options - { fallbackOnEaddrinuse: boolean, host?: string }
 * @returns {Promise<{server: import('http').Server, port:number, stop:()=>Promise<void>}>}
 */
function startServer(desiredPort = 0, options = {}) {
  const fallbackOnEaddrinuse = !!options.fallbackOnEaddrinuse;
  const host = options.host || undefined;
  return new Promise((resolve, reject) => {
    try {
      const app = createApp();
      const srv = app.listen(desiredPort, host, () => {
        const address = srv.address();
        const boundPort = address && address.port ? address.port : desiredPort;
        const stop = () => new Promise((res, rej) => srv.close(err => err ? rej(err) : res()));
        resolve({ server: srv, port: boundPort, stop });
      });

      srv.on('error', async (err) => {
        if (err && err.code === 'EADDRINUSE' && fallbackOnEaddrinuse && desiredPort !== 0) {
          console.warn(`Port ${desiredPort} in use; retrying on an ephemeral port`);
          try {
            const result = await startServer(0, { fallbackOnEaddrinuse: false, host });
            resolve(result);
          } catch (e) {
            reject(e);
          }
          return;
        }
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { createApp, startServer };