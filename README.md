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
| `MOTION.md` | a partitura das animações; cada componente cita a seção que implementa |
| `src/motion/` | tokens de movimento, Lenis, fundo do body, capítulo corrente, prontidão |
| `src/components/` | uma seção por arquivo, na ordem da rolagem |
| `public/` | imagens, fontes, og e favicon já tratados, prontos para servir |

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

Os assets de `public/` (e os manifestos `src/assets/images.ts` e
`src/assets/monogram.ts`) já estão tratados e versionados; são a fonte de
verdade, e o build não depende de nenhum pipeline externo. O que eles contêm:

- **derivadas responsivas** em avif/webp + fallback, nas larguras em que cada
  imagem é de fato renderizada, mais `src/assets/images.ts` (manifesto tipado
  que o `<Picture />` consome);
- **fontes subsetadas** para os 161 glifos que o site usa, em woff2 + woff. Só
  as 7 faces referenciadas pelo layout — o export também traz Switzer e os
  itálicos de General Sans, que nenhum elemento usa. Os `.ttf` do export são
  blobs gzip e não servem no navegador. As fontes estão no caminho crítico do
  LCP (o "MONTE" do hero só pinta quando o Zodiak 700 chega), e o subset é o
  que mais encurta essa espera: 357 KB → 161 KB;
- **os quatro retalhos do rótulo**, que limpam a etiqueta inteira do mockup —
  "RED LABEL", o monograma "MF", o QR code e os textos "mockupfree" — para
  que ela possa ser rebatizada em cima. O nome novo — "MONTE VINHEDO" em
  Zodiak dourado e "VINHO FINO DE ALTITUDE" abaixo — é texto no DOM, dentro
  do wrapper que recebe o tilt, e o degradê do foil acompanha a luz da
  própria etiqueta (clara à esquerda, escura à direita) para ler como
  impresso e não como adesivo colado. Os retalhos não são retângulos
  chapados: cada um reconstrói o rótulo
  com a textura doada de uma faixa limpa da própria etiqueta e a iluminação
  interpolada das linhas que cercam a área coberta. Ficam dentro do wrapper da
  garrafa, em %, e por isso acompanham o parallax e o tilt. O esfumado lateral
  é de 8px nas faixas que atravessam o brilho especular da esquerda: ali um
  corte de 2px vira degrau visível;
- **a silhueta da garrafa** em alfa puro, máscara do reflexo de luz — usar o
  PNG da garrafa custaria 325 KB só para isso;
- **`og.jpg`** 1200×630, recompondo o sanduíche do hero para o feed;
- **o monograma MV** com as curvas reais do Zodiak 700, extraídas com fontTools
  — o mesmo desenho serve ao traço do preloader (DrawSVG) e ao favicon.

## Verificação

```bash
npm run build && npm run preview   # em outro terminal:
npm run shots         # captura desktop + mobile em 13 pontos da rolagem
npm run telas         # hero e divisor em 12 telas, de 360x640 a 2560x1440
npm run abertura      # caça-piscar: amostra a abertura quadro a quadro
npm run profundidade  # tilt/reflexo/sombra, e os fallbacks de toque e reduced-motion
npm run checks        # preloader, prefers-reduced-motion, fim do divisor no mobile
npm run audit         # Lighthouse
```

`shoot.mjs` também reporta qualquer elemento que estoure a viewport, para
separar sangria de propósito (MONTE no hero) de defeito.

### Lighthouse (build de produção, Chrome headless)

| | perf | a11y | práticas | seo |
| --- | --- | --- | --- | --- |
| desktop | 98 | 95 | 100 | 100 |
| mobile | 88 | 95 | 96 | 100 |

Mobile: FCP 1,8 s · LCP 3,4 s · TBT 110 ms · CLS 0.

Três números merecem explicação, porque nenhum é descuido:

**a11y 95 — `color-contrast`, 7 itens.** Todos são texto de seção creme
(`#722036` sobre `#f2ead8`) que a ferramenta mede contra o `#14080b` do body,
porque as seções não têm background próprio: quem tem a cor é o body, e ele
ainda não viajou até lá. São elementos fora da tela no momento da auditoria, e
na rolagem real a cor chega antes de o texto ser legível (o fundo vira em
`top 55%` da seção, as entradas disparam em `top 70%` do elemento). Passar
para 100 exigiria dar background próprio às seções — que é exatamente o efeito
de degrau que o fundo viajante existe para evitar. Ficou como está, ciente.

**LCP mobile 3,4 s.** Subiu de 2,8 s quando o piscar foi corrigido, e a
subida é o conserto funcionando. Antes o MONTE pintava assim que o React
montava, atrás de uma cortina opaca — o Chrome contava um paint que ninguém
via (o LCP ignora oclusão). Agora ele só pinta quando a cortina abre, e a
métrica passou a dizer a verdade. Encurtar a abertura é o único jeito de
baixar isso, e ela já está no teto de 2,8 s que o MOTION.md define.

**Práticas 96 no mobile** é o audit `font-size`: metade do texto fica abaixo
de 12 px. São os labels em caixa alta de 9,5–11 px com tracking largo, que vêm
do export e são parte da identidade.

## Acessibilidade e movimento

- `prefers-reduced-motion: reduce` desliga parallax, pin e scrub via
  `gsap.matchMedia()`; sobram os fades. O Lenis nem é criado — rolagem
  suavizada é ela própria movimento.
- Nas seções, toda entrada é `gsap.from()`: o estado final é o que o React
  renderiza e a animação parte de fora dele, então se um ScrollTrigger não
  disparar o conteúdo aparece assim mesmo — nada fica preso invisível.
  **O hero é a exceção deliberada**: ali os elementos nascem ocultos pelo CSS
  (`oculto-na-abertura`) e o GSAP os traz com `autoAlpha`, porque a cortina do
  preloader precisa cobrir tudo sem que um único quadro mostre o hero antes da
  hora. A troca é consciente: o hero depende do JS para aparecer.
  (A página em si é renderizada no cliente, então sem JavaScript o `#root`
  fica vazio de qualquer forma. As meta tags, o JSON-LD e o `og:image` são
  estáticos, então busca e link preview não dependem disso. Pré-renderizar o
  HTML no build é o próximo passo natural se o LCP precisar cair mais.)
- SplitText em letras leva `aria-label` no pai (senão o leitor de tela
  soletra); em linhas, não — ali o alvo é um `<p>`, e `role=paragraph` não
  aceita nome acessível.
- `will-change: transform` só nos elementos com scrub ativo, e removido no
  cleanup de cada `matchMedia`.

## A abertura é uma timeline só

Preloader e hero não são duas animações que se revezam: são uma
`gsap.timeline()` única, montada em `Hero.tsx`. Por isso o `<Cortina />` mora
dentro do hero (num portal para o `<body>`, para escapar do `perspective` do
palco) em vez de ser irmão dele no `App`.

Isso resolve o piscar que existia antes — o hero aparecia por um quadro, sumia
e só então animava. Três coisas juntas eliminam o flash:

1. **O estado inicial está no CSS, não em `gsap.set()`.** A classe
   `oculto-na-abertura` (`opacity: 0; visibility: hidden`) vai no JSX. Um
   `set()` só roda no primeiro layout effect, e até lá o browser já pintou um
   quadro com o hero inteiro visível. O GSAP tira de lá com `autoAlpha`.
2. **A entrada do hero começa 0,35s antes de a cortina terminar** — o label
   `hero` é inserido com `'-=0.35'`. O MONTE já está subindo enquanto a
   cortina acaba de abrir: sem gap, sem corte.
3. **A master timeline espera `document.fonts.ready`.** Sem isso o SplitText
   mede com a fonte de sistema e reflui no meio da animação.

A rolagem fica travada (`lenis.stop()`) enquanto a cortina está de pé — por
trás dela dá para alcançar seções creme antes de o fundo do body ter viajado
até lá.

`npm run abertura` amostra a tela quadro a quadro durante a abertura e prova
que nenhum quadro mostra o hero antes da hora (a faixa do MONTE fica em bordô
puro, luminância 12,1, até 2,65s).

## Profundidade 3D do hero

Palco com `perspective: 1200px`; toda reação ao ponteiro passa por
`gsap.quickTo` (setter reaproveitado, nunca um tween novo por evento) com
`duration: 0.9` e `power3.out`. Os limites vivem em `LIM`, em
`src/motion/profundidade.ts`:

| camada | reação | limite |
| --- | --- | --- |
| garrafa | `rotationY` / `rotationX` (invertido) | ±7° / ±4° |
| reflexo | `xPercent`, sentido oposto ao tilt | ±30 |
| sombra | `x` oposto ao tilt + `scaleX` | ±14px / 1→1,08 |
| MONTE | `x` | ±10px |
| VINHEDO | `x`, oposto ao MONTE | ±22px |
| fundo | `x` | ±6px |

Nenhuma reação usa `scale` na garrafa: peso não muda de tamanho quando a gente
move a cabeça. Se o efeito ficar perceptível *como efeito*, está alto demais.

Duas armadilhas que valem saber:

- **Cada transform tem um dono só.** O fundo são três wrappers aninhados —
  scroll no de fora, deriva da névoa no do meio, ponteiro no de dentro.
  Empilhar duas animações no mesmo `yPercent` faria elas brigarem.
- **O reflexo são dois elementos.** A máscara da silhueta fica no de fora,
  parado, e só o degradê desliza no de dentro. Mover o elemento mascarado
  levava a máscara junto e o brilho escapava para fora do vidro.

Fallbacks: sem ponteiro fino, a garrafa ganha um float lento (±6px, 5s) e a
luz cruza o vidro uma vez a cada 8s — vitrine em vez de reação. Sob
`prefers-reduced-motion`, nada: hero estático. Fora da viewport do hero os
listeners saem e tudo volta ao repouso pelos mesmos `quickTo`.

`npm run profundidade` mede os três modos.

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

A legenda do hero também: no desktop as duas metades ladeiam a garrafa com
48px de respiro cada; no mobile não há vão possível (sobrariam ~67px por
metade), então elas voltam a ser uma linha só logo abaixo da base da garrafa
— cumprindo a mesma regra de nunca cruzar o vidro.

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
