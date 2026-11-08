// Combat test: light attack, power attack (hold), block and bash against a spawned enemy.
// Usage: npm run build && node scripts/combat.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4178;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://localhost:${PORT}/`);
await wait(1200);
await page.click('#tnew'); await wait(300);
await page.click('#ccgo'); await wait(300);
await page.keyboard.press('Digit2'); // Infantry: dagger + sword
await wait(800);
await page.setViewportSize({ width: 320, height: 180 });
await page.evaluate(() => { window.__game.input.locked = true; });

const click = (button, ms) => page.mouse.down({ button }).then(() => wait(ms)).then(() => page.mouse.up({ button }));
const info = () => page.evaluate(() => { const g = window.__game, p = g.player; return { php: Math.round(p.health), stam: Math.round(p.stamina), enemies: g.combat.enemies.filter((e) => e.alive).map((e) => `${e.kind}:${Math.round(e.hp)}`).slice(-4).join(',') }; });
const reset = () => page.evaluate(() => { const g = window.__game; for (const e of g.combat.enemies) e.hp = 0, e.alive = false; g.teleport(0, -60); g.player.yaw = 0; g.player.health = 100; g.player.stamina = 125; g.player.alive = true; });

await reset();
await page.evaluate(() => { window.__game.give(0, 'bow'); window.__game.spawnEnemy(0, -76, 'brute'); });
await wait(400);
console.log('before bow  ', JSON.stringify(await info()));
await click('left', 4800); // draw ~0.9 game-seconds at the slow software frame rate
await wait(3500);
console.log('after bow   ', JSON.stringify(await info()));

await reset();
await page.evaluate(() => { window.__game.spawnEnemy(0, -80, 'archer'); });
await wait(14000);
console.log('archer fight', JSON.stringify(await info()), '(php may drop from arrows)');

await reset();
await page.evaluate(() => { const g = window.__game; g.spawnEnemy(-3, -66, 'wolf'); g.spawnEnemy(3, -66, 'wolf'); g.spawnEnemy(0, -70, 'soldier'); });
await wait(9000);
console.log('group fight ', JSON.stringify(await info()));
await browser.close();
server.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }
console.log('errors:', errors.length ? [...new Set(errors)].join(' | ') : 'none');
process.exit(0);
