"""
Monte Vinhedo — pipeline de assets.

Gera, a partir de `projeto/assets/` (export do design), tudo o que vai para
`public/`:

  1. fontes woff2 + woff                     -> public/fonts/
  2. derivadas responsivas avif/webp/jpg     -> public/img/
  3. os dois retalhos que cobrem o QR code   -> public/img/label-patch-{a,b}.png
     e os textos "mockupfree" do rótulo
  4. public/og.jpg (1200x630) para link preview
  5. monograma MV com as curvas reais do Zodiak 700:
     public/favicon.svg, public/apple-touch-icon.png, src/assets/monogram.ts
  6. src/assets/images.ts (manifesto tipado consumido pelo <Picture />)

Só precisa rodar de novo se os assets do export mudarem — a saída é versionada.

    python scripts/prepare-assets.py

Requer: Pillow >= 11 (com suporte a avif/webp) e fonttools.
"""

from __future__ import annotations

import gzip
import io
import json
import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, features

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "projeto" / "assets"
PUBLIC = ROOT / "public"
IMG_OUT = PUBLIC / "img"
FONT_OUT = PUBLIC / "fonts"
MANIFEST_TS = ROOT / "src" / "assets" / "images.ts"

AVIF_Q = 52
WEBP_Q = 74
JPEG_Q = 78


# --------------------------------------------------------------------------- #
# 1. fontes                                                                    #
# --------------------------------------------------------------------------- #
# Só as faces que o design realmente usa. O export traz Switzer (4 pesos) e os
# itálicos de General Sans, mas nenhum elemento os referencia — todo itálico do
# layout é Zodiak. Deixar de fora corta ~46% do peso das fontes.
USED_FACES = (
    "zodiak-400",
    "zodiak-400-italic",
    "zodiak-700",
    "zodiak-700-italic",
    "general-sans-300",
    "general-sans-400",
    "general-sans-500",
)


# Rede de segurança do subset: tudo que a língua pede, mesmo que o texto atual
# não use. Sem isto, trocar uma palavra do copy quebraria a fonte em silêncio.
CHARSET_BASE = (
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789"
    "áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ"
    " .,;:!?'\"()[]{}@&/\\%+*=<>#$·—–-_|^~`°ºª€£"
    " ‘’“”…–—·✦­"
)


def charset_do_site() -> str:
    """Une os caracteres que realmente aparecem no código-fonte do site."""
    usados: set[str] = set(CHARSET_BASE)
    alvos = [*(ROOT / "src").rglob("*.tsx"), *(ROOT / "src").rglob("*.ts"), ROOT / "index.html"]
    for arq in alvos:
        try:
            usados.update(arq.read_text(encoding="utf-8"))
        except OSError:
            continue
    return "".join(sorted(c for c in usados if c.isprintable() or c == " "))


def copy_fonts() -> None:
    """Subsetta cada face para os glifos do site e grava woff2 + woff.

    As fontes estão no caminho crítico do LCP: o "MONTE" do hero só pinta
    quando o Zodiak 700 chega. Cortar os glifos que o site nunca usa é o que
    mais encurta essa espera — e o `.ttf` do export, que é um blob gzip
    inútil no navegador, fica de fora.
    """
    from fontTools import subset as fts
    from fontTools.ttLib import TTFont

    FONT_OUT.mkdir(parents=True, exist_ok=True)
    texto = charset_do_site()
    antes = depois = 0

    for face in USED_FACES:
        origem = gzip.decompress((SRC / f"{face}.ttf").read_bytes())
        for ext in ("woff2", "woff"):
            antes += (SRC / f"{face}.{ext}").stat().st_size

        fonte = TTFont(io.BytesIO(origem))
        subsetter = fts.Subsetter(
            options=fts.Options(
                layout_features=["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk"],
                notdef_outline=True,
                recalc_bounds=True,
                drop_tables=["FFTM"],
            )
        )
        subsetter.populate(text=texto)
        subsetter.subset(fonte)

        for ext, flavor in (("woff2", "woff2"), ("woff", "woff")):
            fonte.flavor = flavor
            destino = FONT_OUT / f"{face}.{ext}"
            fonte.save(destino)
            depois += destino.stat().st_size

    print(
        f"fontes  : {len(USED_FACES) * 2} arquivos, {antes // 1024} KB -> {depois // 1024} KB "
        f"({len(texto)} glifos) -> public/fonts/"
    )


def load_ttf(face: str, size: int) -> ImageFont.FreeTypeFont:
    """Os .ttf do export estão gzipados; descompacta em memória para o Pillow."""
    raw = gzip.decompress((SRC / f"{face}.ttf").read_bytes())
    return ImageFont.truetype(io.BytesIO(raw), size)


# --------------------------------------------------------------------------- #
# 2. derivadas responsivas                                                     #
# --------------------------------------------------------------------------- #
@dataclass(frozen=True)
class Source:
    """Uma imagem do export e as larguras em que ela é realmente renderizada."""

    file: str
    widths: tuple[int, ...]
    alt: str
    # `sizes` do <img>, calculado a partir do layout do export
    sizes: str


SOURCES: tuple[Source, ...] = (
    Source(
        # imagem do hero e do Terroir, sempre a 100vw: precisa de degraus
        # finos, senão uma tela de 1440 baixa a derivada de 1920 à toa
        "vinhedo-nevoa.jpg",
        (640, 768, 1024, 1280, 1440, 1600, 1920, 2000),
        "Vinhedo de altitude sob mar de névoa",
        "100vw",
    ),
    Source(
        "rolhas.jpg",
        (780, 1560),
        "Rolhas de safras antigas",
        "(max-width: 907px) 86vw, 780px",
    ),
    Source(
        "garrafas-empoeiradas.jpg",
        (480, 960),
        "Garrafas antigas com lacre de cera na adega",
        "(max-width: 640px) 100vw, 480px",
    ),
    Source(
        "adega-barris.jpg",
        (440, 880),
        "Corredor de barris de carvalho na adega",
        "(max-width: 640px) 100vw, 440px",
    ),
    Source(
        "garrafa-tinto-taca.jpg",
        (640, 1024, 1440),
        "Garrafa do Reserva Alma com taça",
        "(max-width: 900px) 100vw, 50vw",
    ),
    Source(
        "rose-servindo.jpg",
        (640, 1024, 1440),
        "Rosé de Altitude sendo servido",
        "(max-width: 900px) 100vw, 50vw",
    ),
    Source(
        "garrafa-por-do-sol.jpg",
        (608, 1216),
        "Branco das Neblinas ao pôr do sol",
        "(max-width: 820px) 78vw, 608px",
    ),
    Source(
        "splash-taca.jpg",
        (768, 1335),
        "Taça com splash de vinho tinto",
        "100vw",
    ),
    Source(
        "mesa-rustica.jpg",
        (512, 1024),
        "Garrafa e taças em mesa rústica",
        "(max-width: 900px) 72vw, 512px",
    ),
    Source(
        "parede-garrafas.jpg",
        (320, 640),
        "Parede de garrafas do wine bar",
        "(max-width: 900px) 44vw, 320px",
    ),
    Source(
        "vinhedo-dia.jpg",
        (256, 512),
        "Vinhedo verde à luz do dia",
        "(max-width: 900px) 36vw, 256px",
    ),
)

BOTTLE = Source(
    "garrafa-hero-recorte.png",
    (341,),
    "Garrafa Monte Vinhedo",
    "(max-width: 900px) 74vw, 30vw",
)


def slug(file: str) -> str:
    return Path(file).stem


def emit_variants(im: Image.Image, stem: str, widths: tuple[int, ...], alpha: bool) -> dict:
    """Escreve avif/webp + fallback e devolve a entrada de manifesto."""
    # nunca faz upscale: larguras acima da origem viram a largura nativa
    wanted = sorted({min(w, im.width) for w in widths})
    out_widths: list[int] = []
    for w in wanted:
        scaled = im if w == im.width else im.resize(
            (w, round(im.height * w / im.width)), Image.LANCZOS
        )
        scaled.save(IMG_OUT / f"{stem}-{w}.avif", quality=AVIF_Q, speed=4)
        scaled.save(IMG_OUT / f"{stem}-{w}.webp", quality=WEBP_Q, method=6)
        if alpha:
            scaled.save(IMG_OUT / f"{stem}-{w}.png", optimize=True)
        else:
            scaled.convert("RGB").save(
                IMG_OUT / f"{stem}-{w}.jpg", quality=JPEG_Q, optimize=True, progressive=True
            )
        out_widths.append(w)
    return {
        "widths": out_widths,
        "fallback": "png" if alpha else "jpg",
        "width": im.width,
        "height": im.height,
    }


def build_images() -> dict:
    IMG_OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict = {}
    for s in (*SOURCES, BOTTLE):
        im = Image.open(SRC / s.file)
        alpha = im.mode in ("RGBA", "LA")
        im = im.convert("RGBA" if alpha else "RGB")
        entry = emit_variants(im, slug(s.file), s.widths, alpha)
        entry.update(alt=s.alt, sizes=s.sizes)
        manifest[slug(s.file)] = entry
        print(f"imagem  : {s.file:28s} -> {entry['widths']}")
    return manifest


# --------------------------------------------------------------------------- #
# 3. retalhos do rótulo (QR code + textos "mockupfree")                        #
# --------------------------------------------------------------------------- #
# Regiões medidas sobre garrafa-hero-recorte.png (341x1197). Juntas, limpam o
# rótulo inteiro do mockup para que ele possa ser rebatizado:
#   C  y 615..667  -> "RED LABEL"
#   A  y 686..727  -> "A wine bottle label mockup / set from mockupfree.net"
#   D  y 793..873  -> monograma "MF"
#   B  y 946..1027 -> QR code + "MOCKUPFREE.NET" + letra miúda
# Cada retalho reconstrói o rótulo: textura (alta frequência) doada de uma
# faixa limpa da própria etiqueta + iluminação (baixa frequência) interpolada
# a partir das linhas limpas que cercam a região coberta.
# `fx` é a largura do esfumado lateral. O rótulo tem um brilho especular
# forte à esquerda, e ali um corte de 2px vira degrau visível: as faixas que
# atravessam esse brilho dissolvem em 8px. A faixa B mantém 2px porque
# precisa cobrir o QR code, que começa a 1px da borda útil da etiqueta.
PATCHES = (
    dict(name="label-patch-c", x0=26, x1=315, y0=615, y1=667, fx=8,
         donor=(558, 610), above=(598, 614), below=(669, 684)),
    dict(name="label-patch-a", x0=28, x1=313, y0=686, y1=727, fx=8,
         donor=(732, 773), above=(674, 686), below=(729, 741)),
    dict(name="label-patch-d", x0=33, x1=308, y0=793, y1=873, fx=8,
         donor=(866, 946), above=(778, 792), below=(876, 890)),
    dict(name="label-patch-b", x0=34, x1=306, y0=946, y1=1027, fx=2,
         donor=(866, 947), above=(920, 944), below=None),
)


def build_label_patches() -> dict:
    import numpy as np

    src = Image.open(SRC / "garrafa-hero-recorte.png").convert("RGB")
    A = np.asarray(src).astype(float)
    H, W, _ = A.shape

    def low(y0: int, y1: int, x0: int, x1: int, sigma: float = 9) -> "np.ndarray":
        crop = Image.fromarray(A[y0:y1, x0:x1].astype("uint8"))
        return np.asarray(crop.filter(ImageFilter.GaussianBlur(sigma))).astype(float)

    out = {}
    for p in PATCHES:
        x0, x1, y0, y1 = p["x0"], p["x1"], p["y0"], p["y1"]
        w, h = x1 - x0, y1 - y0

        donor = A[p["donor"][0]: p["donor"][1], x0:x1]
        if donor.shape[0] != h:
            donor = np.asarray(
                Image.fromarray(donor.astype("uint8")).resize((w, h), Image.LANCZOS)
            ).astype(float)
        texture = donor - np.asarray(
            Image.fromarray(donor.astype("uint8")).filter(ImageFilter.GaussianBlur(9))
        ).astype(float)

        top = low(*p["above"], x0, x1).mean(axis=0)
        if p["below"]:
            bot = low(*p["below"], x0, x1).mean(axis=0)
        else:  # nada limpo abaixo (fim do rótulo): extrapola a tendência vertical
            a0, a1 = p["above"]
            prev = low(a0 - 40, a1 - 40, x0, x1).mean(axis=0)
            bot = top + (top - prev) / 40 * h * 0.85

        t = np.linspace(0, 1, h)[:, None, None]
        patch = np.clip(top[None] * (1 - t) + bot[None] * t + texture, 0, 255)

        rgba = np.dstack([patch, np.full((h, w), 255.0)])
        fv, fx = 5, int(p["fx"])
        for i in range(fv):  # esfumado vertical
            rgba[i, :, 3] = rgba[h - 1 - i, :, 3] = 255 * (i + 0.5) / fv
        for i in range(fx):  # esfumado horizontal
            rgba[:, i, 3] *= (i + 0.5) / fx
            rgba[:, w - 1 - i, 3] *= (i + 0.5) / fx

        img = Image.fromarray(rgba.astype("uint8"), "RGBA")
        img.save(IMG_OUT / f"{p['name']}.png", optimize=True)
        img.save(IMG_OUT / f"{p['name']}.avif", quality=AVIF_Q, speed=4)
        img.save(IMG_OUT / f"{p['name']}.webp", quality=WEBP_Q, method=6)
        out[p["name"]] = {
            "left": round(x0 / W * 100, 4),
            "top": round(y0 / H * 100, 4),
            "width": round(w / W * 100, 4),
            "height": round(h / H * 100, 4),
        }
        print(f"retalho : {p['name']}  {w}x{h}px (png/webp/avif)")

    build_silhueta()
    return out


def build_silhueta() -> None:
    """Silhueta da garrafa em alfa puro, para `mask-image` do reflexo de luz.

    O reflexo precisa ser recortado pelo contorno do vidro. Usar o PNG da
    garrafa como máscara baixaria 325 KB só para isso; a silhueta sozinha é
    uma forma suave e comprime para uma fração disso.
    """
    src = Image.open(SRC / "garrafa-hero-recorte.png").convert("RGBA")
    alfa = src.getchannel("A")
    silhueta = Image.merge("RGBA", (alfa, alfa, alfa, alfa))
    silhueta.save(IMG_OUT / "garrafa-silhueta.png", optimize=True)
    silhueta.save(IMG_OUT / "garrafa-silhueta.webp", lossless=True, method=6)
    kb = (IMG_OUT / "garrafa-silhueta.webp").stat().st_size / 1024
    print(f"silhueta: garrafa-silhueta.webp {kb:.0f} KB (máscara do reflexo)")


# --------------------------------------------------------------------------- #
# 4. og:image                                                                  #
# --------------------------------------------------------------------------- #
OG_W, OG_H = 1200, 630
BORDO, CREME, DOURADO = (20, 8, 11), (242, 234, 216), (201, 164, 92)


def _vgradient(size: tuple[int, int], stops: list[tuple[float, tuple[int, int, int], float]]):
    """Gradiente vertical a partir de paradas (posição 0..1, cor, alpha 0..1)."""
    w, h = size
    strip = Image.new("RGBA", (1, h))
    for y in range(h):
        t = y / (h - 1)
        i = max(0, min(len(stops) - 2, next(
            (j for j in range(len(stops) - 1) if stops[j + 1][0] >= t), len(stops) - 2)))
        (p0, c0, a0), (p1, c1, a1) = stops[i], stops[i + 1]
        k = 0.0 if p1 == p0 else (t - p0) / (p1 - p0)
        col = tuple(round(a + (b - a) * k) for a, b in zip(c0, c1))
        strip.putpixel((0, y), (*col, round(255 * (a0 + (a1 - a0) * k))))
    return strip.resize((w, h))


def build_og(patch_boxes: dict) -> None:
    """Recompõe o sanduíche do hero (MONTE atrás / garrafa / VINHEDO na frente)
    num quadro 1200x630, que precisa continuar legível a 600x315 no feed."""
    bg = Image.open(SRC / "vinhedo-nevoa.jpg").convert("RGB")
    scale = max(OG_W / bg.width, OG_H / bg.height)
    bg = bg.resize((round(bg.width * scale), round(bg.height * scale)), Image.LANCZOS)
    left, top = (bg.width - OG_W) // 2, round((bg.height - OG_H) * 0.38)
    bg = bg.crop((left, top, left + OG_W, top + OG_H)).convert("RGBA")

    # mesmo empilhamento de gradientes do hero, condensado
    bg = Image.alpha_composite(bg, _vgradient((OG_W, OG_H), [
        (0.00, BORDO, 0.86), (0.46, (114, 32, 54), 0.60), (1.00, BORDO, 0.96),
    ]))

    zodiak_b = load_ttf("zodiak-700", 236)
    zodiak_r = load_ttf("zodiak-400", 64)
    sans = load_ttf("general-sans-400", 17)
    draw = ImageDraw.Draw(bg)

    def centered(text: str, f: ImageFont.FreeTypeFont, y: int, fill, tracking: int = 0) -> None:
        if not tracking:
            draw.text((OG_W / 2, y), text, font=f, fill=fill, anchor="mt")
            return
        adv = [draw.textlength(c, font=f) + tracking for c in text]
        x = (OG_W - (sum(adv) - tracking)) / 2
        for c, a in zip(text, adv):
            draw.text((x, y), c, font=f, fill=fill, anchor="lt")
            x += a

    centered("MONTE", zodiak_b, 52, CREME)  # camada de trás

    # garrafa, já com os retalhos do rótulo aplicados, sangrando pela base
    bottle = Image.open(SRC / "garrafa-hero-recorte.png").convert("RGBA")
    for name in patch_boxes:
        p = next(x for x in PATCHES if x["name"] == name)
        bottle.alpha_composite(
            Image.open(IMG_OUT / f"{name}.png").convert("RGBA"), (p["x0"], p["y0"])
        )
    bh = 604
    bottle = bottle.resize((round(bottle.width * bh / bottle.height), bh), Image.LANCZOS)
    bx, by = (OG_W - bottle.width) // 2, 96

    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sil = Image.new("RGBA", bottle.size, (0, 0, 0, 0))
    sil.paste((0, 0, 0, 185), (0, 0), bottle)
    shadow.paste(sil, (bx, by + 34), sil)
    bg = Image.alpha_composite(bg, shadow.filter(ImageFilter.GaussianBlur(30)))
    bg.alpha_composite(bottle, (bx, by))

    # véu inferior: a garrafa mergulha no bordô a partir do ombro. Além de abrir
    # palco pro lettering, tira de cena o "RED LABEL"/"MF" do mockup do rótulo.
    bg = Image.alpha_composite(bg, _vgradient((OG_W, OG_H), [
        (0.00, BORDO, 0.0), (0.38, BORDO, 0.0), (0.56, BORDO, 0.88),
        (0.74, BORDO, 0.98), (1.00, BORDO, 1.0),
    ]))

    draw = ImageDraw.Draw(bg)
    centered("VINHEDO", zodiak_r, 398, CREME, tracking=20)  # camada da frente

    cx, y = OG_W / 2, 505
    draw.line([(cx - 152, y), (cx - 26, y)], fill=(*DOURADO, 120), width=1)
    draw.line([(cx + 26, y), (cx + 152, y)], fill=(*DOURADO, 120), width=1)
    r = 5.5  # ✦ desenhado como polígono: a glifo não existe nas fontes do export
    draw.polygon(
        [(cx, y - r), (cx + r * 0.30, y - r * 0.30), (cx + r, y), (cx + r * 0.30, y + r * 0.30),
         (cx, y + r), (cx - r * 0.30, y + r * 0.30), (cx - r, y), (cx - r * 0.30, y - r * 0.30)],
        fill=DOURADO,
    )
    centered("VINHOS FINOS DE ALTITUDE · DESDE 1987", sans, 534, DOURADO, tracking=7)

    bg.convert("RGB").save(PUBLIC / "og.jpg", quality=86, optimize=True, progressive=True)
    print(f"og      : public/og.jpg {OG_W}x{OG_H}")


# --------------------------------------------------------------------------- #
# 5. monograma MV                                                              #
# --------------------------------------------------------------------------- #
MONOGRAM_TS = ROOT / "src" / "assets" / "monogram.ts"
GAP = 30  # folga entre a haste final do M e a diagonal do V, em unidades de em


def build_monogram() -> None:
    """Extrai as curvas reais de 'M' e 'V' do Zodiak 700 e monta o monograma.

    Sai como dois <path> independentes: o Preloader traça cada um com DrawSVG,
    e o mesmo desenho, preenchido, vira favicon."""
    import gzip as _gzip

    from fontTools.misc.transform import Transform
    from fontTools.pens.boundsPen import BoundsPen
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.ttLib import TTFont

    font = TTFont(io.BytesIO(_gzip.decompress((SRC / "zodiak-700.ttf").read_bytes())))
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()

    def ink(ch: str):
        bp = BoundsPen(glyphs)
        glyphs[cmap[ord(ch)]].draw(bp)
        return bp.bounds

    (mx0, _, mx1, _), (vx0, _, vx1, _) = ink("M"), ink("V")
    cap = max(ink("M")[3], ink("V")[3])
    v_dx = mx1 + GAP - vx0                       # encosta o V logo depois do M
    w, h = (v_dx + vx1) - mx0, cap

    def path(ch: str, dx: float) -> str:
        pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.1f}")
        # y invertido: a origem tipográfica sobe, a do SVG desce
        glyphs[cmap[ord(ch)]].draw(TransformPen(pen, Transform(1, 0, 0, -1, dx - mx0, cap)))
        return pen.getCommands()

    m_path, v_path = path("M", 0), path("V", v_dx)

    MONOGRAM_TS.parent.mkdir(parents=True, exist_ok=True)
    MONOGRAM_TS.write_text(
        "// GERADO POR scripts/prepare-assets.py — não editar à mão.\n"
        "// Contornos reais do 'M' e do 'V' em Zodiak 700, a mesma face do lettering\n"
        "// do site. O Preloader traça os dois com DrawSVG; o selo de cera repete a\n"
        "// forma em texto.\n\n"
        f"export const MONOGRAM_VIEWBOX = '0 0 {w:.0f} {h:.0f}';\n\n"
        f"export const MONOGRAM_M = '{m_path}';\n\n"
        f"export const MONOGRAM_V = '{v_path}';\n",
        encoding="utf-8",
    )

    pad, side = 0.16, 100.0                      # favicon: quadrado bordô + MV dourado
    scale = side * (1 - 2 * pad) / max(w, h)
    tx, ty = (side - w * scale) / 2, (side - h * scale) / 2
    (PUBLIC / "favicon.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {side:.0f} {side:.0f}">'
        f'<rect width="100" height="100" rx="18" fill="#14080b"/>'
        f'<g transform="translate({tx:.2f} {ty:.2f}) scale({scale:.5f})" fill="#c9a45c">'
        f'<path d="{m_path}"/><path d="{v_path}"/></g></svg>',
        encoding="utf-8",
    )

    ios = 180                                    # apple-touch-icon: sem transparência
    icon = Image.new("RGB", (ios, ios), BORDO)
    d = ImageDraw.Draw(icon)
    fnt = load_ttf("zodiak-700", 96)
    d.text((ios / 2, ios / 2 + 4), "MV", font=fnt, fill=DOURADO, anchor="mm")
    icon.save(PUBLIC / "apple-touch-icon.png", optimize=True)
    print(f"monogr. : favicon.svg + apple-touch-icon.png (viewBox 0 0 {w:.0f} {h:.0f})")


# --------------------------------------------------------------------------- #
# 6. manifesto tipado                                                          #
# --------------------------------------------------------------------------- #
def write_manifest(images: dict, patches: dict) -> None:
    MANIFEST_TS.parent.mkdir(parents=True, exist_ok=True)
    body = f"""// GERADO POR scripts/prepare-assets.py — não editar à mão.
// Cada entrada descreve as derivadas responsivas de uma imagem do export.

export type ImageMeta = {{
  /** larguras disponíveis em avif/webp/fallback, em px */
  readonly widths: readonly number[];
  readonly fallback: 'jpg' | 'png';
  /** dimensões intrínsecas da origem, para reservar espaço e evitar CLS */
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly sizes: string;
}};

export const IMAGES = {json.dumps(images, ensure_ascii=False, indent=2)} as const satisfies Record<string, ImageMeta>;

export type ImageName = keyof typeof IMAGES;

/** Caixas dos retalhos que cobrem o QR code e os textos "mockupfree"
 *  do rótulo, em % das dimensões intrínsecas da garrafa. */
export const LABEL_PATCHES = {json.dumps(patches, ensure_ascii=False, indent=2)} as const;
"""
    MANIFEST_TS.write_text(body, encoding="utf-8")
    print(f"manifest: src/assets/images.ts ({len(images)} imagens)")


def main() -> None:
    if not features.check("avif") or not features.check("webp"):
        raise SystemExit("Pillow sem suporte a avif/webp — instale `pillow` >= 11.3")
    PUBLIC.mkdir(exist_ok=True)
    copy_fonts()
    images = build_images()
    patches = build_label_patches()
    build_og(patches)
    build_monogram()
    write_manifest(images, patches)
    print("\nok — assets prontos em public/")


if __name__ == "__main__":
    main()
