/**
 * Captura o site em pontos-chave da rolagem, para conferência lado a lado com
 * o export. Uso:
 *
 *   npx vite preview --port 4173 &
 *   node scripts/shoot.mjs [--mobile] [--reduced] [--out pasta]
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env['MV_URL'] ?? 'http://localhost:4173/';

const arg = (nome, padrao) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i < 0 ? padrao : (process.argv[i + 1] ?? true);
};
const mobile = process.argv.includes('--mobile');
const reduced = process.argv.includes('--reduced');
const out = String(arg('out', mobile ? 'shots/mobile' : 'shots/desktop'));

const PARADAS = [
  ['00-hero', 0],
  ['01-manifesto', '#manifesto'],
  ['02-terroir', '#terroir'],
  ['03-terroir-mapa', { sel: '#terroir figure', off: 0.35 }],
  ['04-historia', '#historia'],
  ['05-vinhos', '#vinhos'],
  ['06-tinto', { sel: '[aria-labelledby="vinho-tinto"]' }],
  ['07-rose', { sel: '[aria-labelledby="vinho-rose"]' }],
  ['08-branco', { sel: '[aria-labelledby="vinho-branco"]' }],
  ['09-divisor', { sel: '[aria-label="Intensidade"]' }],
  ['10-divisor-fim', { sel: '[aria-label="Intensidade"]', off: 1.0 }],
  ['11-visite', '#visite'],
  ['12-footer', { sel: 'footer' }],
];

mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--font-render-hinting=none'],
});
const page = await browser.newPage();
await page.setViewport(
  mobile ? { width: 390, height: 844, deviceScaleFactor: 2 } : { width: 1440, height: 900 },
);
if (reduced) {
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
}

const erros = [];
page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));

await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60_000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 3400)); // deixa o preloader terminar

for (const [nome, alvo] of PARADAS) {
  await page.evaluate((alvo) => {
    const y =
      typeof alvo === 'number'
        ? alvo
        : (() => {
            const spec = typeof alvo === 'string' ? { sel: alvo, off: 0 } : alvo;
            const el = document.querySelector(spec.sel);
            if (!el) return 0;
            const top = el.getBoundingClientRect().top + window.scrollY;
            return top + (spec.off ?? 0) * window.innerHeight;
          })();
    window.__lenis?.scrollTo?.(y, { immediate: true });
    window.scrollTo({ top: y, behavior: 'instant' });
  }, alvo);
  await new Promise((r) => setTimeout(r, 1500)); // scrub + entradas assentarem
  await page.screenshot({ path: `${out}/${nome}.png` });
}

// scroll horizontal acidental?
const overflow = await page.evaluate(() => ({
  docWidth: document.documentElement.scrollWidth,
  viewport: window.innerWidth,
  culpados: [...document.querySelectorAll('body *')]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.right > window.innerWidth + 1 || r.left < -1;
    })
    .slice(0, 12)
    .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`),
}));

console.log(JSON.stringify({ out, overflow, erros: erros.slice(0, 10) }, null, 2));
await browser.close();
