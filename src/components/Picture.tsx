import { IMAGES, type ImageName } from '../assets/images';

type PictureProps = {
  readonly name: ImageName;
  /** sobrescreve o alt do manifesto; `''` marca a imagem como decorativa */
  readonly alt?: string;
  /** sobrescreve o `sizes` calculado a partir do layout do export */
  readonly sizes?: string;
  readonly className?: string;
  /** o hero é `eager` + `high`; todo o resto entra preguiçoso */
  readonly priority?: boolean;
  readonly style?: React.CSSProperties;
} & {
  /** `data-*` chegam no <img>: é por eles que o GSAP acha as imagens */
  readonly [marcador: `data-${string}`]: string | boolean | undefined;
};

const srcset = (name: string, ext: string, widths: readonly number[]): string =>
  widths.map((w) => `/img/${name}-${w}.${ext} ${w}w`).join(', ');

/**
 * `<picture>` com avif/webp e fallback, montado a partir de
 * `src/assets/images.ts`.
 *
 * As dimensões intrínsecas vão sempre no `<img>` para reservar espaço e
 * manter o CLS em zero, mesmo quando o CSS depois estica a imagem.
 */
export function Picture({
  name,
  alt,
  sizes,
  className,
  priority = false,
  style,
  ...marcadores
}: PictureProps): React.JSX.Element {
  const meta = IMAGES[name];
  const larguras = meta.widths;
  const maior = larguras[larguras.length - 1] ?? meta.width;
  const texto = alt ?? meta.alt;

  return (
    <picture>
      <source type="image/avif" srcSet={srcset(name, 'avif', larguras)} sizes={sizes ?? meta.sizes} />
      <source type="image/webp" srcSet={srcset(name, 'webp', larguras)} sizes={sizes ?? meta.sizes} />
      <img
        src={`/img/${name}-${maior}.${meta.fallback}`}
        srcSet={srcset(name, meta.fallback, larguras)}
        sizes={sizes ?? meta.sizes}
        alt={texto}
        {...(texto === '' ? { 'aria-hidden': true } : {})}
        width={meta.width}
        height={meta.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        className={className}
        style={style}
        {...marcadores}
      />
    </picture>
  );
}
