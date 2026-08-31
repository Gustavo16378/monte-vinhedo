import { gsap, ScrollTrigger } from './gsap';

/**
 * Profundidade 3D falsa do hero.
 *
 * A régua toda é esta: a garrafa tem que parecer um objeto pesado numa
 * vitrine, não um card flutuando. Por isso os limites são baixos e fixos, e
 * nenhuma reação usa `scale` — peso não muda de tamanho quando a gente move
 * a cabeça. Se o efeito ficar perceptível *como efeito*, está alto demais.
 *
 * Toda reação ao ponteiro passa por `gsap.quickTo`: um setter reaproveitado,
 * nunca um tween novo por evento. `pointermove` dispara dezenas de vezes por
 * segundo e criar tweens ali entupiria o GC.
 */

const DUR = 0.9;
const EASE = 'power3.out';

/** Limites rígidos. Mexer aqui é mexer na direção de arte. */
const LIM = {
  rotY: 7, // graus
  rotX: 4,
  reflexo: 30, // xPercent
  sombraX: 14, // px
  sombraEsticar: 0.08, // scaleX extra
  monte: 10, // px
  vinhedo: 22,
  fundo: 6,
} as const;

type Camadas = {
  readonly tilt: Element | undefined;
  readonly reflexo: Element | undefined;
  readonly sombra: Element | undefined;
  readonly monte: Element | undefined;
  readonly vinhedo: Element | undefined;
  readonly fundo: Element | undefined;
  readonly deriva: Element | undefined;
};

function coletar(raiz: HTMLElement): Camadas {
  const q = gsap.utils.selector(raiz);
  const um = (sel: string) => q(sel)[0];
  return {
    tilt: um('[data-garrafa-tilt]'),
    reflexo: um('[data-reflexo]'),
    sombra: um('[data-sombra]'),
    monte: um('[data-hero-monte]'),
    vinhedo: um('[data-hero-vinhedo]'),
    fundo: um('[data-fundo-mouse]'),
    deriva: um('[data-fundo-deriva]'),
  };
}

/**
 * Liga tilt, reflexo, sombra, camadas de texto e a névoa viva.
 * Devolve a função de limpeza.
 */
export function montarProfundidade(raiz: HTMLElement): () => void {
  const c = coletar(raiz);
  const mm = gsap.matchMedia();

  const quick = (alvo: Element | undefined, prop: string) =>
    alvo ? gsap.quickTo(alvo, prop, { duration: DUR, ease: EASE }) : () => {};

  // ─────────────────────────────────────────── névoa viva (independe do mouse)
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    if (!c.deriva) return;
    const drift = gsap.to(c.deriva, {
      yPercent: 2,
      xPercent: 1.5,
      duration: 14,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      startAt: { yPercent: -2, xPercent: -1.5 },
    });
    return () => drift.kill();
  });

  // ──────────────────────────────────────────── ponteiro fino: tilt + reflexo
  mm.add(
    '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    () => {
      const rotY = quick(c.tilt, 'rotationY');
      const rotX = quick(c.tilt, 'rotationX');
      const refX = quick(c.reflexo, 'xPercent');
      const somX = quick(c.sombra, 'x');
      const somE = quick(c.sombra, 'scaleX');
      const monX = quick(c.monte, 'x');
      const vinX = quick(c.vinhedo, 'x');
      const funX = quick(c.fundo, 'x');

      const aplicar = (nx: number, ny: number) => {
        rotY(nx * LIM.rotY);
        // invertido: ponteiro acima joga o topo da garrafa para trás
        rotX(-ny * LIM.rotX);
        // a luz corre no vidro no sentido contrário à inclinação
        refX(-nx * LIM.reflexo);
        somX(-nx * LIM.sombraX);
        somE(1 + Math.abs(nx) * LIM.sombraEsticar);
        monX(nx * LIM.monte);
        vinX(-nx * LIM.vinhedo); // sentido oposto ao MONTE: separa os planos
        funX(nx * LIM.fundo);
      };

      const repousar = () => aplicar(0, 0);

      const aoMover = (e: PointerEvent) => {
        const r = raiz.getBoundingClientRect();
        if (!r.height || !r.width) return;
        aplicar(
          gsap.utils.clamp(-1, 1, ((e.clientX - r.left) / r.width - 0.5) * 2),
          gsap.utils.clamp(-1, 1, ((e.clientY - r.top) / r.height - 0.5) * 2),
        );
      };

      raiz.addEventListener('pointermove', aoMover, { passive: true });
      raiz.addEventListener('pointerleave', repousar, { passive: true });

      // fora da viewport do hero não há o que reagir: solta os listeners e
      // devolve tudo ao repouso com os mesmos quickTo (nunca um corte seco)
      const vigia = ScrollTrigger.create({
        trigger: raiz,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: ({ isActive }) => {
          if (isActive) {
            raiz.addEventListener('pointermove', aoMover, { passive: true });
          } else {
            raiz.removeEventListener('pointermove', aoMover);
            repousar();
          }
        },
      });

      return () => {
        raiz.removeEventListener('pointermove', aoMover);
        raiz.removeEventListener('pointerleave', repousar);
        vigia.kill();
      };
    },
    raiz,
  );

  // ───────────────────────────────────────── toque: vitrine em vez de reação
  mm.add(
    '(prefers-reduced-motion: no-preference) and (not ((hover: hover) and (pointer: fine)))',
    () => {
      const tls: gsap.core.Animation[] = [];

      if (c.tilt) {
        tls.push(
          gsap.to(c.tilt, {
            y: 6,
            duration: 5,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            startAt: { y: -6 },
          }),
        );
      }

      // a luz cruza a garrafa uma vez a cada 8s — efeito de vitrine
      if (c.reflexo) {
        tls.push(
          gsap.fromTo(
            c.reflexo,
            { xPercent: -55, autoAlpha: 0 },
            {
              xPercent: 55,
              autoAlpha: 1,
              duration: 2.6,
              ease: 'sine.inOut',
              repeat: -1,
              repeatDelay: 5.4,
              yoyo: false,
            },
          ),
        );
      }

      return () => tls.forEach((t) => t.kill());
    },
    raiz,
  );

  // `prefers-reduced-motion: reduce` não recebe nada: hero estático.

  return () => mm.revert();
}
