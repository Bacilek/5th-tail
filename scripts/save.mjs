// Save/load test: play a bit, save, reload the page, load the character tile and compare state.
// Usage: npm run build && node scripts/save.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4176;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1100, height: 700 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(`http://localhost:${PORT}/`);
await wait(1200);
await page.click('#tnew');
await wait(300);
await page.fill('#ccname', 'Tester');
await page.click('#ccgo');
await wait(300);
await page.keyboard.press('Digit2'); // Infantry
await wait(1500);

await page.evaluate(() => {
  const g = window.__game;
  g.teleport(10, -80);
  g.startQuest('q_venin');
  g.give(0, 'sword');
  g.setHour(15.5);
  g.player.health = 61;
});
await wait(500);
const before = await page.evaluate(() => { const d = window.__game.snapshot(); return { x: d.player.x.toFixed(1), z: d.player.z.toFixed(1), hp: Math.round(d.player.health), hand0: d.player.hands[0], quests: d.quests.entries.map((e) => e[0] + ':' + e[1].status).join(','), hour: d.hour.toFixed(1), cls: d.classId }; });
console.log('before', JSON.stringify(before));
const saved = await page.evaluate(() => window.__game.saveGame());
console.log('saved', saved);

await page.reload();
await wait(1200);
console.log('continue enabled:', await page.evaluate(() => !document.querySelector('#tcont').disabled));
await page.click('#tcont');
await wait(500);
const tiles = await page.evaluate(() => document.querySelectorAll('.cctile').length);
console.log('tiles', tiles);
await page.click('.cctile');
await wait(1500);
const after = await page.evaluate(() => { const d = window.__game.snapshot(); return { x: d.player.x.toFixed(1), z: d.player.z.toFixed(1), hp: Math.round(d.player.health), hand0: d.player.hands[0], quests: d.quests.entries.map((e) => e[0] + ':' + e[1].status).join(','), hour: d.hour.toFixed(1), cls: d.classId }; });
console.log('after ', JSON.stringify(after));
const same = ['x', 'z', 'hp', 'hand0', 'quests', 'cls'].every((k) => String(before[k]) === String(after[k]));
console.log(same ? 'SAVE/LOAD OK' : 'SAVE/LOAD MISMATCH');

// pause menu
await page.evaluate(() => document.exitPointerLock());
await wait(500);
console.log('pause visible:', await page.evaluate(() => !!document.querySelector('#pause')));

await browser.close();
server.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }
console.log('errors:', errors.length ? [...new Set(errors)].join(' | ') : 'none');
process.exit(same && !errors.length ? 0 : 1);
