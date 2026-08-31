import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap, useGSAP, SplitText } from '../motion/gsap';
import {
  DUR_CURTA,
  DUR_LONGA,
  DUR_MEDIA,
  EASE_ENTRADA,
  EASE_SAIDA,
  STAGGER_CHAR,
} from '../motion/tokens';
import { montarProfundidade } from '../motion/profundidade';
import { getLenis } from '../motion/useSmoothScroll';
import { LABEL_PATCHES } from '../assets/images';
import { Picture } from './Picture';
import { Cortina, marcarPreloaderVisto } from './Preloader';

const VEU_A =
  'linear-gradient(180deg,rgba(20,8,11,.8) 0%,rgba(114,32,54,.58) 46%,rgba(20,8,11,.94) 100%)';
const VEU_B =
  'linear-gradient(180deg,rgba(20,8,11,.58) 0%,rgba(114,32,54,.36) 46%,rgba(20,8,11,.82) 100%)';

/** Faixa de luz que corre no vidro. Pico de 18%, ~40% da largura da garrafa. */
const REFLEXO =
  'linear-gradient(135deg,transparent 30%,rgba(255,241,208,.18) 44%,rgba(255,248,228,.09) 54%,transparent 70%)';

/**
 * Folha dourada do rótulo.
 *
 * O degradê acompanha a luz da própria etiqueta, que é clara à esquerda (há
 * um brilho especular ali) e escurece para a direita, onde o rótulo vira no
 * cilindro. Sem isso o texto lê como adesivo colado por cima; com isso, como
 * foil impresso pegando a mesma luz do resto da garrafa.
 */
const FOIL =
  'linear-gradient(100deg,#f0dcac 0%,#e4c98d 14%,#cfa961 34%,#b08d4d 52%,#8d6f3a 70%,#6b522a 86%,#4f3c1e 100%)';

type HeroProps = {
  /** mostra a cortina do preloader antes da entrada (1x por sessão) */
  readonly comPreloader: boolean;
  /** dispara quando a abertura inteira termina */
  readonly onAberturaFim: () => void;
};

/**
 * Hero — MOTION.md §1, com a profundidade 3D por cima.
 *
 * Sanduíche de camadas: MONTE atrás (z-3), garrafa no meio (z-4) e VINHEDO
 * na frente (z-5), cada uma com sua velocidade de parallax de scroll e seu
 * deslocamento de ponteiro (ver `montarProfundidade`).
 *
 * Cada camada de fundo é um wrapper próprio porque cada transform tem um
 * dono só: scroll no de fora, deriva da névoa no do meio, ponteiro no de
 * dentro. Empilhar duas animações no mesmo `yPercent` faria elas brigarem.
 */
export function Hero({ comPreloader, onAberturaFim }: HeroProps): React.JSX.Element {
  const raiz = useRef<HTMLElement>(null);
  const cortina = useRef<HTMLDivElement>(null);
  // a cortina sai do DOM quando a abertura acaba: escondida ela ainda seria
  // um <div> fixo de tela cheia parado por cima de tudo
  const [cortinaViva, setCortinaViva] = useState(comPreloader);

  useGSAP(
    () => {
      const el = raiz.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const splits: SplitText[] = [];
      let master: gsap.core.Timeline | null = null;
      let soltarProfundidade: (() => void) | null = null;
      let vivo = true;

      // Esperar as fontes evita o SplitText medir com a fonte de sistema e
      // reflowar no meio da animação — a razão de o texto "pular" antes.
      void document.fonts.ready.then(() => {
        if (!vivo || !raiz.current) return;

        const partir = (alvo: Element) => {
          const s = SplitText.create(alvo, { type: 'chars', aria: 'auto', autoSplit: false });
          splits.push(s);
          return s;
        };

        // Rolagem travada enquanto a cortina está de pé. Sem isto dá para
        // rolar por trás dela e alcançar as seções creme antes de o fundo do
        // body ter viajado até lá — texto escuro sobre bordô.
        if (comPreloader) getLenis()?.stop();

        const tl = gsap.timeline({
          defaults: { ease: EASE_ENTRADA },
          onComplete: () => {
            // os chars já cumpriram seu papel; devolver o texto inteiro
            splits.forEach((s) => s.revert());
            marcarPreloaderVisto();
            setCortinaViva(false);
            onAberturaFim();
          },
        });
        master = tl;

        // ── preloader ────────────────────────────────────────────────────
        if (comPreloader && cortina.current) {
          const c = cortina.current;
          tl.fromTo(
            c.querySelectorAll('[data-preloader-traco]'),
            { drawSVG: '0%' },
            { drawSVG: '100%', duration: 1.6, ease: EASE_SAIDA, stagger: 0.18 },
            0,
          )
            .to(
              c.querySelector('[data-preloader-frase]'),
              { autoAlpha: 0.5, duration: 0.8, ease: EASE_SAIDA },
              0.7,
            )
            .to(c, { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: EASE_SAIDA }, 1.7)
            .set(c, { autoAlpha: 0 })
            .call(() => getLenis()?.start())
            // O hero começa a subir 0,35s ANTES de a cortina terminar de abrir:
            // é a sobreposição que apaga o gap entre as duas animações.
            .addLabel('hero', '-=0.35');
        } else {
          tl.addLabel('hero', 0);
        }

        // ── hero ─────────────────────────────────────────────────────────
        const [monte] = q('[data-hero-monte]');
        const [vinhedo] = q('[data-hero-vinhedo]');

        tl.to(q('[data-fundo-scroll]'), { autoAlpha: 1, duration: 0.01 }, 'hero').from(
          q('[data-fundo-mouse]'),
          { scale: 1.08, duration: DUR_LONGA },
          'hero',
        );

        if (monte) {
          tl.set(monte, { autoAlpha: 1 }, 'hero+=0.25').from(
            partir(monte).chars,
            { yPercent: 120, autoAlpha: 0, duration: DUR_MEDIA, stagger: STAGGER_CHAR },
            'hero+=0.25',
          );
        }

        // garrafa: sobreposta ao fim do MONTE
        const entraGarrafa = `hero+=${(0.25 + DUR_MEDIA + STAGGER_CHAR * 4 - 0.4).toFixed(2)}`;
        tl.fromTo(
          q('[data-garrafa-scroll]'),
          { y: 60, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: DUR_LONGA },
          entraGarrafa,
        ).to(q('[data-sombra]'), { autoAlpha: 1, duration: DUR_LONGA }, entraGarrafa);

        if (vinhedo) {
          // entra quando a garrafa está a 60% do caminho
          const at = `${entraGarrafa}+=${(DUR_LONGA * 0.6).toFixed(2)}`;
          tl.set(vinhedo, { autoAlpha: 1 }, at).from(
            partir(vinhedo).chars,
            { yPercent: 120, autoAlpha: 0, duration: DUR_MEDIA, stagger: STAGGER_CHAR },
            at,
          );
        }

        // as duas metades da legenda deslizam de fora para dentro
        tl.fromTo(
          q('[data-legenda-esq]'),
          { x: -40, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: DUR_MEDIA },
          '>-0.45',
        )
          .fromTo(
            q('[data-legenda-dir]'),
            { x: 40, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: DUR_MEDIA },
            '<',
          )
          .to(q('[data-rotulo]'), { autoAlpha: 0.92, duration: DUR_CURTA }, '<+=0.1');

        // ── parallax de scroll (soma ao deslocamento do ponteiro) ─────────
        const mmScroll = gsap.matchMedia();
        mmScroll.add('(prefers-reduced-motion: no-preference)', () => {
          const camadas: readonly (readonly [string, number])[] = [
            ['[data-fundo-scroll]', 10],
            ['[data-hero-monte]', -18],
            ['[data-garrafa-scroll]', -8],
            ['[data-hero-vinhedo]', -26],
          ];
          const alvos = camadas.flatMap(([sel]) => q(sel));
          gsap.set(alvos, { willChange: 'transform' });

          const tws = camadas.map(([sel, yPercent]) =>
            gsap.to(q(sel), {
              yPercent,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
            }),
          );
          return () => {
            tws.forEach((t) => t.kill());
            gsap.set(alvos, { willChange: 'auto' });
          };
        });

        const soltar = montarProfundidade(el);
        soltarProfundidade = () => {
          soltar();
          mmScroll.revert();
        };
      });

      return () => {
        vivo = false;
        master?.kill();
        splits.forEach((s) => s.revert());
        soltarProfundidade?.();
      };
    },
    { scope: raiz, dependencies: [] },
  );

  return (
    <header
      id="topo"
      ref={raiz}
      data-bg="#14080b"
      className="hero-altura hero-escala relative overflow-hidden"
    >
      {/* A cortina vai para o <body>: dentro do palco, o `perspective` a
          tornaria posicionada em relação ao palco e não à tela. */}
      {cortinaViva && createPortal(<Cortina refCortina={cortina} />, document.body)}

      <div data-palco className="absolute inset-0" style={{ perspective: '1200px' }}>
        {/* fundo — três wrappers, uma transform cada */}
        <div data-fundo-scroll className="oculto-na-abertura absolute inset-0 z-[1]">
          <div data-fundo-deriva className="absolute inset-[-4%]">
            <div data-fundo-mouse className="h-full w-full">
              <Picture
                name="vinhedo-nevoa"
                priority
                sizes="108vw"
                className="h-full w-full object-cover [filter:saturate(.75)]"
              />
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="absolute inset-0 z-[2]" style={{ background: VEU_A }} />
        <div aria-hidden="true" className="absolute inset-0 z-[2]" style={{ background: VEU_B }} />

        {/* sombra de contato: fica no chão, não gira com a garrafa */}
        <div
          data-sombra
          aria-hidden="true"
          className="oculto-na-abertura pointer-events-none absolute left-1/2 z-[3]"
          style={{
            translate: '-50% 0',
            top: 'calc(var(--garrafa-topo) + var(--garrafa-altura) - 2.4%)',
            width: 'calc(var(--garrafa-altura) * var(--garrafa-larg) * 1.55)',
            height: 'calc(var(--garrafa-altura) * 0.055)',
            background:
              'radial-gradient(ellipse at center,rgba(5,2,3,.6) 0%,rgba(5,2,3,.32) 46%,transparent 72%)',
            filter: 'blur(10px)',
          }}
        />

        <h1 aria-label="Monte Vinhedo" className="m-0">
          <span
            data-hero-monte
            aria-hidden="true"
            className="oculto-na-abertura absolute top-[var(--monte-topo)] left-1/2 z-[3] font-display text-[length:var(--monte)] leading-[.78] font-bold tracking-[-.01em] whitespace-nowrap text-creme"
            style={{ translate: '-50% 0' }}
          >
            MONTE
          </span>
          <span
            data-hero-vinhedo
            aria-hidden="true"
            className="oculto-na-abertura absolute top-[var(--vinhedo-topo)] left-1/2 z-[5] font-display text-[length:var(--vinhedo)] leading-[.9] tracking-[.3em] whitespace-nowrap text-creme"
            style={{ translate: '-50% 0', paddingLeft: '.3em' }}
          >
            VINHEDO
          </span>
        </h1>

        {/* garrafa: wrapper externo leva scroll + entrada, o interno leva o tilt */}
        <div
          data-garrafa-scroll
          className="oculto-na-abertura absolute top-[var(--garrafa-topo)] left-1/2 z-[4] h-[var(--garrafa-altura)]"
          style={{ translate: '-50% 0' }}
        >
          <div
            data-garrafa-tilt
            className="relative h-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Picture
              name="garrafa-hero-recorte"
              priority
              sizes="341px"
              className="h-full w-auto [filter:drop-shadow(0_48px_90px_rgba(0,0,0,.68))]"
            />

            {/* retalhos que apagam o mockup do rótulo */}
            {Object.entries(LABEL_PATCHES).map(([nome, caixa]) => (
              <picture key={nome}>
                <source type="image/avif" srcSet={`/img/${nome}.avif`} />
                <source type="image/webp" srcSet={`/img/${nome}.webp`} />
                <img
                  src={`/img/${nome}.png`}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute"
                  style={{
                    left: `${caixa.left}%`,
                    top: `${caixa.top}%`,
                    width: `${caixa.width}%`,
                    height: `${caixa.height}%`,
                  }}
                />
              </picture>
            ))}

            {/* o rótulo rebatizado, impresso por cima */}
            <div
              data-rotulo
              aria-hidden="true"
              className="oculto-na-abertura pointer-events-none absolute inset-x-0 text-center"
              style={{ top: '51.3%' }}
            >
              <span
                className="block font-display"
                style={{
                  fontSize: 'calc(var(--garrafa-altura) * 0.0204)',
                  letterSpacing: '.14em',
                  paddingLeft: '.14em',
                  backgroundImage: FOIL,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  filter: 'drop-shadow(0 1px 0 rgba(60,20,26,.55))',
                }}
              >
                MONTE VINHEDO
              </span>
              <span
                className="block"
                style={{
                  marginTop: 'calc(var(--garrafa-altura) * 0.0075)',
                  fontSize: 'calc(var(--garrafa-altura) * 0.0086)',
                  letterSpacing: '.3em',
                  paddingLeft: '.3em',
                  color: 'rgba(248,236,212,.82)',
                  filter: 'drop-shadow(0 1px 1px rgba(58,20,26,.6))',
                }}
              >
                VINHO FINO DE ALTITUDE
              </span>
            </div>

            {/* Luz correndo no vidro.
                Dois elementos de propósito: a máscara da silhueta fica no
                de fora, parado, e só o degradê desliza no de dentro. Mover
                o elemento mascarado levaria a máscara junto, e o brilho
                escaparia para fora do vidro. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{
                mixBlendMode: 'screen',
                WebkitMaskImage: 'url(/img/garrafa-silhueta.webp)',
                maskImage: 'url(/img/garrafa-silhueta.webp)',
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }}
            >
              <div data-reflexo className="absolute inset-0" style={{ background: REFLEXO }} />
            </div>
          </div>
        </div>

        {/* legenda: duas metades na mesma linha de base, flanqueando a garrafa.
            As margens iguais somadas ao `justify-center` abrem exatamente o
            vão da silhueta mais o respiro — nenhum texto cruza o vidro. */}
        <p
          className="absolute inset-x-0 z-[5] m-0 flex items-baseline justify-center"
          style={{ top: 'var(--legenda-topo)' }}
        >
          <span data-legenda-esq className="oculto-na-abertura legenda-hero">
            Vinhos finos de altitude
          </span>
          <span data-legenda-dir className="oculto-na-abertura legenda-hero">
            desde 1987
          </span>
        </p>
      </div>
    </header>
  );
}
