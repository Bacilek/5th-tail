// Walks up the Conscription Tower stair with held W, steering along the spiral; reports height progress. Needs a build.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4184;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto(`http://localhost:${PORT}/`);
await wait(1200);
await page.click('#tnew'); await wait(300);
await page.click('#ccgo'); await wait(300);
await page.keyboard.press('Digit2'); await wait(500);
await page.evaluate(() => { const g = window.__game, T = g.TOWER; g.input.locked = true; g.player.pos.set(T.x - 7.6, 10, T.z + 0.5); g.player.vel.set(0, 0, 0); });
await page.keyboard.down('KeyW');
let last = -1, same = 0;
for (let i = 0; i < 400; i++) {
  const s = await page.evaluate(() => {
    const g = window.__game, T = g.TOWER, p = g.player;
    const dx = p.pos.x - T.x, dz = p.pos.z - T.z, a = Math.atan2(dz, dx), r = Math.hypot(dx, dz);
    const tx = -Math.sin(a), tz = Math.cos(a), ix = -dx / r * 0.25 * (r - 7.6), iz = -dz / r * 0.25 * (r - 7.6);
    p.yaw = Math.atan2(-(tx + ix), -(tz + iz));
    return [p.pos.y, r, p.pos.x - T.x, p.pos.z - T.z, p.yaw];
  });
  if (i % 4 === 0) console.log(i, s.map((v) => v.toFixed(2)).join(" "));
  if (Math.abs(s[0] - last) < 0.01) { if (++same > 60) { console.log('STUCK at', s); break; } } else same = 0;
  last = s[0];
  if (s[0] > 60) { console.log('TOP', s); break; }
  await wait(250);
}
await browser.close(); server.kill();
process.exit(0);
