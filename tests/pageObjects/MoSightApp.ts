import { Page } from '@playwright/test';

export default class MoSightApp {
  readonly page: Page;
  constructor(page: Page) { this.page = page; }
  // Accept an optional base URL so tests can navigate to a programmatically-started server
  async goto(base?: string) { const url = base ? base : '/'; await this.page.goto(url); }
  async setUrl(url: string) { await this.page.fill('#url', url); }
  // For range sliders we update the value and dispatch an input event
  async setSlider(name: string, value: number) { await this.page.locator(`input[name="${name}"]`).evaluate((el, v) => { (el as HTMLInputElement).value = String(v); el.dispatchEvent(new Event('input')); }, value); }
  async run() {
    await Promise.all([
      this.page.waitForResponse(response => response.url().includes('/api/assess') && response.status() === 200),
      this.page.click('#run')
    ]);
  }
  async getOverallScore() {
    return await this.page.textContent('.overall-score');
  }
}
