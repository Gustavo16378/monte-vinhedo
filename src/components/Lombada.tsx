import { useRef } from 'react';
import { gsap, useGSAP } from '../motion/gsap';
import { DUR_CURTA, EASE_SAIDA } from '../motion/tokens';
import { CAPITULOS } from '../capitulos';
import { useCapituloAtivo } from '../motion/capituloAtivo';
import { TINTA, useTomFundo } from '../motion/tomFundo';
import { scrollToSection } from '../motion/useSmoothScroll';

/**
 * Lombada — navegação lateral fixa (MOTION.md §2).
 *
 * Correção sobre o export: os numerais ficam centralizados verticalmente na
 * altura da tela, e não empilhados embaixo. A logo vertical não anima — mas
 * troca de tinta junto com o fundo, senão some nas seções creme.
 *
 * Some abaixo de 900px, onde entra o <IndicadorCapitulo />.
 */
export function Lombada(): React.JSX.Element {
  const raiz = useRef<HTMLElement>(null);
  const ativo = useCapituloAtivo();
  const tom = useTomFundo();

  useGSAP(
    () => {
      const tinta = TINTA[tom];

      gsap.to(gsap.utils.toArray('[data-spine-logo]', raiz.current), {
        color: tinta.logo,
        duration: DUR_CURTA,
        ease: EASE_SAIDA,
      });

      gsap.utils.toArray<HTMLElement>('[data-numeral]', raiz.current).forEach((el, i) => {
        gsap.to(el, {
          color: i === ativo ? tinta.ativo : tinta.inativo,
          x: i === ativo ? 4 : 0,
          duration: DUR_CURTA,
          ease: EASE_SAIDA,
        });
      });
    },
    { scope: raiz, dependencies: [ativo, tom] },
  );

  const irPara = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    scrollToSection(hash);
  };

  return (
    <nav
      ref={raiz}
      aria-label="Capítulos"
      className="pointer-events-none fixed inset-y-0 left-0 z-[100] hidden w-[clamp(48px,4vw,64px)] lg:block"
    >
      <a
        data-spine-logo
        href="#topo"
        onClick={(e) => irPara(e, '#topo')}
        className="pointer-events-auto absolute top-[26px] left-1/2 rotate-180 text-[10.5px] font-medium tracking-[.42em] whitespace-nowrap uppercase hover:text-dourado!"
        style={{
          translate: '-50% 0',
          writingMode: 'vertical-rl',
          color: TINTA.bordo.logo,
          textShadow: '0 1px 6px rgba(20,8,11,.28)',
        }}
      >
        Monte Vinhedo
      </a>

      <ol
        className="pointer-events-auto absolute inset-x-0 top-1/2 m-0 flex list-none flex-col items-center gap-[26px] p-0"
        style={{ translate: '0 -50%', textShadow: '0 1px 6px rgba(20,8,11,.28)' }}
      >
        {CAPITULOS.map((c, i) => (
          <li key={c.id}>
            <a
              data-numeral
              href={`#${c.id}`}
              onClick={(e) => irPara(e, `#${c.id}`)}
              aria-current={i === ativo ? 'location' : undefined}
              // `!` importante de propósito: o GSAP escreve `color` inline nos
              // numerais, e só uma regra !important consegue vencer no hover.
              className="block text-[11px] tracking-[.1em] hover:text-dourado!"
              style={{ color: TINTA.bordo.inativo }}
            >
              <span className="sr-only">{`Capítulo ${c.numeral} — ${c.titulo}`}</span>
              <span aria-hidden="true">{c.numeral}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
