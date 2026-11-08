// Combat test: light attack, power attack (hold), block and bash against a spawned enemy.
// Usage: npm run build && node scripts/combat.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4177;
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

const info = () => page.evaluate(() => { const g = window.__game, p = g.player, e = g.combat.enemies[g.combat.enemies.length - 1]; return { ehp: Math.round(e.hp), alive: e.alive, php: Math.round(p.health), stam: Math.round(p.stamina), dist: Math.hypot(e.group.position.x - p.pos.x, e.group.position.z - p.pos.z).toFixed(1) }; });
const setup = () => page.evaluate(() => {
  const g = window.__game; g.teleport(0, -60); g.player.yaw = 0; g.player.health = 100; g.player.stamina = 100; g.player.alive = true;
  g.spawnEnemy(0, -63);
});
const click = (button, ms) => page.mouse.down({ button }).then(() => wait(ms)).then(() => page.mouse.up({ button }));

await setup(); await wait(300);
console.log('start        ', JSON.stringify(await info()));
await click('left', 120); await wait(2500);
console.log('after light  ', JSON.stringify(await info()));
await click('left', 4200); await wait(3000);
console.log('after power  ', JSON.stringify(await info()));
// block: new enemy; hold X while it telegraphs and hits
await setup(); await wait(200);
await page.keyboard.down('KeyX');
await wait(14000);
console.log('blocking     ', JSON.stringify(await info()), '(php should stay high, stam drops)');
await page.keyboard.up('KeyX');
await browser.close();
server.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }
console.log('errors:', errors.length ? [...new Set(errors)].join(' | ') : 'none');
process.exit(0);
