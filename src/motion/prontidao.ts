import { useSyncExternalStore } from 'react';
import { ScrollTrigger } from './gsap';

/**
 * Interruptor único para o preparo das animações abaixo da dobra.
 *
 * Montar tudo no primeiro frame custa caro: cada SplitText força layout, e são
 * dez blocos de texto mais umas quarenta ScrollTriggers. Durante o preloader
 * nada disso está à vista, então esse trabalho espera — primeiro o hero
 * respira, depois o resto se arma num tempo ocioso.
 */
let liberado = false;
const ouvintes = new Set<() => void>();

export function liberarAnimacoes(): void {
  if (liberado) return;
  liberado = true;
  ouvintes.forEach((f) => f());

  // Um refresh depois que TODAS as seções se armaram.
  //
  // O pin do divisor nasce agora, e ele empurra 120vh de rolagem para baixo de
  // tudo que vem depois. Os ScrollTriggers de `data-bg`, criados lá na
  // montagem, calcularam suas posições sem esse empurrão — sem este refresh a
  // Visite e o rodapé ficam 1080px adiantados, e o fundo vira bordô com a
  // Visite ainda em cena (texto bordô sobre bordô). Dois rAF: o primeiro deixa
  // o React aplicar o re-render, o segundo garante o layout já assentado.
  requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
}

/** Agenda a liberação para o primeiro tempo ocioso depois do hero. */
export function agendarLiberacao(): () => void {
  const idle = window.requestIdleCallback;
  if (typeof idle === 'function') {
    const id = idle(() => liberarAnimacoes(), { timeout: 1200 });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(liberarAnimacoes, 200);
  return () => window.clearTimeout(id);
}

export const useAnimacoesLiberadas = (): boolean =>
  useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => liberado,
    () => false,
  );
