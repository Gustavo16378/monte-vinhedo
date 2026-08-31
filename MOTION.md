# MONTE VINHEDO · Direção de Motion

Documento de referência para implementação das animações.
Stack: GSAP (ScrollTrigger, SplitText, DrawSVG) + Lenis.
Regra geral: nada de ease padrão. Movimento lento, pesado, com peso de veludo.
O site é uma degustação, não um parque de diversões. Poucos efeitos, executados
com precisão.

## Setup

```bash
npm i gsap @gsap/react lenis
```

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

## Tokens de movimento (usar sempre estes)

```js
const EASE_ENTRADA = "power4.out";      // entradas de texto e imagem
const EASE_SAIDA   = "power2.inOut";    // saídas e transições de cor
const EASE_SELO    = "back.out(1.4)";   // carimbo do selo de cera
const DUR_LONGA    = 1.4;               // heros e imagens grandes
const DUR_MEDIA    = 0.9;               // títulos de seção
const DUR_CURTA    = 0.6;               // labels e detalhes
const STAGGER_CHAR = 0.035;             // letra por letra
const STAGGER_LINHA = 0.12;             // linha por linha
```

## 0. Preloader

Fundo bordô #14080b fullscreen. Monograma MV em SVG traçado com DrawSVG
(strokeDashoffset de 0% a 100%, dur 1.6s, EASE_SAIDA). Abaixo, a frase
"toda safra começa com paciência" surge com opacity 0 a 0.5.
Saída: o preloader sobe inteiro com clip-path inset(0 0 100% 0), dur 1.0s,
EASE_SAIDA, revelando o hero. Total: no máximo 2.8s. Roda uma vez por sessão
(sessionStorage).

## 1. Hero (sanduíche de camadas)

Timeline de entrada, dispara após o preloader:
1. Fundo (vinhedo com overlay) surge com scale 1.08 a 1.0, opacity 0 a 1,
   DUR_LONGA
2. "MONTE" (camada de trás): SplitText em chars, cada letra sobe de
   y: 120, opacity 0, DUR_MEDIA, STAGGER_CHAR, EASE_ENTRADA
3. Garrafa: entra depois com y: 60 a 0, opacity 0 a 1, DUR_LONGA,
   delay -0.4 sobreposto ao fim do MONTE
4. "VINHEDO" (camada da frente): mesmo tratamento do MONTE, começa
   quando a garrafa está a 60% do caminho
5. Subtítulo e nav: fade simples, DUR_CURTA, por último

Parallax de scroll (scrub): as três camadas se movem em velocidades
diferentes ao rolar. Fundo yPercent: 10, MONTE yPercent: -18,
garrafa yPercent: -8, VINHEDO yPercent: -26. scrub: true.
Isso cria a profundidade real do sanduíche em movimento.

## 2. Lombada (navegação lateral)

Os numerais ficam centralizados verticalmente (corrigir o empilhamento
atual). Cada seção tem um ScrollTrigger que, ao entrar na viewport
(start "top center"), anima o numeral correspondente: cor creme 40%
para dourado #c9a45c e um pequeno x: 4, DUR_CURTA. O anterior volta.
A logo vertical MONTE VINHEDO fica estática, sem animação.

## 3. Transições de fundo escuro/creme

O truque que costura o site inteiro: o background do body transiciona
entre #14080b e #f2ead8 conforme as seções creme entram.

```js
gsap.utils.toArray("[data-bg]").forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec,
    start: "top 55%",
    end: "bottom 55%",
    onEnter: () => gsap.to("body", { backgroundColor: sec.dataset.bg,
      duration: 0.8, ease: EASE_SAIDA }),
    onEnterBack: () => gsap.to("body", { backgroundColor: sec.dataset.bg,
      duration: 0.8, ease: EASE_SAIDA }),
  });
});
```

As seções não têm background próprio, só o body. A cor "viaja" sob o
conteúdo.

## 4. Manifesto

Frase com SplitText em words, cada palavra sobe de y: 40 com opacity 0,
STAGGER_LINHA, EASE_ENTRADA, disparado em start "top 70%".
A palavra "paciência." entra por último com delay extra de 0.3s
(fazer a piada visual: a palavra paciência exige paciência).
A faixa de rolhas revela com clip-path inset(0 100% 0 0) para
inset(0 0% 0 0), DUR_LONGA.

## 5. Terroir (anotações cartográficas)

A foto revela primeiro: clip-path inset(15%) para inset(0%) + scale
1.1 a 1.0, DUR_LONGA, scrub até "top 30%".
Depois, em sequência (stagger 0.4 entre cada anotação):
1. O ponto dourado pulsa ao aparecer (scale 0 a 1, EASE_SELO)
2. A linha diagonal é um SVG line com DrawSVG 0% a 100%, DUR_CURTA
3. O número conta de 0 até o valor final com snap:

```js
gsap.from(el, { textContent: 0, duration: 1.2, ease: "power1.inOut",
  snap: { textContent: 1 },
  scrollTrigger: { trigger: el, start: "top 75%" } });
```

(1.200 conta em passos de 25; 40 e 1987 em passos de 1)

## 6. Os Vinhos (três capítulos)

Cada capítulo:
- Label "CAPÍTULO N" com clip-path de baixo pra cima, DUR_CURTA
- Nome do vinho: SplitText em chars, STAGGER_CHAR, EASE_ENTRADA
- Imagem com parallax interno: a img dentro de um wrapper com overflow
  hidden, yPercent: -12 com scrub (a foto "anda" dentro da moldura)
- Notas de degustação: fade em linhas, STAGGER_LINHA
No capítulo do Branco, a transição pro fundo creme acontece junto
(seção com data-bg="#f2ead8").

## 7. Divisor splash (INTENSIDADE)

Seção pinada (pin: true, scrub, end "+=120%"):
- A palavra INTENSIDADE entra letra por letra conforme o scroll avança
  (scrub, não timeline solta)
- A metade da palavra que passa atrás da taça usa um clone com z-index
  menor e clip-path na altura da taça
- A foto faz scale 1.0 a 1.06 durante o pin
Ao final do pin a seção libera e o scroll continua.

## 8. Visite + selo de cera

Textos e fotos entram com o padrão de sempre (y + opacity, EASE_ENTRADA).
O selo de cera:
- Entrada: "carimbo". scale 1.6 a 1.0 com opacity 0 a 1, EASE_SELO,
  dur 0.7. Um leve shake de rotação (rotation: -3 a 0) junto
- Idle: o texto circular ao redor gira contínuo, rotation 360 em 24s,
  linear, repeat -1
- Hover: o giro acelera (timeScale 3 com gsap.to no timeScale) e o selo
  scale 1.05
Nunca parar o giro abruptamente: sempre tween no timeScale.

## 9. Footer contra-rótulo

A moldura dourada desenha com DrawSVG (as 4 bordas como um path SVG),
dur 1.2s quando o footer entra. O conteúdo interno fade em sequência
de cima pra baixo, STAGGER_LINHA. Discreto, é o fim da degustação.

## Performance e acabamento

- will-change: transform apenas nos elementos com parallax/scrub
- SplitText: usar aria-label no elemento pai para acessibilidade
- prefers-reduced-motion: media query desativa parallax e pin,
  mantém apenas fades simples
- Imagens dos capítulos com loading="lazy", hero eager
- Testar o pin do splash no mobile; se brigar com o teclado/URL bar,
  trocar pin por entrada scrub sem pin no breakpoint mobile
- Remover o QR code do rótulo da garrafa hero: cobrir com um retângulo
  bordô (#5a2a2e aproximado, pegar a cor exata do rótulo) posicionado
  sobre a área, dentro do wrapper da garrafa, rotacionando junto
