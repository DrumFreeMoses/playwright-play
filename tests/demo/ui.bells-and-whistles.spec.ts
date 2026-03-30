import { test, expect } from '@playwright/test';
import { startApp } from '../helpers/server-control';

test('UI bells and whistles', async ({ page }) => {
  const app = await startApp(0);
  const info = test.info();
  const context = page.context();

  // Start tracing for demonstration
  // @ts-ignore - tracing available on context
  await context.tracing.start({ screenshots: true, snapshots: true });

  await page.goto(app.baseURL);
  await expect(page).toHaveTitle(/MoSight/i);

  // Demonstrate network mocking for a nonexistent asset
  await page.route('**/nonexistent.css', route => route.fulfill({ status: 200, body: 'body{}', headers: { 'content-type': 'text/css' } }));

  // Take a screenshot artifact
  await page.screenshot({ path: info.outputPath('home.png') });

  // Stop tracing and save
  // @ts-ignore
  await context.tracing.stop({ path: info.outputPath('trace.zip') });

  await app.stop();
});
