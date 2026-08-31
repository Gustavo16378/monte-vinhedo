import { useRef } from 'react';
import { gsap, useGSAP } from '../motion/gsap';
import { useAnimacoesLiberadas } from '../motion/prontidao';
import { DUR_CURTA, DUR_LONGA, EASE_ENTRADA, STAGGER_LINHA } from '../motion/tokens';
import { revelarBloco, revelarChars, revelarLinhas } from '../motion/reveal';
import { Picture } from './Picture';
import { SeloCera } from './SeloCera';

const INFOS = [
  'Sextas e sábados · 10h às 18h',
  'Estrada do Contestado, km 18 · São Joaquim — SC',
  'Grupos de até 12 pessoas',
] as const;

/**
 * A Experiência — MOTION.md §8.
 *
 * Textos e fotos entram no padrão da casa (y + opacity, EASE_ENTRADA); a
 * colagem de três fotos chega escalonada, e o selo de cera se carimba
 * sozinho (ver <SeloCera />).
 */
export function Visite(): React.JSX.Element {
  const raiz = useRef<HTMLElement>(null);
  const liberado = useAnimacoesLiberadas();

  useGSAP(
    () => {
      if (!liberado) return;
      const el = raiz.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const splits: { revert: () => void }[] = [];

      const [titulo] = q('[data-visite-titulo]');
      const [texto] = q('[data-visite-texto]');
      const [coluna] = q('[data-visite-coluna]');

      if (titulo) splits.push(revelarChars(titulo, { scrollTrigger: { start: 'top 80%' } }));
      if (texto) splits.push(revelarLinhas(texto, { scrollTrigger: { start: 'top 82%' } }));
      if (coluna) revelarBloco(q('[data-visite-eyebrow]'), { trigger: coluna });

      gsap.from(q('[data-visite-info]'), {
        opacity: 0,
        y: 18,
        duration: DUR_CURTA,
        ease: EASE_ENTRADA,
        stagger: STAGGER_LINHA,
        scrollTrigger: { trigger: '[data-visite-infos]', start: 'top 86%' },
      });

      // `[data-visite-foto]` e não `> *`: a colagem agora tem uma versão
      // mobile e uma desktop, e só as fotos da que estiver em cena importam
      // (a outra está em `display: none`, e animar caixa escondida é gasto
      // à toa que ainda por cima conta no stagger).
      gsap.from(q('[data-visite-foto]'), {
        opacity: 0,
        y: 36,
        duration: DUR_LONGA,
        ease: EASE_ENTRADA,
        stagger: 0.14,
        scrollTrigger: { trigger: '[data-visite-colagem]', start: 'top 80%' },
      });

      return () => splits.forEach((s) => s.revert());
    },
    { scope: raiz, dependencies: [liberado] },
  );

  return (
    <section
      id="visite"
      ref={raiz}
      data-bg="#f2ead8"
      className="border-t border-dourado/45 px-[24px] py-[clamp(100px,15vh,190px)] pl-[24px] text-bordo lg:pr-[clamp(24px,6vw,96px)] lg:pl-[clamp(72px,7vw,110px)]"
    >
      <div className="flex flex-wrap items-start gap-[clamp(44px,6vw,90px)]">
        <div data-visite-coluna className="min-w-0 flex-[1.05_1_min(420px,100%)]">
          <p data-visite-eyebrow className="eyebrow m-0 mb-[30px] text-vinho">
            V · A Experiência
          </p>
          <h2
            data-visite-titulo
            className="m-0 mb-[36px] font-display text-[clamp(52px,6.5vw,120px)] leading-[.98] font-normal [text-wrap:balance]"
          >
            Visite o vale
          </h2>
          <p
            data-visite-texto
            className="m-0 mb-[44px] max-w-[44ch] text-[17px] leading-[1.85] font-light text-bordo/75"
          >
            Degustação guiada na adega, harmonização com queijos da serra e o pôr do sol mais alto
            de Santa Catarina. Saia com a taça — e fique para ver a névoa subir.
          </p>

          <div data-visite-infos className="flex flex-col">
            {INFOS.map((info, i) => (
              <p
                key={info}
                data-visite-info
                className={`m-0 border-t border-dourado/50 py-[15px] text-[12px] tracking-[.24em] text-bordo/68 uppercase ${
                  i === INFOS.length - 1 ? 'border-b' : ''
                }`}
              >
                {info}
              </p>
            ))}
          </div>

          {/* No mobile o selo é o respiro entre o texto e as fotos, e por
              isso vive no fluxo, centralizado. No desktop segue alinhado à
              esquerda, fechando a coluna de texto. */}
          <div className="flex justify-center lg:block">
            <SeloCera />
          </div>
        </div>

        <div
          data-visite-colagem
          className="min-w-[min(300px,100%)] flex-[1_1_min(420px,100%)]"
        >
          {/* MOBILE: a colagem em fluxo.
              A versão absoluta do desktop reparte 100% da largura entre
              três fotos, e num celular isso dava selos de 130px — imagem
              nenhuma sobrevive a esse tamanho. Aqui as três empilham
              grandes: a mesa sangra as margens da seção, a parede sobe por
              cima dela (é a sobreposição que faz ler como colagem e não
              como lista) e o vinhedo fecha como polaroide com legenda.
              Nenhuma abaixo de 70% da largura da tela. */}
          <div className="lg:hidden">
            <Picture
              name="mesa-rustica"
              data-visite-foto
              sizes="100vw"
              className="-mx-[24px] h-[min(46vh,380px)] w-[calc(100%+48px)] max-w-none object-cover"
            />
            <Picture
              name="parede-garrafas"
              data-visite-foto
              sizes="70vw"
              className="relative z-[2] -mt-[56px] ml-auto box-border h-[min(34vh,280px)] w-[70%] border-8 border-creme object-cover"
            />
            <figure
              data-visite-foto
              className="relative z-[3] mx-auto mt-[30px] mb-0 w-[76%] bg-white p-[10px] pb-[14px] shadow-[0_10px_30px_rgba(20,8,11,.14)]"
            >
              <Picture
                name="vinhedo-dia"
                sizes="76vw"
                className="h-[min(26vh,220px)] w-full object-cover"
              />
              <figcaption className="mt-[12px] text-center text-[9.5px] tracking-[.26em] text-bordo/55 uppercase">
                O vinhedo em janeiro, a cinco minutos da adega
              </figcaption>
            </figure>
          </div>

          {/* DESKTOP: a colagem do export, posicionada em porcentagem */}
          <div className="relative hidden h-[min(80vh,760px)] lg:block">
            <Picture
              name="mesa-rustica"
              data-visite-foto
              className="absolute top-0 left-0 z-[1] h-[60%] w-[72%] object-cover"
            />
            <Picture
              name="parede-garrafas"
              data-visite-foto
              className="absolute top-[32%] right-0 z-[2] box-border h-[58%] w-[44%] border-8 border-creme object-cover"
            />
            <Picture
              name="vinhedo-dia"
              data-visite-foto
              className="absolute bottom-0 left-[8%] z-[3] box-border h-[32%] w-[36%] border-8 border-creme object-cover"
            />
            <p className="absolute bottom-[-34px] left-[8%] m-0 text-[10px] tracking-[.3em] text-bordo/55 uppercase">
              O vinhedo em janeiro, a cinco minutos da adega
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
