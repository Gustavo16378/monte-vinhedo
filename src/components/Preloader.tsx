import { MONOGRAM_M, MONOGRAM_V, MONOGRAM_VIEWBOX } from '../assets/monogram';

const CHAVE_SESSAO = 'mv:preloader';

/** Já rodou nesta sessão? Lido de forma síncrona, antes do primeiro paint. */
export function preloaderJaRodou(): boolean {
  try {
    return sessionStorage.getItem(CHAVE_SESSAO) === '1';
  } catch {
    return false; // modo privado / storage bloqueado: mostra, sem quebrar
  }
}

export function marcarPreloaderVisto(): void {
  try {
    sessionStorage.setItem(CHAVE_SESSAO, '1');
  } catch {
    /* storage indisponível: só não memoriza a sessão */
  }
}

type CortinaProps = {
  readonly refCortina: React.RefObject<HTMLDivElement | null>;
};

/**
 * Cortina do preloader — MOTION.md §0. Só markup.
 *
 * A animação vive na master timeline do <Hero />, não aqui: o desenho do
 * monograma, a frase, a subida da cortina e a entrada do hero são uma
 * sequência só, e é isso que elimina o piscar entre as duas.
 *
 * O <Hero /> monta isto num portal para o <body>, fora do palco que tem
 * `perspective` — senão a cortina deixaria de ser fixa em relação à tela.
 */
export function Cortina({ refCortina }: CortinaProps): React.JSX.Element {
  return (
    <div
      ref={refCortina}
      aria-hidden="true"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bordo"
      style={{ clipPath: 'inset(0 0 0% 0)' }}
    >
      <svg
        viewBox={MONOGRAM_VIEWBOX}
        className="w-[clamp(180px,26vw,300px)]"
        fill="none"
        stroke="var(--color-dourado)"
        strokeWidth={12}
        strokeLinejoin="round"
      >
        <path data-preloader-traco d={MONOGRAM_M} />
        <path data-preloader-traco d={MONOGRAM_V} />
      </svg>

      <p
        data-preloader-frase
        className="oculto-na-abertura mt-[clamp(28px,4vh,44px)] text-[11px] tracking-[.42em] text-creme uppercase"
        style={{ paddingLeft: '0.42em' }}
      >
        toda safra começa com paciência
      </p>
    </div>
  );
}
