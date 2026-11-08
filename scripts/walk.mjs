// Walk test: drives the player with real key presses and logs positions, to check collisions and traversal.
// Usage: npm run build && node scripts/walk.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4174;
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

const state = () => page.evaluate(() => { const p = window.__game.player; return { x: +p.pos.x.toFixed(1), y: +p.pos.y.toFixed(2), z: +p.pos.z.toFixed(1), hp: Math.round(p.health), alive: p.alive }; });
const tp = (x, z, yaw = 0) => page.evaluate(([x, z, yaw]) => { const g = window.__game, p = g.player; p.pos.set(x, g.heightAt(x, z) + 0.2, z); p.vel.set(0, 0, 0); p.yaw = yaw; }, [x, z, yaw]);
const tpAbs = (x, y, z, yaw = 0) => page.evaluate(([x, y, z, yaw]) => { const p = window.__game.player; p.pos.set(x, y, z); p.vel.set(0, 0, 0); p.yaw = yaw; }, [x, y, z, yaw]);

async function run(name, setup, keys, seconds, jump = false) {
  await setup();
  await wait(400);
  for (const k of keys) await page.keyboard.down(k);
  const t0 = Date.now(), trace = [];
  let lastJump = 0;
  while (Date.now() - t0 < seconds * 1000) {
    if (jump && Date.now() - lastJump > 700) { await page.keyboard.press('Space'); lastJump = Date.now(); }
    trace.push(await state());
    await wait(500);
  }
  for (const k of keys) await page.keyboard.up(k);
  trace.push(await state());
  console.log(`\n== ${name}`);
  console.log(trace.map((s) => `(${s.x},${s.y},${s.z}) hp${s.hp}`).join(' '));
  return trace;
}

// yaw = -PI/2 faces +x
const EAST = -Math.PI / 2;
const results = {};
results.parapet = await run('Parapet east from tower top', () => tpAbs(43.2, 62, -20, EAST), ['KeyW'], 25);
results.stairs = await run('Gauntlet steps (jumping east)', () => tp(152, -22, EAST), ['KeyW'], 25, true);
results.hall = await run('Walk into Infantry hall door (south side)', () => tp(0, -100, 0), ['KeyW'], 6);

await browser.close();
server.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }

const last = (t) => t[t.length - 1];
console.log('\nSUMMARY');
console.log('parapet end', JSON.stringify(last(results.parapet)), '(expect x > 90 if crossed, y ~62)');
console.log('stairs end', JSON.stringify(last(results.stairs)), '(expect x > 170)');
console.log('errors:', errors.length ? [...new Set(errors)].join(' | ') : 'none');
process.exit(0);
