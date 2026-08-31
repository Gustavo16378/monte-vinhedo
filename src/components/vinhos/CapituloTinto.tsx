import { Picture } from '../Picture';
import { useCapituloVinho } from './useCapituloVinho';

/**
 * Capítulo I · Reserva Alma.
 *
 * Texto à esquerda, foto à direita. O título estoura a coluna para a direita
 * (`width: calc(100% + …)`) e passa por cima da foto — é do export, e é o que
 * dá a assimetria do capítulo.
 */
export function CapituloTinto(): React.JSX.Element {
  const raiz = useCapituloVinho();

  return (
    <section
      ref={raiz}
      data-bg="#14080b"
      aria-labelledby="vinho-tinto"
      className="flex flex-wrap items-center overflow-hidden pt-[clamp(70px,12vh,150px)]"
    >
      <div className="relative z-[2] min-w-0 flex-[1_1_min(460px,100%)] pr-[20px] pb-[clamp(40px,8vh,90px)] pl-[24px] lg:pr-0 lg:pl-[clamp(72px,7vw,110px)]">
        <p data-cap-label className="eyebrow m-0 mb-[28px] text-dourado">
          Capítulo I · Tinto · 2021
        </p>
        <h3
          id="vinho-tinto"
          data-cap-nome
          className="m-0 mb-[34px] font-display text-[clamp(64px,9.5vw,180px)] leading-[.92] font-bold text-creme lg:w-[calc(100%+clamp(0px,calc(100vw-880px),240px))]"
        >
          Reserva <em className="font-bold text-dourado">Alma</em>
        </h3>
        <p
          data-cap-nota
          className="m-0 mb-[34px] max-w-[38ch] text-[15.5px] leading-[1.8] font-light text-creme/72"
        >
          Amora madura, cacau e pimenta-do-reino. Catorze meses em barrica de carvalho francês,
          engarrafado sem filtragem.
        </p>
        <p
          data-cap-detalhe
          className="m-0 text-[11px] tracking-[.3em] text-dourado/75 uppercase"
        >
          Pinot Noir · 1.200 m · guarda de 12 anos
        </p>
        <p data-cap-detalhe className="mt-[30px] mb-0 font-display text-[26px] italic text-dourado">
          R$ 189
        </p>
      </div>

      <figure className="z-[1] m-0 min-w-0 flex-[1_1_min(420px,100%)]">
        <div
          data-cap-moldura
          className="h-[min(62vh,520px)] overflow-hidden lg:h-[min(96vh,860px)]"
        >
          <Picture name="garrafa-tinto-taca" data-cap-foto className="h-[112%] w-full object-cover" />
        </div>
      </figure>
    </section>
  );
}
