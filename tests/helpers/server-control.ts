export async function startApp(desiredPort = 0) {
  // Start the app programmatically using the server's startServer helper
  const { startServer } = require('../../server/index');
  const result = await startServer(desiredPort, { fallbackOnEaddrinuse: true });
  return { port: result.port, baseURL: `http://localhost:${result.port}`, stop: result.stop };
}
