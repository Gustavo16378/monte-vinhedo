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
  ['1280x800', 1280, 800], // notebook 16:10
  ['1366x768', 1366, 768], // o notebook mais comum do mundo
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
      garrafa: caixa('[data-garrafa-scroll]'),
      legenda: caixa('[data-legenda-esq]'),
      legDir: caixa('[data-legenda-dir]'),
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

console.log(
  'tela        vw×vh      MONTE sangra   garrafa t..b     legenda: corta?  cruza garrafa?  overflow',
);
for (const m of relato) {
  const sangraM = m.monte ? `${-m.monte.l}|${m.monte.r - m.vw}` : '-';
  const corta = m.legenda && m.legDir ? (m.legenda.l >= 0 && m.legDir.r <= m.vw ? 'ok' : 'CORTA') : '-';
  // a regra do briefing: nenhum texto por cima do vidro
  const meia = m.garrafa ? (m.garrafa.r - m.garrafa.l) * 0.9003 * 0.5 : 0;
  const cx = m.vw / 2;
  // só é sobreposição de verdade se as caixas se cruzarem nos DOIS eixos:
  // no mobile a legenda fica abaixo da base da garrafa, e ali cruzar em x
  // não significa nada
  const foraEmY = m.legenda && m.garrafa && (m.legenda.t >= m.garrafa.b || m.legenda.b <= m.garrafa.t);
  const cruza =
    m.legenda && m.legDir
      ? foraEmY || (m.legenda.r <= cx - meia + 1 && m.legDir.l >= cx + meia - 1)
        ? 'ok'
        : 'CRUZA'
      : '-';
  const garOk = m.garrafa ? (m.garrafa.b <= m.vh ? 'ok' : `+${m.garrafa.b - m.vh}`) : '-';
  console.log(
    m.nome.padEnd(11),
    `${m.vw}x${m.vh}`.padEnd(11),
    sangraM.padEnd(14),
    m.garrafa ? `${String(m.garrafa.t).padStart(4)}..${String(m.garrafa.b).padStart(5)} ${garOk}`.padEnd(17) : ''.padEnd(17),
    corta.padEnd(16),
    cruza.padEnd(15),
    m.docW > m.vw ? `SCROLL-X ${m.docW - m.vw}` : 'ok',
  );
}
await browser.close();
