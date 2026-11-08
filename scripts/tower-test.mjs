// Renders several created characters in third person + checks the tower stair surface.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4183;
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
await page.evaluate(() => { const g = window.__game; g.input.locked = true; g.player.thirdPerson = true; g.teleport(22, -20); g.player.yaw = -Math.PI / 2; g.player.pitch = 0.45; });
await wait(2500);
await page.screenshot({ path: 'docs/shots/tower-a.png' });
// climb: teleport to mid stair and let physics hold the player
await page.evaluate(() => { const g = window.__game, T = g.TOWER; const y = g.towerStairAt(T.x + 0, T.z + 7.6, 40, 0.5); g.player.pos.set(T.x, y + 0.1, T.z + 7.6); g.player.vel.set(0, 0, 0); });
await wait(1500);
console.log('on stair y', await page.evaluate(() => [window.__game.player.pos.y, window.__game.player.grounded]));
await page.screenshot({ path: 'docs/shots/tower-b.png' });
await browser.close(); server.kill();
process.exit(0);
