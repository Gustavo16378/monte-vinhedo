import { Picture } from '../Picture';
import { useCapituloVinho } from './useCapituloVinho';

/**
 * Capítulo III · Branco das Neblinas.
 *
 * Centrado e claro: é aqui que o fundo do body vira creme (`data-bg`), a
 * virada de luz que MOTION.md §6 pede junto com o capítulo do Branco.
 */
export function CapituloBranco(): React.JSX.Element {
  const raiz = useCapituloVinho();

  return (
    <section
      ref={raiz}
      data-bg="#f2ead8"
      aria-labelledby="vinho-branco"
      className="border-t border-dourado/45 px-[24px] py-[clamp(100px,16vh,200px)] pl-[clamp(24px,6vw,96px)] text-center text-bordo"
    >
      <div className="mx-auto max-w-[1080px]">
        <p data-cap-label className="eyebrow-center m-0 mb-[28px] text-vinho">
          Capítulo III · Branco · 2023
        </p>
        <h3
          id="vinho-branco"
          data-cap-nome
          className="m-0 font-display text-[clamp(52px,7.5vw,140px)] leading-[.98] font-normal [text-wrap:balance]"
        >
          Branco das Neblinas
        </h3>
        <p
          data-cap-detalhe
          className="mt-[24px] mb-0 font-display text-[clamp(18px,1.8vw,26px)] italic text-vinho"
        >
          colhido à noite, sob a névoa
        </p>

        <figure className="mx-auto mt-[48px] mb-0 w-[min(640px,78vw)] border border-vinho/35 p-[16px]">
          <div
            data-cap-moldura
            className="h-[min(48vh,420px)] overflow-hidden lg:h-[min(64vh,620px)]"
          >
            <Picture
              name="garrafa-por-do-sol"
              data-cap-foto
              className="h-[112%] w-full object-cover"
            />
          </div>
        </figure>

        <p
          data-cap-detalhe
          className="mt-[44px] mb-0 flex flex-wrap items-center justify-center gap-[24px] text-[12px] tracking-[.3em] text-bordo/68 uppercase"
        >
          <span>Flor branca</span>
          <span aria-hidden="true" className="text-[11px] text-vinho">
            ✦
          </span>
          <span>Pêssego</span>
          <span aria-hidden="true" className="text-[11px] text-vinho">
            ✦
          </span>
          <span>Pedra molhada</span>
        </p>
        <p data-cap-detalhe className="mt-[26px] mb-0 font-display text-[19px] italic text-bordo/68">
          Chardonnay de parcela única · 40 caixas por safra
        </p>
        <p data-cap-detalhe className="mt-[26px] mb-0 font-display text-[26px] italic text-vinho">
          R$ 129
        </p>

        <div
          data-cap-detalhe
          aria-hidden="true"
          className="mx-auto mt-[56px] flex w-[180px] flex-col gap-[4px]"
        >
          <i className="block h-px bg-vinho/40" />
          <i className="block h-px bg-vinho/40" />
        </div>
      </div>
    </section>
  );
}
