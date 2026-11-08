// Third-person melee pose check: swing windup/strike/recover + block, side and front. node scripts/pose-test.mjs (needs build)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4185;
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
  window.__st = { view: 'side', swing: 0, block: false };
  p.sync = (dt) => {
    const s = window.__st;
    p.swing[1] = s.swing; p.swing[0] = 0; p.blocking = s.block; p.swingHit = [true, true];
    orig(dt);
    const e = p.pos, c = p.camera; const o = s.view === 'side' ? [3, 0] : s.view === 'front' ? [0, -3] : [0, 3];
    c.position.set(e.x + o[0], e.y + 1.3, e.z + o[1]); c.lookAt(e.x, e.y + 1.1, e.z);
  };
});
await wait(2500);
const states = process.argv[2] ? JSON.parse(process.argv[2]) : [{ n: 'wind', swing: 0.35 }, { n: 'strike', swing: 0.5 }, { n: 'block', block: true }];
for (const st of states) for (const view of ['side', 'front']) {
  await page.evaluate(([st, view]) => { window.__st = { view, swing: st.swing ?? 0, block: !!st.block }; window.__rot = st.rot || null; }, [st, view]);
  if (st.walk) await page.keyboard.down('KeyW');
  await wait(st.walk ? 2200 : 1500);
  await page.screenshot({ path: `docs/shots/pose-${st.n}-${view}.png`, clip: { x: 250, y: 100, width: 300, height: 320 } });
  if (st.walk) await page.keyboard.up('KeyW');
}
await browser.close();
server.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }
process.exit(0);
