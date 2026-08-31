/**
 * Captura hero e divisor numa grade de telas — de celular curto a ultrawide.
 * É o teste de "funciona em todas as telas", que dois breakpoints não provam.
 *
 *   node scripts/telas.mjs [--only hero|divisor]
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env['MV_URL'] ?? 'http://localhost:4173/';
const OUT = 'shots/telas';
mkdirSync(OUT, { recursive: true });

const TELAS = [
  ['360x640', 360, 640], // celular pequeno e curto
  ['390x844', 390, 844], // iPhone
  ['430x932', 430, 932], // celular grande
  ['600x900', 600, 900], // limiar do breakpoint
  ['768x1024', 768, 1024], // tablet retrato
  ['1024x768', 1024, 768], // tablet paisagem (curta)
  ['1280x720', 1280, 720], // notebook curto
  ['1440x900', 1440, 900],
  ['1570x1000', 1570, 1000], // a tela do print
  ['1920x1080', 1920, 1080],
  ['2560x1440', 2560, 1440],
  ['1920x620', 1920, 620], // extremo: largo e baixo
];

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--font-render-hinting=none'],
});

const relato = [];
for (const [nome, w, h] of TELAS) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  // preloader (~2,7s) + timeline de entrada do hero (~2,4s) + folga
  await espera(6000);

  if (only !== 'divisor') await page.screenshot({ path: `${OUT}/hero-${nome}.png` });

  const medidas = await page.evaluate(() => {
    const caixa = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom) };
    };
    return {
      vw: innerWidth,
      vh: innerHeight,
      monte: caixa('[data-hero-monte]'),
      vinhedo: caixa('[data-hero-vinhedo]'),
      garrafa: caixa('[data-hero-garrafa]'),
      legenda: caixa('[data-hero-legenda] span'),
      docW: document.documentElement.scrollWidth,
    };
  });
  relato.push({ nome, ...medidas });

  if (only !== 'hero') {
    await page.evaluate(() => {
      const el = document.querySelector('[aria-label="Intensidade"]');
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: r.top + window.scrollY + window.innerHeight * 1.1, behavior: 'instant' });
    });
    await espera(1400);
    await page.screenshot({ path: `${OUT}/divisor-${nome}.png` });
  }
  await page.close();
}

console.log('tela        vw×vh     MONTE l..r (sangra)     garrafa t..b      legenda l..r   overflow');
for (const m of relato) {
  const sangraM = m.monte ? `${-m.monte.l}|${m.monte.r - m.vw}` : '-';
  const legOk = m.legenda ? (m.legenda.l >= 0 && m.legenda.r <= m.vw ? 'ok' : 'CORTA') : '-';
  const garOk = m.garrafa ? (m.garrafa.b <= m.vh ? 'ok' : `+${m.garrafa.b - m.vh}`) : '-';
  console.log(
    m.nome.padEnd(11),
    `${m.vw}x${m.vh}`.padEnd(10),
    m.monte ? `${String(m.monte.l).padStart(5)}..${String(m.monte.r).padStart(5)} (${sangraM})`.padEnd(24) : ''.padEnd(24),
    m.garrafa ? `${String(m.garrafa.t).padStart(4)}..${String(m.garrafa.b).padStart(5)} ${garOk}`.padEnd(18) : ''.padEnd(18),
    legOk.padEnd(14),
    m.docW > m.vw ? `SCROLL-X ${m.docW - m.vw}` : 'ok',
  );
}
await browser.close();
