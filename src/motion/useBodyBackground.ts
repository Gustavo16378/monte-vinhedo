import { gsap, useGSAP, ScrollTrigger } from './gsap';
import { BG_BORDO, EASE_SAIDA } from './tokens';
import { definirTom } from './tomFundo';

/**
 * O truque que costura o site inteiro (MOTION.md §3).
 *
 * As seções não têm background próprio: quem transiciona entre #14080b e
 * #f2ead8 é o body, lendo o `data-bg` de cada seção. A cor "viaja" por baixo
 * do conteúdo em vez de trocar em degraus.
 *
 * Continua valendo sob `prefers-reduced-motion` — é troca de cor, não
 * deslocamento; só a duração encolhe para quase um corte.
 */
export function useBodyBackground(): void {
  useGSAP(() => {
    gsap.set(document.body, { backgroundColor: BG_BORDO });

    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = suave ? 0.8 : 0.15;

    const paraCor = (cor: string) => () => {
      // a lombada e o indicador acompanham a virada: são fixos, a cor é que anda
      definirTom(cor);
      gsap.to(document.body, { backgroundColor: cor, duration, ease: EASE_SAIDA });
    };

    gsap.utils.toArray<HTMLElement>('[data-bg]').forEach((sec) => {
      const cor = sec.dataset['bg'];
      if (!cor) return;
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 55%',
        end: 'bottom 55%',
        onEnter: paraCor(cor),
        onEnterBack: paraCor(cor),
      });
    });
  }, []);
}
