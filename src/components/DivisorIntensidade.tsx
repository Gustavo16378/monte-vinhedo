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
 * agora param em ~0.86 de alfa: a taça continua na frente, mas as letras
 * atravessam o vidro como um fantasma, que é o que o vidro faz de verdade.
 * As bordas seguem em transparente total, então o recorte continua invisível.
 *
 * A faixa é larga (8%–88%) porque agora é medida sobre a CHAPA da foto, e
 * não sobre a tela inteira. Ser generosa não custa nada: fora da silhueta
 * da taça as duas cópias são a mesma imagem no mesmo lugar, então onde não
 * há vidro a máscara é literalmente invisível.
 */
const MASCARA = [
  'linear-gradient(90deg',
  'transparent 8%',
  'rgba(0,0,0,.80) 18%',
  'rgba(0,0,0,.86) 35%',
  'rgba(0,0,0,.86) 62%',
  'rgba(0,0,0,.80) 78%',
  'transparent 88%)',
].join(',');

/**
 * Dissolve as laterais da chapa da foto no fundo da seção.
 *
 * A foto deixou de ser full-bleed (ver `--taca-larg` abaixo) e por isso
 * agora tem bordas verticais. Sem este esfumado elas leriam como um
 * retângulo colado; com ele, a vinheta da própria foto continua no fundo
 * da seção e não há costura.
 */
const ESFUMADO =
  'linear-gradient(90deg,transparent 0%,#000 13%,#000 87%,transparent 100%)';

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
            )
              // de 1.06 para 1.03: o movimento é de ASSENTAR, não de
              // aproximar. Ampliar durante o pin era o que empurrava o
              // enquadramento para dentro do bojo bem no momento em que a
              // palavra pedia a taça inteira em cena.
              .fromTo(fotos, { scale: 1.06 }, { scale: 1.03, ease: 'none', duration: 3 }, 0);
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
        // O mobile ganha o MESMO pin do desktop: a seção trava e as letras
        // entram conforme a rolagem. Antes aqui só havia scrub solto, e a
        // palavra passava num piscar.
        //
        // `pinType: 'transform'` é o que torna isso viável no celular. O pin
        // padrão usa `position: fixed`, e no Chrome do Android a barra de URL
        // que aparece e some redimensiona o viewport — o elemento fixo salta a
        // cada mudança. Com `transform` o pin é só um deslocamento, imune a
        // isso, e ainda é o modo que combina com o Lenis, que também conduz a
        // página por transform.
        //
        // Deliberadamente SEM `ScrollTrigger.normalizeScroll(true)`: ele
        // sequestra wheel e touch para conduzir a rolagem por conta própria,
        // e o Lenis desta página já faz exatamente isso. Ligar os dois é ter
        // dois donos do mesmo gesto — o efeito colateral que o próprio
        // briefing manda escopar. O problema que o normalizeScroll resolveria
        // (a barra de URL do Android saltando o pin) já está resolvido acima
        // pelo `pinType: 'transform'`, que é imune ao redimensionamento do
        // viewport por não depender de `position: fixed`.
        gsap.set(fotos, { willChange: 'transform' });
        montar({
          trigger: el,
          start: 'top top',
          end: '+=90%',
          pin: true,
          pinType: 'transform',
          scrub: true,
          refreshPriority: 1,
        });
        return () => {
          split?.revert();
          split = null;
          gsap.set(fotos, { willChange: 'auto' });
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
      style={{
        /* Largura da chapa da foto, e é ela que define o zoom.
           A taça (da borda ao pé) ocupa 58,5% da altura do JPG, que é
           1335x2000. Com `object-fit: cover` numa caixa mais estreita que
           a proporção da foto, quem manda é a largura: a altura exibida
           vira 1,4981 × largura, e a taça, 0,8764 × largura. Igualando a
           80% da altura da tela sai largura = 91,3svh.

           Antes a caixa era 100vw: numa tela 16:9 isso ampliava a foto em
           1,44× e só o bojo cabia em cena — a taça deixava de ser uma taça
           e virava uma mancha vermelha. No mobile o `min()` devolve o
           full-bleed, que ali é o enquadramento certo. */
        ['--taca-larg' as string]: 'min(91.3svh, 100vw)',
        background: 'radial-gradient(120% 100% at 50% 50%,#181416 0%,#14080b 72%)',
      }}
    >
      <Picture
        name="splash-taca"
        alt=""
        data-divisor-foto
        sizes="min(91.3svh, 100vw)"
        className="absolute top-0 left-1/2 z-[1] h-full object-cover [filter:grayscale(.35)_contrast(1.08)]"
        style={{
          width: 'var(--taca-larg)',
          translate: '-50% 0',
          WebkitMaskImage: ESFUMADO,
          maskImage: ESFUMADO,
        }}
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
        sizes="min(91.3svh, 100vw)"
        className="absolute top-0 left-1/2 z-[3] h-full object-cover [filter:grayscale(.35)_contrast(1.08)]"
        style={{
          width: 'var(--taca-larg)',
          translate: '-50% 0',
          WebkitMaskImage: MASCARA,
          maskImage: MASCARA,
        }}
      />
    </section>
  );
}
