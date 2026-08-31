import { Picture } from '../Picture';
import { useCapituloVinho } from './useCapituloVinho';

/**
 * Capítulo II · Rosé de Altitude.
 *
 * Espelha o capítulo I: foto à esquerda, texto à direita. O título invade a
 * foto pela esquerda com margem negativa — `clamp(-260px, calc(880px - 100vw), 0px)`
 * do export, que só morde quando a viewport é larga o bastante para caber.
 */
export function CapituloRose(): React.JSX.Element {
  const raiz = useCapituloVinho();

  return (
    <section
      ref={raiz}
      data-bg="#14080b"
      aria-labelledby="vinho-rose"
      className="flex flex-wrap items-center overflow-hidden py-[clamp(70px,12vh,150px)] pl-0 lg:pl-[clamp(56px,5vw,84px)]"
    >
      <figure className="z-[1] m-0 min-w-0 flex-[1_1_min(420px,100%)]">
        <div
          data-cap-moldura
          className="h-[min(62vh,540px)] overflow-hidden lg:h-[min(100vh,900px)]"
        >
          <Picture name="rose-servindo" data-cap-foto className="h-[112%] w-full object-cover" />
        </div>
      </figure>

      <div className="relative z-[2] min-w-0 flex-[1_1_min(460px,100%)] px-[24px] pt-[clamp(40px,8vh,90px)] lg:pr-[clamp(24px,7vw,110px)] lg:pl-[clamp(24px,4vw,60px)]">
        <i
          data-cap-detalhe
          aria-hidden="true"
          className="mb-[34px] block h-[5px] w-[64px] bg-rose"
        />
        <p data-cap-label className="eyebrow m-0 mb-[28px] text-dourado">
          Capítulo II · Rosé · 2023
        </p>
        <h3
          id="vinho-rose"
          data-cap-nome
          className="mt-0 mr-0 mb-[34px] ml-0 font-display text-[clamp(56px,8vw,152px)] leading-[.95] font-bold text-creme lg:ml-[clamp(-260px,calc(880px-100vw),0px)]"
        >
          Rosé de <em className="font-bold text-rose">Altitude</em>
        </h3>
        <p
          data-cap-nota
          className="m-0 mb-[34px] max-w-[38ch] text-[15.5px] leading-[1.8] font-light text-creme/72"
        >
          Morango fresco, pétalas e um final salino que pede mais um gole. Prensagem direta, seis
          meses sobre borras finas.
        </p>
        <p data-cap-detalhe className="m-0 text-[11px] tracking-[.3em] text-dourado/75 uppercase">
          Pinot Noir · servir a 8 °C · 750 ml
        </p>
        <p data-cap-detalhe className="mt-[30px] mb-0 font-display text-[26px] italic text-rose">
          R$ 98
        </p>
      </div>
    </section>
  );
}
