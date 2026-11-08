// Weapon-in-hand pose test: tries candidate tpMount rotations, close-up screenshots.
// Usage: npm run build && node scripts/weapon-test.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4181;
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
await page.evaluate(() => { const g = window.__game; g.input.locked = true; g.teleport(0, 10); g.player.yaw = 0; g.player.thirdPerson = true; });
await wait(2500);
const cands = (process.argv[2] ? JSON.parse(process.argv[2]) : [[Math.PI + 1.0, 0, 0], [Math.PI / 2, 0, 0], [-Math.PI / 2, 0, 0], [0, 0, 0], [Math.PI, 0, 0], [0, 0, Math.PI / 2]]);
let i = 0;
for (const [x, y, z] of cands) {
  await page.evaluate(([x, y, z]) => { const p = window.__game.player; for (const m of p.tpMount) m.rotation.set(x, y, z); }, [x, y, z]);
  await wait(1500);
  await page.screenshot({ path: `docs/shots/weapon-${i++}.png`, clip: { x: 250, y: 180, width: 300, height: 300 } });
}
await browser.close();
server.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }
process.exit(0);
