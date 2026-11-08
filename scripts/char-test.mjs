// Creates two characters in sequence and prints stored looks (first must stay unchanged). Needs a build.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4186;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
await page.goto(`http://localhost:${PORT}/`);
await wait(1200);
const dump = async (tag) => console.log(tag, await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('5thtail.characters.v1') || '[]').map((c) => [c.id, c.look.name, c.look.hair, c.look.hairStyle, c.look.female, c.look.cloth]))));
const create = async (name, hairIdx, style) => {
  await page.click('#tnew'); await wait(300);
  await page.fill('#ccname', name);
  await page.click(`.sw[data-k="hair"] .opt >> nth=${hairIdx}`);
  await page.click(`.sw[data-k="hairStyle"] .opt >> nth=${style}`);
  await page.click('#ccgo'); await wait(300);
  await page.keyboard.press('Digit2'); await wait(800);
};
await create('Alpha', 0, 0);
await dump('after A');
await page.evaluate(() => { const g = window.__game; g.saveGame(); });
await page.reload(); await wait(1200);
await create('Beta', 3, 2);
await dump('after B');
await page.evaluate(() => { const g = window.__game; g.saveGame(); });
await page.reload(); await wait(1500);
await page.evaluate(() => window.__game.saveGame());
await page.reload(); await wait(1500);
await page.click('#tnew'); await wait(300);
const bg = () => page.evaluate(() => [document.querySelector('.cctile .pf').style.background, document.querySelector('.ccrow .pf').style.background]);
console.log('before', await bg());
await page.click('.sw[data-k="hair"] .opt >> nth=5'); await wait(200);
console.log('after hair change (tile must stay, preview must change)', await bg());
await browser.close(); server.kill();
process.exit(0);
