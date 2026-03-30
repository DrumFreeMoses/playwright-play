const express = require('express');
const path = require('path');
const fs = require('fs');
const { runAssessment } = require('./assess');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  app.post('/api/assess', async (req, res) => {
    const { url, weights } = req.body || {};
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

function startServer(desiredPort = 43210, options = {}) {
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

      srv.on('error', (err) => reject(err));
    } catch (e) {
      reject(e);
    }
  });
}

if (require.main === module) {
  const port = process.env.PORT ? Number(process.env.PORT) : 43210;
  startServer(port, { }).then(({ port }) => {
    console.log(`MoSight running: http://localhost:${port}`);
    console.log(JSON.stringify({ port }));
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { createApp, startServer };
