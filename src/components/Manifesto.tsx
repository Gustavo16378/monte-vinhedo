import { useRef } from 'react';
import { gsap, useGSAP, SplitText } from '../motion/gsap';
import { useAnimacoesLiberadas } from '../motion/prontidao';
import { DUR_CURTA, DUR_LONGA, DUR_MEDIA, EASE_ENTRADA, STAGGER_LINHA } from '../motion/tokens';
import { Picture } from './Picture';

/**
 * Manifesto — MOTION.md §4.
 *
 * A frase sobe palavra por palavra, e "paciência." chega 0,3s depois de
 * todas as outras: a piada visual de fazer a palavra exigir o que ela diz.
 */
export function Manifesto(): React.JSX.Element {
  const raiz = useRef<HTMLElement>(null);
  const liberado = useAnimacoesLiberadas();

  useGSAP(
    () => {
      if (!liberado) return;
      const el = raiz.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const [frase] = q('[data-manifesto-frase]');
      if (!frase) return;

      const split = SplitText.create(frase, {
        type: 'words',
        aria: 'auto',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            y: 40,
            opacity: 0,
            duration: DUR_MEDIA,
            ease: EASE_ENTRADA,
            // a última palavra é "paciência." — e ela se faz esperar
            stagger: (i, _alvo, lista) =>
              i * STAGGER_LINHA + (i === lista.length - 1 ? 0.3 : 0),
            scrollTrigger: { trigger: frase, start: 'top 70%' },
          }),
      });

      gsap.from(q('[data-manifesto-eyebrow]'), {
        opacity: 0,
        y: 16,
        duration: DUR_CURTA,
        ease: EASE_ENTRADA,
        scrollTrigger: { trigger: el, start: 'top 62%' },
      });

      gsap.from(q('[data-manifesto-ornamento]'), {
        opacity: 0,
        duration: DUR_CURTA,
        ease: EASE_ENTRADA,
        scrollTrigger: { trigger: '[data-manifesto-ornamento]', start: 'top 88%' },
      });

      // a faixa de rolhas se abre da esquerda para a direita
      gsap.from(q('[data-manifesto-rolhas]'), {
        clipPath: 'inset(0 100% 0 0)',
        duration: DUR_LONGA,
        ease: EASE_ENTRADA,
        scrollTrigger: { trigger: '[data-manifesto-rolhas]', start: 'top 88%' },
      });

      gsap.from(q('[data-manifesto-legenda]'), {
        opacity: 0,
        duration: DUR_CURTA,
        ease: EASE_ENTRADA,
        scrollTrigger: { trigger: '[data-manifesto-legenda]', start: 'top 92%' },
      });

      return () => split.revert();
    },
    { scope: raiz, dependencies: [liberado] },
  );

  return (
    <section
      id="manifesto"
      ref={raiz}
      data-bg="#f2ead8"
      className="flex flex-col items-center border-t border-dourado/45 px-[24px] pt-[clamp(96px,15vh,180px)] pb-[clamp(84px,12vh,150px)] pl-[clamp(64px,6vw,96px)] text-center text-bordo"
    >
      <p data-manifesto-eyebrow className="eyebrow-center m-0 mb-[44px] text-vinho">
        I · Manifesto
      </p>

      <h2
        data-manifesto-frase
        className="m-0 max-w-[16ch] font-display text-[clamp(40px,5.8vw,96px)] leading-[1.06] font-normal [text-wrap:balance]"
      >
        Toda safra começa com <em className="text-vinho">paciência.</em>
      </h2>

      <div
        data-manifesto-ornamento
        aria-hidden="true"
        className="mt-[56px] flex items-center gap-[22px] text-dourado"
      >
        <i className="block h-px w-[90px] bg-dourado/55" />
        <span className="text-[13px]">✦</span>
        <i className="block h-px w-[90px] bg-dourado/55" />
      </div>

      <figure className="mt-[56px] mb-0 w-[min(780px,86vw)]">
        <Picture
          name="rolhas"
          data-manifesto-rolhas
          className="h-[120px] w-full border border-vinho/20 object-cover [filter:sepia(.12)_saturate(.92)]"
        />
        <figcaption
          data-manifesto-legenda
          className="mt-[16px] text-[10.5px] tracking-[.3em] text-bordo/55 uppercase"
        >
          Guardamos as rolhas de todas as safras desde 1987
        </figcaption>
      </figure>
    </section>
  );
}
