// Combat test: light attack, power attack (hold), block and bash against a spawned enemy.
// Usage: npm run build && node scripts/combat.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4180;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
const errors = [];
page.on('console', (m) => { if (m.text().startsWith('humanoid')) console.log(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://localhost:${PORT}/`);
await wait(1200);
await page.click('#tnew'); await wait(300);
await page.click('#ccgo'); await wait(300);
await page.keyboard.press('Digit2'); // Infantry: dagger + sword
await wait(800);
await page.setViewportSize({ width: 800, height: 520 });
await page.evaluate(() => { window.__game.input.locked = true; });

await page.evaluate(() => { const g = window.__game; g.teleport(0, 10); g.player.yaw = 0; g.player.thirdPerson = true; g.input.locked = true; });
await wait(2500);
await page.screenshot({ path: 'docs/shots/model-idle.png' });
await page.evaluate(() => { const g = window.__game; g.player.thirdPerson = false; g.teleport(0, 26); g.player.yaw = 0; g.spawnEnemy(-3, 14, 'venin'); g.spawnEnemy(3, 14, 'soldier'); g.spawnEnemy(0, 8, 'brute'); g.spawnEnemy(7, 10, 'archer'); });
await wait(3500);
await page.screenshot({ path: 'docs/shots/enemies-a.png' });
await wait(6000);
await page.screenshot({ path: 'docs/shots/enemies-b.png' });
console.log('errors:', errors.length ? [...new Set(errors)].join(' | ') : 'none');
await browser.close();
server.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }
process.exit(0);
