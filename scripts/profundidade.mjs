/**
 * Confere a profundidade 3D: limites do tilt, sentidos opostos das camadas,
 * repouso ao sair do hero, e os dois fallbacks (toque e reduced-motion).
 *
 *   node scripts/profundidade.mjs
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env['MV_URL'] ?? 'http://localhost:4173/';
mkdirSync('shots/checks', { recursive: true });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--hide-scrollbars'],
});

/** Lê as transforms que o GSAP escreveu, em números. */
const ler = (page) =>
  page.evaluate(() => {
    const gv = (sel, prop) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const v = el._gsap?.[prop];
      return v === undefined ? null : Math.round(parseFloat(v) * 100) / 100;
    };
    return {
      rotY: gv('[data-garrafa-tilt]', 'rotationY'),
      rotX: gv('[data-garrafa-tilt]', 'rotationX'),
      reflexo: gv('[data-reflexo]', 'xPercent'),
      sombraX: gv('[data-sombra]', 'x'),
      sombraSX: gv('[data-sombra]', 'scaleX'),
      monte: gv('[data-hero-monte]', 'x'),
      vinhedo: gv('[data-hero-vinhedo]', 'x'),
      fundo: gv('[data-fundo-mouse]', 'x'),
    };
  });

// ─────────────────────────────────────────────────── ponteiro fino (desktop)
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await espera(6500);

  console.log('=== ponteiro fino ===');
  for (const [rot, x, y] of [
    ['canto sup-esq', 60, 60],
    ['canto inf-dir', 1380, 840],
    ['centro       ', 720, 450],
  ]) {
    await page.mouse.move(x, y);
    await espera(1500); // deixa o quickTo assentar (dur 0.9)
    const v = await ler(page);
    console.log(
      `  ${rot}  rotY=${String(v.rotY).padStart(6)}  rotX=${String(v.rotX).padStart(6)}` +
        `  reflexo=${String(v.reflexo).padStart(7)}  sombraX=${String(v.sombraX).padStart(6)}` +
        `  scaleX=${String(v.sombraSX).padStart(5)}`,
    );
    console.log(
      `                 MONTE=${String(v.monte).padStart(6)}  VINHEDO=${String(v.vinhedo).padStart(6)}` +
        `  fundo=${String(v.fundo).padStart(6)}`,
    );
  }

  await page.mouse.move(1380, 200);
  await espera(1400);
  await page.screenshot({ path: 'shots/checks/tilt-direita.png' });
  await page.mouse.move(60, 200);
  await espera(1400);
  await page.screenshot({ path: 'shots/checks/tilt-esquerda.png' });

  // sair do hero tem que devolver tudo ao repouso
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2, behavior: 'instant' }));
  await espera(1600);
  const rep = await ler(page);
  const zerado = ['rotY', 'rotX', 'reflexo', 'sombraX', 'monte', 'vinhedo', 'fundo'].every(
    (k) => Math.abs(rep[k] ?? 0) < 0.5,
  );
  console.log(`  fora do hero -> repouso: ${zerado ? 'ok' : 'FALHOU ' + JSON.stringify(rep)}`);
  await page.close();
}

// ───────────────────────────────────────────────────────────── toque (idle)
{
  const page = await browser.newPage();
  // `hover`/`pointer` não são emuláveis por emulateMediaFeatures; vêm da
  // emulação de dispositivo. isMobile + hasTouch faz o Chrome reportar
  // hover:none / pointer:coarse, que é o que a matchMedia do site lê.
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await espera(6500);

  const mq = await page.evaluate(() => ({
    hover: matchMedia('(hover: hover)').matches,
    fino: matchMedia('(pointer: fine)').matches,
  }));
  const a = await ler(page);
  const y1 = await page.evaluate(() => document.querySelector('[data-garrafa-tilt]')?._gsap?.y);
  await espera(1800);
  const b = await ler(page);
  const y2 = await page.evaluate(() => document.querySelector('[data-garrafa-tilt]')?._gsap?.y);

  console.log('\n=== toque ===');
  console.log(`  media: hover=${mq.hover} pointer:fine=${mq.fino}  (esperado false/false)`);
  console.log(`  float da garrafa: y ${y1} -> ${y2} ${y1 !== y2 ? 'ok (oscilando)' : 'PARADO'}`);
  console.log(
    `  reflexo cruzando: ${a.reflexo} -> ${b.reflexo} ${a.reflexo !== b.reflexo ? 'ok' : '(parado neste intervalo)'}`,
  );
  console.log(`  tilt desativado: ${a.rotY === null || a.rotY === 0 ? 'ok' : 'FALHOU ' + a.rotY}`);
  await page.close();
}

// ────────────────────────────────────────────────── prefers-reduced-motion
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await espera(4000);
  await page.mouse.move(1380, 120);
  await espera(1500);
  const v = await ler(page);
  const parado = Object.values(v).every((x) => x === null || Math.abs(x) < 0.5 || x === 1);
  console.log('\n=== reduced-motion ===');
  console.log(`  estático: ${parado ? 'ok' : 'FALHOU ' + JSON.stringify(v)}`);
  await page.screenshot({ path: 'shots/checks/reduced-hero.png' });
  await page.close();
}

await browser.close();
