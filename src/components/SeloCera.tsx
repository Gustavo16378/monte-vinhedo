import { useRef } from 'react';
import { gsap, useGSAP } from '../motion/gsap';
import { EASE_SAIDA, EASE_SELO } from '../motion/tokens';
import { scrollToSection } from '../motion/useSmoothScroll';

const CERA =
  'radial-gradient(circle at 36% 30%,#8d2c46 0%,#722036 52%,#57162a 100%)';
const RELEVO =
  'inset 0 2px 7px rgba(242,234,216,.22),inset 0 -8px 16px rgba(20,8,11,.5),0 14px 32px rgba(114,32,54,.35)';

/**
 * Selo de cera — MOTION.md §8.
 *
 * Entrada de carimbo (scale 1.6 → 1, com um tranco de rotação), texto
 * circular girando sem parar e, no hover, o giro acelera.
 *
 * A regra da partitura: nunca parar o giro abruptamente. Entrando ou saindo
 * do hover, quem é animado é o `timeScale` da timeline — a rotação em si
 * nunca corta.
 */
export function SeloCera(): React.JSX.Element {
  const raiz = useRef<HTMLAnchorElement>(null);
  const giro = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      const el = raiz.current;
      if (!el) return;
      const anel = el.querySelector('[data-selo-giro]');
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const carimbo = gsap.from(el, {
          scale: 1.6,
          opacity: 0,
          rotation: -3,
          duration: 0.7,
          ease: EASE_SELO,
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });

        giro.current = gsap.to(anel, {
          rotation: 360,
          svgOrigin: '92 92',
          duration: 24,
          ease: 'none',
          repeat: -1,
        });

        return () => {
          carimbo.kill();
          giro.current?.kill();
          giro.current = null;
        };
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        const tw = gsap.from(el, {
          opacity: 0,
          duration: 0.6,
          ease: EASE_SAIDA,
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
        return () => tw.kill();
      });

      return () => mm.revert();
    },
    { scope: raiz },
  );

  const acelerar = (fator: number) => {
    if (giro.current) gsap.to(giro.current, { timeScale: fator, duration: 0.4, ease: EASE_SAIDA });
    if (raiz.current) {
      gsap.to(raiz.current, { scale: fator > 1 ? 1.05 : 1, duration: 0.3, ease: EASE_SAIDA });
    }
  };

  return (
    <a
      ref={raiz}
      href="#visite"
      aria-label="Agende sua visita"
      onClick={(e) => {
        e.preventDefault();
        scrollToSection('#visite');
      }}
      onMouseEnter={() => acelerar(3)}
      onMouseLeave={() => acelerar(1)}
      onFocus={() => acelerar(3)}
      onBlur={() => acelerar(1)}
      className="relative mt-[48px] inline-flex h-[184px] w-[184px] items-center justify-center rounded-full"
      style={{ background: CERA, boxShadow: RELEVO }}
    >
      <span
        aria-hidden="true"
        className="font-display text-[52px] leading-none font-bold text-dourado"
      >
        MV
      </span>
      <svg
        viewBox="0 0 184 184"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <path id="mv-selo-arc" d="M 92,21 a 71,71 0 1,1 -0.01,0" />
        </defs>
        <g data-selo-giro>
          <text
            className="font-sans"
            style={{ fontSize: '10.5px', letterSpacing: '4px', fill: 'var(--color-dourado)' }}
          >
            <textPath href="#mv-selo-arc">AGENDE SUA VISITA ✦ AGENDE SUA VISITA ✦</textPath>
          </text>
        </g>
      </svg>
    </a>
  );
}
