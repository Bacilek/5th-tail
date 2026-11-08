// Gauntlet check: screenshot of the climb section + standing on the beam. Needs a build.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4189;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
await page.goto(`http://localhost:${PORT}/`);
await wait(1200);
await page.click('#tnew'); await wait(300);
await page.click('#ccgo'); await wait(300);
await page.keyboard.press('Digit2'); await wait(800);
await page.evaluate(() => { const g = window.__game; g.input.locked = true; g.player.thirdPerson = true; g.teleport(150, -22); g.player.yaw = -Math.PI / 2; g.player.pitch = 0.25; });
await wait(3000);
await page.screenshot({ path: 'docs/shots/gauntlet-a.png' });
await page.evaluate(() => { const g = window.__game; g.player.pos.set(178, 58.5 + 8.4, -22); g.player.vel.set(0, 0, 0); g.player.pitch = 0.1; });
await wait(2500);
console.log('on beam', await page.evaluate(() => { const p = window.__game.player; return [p.pos.y - 58.5, p.grounded]; }));
await page.screenshot({ path: 'docs/shots/gauntlet-b.png' });
await browser.close(); server.kill();
process.exit(0);
