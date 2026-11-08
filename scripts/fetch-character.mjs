// Downloads the CC0 "Universal Base Characters [Standard]" zip from itch.io (Quaternius) via headless Chrome.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
await new Promise((r) => setTimeout(r, Number(process.env.DELAY ?? 0)));
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
await page.goto('https://quaternius.itch.io/universal-base-characters', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
console.log('title:', await page.title());
await page.getByText(/Download Now/i).first().click();
await page.waitForTimeout(2500);
const nothanks = page.getByText(/No thanks, just take me to the downloads/i).first();
if (await nothanks.count()) await nothanks.click();
await page.waitForTimeout(3000);
console.log('url', page.url()); console.log((await page.locator('body').innerText()).replace(/s+/g,' ').slice(0,700)); await page.screenshot({path:'docs/shots/itch.png'});
const rows = await page.locator('.upload').allTextContents();
console.log('uploads:', rows.map((r) => r.replace(/\s+/g, ' ').slice(0, 90)));
const row = page.locator('.upload').filter({ hasText: /Standard/i }).first();
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 600000 }),
  row.locator('a.download_btn, .download_btn, a.button').first().click(),
]);
console.log('downloading', download.suggestedFilename());
await download.saveAs('assets/incoming/universal-base-characters.zip');
console.log('saved', fs.statSync('assets/incoming/universal-base-characters.zip').size);
await browser.close();
