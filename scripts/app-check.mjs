// Launches the Electron app briefly with remote debugging, checks that the title screen renders, screenshots it.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const electron = (await import('electron')).default ?? 'electron';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = process.argv[2];
const proc = exe ? spawn(exe, ['--remote-debugging-port=9333'], { stdio: 'ignore' }) : spawn(String(electron), ['.', '--remote-debugging-port=9333'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 30; i++) { try { browser = await chromium.connectOverCDP('http://127.0.0.1:9333'); break; } catch { await wait(1000); } }
if (!browser) { console.log('could not attach'); proc.kill(); process.exit(1); }
const page = browser.contexts()[0].pages()[0];
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await wait(3000);
const info = await page.evaluate(() => ({ title: document.title, btn: !!document.querySelector('#tnew'), url: location.href }));
console.log(JSON.stringify(info));
fs.mkdirSync('docs/shots', { recursive: true });
await page.screenshot({ path: 'docs/shots/app-title.png' });
console.log('errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
proc.kill();
try { spawn('taskkill', ['/F', '/T', '/PID', String(proc.pid)], { shell: true, stdio: 'ignore' }); } catch { /* ignore */ }
process.exit(info.btn ? 0 : 1);
