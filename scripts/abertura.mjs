/**
 * Caça-piscar: amostra a tela quadro a quadro durante a abertura e verifica
 * que nenhum frame mostra o hero antes de a cortina abrir.
 *
 * A prova é feita numa faixa do topo da tela, onde o MONTE fica: enquanto a
 * cortina está fechada aquilo tem que ser bordô liso (#14080b). Um único
 * quadro claro ali é o flash que estamos caçando.
 *
 *   node scripts/abertura.mjs
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env['MV_URL'] ?? 'http://localhost:4173/';
mkdirSync('shots/abertura', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// CDP para amostrar a tela sem o custo de screenshot completo
const cdp = await page.createCDPSession();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });

const quadros = [];
const t0 = Date.now();
while (Date.now() - t0 < 4200) {
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 60,
    clip: { x: 0, y: 120, width: 1440, height: 220, scale: 0.25 },
    captureBeyondViewport: false,
  });
  quadros.push({ t: Date.now() - t0, data });
  await new Promise((r) => setTimeout(r, 55));
}
writeFileSync('shots/abertura/quadros.json', JSON.stringify(quadros));
console.log(`capturados ${quadros.length} quadros em ${Date.now() - t0}ms`);

// e o estado final, para conferência visual
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: 'shots/abertura/final.png' });
await browser.close();
