# Monte Vinhedo

Site conceitual de uma vinícola boutique de altitude em São Joaquim (SC).
One-page imersiva, montada como uma degustação em cinco capítulos.

Vite + React + TypeScript + Tailwind v4 · GSAP (ScrollTrigger, SplitText,
DrawSVG) + Lenis · deploy estático no Cloudflare Pages.

```bash
npm install
npm run dev
```

## Como o site está montado

| Arquivo | Papel |
| --- | --- |
| `projeto/index.html` + `projeto/assets/` | export do design aprovado — a referência visual e a origem de todos os assets |
| `MOTION.md` | a partitura das animações; cada componente cita a seção que implementa |
| `src/motion/` | tokens de movimento, Lenis, fundo do body, capítulo corrente, prontidão |
| `src/components/` | uma seção por arquivo, na ordem da rolagem |
| `scripts/prepare-assets.py` | gera tudo que vive em `public/` a partir do export |

Três sistemas costuram a página e vale conhecê-los antes de mexer:

**O fundo viaja, as seções não têm cor.** Nenhuma seção declara `background`.
Cada uma carrega `data-bg` e um ScrollTrigger transiciona o `<body>` entre
`#14080b` e `#f2ead8` (`src/motion/useBodyBackground.ts`, MOTION.md §3). Como
a virada dispara em `top 55%` da seção, as entradas de abertura de bloco usam
`top 70%` — é onde as duas coisas se encontram. Disparar antes faria o texto
entrar sobre a cor errada.

**A lombada troca de tinta.** Ela é fixa: fica parada enquanto a cor passa por
baixo. `src/motion/tomFundo.ts` avisa quando o fundo virou, e a Lombada e o
indicador mobile reagem. É o que o export resolvia com `data-spine` e as
variáveis `{{ spineInk }}` / `{{ c1..c5 }}`.

**As animações de baixo esperam.** Montar dez SplitText e ~40 ScrollTriggers no
primeiro frame custava 1,3 s de layout no celular. `src/motion/prontidao.ts`
adia esse preparo para o primeiro tempo ocioso depois que o hero entra.

> ⚠️ Esse adiamento tem um efeito colateral que já custou um bug: o pin do
> divisor nasce depois dos ScrollTriggers de `data-bg`, e ele acrescenta 120vh
> à altura do documento. Sem tratar isso, a Visite e o rodapé ficam 1080 px
> adiantados e o fundo vira bordô com a Visite ainda em cena — texto bordô
> sobre bordô. A defesa é dupla: o trigger pinado leva `refreshPriority: 1`
> (recalcula primeiro em todo refresh) e `liberarAnimacoes()` dispara um
> `ScrollTrigger.refresh()` depois que todas as seções se armaram. **Qualquer
> novo pin precisa de `refreshPriority` também.**

## Assets

`public/` é gerado, mas versionado — o build do Cloudflare não precisa de
Python. Só rode o pipeline se o export mudar:

```bash
pip install "pillow>=11.3" numpy "fonttools[woff]"
npm run assets
```

Ele produz, a partir de `projeto/assets/`:

- **derivadas responsivas** em avif/webp + fallback, nas larguras em que cada
  imagem é de fato renderizada, mais `src/assets/images.ts` (manifesto tipado
  que o `<Picture />` consome);
- **fontes subsetadas** para os 161 glifos que o site usa, em woff2 + woff. Só
  as 7 faces referenciadas pelo layout — o export também traz Switzer e os
  itálicos de General Sans, que nenhum elemento usa. Os `.ttf` do export são
  blobs gzip e não servem no navegador. As fontes estão no caminho crítico do
  LCP (o "MONTE" do hero só pinta quando o Zodiak 700 chega), e o subset é o
  que mais encurta essa espera: 357 KB → 161 KB;
- **os dois retalhos do rótulo** que cobrem o QR code e os textos "mockupfree"
  da garrafa do hero. Não são retângulos chapados: cada um reconstrói o rótulo
  com a textura doada de uma faixa limpa da própria etiqueta e a iluminação
  interpolada das linhas que cercam a área coberta. Ficam dentro do wrapper da
  garrafa, em %, e por isso acompanham o parallax;
- **`og.jpg`** 1200×630, recompondo o sanduíche do hero para o feed;
- **o monograma MV** com as curvas reais do Zodiak 700, extraídas com fontTools
  — o mesmo desenho serve ao traço do preloader (DrawSVG) e ao favicon.

## Verificação

```bash
npm run build && npm run preview   # em outro terminal:
npm run shots      # captura desktop + mobile em 13 pontos da rolagem
npm run checks     # preloader, prefers-reduced-motion, fim do divisor no mobile
npm run audit      # Lighthouse
```

`shoot.mjs` também reporta qualquer elemento que estoure a viewport, para
separar sangria de propósito (MONTE no hero) de defeito.

### Lighthouse (build de produção, Chrome headless)

| | perf | a11y | práticas | seo |
| --- | --- | --- | --- | --- |
| desktop | 98 | 100 | 100 | 100 |
| mobile | 91–92 | 100 | 96 | 100 |

Mobile: FCP 1,8 s · LCP 2,8 s · TBT 120 ms · CLS 0.

Os 96 em práticas no mobile são o audit `font-size`: metade do texto fica
abaixo de 12 px. São os labels em caixa alta de 9,5–11 px com tracking largo,
que vêm do export e são parte da identidade. Subi-los passaria no audit e
quebraria o design; ficou como está, de propósito.

## Acessibilidade e movimento

- `prefers-reduced-motion: reduce` desliga parallax, pin e scrub via
  `gsap.matchMedia()`; sobram os fades. O Lenis nem é criado — rolagem
  suavizada é ela própria movimento.
- Toda entrada é `gsap.from()`, nunca `gsap.to()` a partir de um estado
  escondido em CSS: o estado final é o que o React renderiza, e a animação
  parte de fora dele. Se o GSAP falhar ou um ScrollTrigger não disparar, o
  conteúdo aparece — nada fica preso invisível esperando animação.
  (Isso vale para a camada de movimento; a página em si é renderizada no
  cliente, então sem JavaScript o `#root` fica vazio. As meta tags, o
  JSON-LD e o `og:image` são estáticos, então busca e link preview não
  dependem disso. Pré-renderizar o HTML no build é o próximo passo natural
  se o LCP precisar cair mais.)
- SplitText em letras leva `aria-label` no pai (senão o leitor de tela
  soletra); em linhas, não — ali o alvo é um `<p>`, e `role=paragraph` não
  aceita nome acessível.
- `will-change: transform` só nos elementos com scrub ativo, e removido no
  cleanup de cada `matchMedia`.

## A escala do hero

O sanduíche do hero é a parte que mais sofre com proporção de tela, porque
mistura duas unidades: as palavras eram medidas em `vw` e a garrafa em `svh`.
Numa tela larga e baixa (16:9 de notebook, ultrawide) o MONTE crescia sem
limite e engolia a garrafa; e como "MONTE" mede 3,97 em de largura, `27vw`
dava sempre 107vw de palavra — sangria acidental de 3,5vw em toda tela, até o
`clamp` de 520 px cortar e a palavra virar um bloco encolhido no meio.

`hero-escala`, em `src/index.css`, resolve medindo pelos **dois eixos**:

```css
--monte: max(64px, min(25.7vw, 45svh));
```

25,7vw é a conta de 102vw ÷ 3,97 em — a palavra toca as duas bordas com 1vw de
sangria de cada lado. O termo em `svh` assume quando a tela passa de ~1,75:1 e
impede que a palavra domine a composição. A troca é contínua, sem degrau.

Medido de 360×640 a 2560×1440, a sangria do MONTE fica entre 2 e 14 px em
todas as telas — antes ia de 13 a 67 px e invertia para 250 px de recuo em
2560. Só em proporções extremas (1920×620, 3,1:1) a palavra recua, porque ali
não existe espaço vertical para palavra monumental e garrafa ao mesmo tempo.

`npm run telas` captura hero e divisor em doze telas e reporta sangria,
recorte e scroll horizontal de cada uma.

## Mobile

Recomposto, não encolhido. A Lombada sai e entra um indicador de capítulo
discreto no topo (sem hambúrguer: o site é uma rolagem só). As anotações
cartográficas do Terroir saem de cima da foto e viram lista. O divisor perde o
pin. No hero, o VINHEDO passa de ~52vw de largura (desktop) para ~92vw.

No divisor, a máscara da taça não é opaca: ela para em ~0,84 de alfa no miolo.
Com preto cheio — como no export — o "SI" de INTENSIDADE sumia por completo e
a palavra virava "INTEN DADE". Com a faixa translúcida, a taça continua na
frente e as letras atravessam o vidro como um fantasma, que é o que vidro faz.

## Deploy — Cloudflare Pages

Build `npm run build`, saída `dist`. `public/_headers` já define o cache
imutável de `/assets`, `/fonts` e `/img`.

Antes de publicar, trocar o placeholder `https://montevinhedo.com.br` pela URL
real em `index.html` (canonical, `og:url`, `og:image`, JSON-LD),
`public/sitemap.xml` e `public/robots.txt`.
