// Smoke test: boots the production build in headless Chrome, plays the start flow and screenshots key spots.
// Usage: npm run build && node scripts/smoke.mjs   (starts `vite preview` itself)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4173;
const OUT = 'docs/shots';
fs.mkdirSync(OUT, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 40; i++) {
  try { const r = await fetch(`http://localhost:${PORT}/`); if (r.ok) break; } catch { /* not up yet */ }
  await wait(500);
}

const errors = [];
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));

const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };
const game = (fn) => page.evaluate(fn);

try {
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await wait(2500);
  await shot('01-character-creator');
  await page.click('#ccgo');
  await wait(800);
  await shot('02-class-select');
  await page.keyboard.press('Digit1'); // Rider
  await wait(2500);
  await shot('03-rider-start-tower');
  const info = await game(() => {
    const g = window.__game;
    return g ? { pos: [g.player.pos.x, g.player.pos.y, g.player.pos.z], health: g.player.health } : null;
  });
  console.log('game hook', JSON.stringify(info));

  const spots = {
    '04-lower-college': [0, 24],
    '05-citadel': [108, -12],
    '06-gauntlet-start': [132, -22],
    '07-flight-field': [225, -15],
    '08-village': [-90, 85],
    '09-venin-camp': [96, 120],
    '10-archives': [-100, -22],
  };
  for (const [name, [x, z]] of Object.entries(spots)) {
    await game(`(() => { const g = window.__game; const p = g.player; p.pos.set(${x}, g.heightAt(${x}, ${z}) + 0.1, ${z}); p.vel.set(0,0,0); })()`);
    await wait(900);
    await shot(name);
  }
  // night
  await game('window.__game.setHour(0.5)');
  await game(`(() => { const g = window.__game; const p = g.player; p.pos.set(0, g.heightAt(0, 24) + 0.1, 24); })()`);
  await wait(900);
  await shot('11-night-college');

  const fps = await page.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const f = () => { n++; if (performance.now() - t0 > 2000) res(n / 2); else requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }));
  console.log('fps (software GL, not representative):', fps.toFixed(1));
} catch (e) {
  errors.push(`[script] ${e.message}`);
  await shot('error').catch(() => {});
}

await browser.close();
server.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }
console.log(errors.length ? `ERRORS (${errors.length}):\n` + [...new Set(errors)].join('\n') : 'no console errors');
process.exit(errors.some((e) => !e.startsWith('[warning]')) ? 1 : 0);
