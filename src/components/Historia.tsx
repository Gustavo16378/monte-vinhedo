import { useRef } from 'react';
import { gsap, useGSAP } from '../motion/gsap';
import { useAnimacoesLiberadas } from '../motion/prontidao';
import { DUR_CURTA, DUR_LONGA, EASE_ENTRADA } from '../motion/tokens';
import { revelarBloco, revelarChars } from '../motion/reveal';
import { Picture } from './Picture';

/**
 * Nossa História.
 *
 * Fotos assimétricas sangrando pelas bordas, com o parallax interno dos
 * capítulos (MOTION.md §6): a imagem "anda" dentro da moldura de overflow
 * hidden em vez de a moldura se mexer.
 */
export function Historia(): React.JSX.Element {
  const raiz = useRef<HTMLElement>(null);
  const liberado = useAnimacoesLiberadas();

  useGSAP(
    () => {
      if (!liberado) return;
      const el = raiz.current;
      if (!el) return;
      const q = gsap.utils.selector(el);

      const [titulo] = q('[data-historia-titulo]');
      const [texto] = q('[data-historia-texto]');
      const splits = titulo ? [revelarChars(titulo, { scrollTrigger: { start: 'top 78%' } })] : [];
      if (texto) revelarBloco(q('[data-historia-linha]'), { trigger: texto });

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const molduras = q('[data-parallax-moldura]');
        const fotos = q('[data-parallax-foto]');
        gsap.set(fotos, { willChange: 'transform' });

        const tweens = molduras.map((moldura, i) =>
          gsap.fromTo(
            fotos[i] as Element,
            { yPercent: -12 },
            {
              yPercent: 0,
              ease: 'none',
              scrollTrigger: { trigger: moldura, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          ),
        );
        return () => {
          tweens.forEach((t) => t.kill());
          gsap.set(fotos, { willChange: 'auto' });
        };
      });

      const legendas = gsap.from(q('figcaption'), {
        opacity: 0,
        duration: DUR_CURTA,
        ease: EASE_ENTRADA,
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 45%' },
      });

      const fade = gsap.from(q('[data-parallax-moldura]'), {
        opacity: 0,
        duration: DUR_LONGA,
        ease: EASE_ENTRADA,
        stagger: 0.2,
        scrollTrigger: { trigger: el, start: 'top 72%' },
      });

      return () => {
        splits.forEach((s) => s.revert());
        legendas.kill();
        fade.kill();
        mm.revert();
      };
    },
    { scope: raiz, dependencies: [liberado] },
  );

  return (
    <section
      id="historia"
      ref={raiz}
      data-bg="#14080b"
      className="overflow-hidden py-[clamp(80px,12vh,150px)] pr-0 pl-[20px] lg:pl-[clamp(56px,5vw,84px)]"
    >
      <div className="flex flex-wrap items-start">
        <figure className="m-0 min-w-[min(320px,100%)] flex-[0_1_min(480px,100%)]">
          <div
            data-parallax-moldura
            className="h-[min(52vh,420px)] overflow-hidden lg:h-[min(76vh,720px)]"
          >
            <Picture
              name="garrafas-empoeiradas"
              data-parallax-foto
              className="h-[112%] w-full object-cover"
            />
          </div>
          <figcaption className="legenda pt-[14px] pl-[clamp(20px,3vw,36px)] text-dourado/60">
            Safras de guarda desde 1994
          </figcaption>
        </figure>

        <div
          data-historia-texto
          className="min-w-0 flex-[1.1_1_min(400px,100%)] px-[20px] py-[clamp(36px,7vh,90px)] lg:px-[clamp(28px,5vw,76px)]"
        >
          <p data-historia-linha className="eyebrow m-0 mb-[30px] text-dourado">
            III · Nossa História
          </p>
          <h2
            data-historia-titulo
            className="m-0 mb-[36px] font-display text-[clamp(46px,5.4vw,100px)] leading-[1.02] font-normal text-creme [text-wrap:balance]"
          >
            Três gerações, um vale.
          </h2>
          <p data-historia-linha className="corpo m-0 mb-[26px] text-creme/72">
            Chegamos ao vale em 1987, quando ninguém acreditava em vinho fino no alto da serra.
            Plantamos assim mesmo — três hectares de Pinot Noir e uma teimosia de família.
          </p>
          <p data-historia-linha className="corpo m-0 text-creme/72">
            Hoje a terceira geração assina cada rótulo, e as garrafas descansam na adega o tempo
            que pedirem. Pressa, aqui, não entra.
          </p>
        </div>

        <figure className="mt-[clamp(48px,16vh,200px)] mr-0 mb-0 ml-auto min-w-[min(300px,100%)] flex-[0_1_min(440px,100%)]">
          <div
            data-parallax-moldura
            className="h-[min(34vh,300px)] overflow-hidden lg:h-[min(46vh,440px)]"
          >
            <Picture
              name="adega-barris"
              data-parallax-foto
              className="h-[112%] w-full object-cover"
            />
          </div>
          <figcaption className="legenda pt-[14px] pr-[clamp(20px,3vw,36px)] text-right text-dourado/60">
            Adega subterrânea · 12 °C constantes
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
