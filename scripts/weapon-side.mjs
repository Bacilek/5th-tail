// Weapon pose from side/front: node scripts/weapon-side.mjs [[x,y,z],...]  (needs build)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4182;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 800, height: 520 } });
await page.goto(`http://localhost:${PORT}/`);
await wait(1200);
await page.click('#tnew'); await wait(300);
await page.click('#ccgo'); await wait(300);
await page.keyboard.press('Digit2'); await wait(800);
await page.evaluate(() => {
  const g = window.__game; g.input.locked = true; g.teleport(0, 10); g.player.yaw = 0; g.player.thirdPerson = true;
  const p = g.player, orig = p.sync.bind(p);
  window.__view = 'side';
  p.sync = (dt) => { orig(dt); const e = p.pos, c = p.camera; const o = window.__view === 'side' ? [3, 0] : [0, -3]; c.position.set(e.x + o[0], e.y + 1.3, e.z + o[1]); c.lookAt(e.x, e.y + 1.1, e.z); };
});
await wait(2500);
const cands = process.argv[2] ? JSON.parse(process.argv[2]) : [[Math.PI + 1.0, 0, 0]];
let i = 0;
for (const view of ['side', 'front']) for (const [x, y, z] of cands) {
  await page.evaluate(([x, y, z, v]) => { window.__view = v; for (const m of window.__game.player.tpMount) m.rotation.set(x, y, z); }, [x, y, z, view]);
  await wait(1500);
  await page.screenshot({ path: `docs/shots/wside-${view}-${i++}.png`, clip: { x: 250, y: 100, width: 300, height: 320 } });
}
await browser.close();
server.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }
process.exit(0);
