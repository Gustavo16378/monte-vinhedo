import { useRef, useState } from 'react';
import { gsap, useGSAP } from '../motion/gsap';
import { EASE_SAIDA } from '../motion/tokens';
import { MONOGRAM_M, MONOGRAM_V, MONOGRAM_VIEWBOX } from '../assets/monogram';
import { getLenis } from '../motion/useSmoothScroll';

const CHAVE_SESSAO = 'mv:preloader';

/** Já rodou nesta sessão? Lido de forma síncrona, antes do primeiro paint. */
export function preloaderJaRodou(): boolean {
  try {
    return sessionStorage.getItem(CHAVE_SESSAO) === '1';
  } catch {
    return false; // modo privado / storage bloqueado: mostra, sem quebrar
  }
}

type PreloaderProps = {
  /** dispara quando a cortina termina de subir — é a deixa do hero */
  readonly onDone: () => void;
};

/**
 * Preloader — MOTION.md §0.
 *
 * Monograma MV traçado com DrawSVG sobre bordô cheio, a frase surgindo a 50%
 * de opacidade, e a saída como uma cortina que sobe em `clip-path`.
 * Teto de 2,8s, uma vez por sessão.
 */
export function Preloader({ onDone }: PreloaderProps): React.JSX.Element | null {
  const raiz = useRef<HTMLDivElement>(null);
  const [saiu, setSaiu] = useState(false);

  useGSAP(
    () => {
      const el = raiz.current;
      if (!el) return;

      getLenis()?.stop();

      const encerrar = () => {
        try {
          sessionStorage.setItem(CHAVE_SESSAO, '1');
        } catch {
          /* storage indisponível: só não memoriza a sessão */
        }
        getLenis()?.start();
        setSaiu(true);
        onDone();
      };

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        // sem traço, sem cortina: só o fade que a diretriz preserva
        const tl = gsap.timeline({ onComplete: encerrar });
        tl.set('[data-preloader-traco]', { drawSVG: '100%' })
          .to('[data-preloader-frase]', { opacity: 0.5, duration: 0.3 })
          .to(el, { opacity: 0, duration: 0.4, ease: EASE_SAIDA }, '+=0.2');
        return () => tl.kill();
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ onComplete: encerrar });

        tl.fromTo(
          '[data-preloader-traco]',
          { drawSVG: '0%' },
          { drawSVG: '100%', duration: 1.6, ease: EASE_SAIDA, stagger: 0.18 },
        )
          .to('[data-preloader-frase]', { opacity: 0.5, duration: 0.8, ease: EASE_SAIDA }, 0.7)
          // a cortina sobe montada no fim do traço: o total fecha em ~2,7s
          .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: EASE_SAIDA }, 1.7);

        return () => tl.kill();
      });

      return () => mm.revert();
    },
    { scope: raiz, dependencies: [onDone] },
  );

  if (saiu) return null;

  return (
    <div
      ref={raiz}
      aria-hidden="true"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bordo"
      style={{ clipPath: 'inset(0 0 0% 0)' }}
    >
      <svg
        viewBox={MONOGRAM_VIEWBOX}
        className="w-[clamp(180px,26vw,300px)]"
        fill="none"
        stroke="var(--color-dourado)"
        strokeWidth={12}
        strokeLinejoin="round"
      >
        <path data-preloader-traco d={MONOGRAM_M} />
        <path data-preloader-traco d={MONOGRAM_V} />
      </svg>

      <p
        data-preloader-frase
        className="mt-[clamp(28px,4vh,44px)] text-[11px] tracking-[0.42em] text-creme uppercase opacity-0"
        style={{ paddingLeft: '0.42em' }}
      >
        toda safra começa com paciência
      </p>
    </div>
  );
}
