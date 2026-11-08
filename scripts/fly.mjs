// Flight test: broom and dragon, including collision against the Citadel hall and a roof.
// Usage: npm run build && node scripts/fly.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4175;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://localhost:${PORT}/`);
await wait(1500);
await page.click('#ccgo');
await page.keyboard.press('Digit1');
await page.setViewportSize({ width: 360, height: 200 });
await wait(1000);

const st = () => page.evaluate(() => { const p = window.__game.player; return `(${p.pos.x.toFixed(1)},${p.pos.y.toFixed(1)},${p.pos.z.toFixed(1)})`; });
const tp = (x, z, yaw = 0) => page.evaluate(([x, z, yaw]) => { const g = window.__game; g.teleport(x, z); g.player.yaw = yaw; }, [x, z, yaw]);
const EAST = -Math.PI / 2;

// --- broom: take off over the lower courtyard, fly east into the Citadel hall walls
await tp(60, -10, EAST);
await wait(500);
await page.keyboard.press('KeyB');
await wait(600);
console.log('broom mounted at', await st());
await page.keyboard.down('KeyW');
await page.keyboard.down('ShiftLeft');
for (let i = 0; i < 24; i++) { await wait(700); if (i % 3 === 0) console.log('broom', await st()); }
await page.keyboard.up('ShiftLeft');
await page.keyboard.up('KeyW');
console.log('broom end', await st());
await page.keyboard.press('KeyB');
await wait(500);

// --- dragon: bond, summon, mount, fly
await page.evaluate(() => window.__game.bond(0));
await tp(0, 20, 0);
await wait(500);
await page.keyboard.press('KeyR');
await wait(36000);
await tp(0, 12, 0);
await wait(400);
await page.keyboard.press('KeyF');
await wait(800);
console.log('dragon mounted?', await page.evaluate(() => document.querySelector('#drg')?.textContent), await st());
await page.keyboard.down('KeyW');
for (let i = 0; i < 10; i++) { await wait(700); if (i % 3 === 0) console.log('dragon', await st()); }
await page.keyboard.up('KeyW');

await browser.close();
server.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }
console.log('errors:', errors.length ? [...new Set(errors)].join(' | ') : 'none');
process.exit(0);
