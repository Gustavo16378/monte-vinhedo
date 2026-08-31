import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

let instance: Lenis | null = null;

/** O Lenis vivo, se houver. `null` sob `prefers-reduced-motion: reduce`. */
export const getLenis = (): Lenis | null => instance;

/**
 * Inicialização única do Lenis + acoplamento ao ScrollTrigger
 * (MOTION.md §Setup). Chamar uma vez, no App.
 *
 * Sob `prefers-reduced-motion: reduce` o Lenis nem é criado: a rolagem
 * suavizada é ela própria movimento, e o scroll nativo é a resposta certa.
 */
export function useSmoothScroll(): void {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ScrollTrigger.refresh();
      return;
    }
    started.current = true;

    /**
     * Um gesto, um dono.
     *
     * Sem `syncTouch` o Lenis não toca no gesto de dedo: o toque continua
     * sendo rolagem nativa e o Lenis só assiste, reportando a posição. Isso
     * bastava até o divisor ganhar pin no mobile — a partir dali havia duas
     * coisas mexendo na página (o scroll nativo, com sua inércia própria, e
     * o pin conduzido por transform), e o pin ficava disputando posição com
     * um scroll que ele não controlava. É esse o tranco.
     *
     * Com `syncTouch` o Lenis passa a conduzir também o dedo, e volta a
     * haver um único mecanismo de rolagem na página inteira. Por isso, e não
     * por acaso, o divisor NÃO usa `ScrollTrigger.normalizeScroll()`: ele
     * seria o terceiro dono do mesmo gesto.
     *
     * `(pointer: coarse)` em vez de largura de tela de propósito — o que
     * decide não é o tamanho da janela, é a página ser rolada com o dedo.
     * Assim um celular deitado, com mais de 900px, continua do lado certo.
     */
    const porToque = window.matchMedia('(pointer: coarse)').matches;

    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.9,
      syncTouch: porToque,
    });
    instance = lenis;

    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      instance = null;
      started.current = false;
    };
  }, []);
}

/** Rolagem até uma âncora respeitando o Lenis (e o scroll nativo sem ele). */
export function scrollToSection(hash: string): void {
  const target = document.querySelector(hash);
  if (!target) return;
  if (instance) instance.scrollTo(target as HTMLElement, { duration: 1.6 });
  else target.scrollIntoView({ behavior: 'auto', block: 'start' });
}
