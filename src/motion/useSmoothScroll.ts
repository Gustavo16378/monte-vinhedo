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

    const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9 });
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
