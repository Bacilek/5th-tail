// Generates the Fifth Tail app icon (placeholder art): build/icon.png (512) and build/icon.ico (PNG-embedded, 16-256).
// Renders an SVG with headless Chrome via playwright-core. Usage: node scripts/make-icon.mjs
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
fs.mkdirSync('build', { recursive: true });

// A dragon-scale / five-tail motif: dark rounded square, ember glow, five curved tails fanning out, a gold scale in the middle.
const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="62%" r="75%"><stop offset="0" stop-color="#3a2340"/><stop offset="1" stop-color="#07060d"/></radialGradient>
    <radialGradient id="glow" cx="50%" cy="68%" r="45%"><stop offset="0" stop-color="#ff8a3a" stop-opacity=".75"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#c9822a"/></linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <rect width="512" height="512" rx="96" fill="url(#glow)"/>
  <g fill="none" stroke="#e9d9b0" stroke-width="14" stroke-linecap="round">
    <path d="M256 400 C 120 360 110 220 150 130"/>
    <path d="M256 400 C 190 340 190 230 210 110" />
    <path d="M256 400 C 256 330 256 220 256 90" stroke="#ffd98a" stroke-width="18"/>
    <path d="M256 400 C 322 340 322 230 302 110"/>
    <path d="M256 400 C 392 360 402 220 362 130"/>
  </g>
  <g fill="#e9d9b0">
    <circle cx="150" cy="128" r="12"/><circle cx="210" cy="106" r="12"/><circle cx="256" cy="84" r="14" fill="#ffd98a"/><circle cx="302" cy="106" r="12"/><circle cx="362" cy="128" r="12"/>
  </g>
  <path d="M256 360 L296 400 L256 450 L216 400 Z" fill="url(#gold)" stroke="#5a3410" stroke-width="6"/>
  <path d="M256 372 L284 400 L256 436 L228 400 Z" fill="none" stroke="#fff3c8" stroke-width="3" opacity=".7"/>
</svg>`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
const pngs = {};
for (const s of sizes) {
  await page.setViewportSize({ width: s, height: s });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(s)}</body></html>`);
  pngs[s] = await page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: s, height: s } });
}
await browser.close();
fs.writeFileSync('build/icon.png', pngs[512]);

// ICO container with embedded PNGs (valid since Windows Vista)
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(icoSizes.length, 4);
const entries = []; let offset = 6 + 16 * icoSizes.length; const datas = [];
for (const s of icoSizes) {
  const d = pngs[s]; const e = Buffer.alloc(16);
  e.writeUInt8(s === 256 ? 0 : s, 0); e.writeUInt8(s === 256 ? 0 : s, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(d.length, 8); e.writeUInt32LE(offset, 12);
  entries.push(e); datas.push(d); offset += d.length;
}
fs.writeFileSync('build/icon.ico', Buffer.concat([header, ...entries, ...datas]));
console.log('wrote build/icon.png and build/icon.ico');
