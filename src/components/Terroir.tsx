import { useRef } from 'react';
import { gsap, useGSAP } from '../motion/gsap';
import { useAnimacoesLiberadas } from '../motion/prontidao';
import { DUR_CURTA, DUR_LONGA, EASE_ENTRADA, EASE_SELO } from '../motion/tokens';
import { revelarBloco, revelarChars } from '../motion/reveal';
import { Picture } from './Picture';

type Anotacao = {
  readonly id: string;
  readonly valor: number;
  /** passo do snap na contagem */
  readonly passo: number;
  readonly sufixo: string;
  /** milhar com ponto? (1.200 sim, 1987 não — é ano) */
  readonly milhar: boolean;
  readonly rotulo: string;
  /** ancoragem do ponto sobre a foto, como no export */
  readonly ponto: { readonly left: string; readonly top: string };
  /** linha diagonal em px a partir do ponto (a que o DrawSVG traça) */
  readonly linha: { readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number };
  /** posição da caixa de texto em relação ao ponto */
  readonly texto: React.CSSProperties;
};

/** Geometria transcrita do export: posições, comprimentos e ângulos das linhas. */
const ANOTACOES: readonly Anotacao[] = [
  {
    id: 'altitude',
    valor: 1200,
    passo: 25,
    sufixo: ' m',
    milhar: true,
    rotulo: 'de altitude na serra',
    ponto: { left: '16%', top: '60%' },
    linha: { x1: 3, y1: -2, x2: 98.3, y2: -57.0 }, // 110px a -30°
    texto: { left: '96px', top: '-110px' },
  },
  {
    id: 'area',
    valor: 40,
    passo: 1,
    sufixo: ' ha',
    milhar: false,
    rotulo: 'de vinhedos em basalto',
    ponto: { left: '44%', top: '36%' },
    linha: { x1: 3, y1: 0, x2: 82.5, y2: 42.3 }, // 90px a 28°
    texto: { left: '78px', top: '48px' },
  },
  {
    id: 'safra',
    valor: 1987,
    passo: 1,
    sufixo: '',
    milhar: false,
    rotulo: 'primeira safra plantada',
    ponto: { left: '78%', top: '64%' },
    linha: { x1: -3, y1: -2, x2: -111.8, y2: -52.7 }, // 120px a 205°
    texto: { right: '106px', top: '-108px', textAlign: 'right' },
  },
];

const formatar = (a: Anotacao, n: number): string =>
  (a.milhar ? Math.round(n).toLocaleString('pt-BR') : String(Math.round(n))) + a.sufixo;

/**
 * O Terroir — MOTION.md §5.
 *
 * A foto se abre com clip-path em scrub e, só depois, as três anotações
 * cartográficas chegam em sequência: o ponto pulsa, a linha é traçada com
 * DrawSVG e o número conta até o valor.
 *
 * MOBILE: as anotações saem de cima da foto e viram uma lista compacta
 * logo abaixo dela — sobre a foto, nesse tamanho, elas se atropelariam.
 */
export function Terroir(): React.JSX.Element {
  const raiz = useRef<HTMLElement>(null);
  const liberado = useAnimacoesLiberadas();

  useGSAP(
    () => {
      if (!liberado) return;
      const el = raiz.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const [titulo] = q('[data-terroir-titulo]');
      const intro = q('[data-terroir-intro]')[0];
      const splits = titulo ? [revelarChars(titulo, { scrollTrigger: { start: 'top 78%' } })] : [];

      if (intro) revelarBloco(q('[data-terroir-texto]'), { trigger: intro });

      const mm = gsap.matchMedia();

      // ------------------------------------------------- foto (só com motion)
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const foto = q('[data-terroir-foto]');
        gsap.set(foto, { willChange: 'transform, clip-path' });
        const tw = gsap.fromTo(
          foto,
          { clipPath: 'inset(15%)', scale: 1.1 },
          {
            clipPath: 'inset(0%)',
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-terroir-figura]',
              start: 'top 85%',
              end: 'top 30%',
              scrub: true,
            },
          },
        );
        return () => {
          tw.kill();
          gsap.set(foto, { willChange: 'auto' });
        };
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        const tw = gsap.from(q('[data-terroir-foto]'), {
          opacity: 0,
          duration: DUR_LONGA,
          scrollTrigger: { trigger: '[data-terroir-figura]', start: 'top 80%' },
        });
        return () => tw.kill();
      });

      // ------------------------------------------------------- as anotações
      // Desktop desenha ponto + linha + número sobre a foto; no mobile a mesma
      // sequência acontece na lista, sem as linhas.
      const montarContagem = (escopo: string) =>
        ANOTACOES.forEach((a) => {
          const [alvo] = q(`${escopo} [data-contador='${a.id}']`);
          if (!alvo) return;
          const proxy = { n: 0 };
          gsap.to(proxy, {
            n: a.valor,
            duration: 1.2,
            ease: 'power1.inOut',
            snap: { n: a.passo },
            onUpdate: () => {
              alvo.textContent = formatar(a, proxy.n);
            },
            scrollTrigger: { trigger: alvo, start: 'top 75%' },
          });
        });

      mm.add('(min-width: 900px)', () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: '[data-terroir-figura]', start: 'top 45%' },
        });
        ANOTACOES.forEach((a, i) => {
          const at = i * 0.4; // stagger de 0.4 entre anotações
          tl.from(q(`[data-anotacao='${a.id}'] [data-ponto]`), {
            scale: 0,
            duration: DUR_CURTA,
            ease: EASE_SELO,
          }, at)
            .fromTo(
              q(`[data-anotacao='${a.id}'] [data-linha]`),
              { drawSVG: '0%' },
              { drawSVG: '100%', duration: DUR_CURTA, ease: EASE_ENTRADA },
              at + 0.2,
            )
            .from(
              q(`[data-anotacao='${a.id}'] [data-caixa]`),
              { opacity: 0, duration: DUR_CURTA, ease: EASE_ENTRADA },
              at + 0.45,
            );
        });
        montarContagem('[data-terroir-mapa]');
        return () => tl.kill();
      });

      mm.add('(max-width: 899px)', () => {
        const tw = gsap.from(q('[data-terroir-lista] li'), {
          opacity: 0,
          x: -18,
          duration: DUR_CURTA,
          ease: EASE_ENTRADA,
          stagger: 0.14,
          scrollTrigger: { trigger: '[data-terroir-lista]', start: 'top 85%' },
        });
        montarContagem('[data-terroir-lista]');
        return () => tw.kill();
      });

      return () => {
        splits.forEach((s) => s.revert());
        mm.revert();
      };
    },
    { scope: raiz, dependencies: [liberado] },
  );

  return (
    <section
      id="terroir"
      ref={raiz}
      data-bg="#14080b"
      className="overflow-hidden py-[clamp(96px,15vh,180px)] pr-0 pl-[20px] lg:pl-[clamp(56px,5vw,84px)]"
    >
      <div data-terroir-intro className="pr-[20px] lg:pr-0">
        <p data-terroir-texto className="eyebrow m-0 mb-[30px] text-dourado">
          II · O Terroir
        </p>
        <h2
          data-terroir-titulo
          className="m-0 mb-[34px] font-display text-[clamp(64px,9vw,168px)] leading-[.92] font-normal text-creme"
        >
          O Terroir
        </h2>
        <p data-terroir-texto className="corpo m-0 text-creme/72">
          Basalto vulcânico, noites frias e a névoa que sobe o vale ao amanhecer. Aqui a uva
          amadurece devagar — e é dessa espera que nasce a acidez viva dos nossos vinhos.
        </p>
      </div>

      <figure data-terroir-figura className="relative mt-[clamp(44px,7vh,80px)] mb-0">
        <Picture
          name="vinhedo-nevoa"
          alt="Carta da propriedade: vinhedos sobre o mar de névoa"
          data-terroir-foto
          className="h-[min(62vh,560px)] w-full object-cover lg:h-[min(88vh,900px)]"
        />

        {/* ------------------------------------------- desktop: sobre a foto */}
        <div data-terroir-mapa aria-hidden="true" className="hidden lg:block">
          {ANOTACOES.map((a) => (
            <div key={a.id} data-anotacao={a.id} className="absolute" style={a.ponto}>
              <i
                data-ponto
                className="absolute -top-[5px] -left-[5px] block h-[10px] w-[10px] rounded-full bg-dourado"
                style={{ boxShadow: '0 0 0 5px rgba(201,164,92,.22)' }}
              />
              <svg
                className="absolute top-0 left-0 h-px w-px"
                style={{ overflow: 'visible' }}
                aria-hidden="true"
              >
                <line
                  data-linha
                  x1={a.linha.x1}
                  y1={a.linha.y1}
                  x2={a.linha.x2}
                  y2={a.linha.y2}
                  stroke="rgba(201,164,92,.75)"
                  strokeWidth={1}
                />
              </svg>
              <div
                data-caixa
                className="absolute whitespace-nowrap"
                style={{ ...a.texto, textShadow: '0 1px 12px rgba(20,8,11,.75)' }}
              >
                <span className="block font-display text-[clamp(26px,2.4vw,38px)] leading-none text-dourado">
                  <span data-contador={a.id}>{formatar(a, a.valor)}</span>
                </span>
                <span className="mt-[7px] block text-[10px] tracking-[.3em] text-creme/88 uppercase">
                  {a.rotulo}
                </span>
              </div>
            </div>
          ))}
        </div>

        <figcaption className="legenda pt-[16px] text-dourado/60">
          Carta da propriedade · o vale ao amanhecer
        </figcaption>

        {/* --------------------------------------- mobile: lista sob a foto */}
        <ul
          data-terroir-lista
          className="m-0 mt-[28px] flex list-none flex-col gap-[18px] p-0 pr-[20px] lg:hidden"
        >
          {ANOTACOES.map((a) => (
            <li key={a.id} className="flex items-baseline gap-[14px]">
              <i
                aria-hidden="true"
                className="relative top-[-3px] block h-[7px] w-[7px] shrink-0 rounded-full bg-dourado"
                style={{ boxShadow: '0 0 0 4px rgba(201,164,92,.18)' }}
              />
              <span className="font-display text-[26px] leading-none text-dourado">
                <span data-contador={a.id}>{formatar(a, a.valor)}</span>
              </span>
              <span className="text-[10px] tracking-[.26em] text-creme/70 uppercase">
                {a.rotulo}
              </span>
            </li>
          ))}
        </ul>
      </figure>
    </section>
  );
}
