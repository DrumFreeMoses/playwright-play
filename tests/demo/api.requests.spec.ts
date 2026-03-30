import { test, expect } from '@playwright/test';
import { startApp } from '../helpers/server-control';

test('API root serves the UI', async ({ request }) => {
  const app = await startApp(0);
  const r = await request.get(`${app.baseURL}/`);
  expect(r.status()).toBe(200);
  const text = await r.text();
  expect(text).toContain('MoSight');
  await app.stop();
});
