// Flight Field screenshots (aeries + vale). Needs a build. Usage: node scripts/field-shot.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4192;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`http://localhost:${PORT}/`);
await wait(1200);
await page.click('#tnew'); await wait(300);
await page.click('#ccgo'); await wait(300);
await page.keyboard.press('Digit2'); await wait(800);
const shots = [['village', -90, 100, 0, 0.2], ['smithy', -90, 72, 0, 0.2]];
for (const [n, x, z, yaw, pitch] of shots) {
  await page.evaluate(([x, z, yaw, pitch]) => { const g = window.__game; g.input.locked = true; g.player.thirdPerson = true; g.teleport(x, z); g.player.yaw = yaw; g.player.pitch = pitch; }, [x, z, yaw, pitch]);
  await wait(3000);
  await page.screenshot({ path: `docs/shots/field-${n}.png` });
}
console.log('errors', errs.length ? errs.join(' | ') : 'none');
await browser.close(); server.kill();
process.exit(0);
