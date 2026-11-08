// Draw calls / triangles at several spots, with and without static merging (?nomerge). Needs a build.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4193;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const spots = [['college', 0, 20, 0], ['healers', 0, 70, Math.PI], ['infantry', 0, -90, 0], ['village', -90, 100, 0], ['citadel', 112, -20, 0], ['field', 215, 10, -Math.PI / 2], ['scribes', -100, -26, Math.PI]];
for (const q of ['?nomerge', '']) {
  const page = await browser.newPage({ viewport: { width: 800, height: 520 } });
  await page.goto(`http://localhost:${PORT}/${q}`);
  await wait(1200);
  await page.click('#tnew'); await wait(300);
  await page.click('#ccgo'); await wait(300);
  await page.keyboard.press('Digit2'); await wait(800);
  const out = [];
  for (const [n, x, z, yaw] of spots) {
    await page.evaluate(([x, z, yaw]) => { const g = window.__game; g.input.locked = true; g.teleport(x, z); g.player.yaw = yaw; }, [x, z, yaw]);
    await wait(2500);
    const r = await page.evaluate(() => { const i = window.__game.renderer.info; return [i.render.calls, Math.round(i.render.triangles / 1000)]; });
    out.push(`${n}: ${r[0]} calls / ${r[1]}k tris`);
  }
  console.log(q || '(merged)', '\n  ' + out.join('\n  '));
  await page.close();
}
await browser.close(); server.kill();
process.exit(0);
