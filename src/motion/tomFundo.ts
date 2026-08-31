import { useSyncExternalStore } from 'react';
import { BG_CREME } from './tokens';

/** Que cor o body está exibindo agora, sob os elementos fixos. */
export type Tom = 'bordo' | 'creme';

let tom: Tom = 'bordo';
const ouvintes = new Set<() => void>();

/** Chamado pelos ScrollTriggers de `data-bg` (ver useBodyBackground). */
export function definirTom(cor: string): void {
  const novo: Tom = cor.trim().toLowerCase() === BG_CREME ? 'creme' : 'bordo';
  if (novo === tom) return;
  tom = novo;
  ouvintes.forEach((f) => f());
}

/**
 * Assina o tom do fundo.
 *
 * A Lombada e o indicador de capítulo são fixos: ficam parados enquanto a cor
 * do body viaja por baixo deles. Sem isto, a lombada creme desaparece assim
 * que uma seção creme entra — é o mesmo problema que o `data-spine` do export
 * resolvia com as variáveis `{{ spineInk }}` e `{{ c1..c5 }}`.
 */
export const useTomFundo = (): Tom =>
  useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => tom,
    () => 'bordo' as const,
  );

/** Paleta da lombada para cada tom de fundo. */
export const TINTA = {
  bordo: { logo: '#f2ead8', inativo: 'rgba(242,234,216,.4)', ativo: '#c9a45c' },
  // Sobre creme o dourado a 11px fica fraco demais para marcar o capítulo
  // corrente; o vinho é o acento que o próprio export usa nas seções claras.
  creme: { logo: '#14080b', inativo: 'rgba(20,8,11,.42)', ativo: '#722036' },
} as const satisfies Record<Tom, { logo: string; inativo: string; ativo: string }>;
