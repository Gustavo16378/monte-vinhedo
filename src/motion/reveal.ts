import { gsap, SplitText } from './gsap';
import { DUR_MEDIA, EASE_ENTRADA, STAGGER_CHAR, STAGGER_LINHA } from './tokens';

/** `ScrollTrigger.Vars` vem da declaração global de tipos do GSAP. */
type Trigger = ScrollTrigger.Vars;

type RevealOpts = {
  /** deslocamento vertical inicial, em px */
  readonly y?: number;
  readonly duration?: number;
  readonly stagger?: number;
  readonly delay?: number;
  readonly scrollTrigger?: Trigger;
  /** encadeia numa timeline em vez de tocar solto */
  readonly timeline?: gsap.core.Timeline;
  /** posição na timeline, quando houver */
  readonly at?: gsap.Position;
};

/**
 * SplitText + entrada padrão do site, na forma recomendada pelo GSAP 3.13:
 * `autoSplit` refaz a divisão quando a fonte carrega ou a linha reflui, e o
 * `onSplit` devolve a animação para que ela seja recriada junto.
 *
 * `aria: 'auto'` põe o texto original como `aria-label` no elemento pai e
 * esconde os pedaços do leitor de tela (MOTION.md §Performance e acabamento).
 *
 * Devolve a instância — o chamador precisa dar `revert()` na limpeza.
 */
function reveal(
  target: Element,
  type: 'chars' | 'words' | 'lines',
  { y = 40, duration = DUR_MEDIA, stagger, delay = 0, scrollTrigger, timeline, at }: RevealOpts,
): SplitText {
  const step = stagger ?? (type === 'chars' ? STAGGER_CHAR : STAGGER_LINHA);

  // Quebrar em letras espalha o texto por dezenas de elementos: sem o
  // `aria-label` no pai, o leitor de tela soletra. Quebrar em linhas não tem
  // esse problema — e ali o `aria-label` seria proibido, porque o alvo é um
  // <p> (role=paragraph não aceita nome acessível). Daí a distinção.
  const porLinha = type === 'lines';

  return SplitText.create(target, {
    type,
    aria: porLinha ? 'none' : 'auto',
    tag: 'span', // <div> dentro de <p> seria HTML inválido
    autoSplit: true,
    onSplit: (self) => {
      const pieces = self[type];
      if (!pieces.length) return;

      const vars: gsap.TweenVars = {
        y,
        opacity: 0,
        duration,
        stagger: step,
        ease: EASE_ENTRADA,
      };

      if (timeline) return timeline.from(pieces, vars, at);
      return gsap.from(pieces, {
        ...vars,
        delay,
        ...(scrollTrigger ? { scrollTrigger: { trigger: target, ...scrollTrigger } } : {}),
      });
    },
  });
}

/** Letra por letra — títulos de display (MONTE, VINHEDO, nomes dos vinhos). */
export const revelarChars = (target: Element, opts: RevealOpts = {}): SplitText =>
  reveal(target, 'chars', { y: 120, ...opts });

/** Palavra por palavra — o manifesto. */
export const revelarPalavras = (target: Element, opts: RevealOpts = {}): SplitText =>
  reveal(target, 'words', { y: 40, stagger: STAGGER_LINHA, ...opts });

/** Linha por linha — blocos de texto corrido. */
export const revelarLinhas = (target: Element, opts: RevealOpts = {}): SplitText =>
  reveal(target, 'lines', { y: 24, stagger: STAGGER_LINHA, ...opts });

/**
 * Fade simples com subida curta, para elementos que não passam por SplitText.
 * É também o único movimento que sobra sob `prefers-reduced-motion: reduce`.
 */
export function revelarBloco(
  targets: gsap.TweenTarget,
  opts: {
    readonly y?: number;
    readonly stagger?: number;
    /** de preferência o container do bloco, não a seção inteira — ver `start` */
    readonly trigger: gsap.DOMTarget;
    readonly start?: string;
  },
): gsap.core.Tween {
  return gsap.from(targets, {
    y: opts.y ?? 28,
    opacity: 0,
    duration: DUR_MEDIA,
    ease: EASE_ENTRADA,
    stagger: opts.stagger ?? STAGGER_LINHA,
    scrollTrigger: {
      trigger: opts.trigger,
      // 'top 70%' não é arbitrário: com o padding de topo das seções, é onde a
      // abertura do bloco cai junto com a virada de fundo do body (que dispara
      // em 'top 55%' da seção). Disparar antes faria o texto entrar sobre a cor
      // errada — creme sobre creme, bordô sobre bordô.
      start: opts.start ?? 'top 70%',
    },
  });
}
