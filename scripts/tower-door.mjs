// Walks into the Conscription Tower ground floor through the south door. Needs a build.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4187;
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
await page.evaluate(() => { const g = window.__game, T = g.TOWER; g.input.locked = true; g.player.thirdPerson = true; g.teleport(T.x, T.z + 10); g.player.yaw = 0; g.player.pitch = 0.1; });
await wait(2500);
await page.screenshot({ path: 'docs/shots/tower-door-a.png' });
await page.keyboard.down('KeyW');
for (let i = 0; i < 20; i++) { await wait(500); }
await page.keyboard.up('KeyW');
console.log('pos', await page.evaluate(() => { const g = window.__game, p = g.player; return [p.pos.x - g.TOWER.x, p.pos.y, p.pos.z - g.TOWER.z]; }));
await page.evaluate(() => { window.__game.player.thirdPerson = false; });
await wait(1500);
await page.screenshot({ path: 'docs/shots/tower-door-b.png' });
await browser.close(); server.kill();
process.exit(0);
