import { useRef } from 'react';
import { gsap, useGSAP } from '../motion/gsap';
import { useAnimacoesLiberadas } from '../motion/prontidao';
import { revelarBloco, revelarChars } from '../motion/reveal';
import { CapituloTinto } from './vinhos/CapituloTinto';
import { CapituloRose } from './vinhos/CapituloRose';
import { CapituloBranco } from './vinhos/CapituloBranco';

/**
 * Os Vinhos — a abertura do capítulo IV e os três capítulos que a seguem.
 *
 * A âncora `#vinhos` fica só nesta abertura; a Lombada mantém o IV aceso
 * durante os três capítulos e o divisor, que não têm âncora própria
 * (ver `useCapituloSpy`).
 */
export function Vinhos(): React.JSX.Element {
  const raiz = useRef<HTMLElement>(null);
  const liberado = useAnimacoesLiberadas();

  useGSAP(
    () => {
      if (!liberado) return;
      const el = raiz.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const [titulo] = q('[data-vinhos-titulo]');
      const split = titulo ? revelarChars(titulo, { scrollTrigger: { start: 'top 80%' } }) : null;

      revelarBloco(q('[data-vinhos-linha]'), { trigger: el, start: 'top 72%' });

      return () => split?.revert();
    },
    { scope: raiz, dependencies: [liberado] },
  );

  return (
    <>
      <section
        id="vinhos"
        ref={raiz}
        data-bg="#14080b"
        className="px-[24px] pt-[clamp(90px,14vh,170px)] pb-0 pl-[24px] text-center lg:pl-[clamp(64px,6vw,96px)]"
      >
        <p
          data-vinhos-linha
          aria-hidden="true"
          className="m-0 mb-[26px] font-display text-[26px] text-dourado"
        >
          {'{ '}
          <span className="text-[15px]">✦</span>
          {' }'}
        </p>
        <p data-vinhos-linha className="eyebrow-center m-0 mb-[26px] text-dourado">
          IV · Os Vinhos
        </p>
        <h2
          data-vinhos-titulo
          className="m-0 font-display text-[clamp(44px,5vw,84px)] leading-none font-normal text-creme"
        >
          Os Vinhos
        </h2>
        <p
          data-vinhos-linha
          className="mt-[22px] mb-0 font-display text-[clamp(17px,1.6vw,23px)] italic text-creme/65"
        >
          três capítulos de uma mesma montanha
        </p>
      </section>

      <CapituloTinto />
      <CapituloRose />
      <CapituloBranco />
    </>
  );
}
