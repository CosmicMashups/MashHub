import { describe, it, expect, afterAll, beforeAll, beforeEach, afterEach } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright';

describe('E2E Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:5173');
  });

  afterEach(async () => {
    await page.close();
  });

  it('loads the application', async () => {
    await page.waitForSelector('h1');
    const title = await page.textContent('h1');
    expect(title).toBe('Mashup Manager');
  });

  it('can add a new song', async () => {
    await page.click('button:has-text("Add Song")');
    await page.waitForSelector('input[name="title"]');
    
    await page.fill('input[name="title"]', 'E2E Test Song');
    await page.fill('input[name="artist"]', 'E2E Test Artist');
    await page.fill('input[name="bpms"]', '120');
    await page.fill('input[name="keys"]', 'C Major');
    
    await page.click('button:has-text("Save")');
    
    await page.waitForSelector('text=E2E Test Song');
    expect(await page.textContent('text=E2E Test Song')).toBeTruthy();
  });
});