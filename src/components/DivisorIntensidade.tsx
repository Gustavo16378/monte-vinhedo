import { useRef } from 'react';
import { gsap, useGSAP, SplitText } from '../motion/gsap';
import { useAnimacoesLiberadas } from '../motion/prontidao';
import { DUR_LONGA, EASE_ENTRADA } from '../motion/tokens';
import { Picture } from './Picture';

/**
 * Faixa central em que a taça passa na frente da palavra.
 *
 * O export usava preto cheio no miolo (41%–59%), e ali o "SI" de INTENSIDADE
 * sumia por completo — a palavra virava "INTEN DADE". As paradas centrais
 * agora param em ~0.84 de alfa: a taça continua na frente, mas as letras
 * atravessam o vidro como um fantasma, que é o que o vidro faz de verdade.
 * As bordas seguem em transparente total, então o recorte continua invisível.
 */
const MASCARA = [
  'linear-gradient(90deg',
  'transparent 30%',
  'rgba(0,0,0,.78) 39%',
  'rgba(0,0,0,.84) 46%',
  'rgba(0,0,0,.84) 54%',
  'rgba(0,0,0,.78) 61%',
  'transparent 70%)',
].join(',');

/**
 * Divisor splash — MOTION.md §7.
 *
 * A palavra INTENSIDADE entra letra por letra conforme o scroll avança, e o
 * miolo dela passa por trás da taça. A profundidade vem do export: a mesma
 * foto aparece duas vezes, a de cima mascarada só na faixa da taça, com a
 * palavra ensanduichada entre as duas. É o mesmo efeito do clone com
 * clip-path descrito na partitura, resolvido em CSS puro e sem duplicar texto.
 *
 * MOBILE: sem pin. Numa tela pequena o pin briga com a barra de URL e com o
 * teclado, então a mesma timeline roda em scrub solto.
 */
export function DivisorIntensidade(): React.JSX.Element {
  const raiz = useRef<HTMLElement>(null);
  const liberado = useAnimacoesLiberadas();

  useGSAP(
    () => {
      if (!liberado) return;
      const el = raiz.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const [palavra] = q('[data-divisor-palavra]');
      if (!palavra) return;

      const fotos = q('[data-divisor-foto]');
      const mm = gsap.matchMedia();
      let split: SplitText | null = null;

      const montar = (scrollTrigger: ScrollTrigger.Vars) => {
        split?.revert();
        split = SplitText.create(palavra, {
          type: 'chars',
          aria: 'auto',
          autoSplit: true,
          onSplit: (self) => {
            const tl = gsap.timeline({ scrollTrigger });
            tl.from(
              self.chars,
              {
                yPercent: 60,
                opacity: 0,
                ease: EASE_ENTRADA,
                duration: 0.6,
                stagger: { amount: 1.8 },
              },
              0,
            ).fromTo(fotos, { scale: 1 }, { scale: 1.06, ease: 'none', duration: 3 }, 0);
            return tl;
          },
        });
      };

      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set(fotos, { willChange: 'transform' });
        montar({
          trigger: el,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: true,
          // Este é o único trigger que muda a altura do documento. Precisa ser
          // o primeiro a se recalcular em cada refresh, senão todo mundo que
          // vem depois na página mede posições sem o espaçamento do pin.
          refreshPriority: 1,
        });
        return () => {
          split?.revert();
          split = null;
          gsap.set(fotos, { willChange: 'auto' });
        };
      });

      mm.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', () => {
        // A janela do scrub fecha em 'top 12%', não na saída da seção: assim a
        // palavra termina de entrar quando o divisor ocupa a tela inteira e
        // fica legível por todo o resto da rolagem, em vez de só num piscar.
        montar({ trigger: el, start: 'top 88%', end: 'top 12%', scrub: true });
        return () => {
          split?.revert();
          split = null;
        };
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        const tw = gsap.from(palavra, {
          opacity: 0,
          duration: DUR_LONGA,
          ease: EASE_ENTRADA,
          scrollTrigger: { trigger: el, start: 'top 70%' },
        });
        return () => tw.kill();
      });

      return () => {
        split?.revert();
        mm.revert();
      };
    },
    { scope: raiz, dependencies: [liberado] },
  );

  return (
    <section
      ref={raiz}
      data-bg="#14080b"
      aria-label="Intensidade"
      className="relative h-[100svh] min-h-[620px] overflow-hidden"
    >
      <Picture
        name="splash-taca"
        alt=""
        data-divisor-foto
        className="absolute inset-0 z-[1] h-full w-full object-cover [filter:grayscale(.35)_contrast(1.08)]"
      />

      <h2
        data-divisor-palavra
        // "INTENSIDADE" mede 7,71em: a 13,2vw ela não caberia numa tela de
        // 390px (812px de palavra), e o efeito depende de a palavra inteira
        // ser lida atravessando a taça. No mobile ela cai para 12vw.
        className="absolute top-1/2 left-1/2 z-[2] m-0 font-display text-[clamp(34px,12vw,64px)] tracking-[.01em] whitespace-nowrap text-creme lg:text-[clamp(64px,13.2vw,265px)]"
        style={{ translate: '-50% -54%' }}
      >
        INTENSIDADE
      </h2>

      {/* a mesma foto, recortada só na faixa da taça: é ela que passa na frente */}
      <Picture
        name="splash-taca"
        data-divisor-foto
        className="absolute inset-0 z-[3] h-full w-full object-cover [filter:grayscale(.35)_contrast(1.08)]"
        style={{ WebkitMaskImage: MASCARA, maskImage: MASCARA }}
      />
    </section>
  );
}
