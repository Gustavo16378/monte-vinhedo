/**
 * Gera `public/og.jpg` — a arte de compartilhamento, 1200x630.
 *
 * Não é screenshot da home. É uma composição DEDICADA ao formato
 * horizontal, montada com os mesmos assets e as mesmas fontes do hero: o
 * sanduíche MONTE / garrafa / VINHEDO reproporcionado para 1200x630, onde
 * a tela é larga e baixa demais para a composição da página caber.
 *
 * O caminho é o browser, e não sharp/canvas, por um motivo só: fidelidade
 * tipográfica. MONTE e VINHEDO dependem do Zodiak com tracking negativo e
 * do rótulo em `background-clip: text` — reimplementar isso em canvas seria
 * reimplementar um motor de texto. Aqui o Chrome desenha exatamente o que
 * desenha no site.
 *
 * Precisa do preview de pé (é dele que saem fontes e imagens):
 *
 *   npx vite preview --port 4173 &
 *   node scripts/og.mjs
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync, statSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env['MV_URL'] ?? 'http://localhost:4173/';
const SAIDA = 'public/og.jpg';

const L = 1200;
const A = 630;
/** margem de segurança: apps de preview cortam as beiradas */
const SEGURO = 60;

/* ── a composição, nas proporções do site ─────────────────────────────
   MONTE tem 3,9835em de TINTA (medido no browser; o avanço é 3,962em, a
   haste do M ultrapassa a caixa à esquerda). A 266px isso dá 1060px de
   tinta em 1200 de frame — 70px de margem de cada lado, acima dos 60
   exigidos. Ir aos 92% que a página usa daria 48px e furaria a margem.

   VINHEDO mantém a razão 9:22 do site em relação ao MONTE.
   A garrafa tem 0,2849 de largura sobre altura (341x1197 no PNG).        */
const MONTE_FS = 266;
const VINHEDO_FS = Math.round(MONTE_FS * (9 / 22)); // 109
const GARRAFA_H = Math.round(A * 0.85); // 536
const GARRAFA_SANGRIA = 22; // quanto a base passa do limite inferior
const GARRAFA_TOPO = A - GARRAFA_H + GARRAFA_SANGRIA;
const GARRAFA_L = GARRAFA_H * 0.2849;
/** vão de cada metade da legenda até o eixo: meia garrafa + respiro */
const LEGENDA_VAO = Math.round((GARRAFA_H * 0.2565) / 2 + 34);

/** retalhos que apagam o rótulo do mockup, em % da caixa da garrafa */
const PATCHES = [
  ['label-patch-c', 7.6246, 51.3784, 84.7507, 4.3442],
  ['label-patch-a', 8.2111, 57.3099, 83.5777, 3.4252],
  ['label-patch-d', 9.6774, 66.249, 80.6452, 6.6834],
  ['label-patch-b', 9.9707, 79.0309, 79.7654, 6.7669],
];

const FOIL =
  'linear-gradient(100deg,#f0dcac 0%,#e4c98d 14%,#cfa961 34%,#b08d4d 52%,#8d6f3a 70%,#6b522a 86%,#4f3c1e 100%)';

const html = `<!doctype html>
<html><head><meta charset="utf-8"><base href="${BASE}">
<style>
  @font-face{font-family:Zodiak;src:url(fonts/zodiak-700.woff2) format('woff2');font-weight:700;font-display:block}
  @font-face{font-family:Zodiak;src:url(fonts/zodiak-400.woff2) format('woff2');font-weight:400;font-display:block}
  @font-face{font-family:'General Sans';src:url(fonts/general-sans-400.woff2) format('woff2');font-weight:400;font-display:block}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${L}px;height:${A}px;overflow:hidden;background:#14080b}
  #frame{position:relative;width:${L}px;height:${A}px;overflow:hidden;background:#14080b}
  img{display:block}

  /* fundo: a mesma foto e a mesma dessaturação do hero */
  #bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.75);z-index:1}
  /* overlay bordô a 75%, com a vinheta que o hero faz com dois véus */
  #veu{position:absolute;inset:0;z-index:2;background:
    radial-gradient(120% 90% at 50% 42%,rgba(114,32,54,.30) 0%,rgba(20,8,11,0) 70%),
    rgba(20,8,11,.75)}

  #monte{position:absolute;z-index:3;left:50%;transform:translateX(-50%);
    font-family:Zodiak,serif;font-weight:700;font-size:${MONTE_FS}px;line-height:.78;
    letter-spacing:-.01em;color:#f2ead8;white-space:nowrap}
  #vinhedo{position:absolute;z-index:5;left:50%;transform:translateX(-50%);
    font-family:Zodiak,serif;font-weight:400;font-size:${VINHEDO_FS}px;line-height:.9;
    letter-spacing:.3em;padding-left:.3em;color:#f2ead8;white-space:nowrap}

  #garrafa{position:absolute;z-index:4;left:50%;transform:translateX(-50%);
    top:${GARRAFA_TOPO}px;height:${GARRAFA_H}px;width:${GARRAFA_L}px}
  #garrafa>img.corpo{height:100%;width:auto;filter:drop-shadow(0 26px 52px rgba(0,0,0,.68))}
  #garrafa .patch{position:absolute;pointer-events:none}

  /* rótulo rebatizado, nas mesmas frações da altura da garrafa do site */
  #rotulo{position:absolute;inset-inline:0;top:51.3%;text-align:center}
  #rotulo .nome{display:block;font-family:Zodiak,serif;
    font-size:${(GARRAFA_H * 0.0204).toFixed(2)}px;letter-spacing:.14em;padding-left:.14em;
    background-image:${FOIL};-webkit-background-clip:text;background-clip:text;color:transparent;
    filter:drop-shadow(0 1px 0 rgba(60,20,26,.55))}
  #rotulo .sub{display:block;margin-top:${(GARRAFA_H * 0.0075).toFixed(2)}px;
    font-family:'General Sans',sans-serif;font-size:${(GARRAFA_H * 0.0092).toFixed(2)}px;
    letter-spacing:.3em;padding-left:.3em;color:rgba(248,236,212,.82);
    filter:drop-shadow(0 1px 1px rgba(58,20,26,.6))}

  /* legenda partida nas duas metades do hero: assim ela ladeia a garrafa
     em vez de atravessá-la, e o "·" do export vira o próprio vidro */
  .legenda{position:absolute;z-index:6;font-family:'General Sans',sans-serif;font-weight:400;
    font-size:15px;letter-spacing:.42em;text-transform:uppercase;color:#f2ead8;white-space:nowrap;
    text-shadow:0 1px 10px rgba(20,8,11,.8)}
</style></head>
<body><div id="frame">
  <img id="bg" src="img/vinhedo-nevoa-2000.jpg">
  <div id="veu"></div>

  <div id="monte">MONTE</div>

  <div id="garrafa">
    <img class="corpo" src="img/garrafa-hero-recorte-341.png">
    ${PATCHES.map(
      ([n, l, t, w, h]) =>
        `<img class="patch" src="img/${n}.png" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%">`,
    ).join('\n    ')}
    <div id="rotulo">
      <span class="nome">MONTE VINHEDO</span>
      <span class="sub">VINHO FINO DE ALTITUDE</span>
    </div>
  </div>

  <div id="vinhedo">VINHEDO</div>

  <span class="legenda" id="leg-esq">Vinhos finos de altitude</span>
  <span class="legenda" id="leg-dir">desde 1987</span>
</div></body></html>`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--force-device-scale-factor=1', '--font-render-hinting=none', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: L, height: A, deviceScaleFactor: 1 });

// Navegar ANTES de injetar o HTML não é detalhe: `setContent` reescreve o
// documento mas preserva a origem, e fonte é recurso com CORS. Partindo de
// `about:blank`, os .woff2 vinham de outra origem, eram bloqueados em
// silêncio e o Chrome caía no serif do sistema — a arte saía com a
// tipografia errada sem nenhum erro à vista. Com o goto primeiro, a página
// injetada é same-origin e o Zodiak carrega.
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);

const fontesOk = await page.evaluate(() => ({
  zodiak700: document.fonts.check('700 100px Zodiak'),
  zodiak400: document.fonts.check('400 100px Zodiak'),
  generalSans: document.fonts.check('400 100px "General Sans"'),
}));
if (!fontesOk.zodiak700 || !fontesOk.zodiak400 || !fontesOk.generalSans) {
  await browser.close();
  throw new Error(`fontes não carregaram: ${JSON.stringify(fontesOk)}`);
}

/* O posicionamento vertical é feito aqui, depois de as fontes carregarem:
   é medindo a caixa real de cada palavra que dá para encostá-la onde se
   quer sem depender de adivinhar entrelinha e half-leading. */
const medidas = await page.evaluate(
  ({ A, SEGURO, LEGENDA_VAO }) => {
    const monte = document.getElementById('monte');
    const vinhedo = document.getElementById('vinhedo');
    const esq = document.getElementById('leg-esq');
    const dir = document.getElementById('leg-dir');

    // MONTE: topo da TINTA a 72px do topo do frame
    monte.style.top = '0px';
    const mAlt = monte.getBoundingClientRect().height;
    const mInk = (mAlt - 0.7188 * parseFloat(getComputedStyle(monte).fontSize)) / 2;
    monte.style.top = `${72 - mInk}px`;

    // VINHEDO: cruzando o terço inferior, tinta começando a 68,5% da altura.
    //
    // Os 68,5% não são estéticos, são uma folga medida. O rótulo impresso
    // fica a 51,3% da altura da garrafa, e a 61% a letra do meio da palavra
    // — o H — caía exatamente sobre ele: os dois textos se anulavam num
    // borrão. Neste formato a garrafa é pequena demais para absorver a
    // travessia como absorve no site. Aqui a palavra passa ABAIXO do
    // rótulo, ainda cruzando o vidro e ainda no terço inferior.
    vinhedo.style.top = '0px';
    const vAlt = vinhedo.getBoundingClientRect().height;
    const vInk = (vAlt - 0.7188 * parseFloat(getComputedStyle(vinhedo).fontSize)) / 2;
    vinhedo.style.top = `${A * 0.685 - vInk}px`;

    // Legenda: rodapé, ladeando a garrafa, mesma linha de base. Ancorada
    // pela BASE da caixa e não pelo topo — é a distância até a borda de
    // baixo que a margem de segurança cobra, e ela depende da altura da
    // linha, que só se conhece depois de a fonte carregar.
    for (const [el, lado] of [
      [esq, 'right'],
      [dir, 'left'],
    ]) {
      el.style.top = '0px';
      const alt = el.getBoundingClientRect().height;
      el.style.top = `${A - SEGURO - 8 - alt}px`;
      el.style[lado] = `calc(50% + ${LEGENDA_VAO}px)`;
      el.style.textAlign = lado === 'right' ? 'right' : 'left';
    }

    const caixa = (el) => {
      const r = el.getBoundingClientRect();
      return {
        l: Math.round(r.left),
        r: Math.round(r.right),
        t: Math.round(r.top),
        b: Math.round(r.bottom),
      };
    };
    const textos = { monte: caixa(monte), vinhedo: caixa(vinhedo), legEsq: caixa(esq), legDir: caixa(dir) };
    const g = caixa(document.getElementById('garrafa'));

    // a tinta do M passa 0,0313em à esquerda da caixa; a margem real é menor
    const overhang = 0.0313 * parseFloat(getComputedStyle(monte).fontSize);
    const margem = Object.entries(textos).map(([nome, c]) => {
      const extra = nome === 'monte' ? overhang : 0;
      return {
        nome,
        esq: Math.round(c.l - extra),
        dir: Math.round(1200 - c.r - extra),
        topo: c.t,
        base: Math.round(630 - c.b),
      };
    });

    return {
      garrafa: g,
      margens: margem,
      violacoes: margem.filter(
        (m) => m.esq < SEGURO || m.dir < SEGURO || m.topo < SEGURO || m.base < SEGURO,
      ),
      // legenda cruza o vidro?
      legendaSobreVidro:
        textos.legEsq.r > g.l + (g.r - g.l) * 0.09 || textos.legDir.l < g.r - (g.r - g.l) * 0.09,
    };
  },
  { A, SEGURO, LEGENDA_VAO },
);

const buf = await page.screenshot({
  type: 'jpeg',
  quality: 85,
  clip: { x: 0, y: 0, width: L, height: A },
});
writeFileSync(SAIDA, buf);
await browser.close();

const kb = statSync(SAIDA).size / 1024;
console.log(
  JSON.stringify(
    {
      saida: SAIDA,
      tamanhoKB: +kb.toFixed(1),
      abaixoDe300KB: kb < 300,
      garrafa: medidas.garrafa,
      sangraNaBase: medidas.garrafa.b > A,
      margens: medidas.margens,
      violacoesDe60px: medidas.violacoes,
      legendaSobreVidro: medidas.legendaSobreVidro,
    },
    null,
    2,
  ),
);
if (medidas.violacoes.length || kb >= 300 || medidas.legendaSobreVidro) process.exitCode = 1;
