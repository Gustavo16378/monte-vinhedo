/**
 * Conferências que uma screenshot solta não pega: preloader em movimento,
 * prefers-reduced-motion, e o fim do divisor no mobile.
 *
 *   node scripts/checks.mjs
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env['MV_URL'] ?? 'http://localhost:4173/';
const OUT = 'shots/checks';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--font-render-hinting=none'],
});
const relato = {};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- preloader
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  for (const t of [500, 1200, 2100]) {
    await page.evaluate((t) => new Promise((r) => setTimeout(r, t)), t === 500 ? 500 : 700);
    await page.screenshot({ path: `${OUT}/preloader-${t}.png` });
  }
  relato.preloaderSaiu = await page
    .waitForFunction(() => !document.querySelector('[data-preloader-traco]'), { timeout: 6000 })
    .then(() => true)
    .catch(() => false);
  // roda uma vez por sessão: um reload não deve mostrar de novo
  await page.reload({ waitUntil: 'domcontentloaded' });
  await espera(300);
  relato.preloaderReprisou = (await page.$('[data-preloader-traco]')) !== null;
  await page.close();
}

// ------------------------------------------------- prefers-reduced-motion
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await espera(2500);

  relato.reduced = await page.evaluate(() => {
    const divisor = document.querySelector('[aria-label="Intensidade"]');
    divisor?.scrollIntoView();
    return {
      // sem pin: o ScrollTrigger não deve ter criado pin-spacer nenhum
      pinSpacers: document.querySelectorAll('.pin-spacer').length,
      lenisAtivo: document.documentElement.classList.contains('lenis'),
    };
  });
  await espera(1200);
  await page.screenshot({ path: `${OUT}/reduced-divisor.png` });
  await page.evaluate(() => document.querySelector('#visite')?.scrollIntoView());
  await espera(1200);
  await page.screenshot({ path: `${OUT}/reduced-visite.png` });
  relato.reducedErros = erros;
  await page.close();
}

// --------------------------------------------- divisor no fim, no mobile
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await espera(3400);
  await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Intensidade"]');
    const r = el.getBoundingClientRect();
    window.scrollTo({ top: r.bottom + window.scrollY - window.innerHeight, behavior: 'instant' });
  });
  await espera(1500);
  await page.screenshot({ path: `${OUT}/mobile-divisor-fim.png` });
  await page.close();
}

console.log(JSON.stringify(relato, null, 2));
await browser.close();
