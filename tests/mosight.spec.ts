import { test, expect } from '@playwright/test';
import MoSightApp from './pageObjects/MoSightApp';

const { startServer } = require('../server/server');

let serverHandle: { port: number; stop: () => Promise<void> } | null = null;

test.describe('MoSight demo app', () => {
  test.beforeAll(async () => {
    // Start server on an ephemeral port for test isolation
    serverHandle = await startServer(0, { fallbackOnEaddrinuse: true });
  });

  test.afterAll(async () => {
    if (serverHandle) await serverHandle.stop();
  });

  test('UI runs assessment', async ({ page }) => {
    const base = `http://localhost:${serverHandle?.port}`;
    // navigate to the app served by the programmatic server
    await page.goto(base);
    const app = new MoSightApp(page);
    await app.setUrl('https://example.com');
    await app.run();
    const overall = await app.getOverallScore();
    expect(overall).toBeTruthy();
  });
});
