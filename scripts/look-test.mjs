// Renders several created characters in third person + checks the tower stair surface.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4181;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://localhost:${PORT}/`);
await wait(1200);
await page.click('#tnew'); await wait(300);
await page.click('#ccgo'); await wait(300);
await page.keyboard.press('Digit2');
await wait(1000);
await page.evaluate(() => { window.__game.input.locked = true; });
const looks = [
  { name: 'A', female: true, skin: 0x6e4a32, hair: 0xd8c070, hairStyle: 'long', cloth: 0x3a1a1a },
  { name: 'B', female: false, skin: 0xf1d3b8, hair: 0x8a2a1e, hairStyle: 'buns', beard: true, cloth: 0x1f3a2a },
  { name: 'C', female: true, skin: 0x4a3022, hair: 0xc8c8d0, hairStyle: 'bald', cloth: 0x2a3a4a },
  { name: 'D', female: false, skin: 0xc08e6a, hair: 0x0e0a08, hairStyle: 'buzzed', beard: true, cloth: 0x3a2a4a },
];
let i = 0;
for (const l of looks) {
  await page.evaluate((look) => { const g = window.__game; g.player.applyLook(look); g.teleport(0, 10); g.player.yaw = Math.PI; g.player.thirdPerson = true; g.input.locked = true; }, l);
  await wait(2500);
  await page.screenshot({ path: `docs/shots/look-${i++}.png` });
}
const st = await page.evaluate(() => { const g = window.__game; const T = g.TOWER; const out = []; for (const [dx, dz, y] of [[-7.6, 0, 10], [-7.6, 0, 10.5], [0, 7.6, 10], [0, 7.6, 40], [7.6, 0, 61], [-7.6, 0, 61.7]]) out.push(g.towerStairAt(T.x + dx, T.z + dz, y, 0.5)); return out; });
console.log('stair', JSON.stringify(st));
console.log('errors:', errors.length ? [...new Set(errors)].join(' | ') : 'none');
await browser.close();
server.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }
process.exit(0);
