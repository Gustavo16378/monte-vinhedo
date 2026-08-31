import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin);

/**
 * O Chrome do Android recolhe e devolve a barra de URL durante o gesto de
 * rolagem, e cada uma dessas trocas é um `resize` de verdade — a altura do
 * viewport muda no meio do movimento. Sem isto, o ScrollTrigger trata cada
 * uma como mudança de layout e recalcula start/end de todos os triggers,
 * inclusive o do pin do divisor: era daí que vinha o fundo "puxando" e
 * travando em saltos enquanto as letras animavam.
 *
 * `ignoreMobileResize` faz o ScrollTrigger desprezar as mudanças de ALTURA
 * em telas de toque. Mudança de largura (rotação de tela) continua
 * disparando refresh, que é o caso em que recalcular é mesmo necessário.
 */
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin };

/**
 * Condições compartilhadas por todo `gsap.matchMedia()` do site.
 *
 * `motion` liga parallax, pin e scrub; `still` é o caminho de
 * `prefers-reduced-motion: reduce`, onde sobram só os fades.
 */
export const MQ = {
  desktop: '(min-width: 900px)',
  mobile: '(max-width: 899px)',
  motion: '(prefers-reduced-motion: no-preference)',
  still: '(prefers-reduced-motion: reduce)',
} as const;

export type MatchConditions = {
  readonly desktop: boolean;
  readonly mobile: boolean;
  readonly motion: boolean;
  readonly still: boolean;
};
