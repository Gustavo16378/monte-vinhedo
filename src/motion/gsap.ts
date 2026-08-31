import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin);

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
