import { useSyncExternalStore } from 'react';
import { useGSAP, ScrollTrigger } from './gsap';
import { CAPITULOS } from '../capitulos';

/** Índice do capítulo em cena; -1 enquanto o hero ocupa a tela. */
let ativo = -1;
const ouvintes = new Set<() => void>();

function definir(indice: number): void {
  if (indice === ativo) return;
  ativo = indice;
  ouvintes.forEach((f) => f());
}

/**
 * Assina o capítulo em cena.
 *
 * Store externo em vez de contexto: só a Lombada e o indicador mobile
 * re-renderizam a cada troca, sem sacudir a árvore inteira — e nada
 * disso encosta nos estilos inline que o GSAP escreve.
 */
export const useCapituloAtivo = (): number =>
  useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => ativo,
    () => -1,
  );

/**
 * Cria os ScrollTriggers que marcam o capítulo corrente (MOTION.md §2).
 *
 * O capítulo vale do "top center" da sua âncora até o "top center" da
 * âncora seguinte — assim o IV continua aceso durante os três capítulos de
 * vinho e o divisor, que não têm âncora própria. Chamar uma vez, no App.
 */
export function useCapituloSpy(): void {
  useGSAP(() => {
    const ancoras = CAPITULOS.map((c) => document.getElementById(c.id));

    ancoras.forEach((el, i) => {
      if (!el) return;
      const proxima = ancoras[i + 1];

      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        ...(proxima ? { endTrigger: proxima, end: 'top center' } : { end: 'max' }),
        onToggle: (self) => {
          if (self.isActive) definir(i);
        },
        ...(i === 0 ? { onLeaveBack: () => definir(-1) } : {}),
      });
    });
  }, []);
}
