import { useRef } from 'react';
import { gsap, useGSAP } from '../motion/gsap';
import { DUR_CURTA, EASE_SAIDA } from '../motion/tokens';
import { CAPITULOS } from '../capitulos';
import { useCapituloAtivo } from '../motion/capituloAtivo';
import { useTomFundo } from '../motion/tomFundo';

/** A pastilha inverte junto com o fundo para não virar um borrão cinza. */
const PASTILHA = {
  bordo: { background: 'rgba(20,8,11,.42)', color: 'rgba(242,234,216,.85)' },
  creme: { background: 'rgba(242,234,216,.55)', color: 'rgba(20,8,11,.72)' },
} as const;

/**
 * Indicador de capítulo do mobile.
 *
 * Substitui a Lombada abaixo de 900px. Sem menu hambúrguer: o site é uma
 * página só, de rolagem contínua — o que falta ali não é navegação, é
 * saber em que capítulo se está. Aparece a partir do capítulo I e troca de
 * texto com um fade curto.
 */
export function IndicadorCapitulo(): React.JSX.Element {
  const raiz = useRef<HTMLDivElement>(null);
  const ativo = useCapituloAtivo();
  const tom = useTomFundo();
  const capitulo = CAPITULOS[ativo];

  useGSAP(
    () => {
      const el = raiz.current;
      if (!el) return;
      gsap.to(el, {
        autoAlpha: capitulo ? 1 : 0,
        y: capitulo ? 0 : -8,
        duration: DUR_CURTA,
        ease: EASE_SAIDA,
      });
      gsap.to(el.querySelector('p'), { ...PASTILHA[tom], duration: DUR_CURTA, ease: EASE_SAIDA });
    },
    { scope: raiz, dependencies: [ativo, tom] },
  );

  return (
    <div
      ref={raiz}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center pt-[14px] opacity-0 lg:hidden"
    >
      <p
        className="m-0 rounded-full px-[14px] py-[6px] text-[9.5px] tracking-[.32em] uppercase backdrop-blur-[2px]"
        style={{ ...PASTILHA.bordo, paddingLeft: 'calc(14px + .32em)' }}
      >
        {capitulo ? `${capitulo.numeral} · ${capitulo.titulo}` : ''}
      </p>
    </div>
  );
}
