/**
 * Tokens de movimento — MOTION.md §"Tokens de movimento".
 *
 * Regra da direção de arte: nada de ease padrão. Movimento lento e pesado,
 * com peso de veludo. Toda animação do site sai daqui.
 */

export const EASE_ENTRADA = 'power4.out'; // entradas de texto e imagem
export const EASE_SAIDA = 'power2.inOut'; // saídas e transições de cor
export const EASE_SELO = 'back.out(1.4)'; // carimbo do selo de cera

export const DUR_LONGA = 1.4; // heros e imagens grandes
export const DUR_MEDIA = 0.9; // títulos de seção
export const DUR_CURTA = 0.6; // labels e detalhes

export const STAGGER_CHAR = 0.035; // letra por letra
export const STAGGER_LINHA = 0.12; // linha por linha

/** Cores de fundo que o body atravessa (ver `data-bg` nas seções). */
export const BG_BORDO = '#14080b';
export const BG_CREME = '#f2ead8';
