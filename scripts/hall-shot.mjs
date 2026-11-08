// Screenshot inside Administration hall. Needs a build. Usage: node scripts/hall-shot.mjs [x z yaw]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const PORT = 4188;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const [x, z, yaw] = process.argv.slice(2).map(Number);
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await wait(500); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
await page.goto(`http://localhost:${PORT}/`);
await wait(1200);
await page.click('#tnew'); await wait(300);
await page.click('#ccgo'); await wait(300);
await page.keyboard.press('Digit2'); await wait(800);
await page.evaluate(([x, z, yaw]) => { const g = window.__game; g.input.locked = true; g.teleport(x, z); g.player.yaw = yaw; g.player.pitch = 0.05; }, [x ?? 0, z ?? -24, yaw ?? 0]);
await wait(3000);
await page.screenshot({ path: 'docs/shots/hall.png' });
await browser.close(); server.kill();
process.exit(0);
