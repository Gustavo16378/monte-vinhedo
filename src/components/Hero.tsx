import { useRef } from 'react';
import { gsap, useGSAP, type MatchConditions } from '../motion/gsap';
import { DUR_CURTA, DUR_LONGA, DUR_MEDIA, EASE_ENTRADA, STAGGER_CHAR } from '../motion/tokens';
import { revelarChars } from '../motion/reveal';
import { LABEL_PATCHES } from '../assets/images';
import { Picture } from './Picture';

type HeroProps = {
  /** o preloader já saiu de cena? a timeline de entrada espera por isso */
  readonly pronto: boolean;
};

/**
 * Hero — MOTION.md §1.
 *
 * Sanduíche de camadas: MONTE atrás (z-3), garrafa no meio (z-4) e VINHEDO
 * na frente (z-5), cada uma com sua velocidade de parallax. O empilhamento
 * é o do export; o que muda no mobile é a proporção, não a receita.
 */
export function Hero({ pronto }: HeroProps): React.JSX.Element {
  const raiz = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!pronto) return;
      const el = raiz.current;
      if (!el) return;

      const q = gsap.utils.selector(el);
      const [monte] = q('[data-hero-monte]');
      const [vinhedo] = q('[data-hero-vinhedo]');
      if (!monte || !vinhedo) return;

      const mm = gsap.matchMedia();

      // ---------------------------------------------------------- entrada
      const tl = gsap.timeline({ defaults: { ease: EASE_ENTRADA } });

      tl.from(q('[data-hero-fundo]'), { scale: 1.08, opacity: 0, duration: DUR_LONGA }, 0);

      const splits = [
        revelarChars(monte, { duration: DUR_MEDIA, timeline: tl, at: 0.25 }),
        // VINHEDO entra quando a garrafa está a 60% do caminho
        revelarChars(vinhedo, { duration: DUR_MEDIA, timeline: tl, at: 1.0 }),
      ];

      tl.from(
        q('[data-hero-garrafa]'),
        { y: 60, opacity: 0, duration: DUR_LONGA },
        // sobreposto ao fim do MONTE: -0.4 relativo ao seu término
        `>-${(0.4 + STAGGER_CHAR * 5).toFixed(2)}`,
      ).from(q('[data-hero-legenda]'), { opacity: 0, duration: DUR_CURTA }, '>-0.2');

      // --------------------------------------------------------- parallax
      // As quatro velocidades que dão profundidade real ao sanduíche.
      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)' },
        (ctx) => {
          if (!(ctx.conditions as Pick<MatchConditions, 'motion'>).motion) return;

          const camadas: readonly (readonly [string, number])[] = [
            ['[data-hero-fundo]', 10],
            ['[data-hero-monte]', -18],
            ['[data-hero-garrafa]', -8],
            ['[data-hero-vinhedo]', -26],
          ];

          const alvos = camadas.flatMap(([sel]) => q(sel));
          gsap.set(alvos, { willChange: 'transform' });

          camadas.forEach(([sel, yPercent]) => {
            gsap.to(q(sel), {
              yPercent,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
            });
          });

          return () => gsap.set(alvos, { willChange: 'auto' });
        },
        raiz,
      );

      return () => {
        splits.forEach((s) => s.revert());
        mm.revert();
      };
    },
    { scope: raiz, dependencies: [pronto] },
  );

  return (
    <header
      id="topo"
      ref={raiz}
      data-bg="#14080b"
      className="hero-altura hero-escala relative overflow-hidden"
    >
      <div data-hero-fundo className="absolute inset-0 z-[1]">
        <Picture
          name="vinhedo-nevoa"
          priority
          sizes="100vw"
          className="h-full w-full object-cover [filter:saturate(.75)]"
        />
      </div>

      {/* Os dois véus do export, empilhados: juntos é que dão o bordô profundo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2]"
        style={{
          background:
            'linear-gradient(180deg,rgba(20,8,11,.8) 0%,rgba(114,32,54,.58) 46%,rgba(20,8,11,.94) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2]"
        style={{
          background:
            'linear-gradient(180deg,rgba(20,8,11,.58) 0%,rgba(114,32,54,.36) 46%,rgba(20,8,11,.82) 100%)',
        }}
      />

      <h1 aria-label="Monte Vinhedo" className="m-0">
        <span
          data-hero-monte
          aria-hidden="true"
          className="absolute top-[var(--monte-topo)] left-1/2 z-[3] font-display text-[length:var(--monte)] leading-[.78] font-bold tracking-[-.01em] whitespace-nowrap text-creme"
          style={{ translate: '-50% 0' }}
        >
          MONTE
        </span>
        <span
          data-hero-vinhedo
          aria-hidden="true"
          className="absolute top-[var(--vinhedo-topo)] left-1/2 z-[5] font-display text-[length:var(--vinhedo)] leading-[.9] tracking-[.3em] whitespace-nowrap text-creme"
          style={{ translate: '-50% 0', paddingLeft: '.3em' }}
        >
          VINHEDO
        </span>
      </h1>

      {/* Wrapper da garrafa: os retalhos do rótulo vivem aqui dentro, em %,
          para acompanharem o parallax e qualquer transform futura. */}
      <div
        data-hero-garrafa
        className="absolute top-[var(--garrafa-topo)] left-1/2 z-[4] h-[var(--garrafa-altura)]"
        style={{ translate: '-50% 0' }}
      >
        <div className="relative h-full">
          <Picture
            name="garrafa-hero-recorte"
            priority
            sizes="341px"
            className="h-full w-auto [filter:drop-shadow(0_48px_90px_rgba(0,0,0,.68))]"
          />
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
        </div>
      </div>

      <p
        data-hero-legenda
        className="absolute inset-x-0 z-[5] m-0 flex items-center justify-center top-[calc(var(--vinhedo-topo)+var(--legenda-offset))]"
      >
        {/* no mobile o corpo e o tracking encolhem para a linha caber inteira:
            cortar as pontas dela não é sangria de propósito, é defeito */}
        <span className="pl-[.26em] text-[9.5px] font-normal tracking-[.26em] whitespace-nowrap text-dourado uppercase lg:pl-[.5em] lg:text-[12px] lg:tracking-[.5em]">
          Vinhos finos de altitude · desde 1987
        </span>
      </p>
    </header>
  );
}
