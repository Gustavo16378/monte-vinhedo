import { useRef, type RefObject } from 'react';
import { gsap, useGSAP } from '../../motion/gsap';
import { useAnimacoesLiberadas } from '../../motion/prontidao';
import { DUR_CURTA, DUR_LONGA, EASE_ENTRADA, STAGGER_LINHA } from '../../motion/tokens';
import { revelarChars, revelarLinhas } from '../../motion/reveal';

/**
 * A partitura comum aos três capítulos de vinho — MOTION.md §6.
 *
 *   [data-cap-label]    label "CAPÍTULO N", com clip-path de baixo pra cima
 *   [data-cap-nome]     nome do vinho, letra por letra
 *   [data-cap-moldura]  moldura com overflow hidden…
 *   [data-cap-foto]     …e a foto que anda dentro dela em scrub
 *   [data-cap-nota]     notas de degustação, linha por linha
 *   [data-cap-detalhe]  ficha técnica e preço, fade em sequência
 *
 * Devolve o ref para pendurar na <section>.
 */
export function useCapituloVinho(): RefObject<HTMLElement | null> {
  const raiz = useRef<HTMLElement>(null);
  const liberado = useAnimacoesLiberadas();

  useGSAP(
    () => {
      if (!liberado) return;
      const el = raiz.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const splits: { revert: () => void }[] = [];

      gsap.from(q('[data-cap-label]'), {
        clipPath: 'inset(100% 0 0 0)',
        duration: DUR_CURTA,
        ease: EASE_ENTRADA,
        scrollTrigger: { trigger: el, start: 'top 70%' },
      });

      const [nome] = q('[data-cap-nome]');
      if (nome) splits.push(revelarChars(nome, { scrollTrigger: { start: 'top 82%' } }));

      const [nota] = q('[data-cap-nota]');
      if (nota) splits.push(revelarLinhas(nota, { scrollTrigger: { start: 'top 84%' } }));

      gsap.from(q('[data-cap-detalhe]'), {
        opacity: 0,
        y: 20,
        duration: DUR_CURTA,
        ease: EASE_ENTRADA,
        stagger: STAGGER_LINHA,
        scrollTrigger: { trigger: el, start: 'top 46%' },
      });

      const mm = gsap.matchMedia();

      // A foto "anda" dentro da moldura — quem se move é a imagem, não o quadro.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const foto = q('[data-cap-foto]');
        if (!foto.length) return;
        gsap.set(foto, { willChange: 'transform' });
        const tw = gsap.fromTo(
          foto,
          { yPercent: -12 },
          {
            yPercent: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: q('[data-cap-moldura]')[0] ?? el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
        return () => {
          tw.kill();
          gsap.set(foto, { willChange: 'auto' });
        };
      });

      gsap.from(q('[data-cap-moldura]'), {
        opacity: 0,
        duration: DUR_LONGA,
        ease: EASE_ENTRADA,
        scrollTrigger: { trigger: el, start: 'top 72%' },
      });

      return () => {
        splits.forEach((s) => s.revert());
        mm.revert();
      };
    },
    { scope: raiz, dependencies: [liberado] },
  );

  return raiz;
}
