import { useRef } from 'react';
import { gsap, useGSAP } from '../motion/gsap';
import { useAnimacoesLiberadas } from '../motion/prontidao';
import { DUR_MEDIA, EASE_ENTRADA, EASE_SAIDA, STAGGER_LINHA } from '../motion/tokens';
import { scrollToSection } from '../motion/useSmoothScroll';

const ATALHOS = [
  { href: '#terroir', texto: 'II · Terroir' },
  { href: '#vinhos', texto: 'IV · Vinhos' },
  { href: '#visite', texto: 'V · Visite' },
  { href: '#topo', texto: '@montevinhedo' },
] as const;

/**
 * Contra-rótulo — MOTION.md §9.
 *
 * A moldura dourada é um path SVG traçado com DrawSVG em vez de um `border`,
 * para que ela realmente se desenhe: começa no canto superior esquerdo e
 * fecha os quatro lados no sentido horário. O conteúdo entra em cascata de
 * cima pra baixo. Discreto — é o fim da degustação.
 */
export function Footer(): React.JSX.Element {
  const raiz = useRef<HTMLElement>(null);
  const liberado = useAnimacoesLiberadas();

  useGSAP(
    () => {
      if (!liberado) return;
      const el = raiz.current;
      if (!el) return;
      const q = gsap.utils.selector(el);

      gsap.fromTo(
        q('[data-footer-moldura]'),
        { drawSVG: '0%' },
        {
          drawSVG: '100%',
          duration: 1.2,
          ease: EASE_SAIDA,
          scrollTrigger: { trigger: el, start: 'top 82%' },
        },
      );

      gsap.from(q('[data-footer-linha]'), {
        opacity: 0,
        y: 16,
        duration: DUR_MEDIA,
        ease: EASE_ENTRADA,
        stagger: STAGGER_LINHA,
        scrollTrigger: { trigger: el, start: 'top 78%' },
      });
    },
    { scope: raiz, dependencies: [liberado] },
  );

  return (
    <footer
      ref={raiz}
      data-bg="#14080b"
      className="px-[20px] py-[clamp(70px,11vh,130px)] pl-[24px] text-creme lg:pr-[clamp(20px,5vw,80px)] lg:pl-[clamp(64px,6vw,92px)]"
    >
      <div className="relative mx-auto max-w-[720px] px-[clamp(24px,6vw,72px)] py-[clamp(44px,7vw,84px)] text-center">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            data-footer-moldura
            d="M0 0 H100 V100 H0 Z"
            fill="none"
            stroke="rgba(201,164,92,.55)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <p data-footer-linha aria-hidden="true" className="m-0 mb-[24px] text-[13px] text-dourado">
          ✦
        </p>
        <p
          data-footer-linha
          className="m-0 font-display text-[clamp(34px,4.2vw,62px)] leading-none font-normal"
        >
          Monte <em className="text-dourado">Vinhedo</em>
        </p>
        <p
          data-footer-linha
          className="mt-[20px] mb-0 text-[10px] tracking-[.42em] text-dourado uppercase"
          style={{ paddingLeft: '.42em' }}
        >
          Vinhos finos de altitude · desde 1987
        </p>

        <i
          data-footer-linha
          aria-hidden="true"
          className="mx-auto my-[36px] block h-px w-[120px] bg-dourado/40"
        />

        <address
          data-footer-linha
          className="m-0 text-[11px] leading-[2.2] tracking-[.24em] text-creme/60 uppercase not-italic"
        >
          Estrada do Contestado, km 18
          <br />
          São Joaquim — Santa Catarina · Brasil
          <br />
          <a href="mailto:contato@montevinhedo.com.br" className="text-dourado hover:text-creme">
            contato@montevinhedo.com.br
          </a>
        </address>

        <nav
          data-footer-linha
          aria-label="Atalhos"
          className="mt-[34px] flex flex-wrap justify-center gap-[clamp(18px,2.6vw,34px)] text-[10.5px] tracking-[.28em] uppercase"
        >
          {ATALHOS.map(({ href, texto }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(href);
              }}
              className="text-dourado hover:text-creme"
            >
              {texto}
            </a>
          ))}
        </nav>

        <i
          data-footer-linha
          aria-hidden="true"
          className="mx-auto my-[36px] block h-px w-[120px] bg-dourado/40"
        />

        <p data-footer-linha className="m-0 text-[9.5px] leading-[2] tracking-[.2em] text-creme/42 uppercase">
          750 ml · Vinho fino de altitude · Contém sulfitos
          <br />
          Aprecie com moderação · Venda proibida para menores de 18 anos
        </p>
        <p
          data-footer-linha
          className="mt-[22px] mb-0 text-[9px] tracking-[.3em] text-creme/30 uppercase"
        >
          © 2026 Monte Vinhedo
        </p>
      </div>
    </footer>
  );
}
