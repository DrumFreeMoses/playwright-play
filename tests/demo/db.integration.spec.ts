import { test, expect } from '@playwright/test';
import { startApp } from '../helpers/server-control';
import fs from 'fs';
import path from 'path';

test('Report persistence (filesystem DB)', async ({ request }) => {
  const app = await startApp(0);
  const res = await request.post(`${app.baseURL}/api/assess`, { data: { url: `${app.baseURL}/testpages/simple.html` } });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.execSummary).toBeDefined();

  const jsonFile = body.meta && body.meta.jsonFile;
  const reportsDir = path.join(process.cwd(), 'server', 'reports');
  const filePath = path.join(reportsDir, jsonFile || '');

  // Wait briefly for file I/O to settle
  await new Promise((r) => setTimeout(r, 500));

  expect(fs.existsSync(filePath)).toBeTruthy();

  await app.stop();
});
