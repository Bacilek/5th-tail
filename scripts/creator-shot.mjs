// Screenshot of the character creator with the live 3D preview. Needs a build.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4191;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(`http://localhost:${PORT}/`);
await wait(1500);
await page.click('#tnew'); await wait(500);
await page.click('.sw[data-k="female"] .opt >> nth=1'); await page.click('.sw[data-k="hairStyle"] .opt >> nth=2'); await page.click('.sw[data-k="cloth"] .opt >> nth=3');
await wait(2500);
await page.screenshot({ path: 'docs/shots/creator.png' });
console.log('errors', errs.length ? errs.join(' | ') : 'none');
await browser.close(); server.kill();
process.exit(0);
