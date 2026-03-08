import { describe, it, expect, afterAll, beforeAll, beforeEach, afterEach } from 'vitest';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { spawn, type ChildProcess } from 'child_process';

async function waitForUrl(url: string, timeoutMs: number = 30_000) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch {
      // ignore until timeout
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for ${url}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

const consoleErrorMap = new WeakMap<Page, string[]>();

// These tests require a running dev server and the Playwright test runner.
// They are intentionally skipped when executed via `vitest run`.
// Run them with: npx playwright test
describe.skip('E2E Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let devServer: ChildProcess | null = null;
  const baseUrl = 'http://127.0.0.1:5173';

  beforeAll(async () => {
    devServer = spawn(
      'npm',
      ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
      { shell: true }
    );
    await waitForUrl(baseUrl);
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
    if (devServer) {
      devServer.kill();
      devServer = null;
    }
  });

  beforeEach(async () => {
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto(baseUrl);

    consoleErrorMap.set(page, consoleErrors);
  });

  afterEach(async () => {
    const consoleErrors = consoleErrorMap.get(page) ?? [];
    const hookOrderErrors = consoleErrors.filter((t) =>
      /Rendered more hooks than during the previous render|Rules of Hooks/i.test(t)
    );
    expect(hookOrderErrors, `Console hook-order errors:\n${hookOrderErrors.join('\n')}`).toEqual([]);

    await page.close();
    await context.close();
  });

  it('loads the application', async () => {
    await page.waitForSelector('h1');
    const title = await page.textContent('h1');
    expect(title).toBe('Mashup Manager');
  });

  it('can add a new song', async () => {
    await page.click('button:has-text("Add Song")');
    await page.waitForSelector('input[placeholder="Enter song title"]');

    await page.fill('input[placeholder="Enter song title"]', 'E2E Test Song');
    await page.fill('input[placeholder="Enter artist name"]', 'E2E Test Artist');

    await page.locator('select').filter({ hasText: 'Select PART' }).first().selectOption({ label: 'Intro' });
    await page.fill('input[placeholder="Enter BPM"]', '120');
    await page.locator('select').filter({ hasText: 'Select key' }).first().selectOption({ label: 'C Major' });

    await page.click('button:has-text("Save Song")');

    await page.waitForSelector('text=E2E Test Song');
    expect(await page.textContent('text=E2E Test Song')).toBeTruthy();
  });

  it('can edit a song from the Actions column and from Song Details without hook-order errors', async () => {
    const songTitle = 'E2E Edit Flow Song';

    // Add a song first (ensures a known target exists)
    await page.click('button:has-text("Add Song")');
    await page.waitForSelector('input[placeholder="Enter song title"]');
    await page.fill('input[placeholder="Enter song title"]', songTitle);
    await page.fill('input[placeholder="Enter artist name"]', 'E2E Artist');
    await page.locator('select').filter({ hasText: 'Select PART' }).first().selectOption({ label: 'Intro' });
    await page.fill('input[placeholder="Enter BPM"]', '128');
    await page.locator('select').filter({ hasText: 'Select key' }).first().selectOption({ label: 'C Major' });
    await page.click('button:has-text("Save Song")');
    await page.waitForSelector(`text=${songTitle}`);

    const row = page.locator('tr', { hasText: songTitle }).first();

    // Edit from Actions column
    await row.locator('button[title="Edit song"]').click();
    await page.getByRole('heading', { name: 'Edit Song' }).waitFor();
    await page.locator('button[aria-label="Close"]').first().click();

    // Open Song Details (row click) then Edit Song
    await row.click();
    await page.waitForSelector('text=Song Details');
    await page.click('button:has-text("Edit Song")');
    await page.getByRole('heading', { name: 'Edit Song' }).waitFor();
  });
});