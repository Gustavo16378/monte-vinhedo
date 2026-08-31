// GERADO POR scripts/prepare-assets.py — não editar à mão.
// Cada entrada descreve as derivadas responsivas de uma imagem do export.

export type ImageMeta = {
  /** larguras disponíveis em avif/webp/fallback, em px */
  readonly widths: readonly number[];
  readonly fallback: 'jpg' | 'png';
  /** dimensões intrínsecas da origem, para reservar espaço e evitar CLS */
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly sizes: string;
};

export const IMAGES = {
  "vinhedo-nevoa": {
    "widths": [
      640,
      768,
      1024,
      1280,
      1440,
      1600,
      1920,
      2000
    ],
    "fallback": "jpg",
    "width": 2000,
    "height": 1333,
    "alt": "Vinhedo de altitude sob mar de névoa",
    "sizes": "100vw"
  },
  "rolhas": {
    "widths": [
      780,
      1560
    ],
    "fallback": "jpg",
    "width": 2000,
    "height": 1333,
    "alt": "Rolhas de safras antigas",
    "sizes": "(max-width: 907px) 86vw, 780px"
  },
  "garrafas-empoeiradas": {
    "widths": [
      480,
      960
    ],
    "fallback": "jpg",
    "width": 1500,
    "height": 2000,
    "alt": "Garrafas antigas com lacre de cera na adega",
    "sizes": "(max-width: 640px) 100vw, 480px"
  },
  "adega-barris": {
    "widths": [
      440,
      880
    ],
    "fallback": "jpg",
    "width": 2000,
    "height": 1125,
    "alt": "Corredor de barris de carvalho na adega",
    "sizes": "(max-width: 640px) 100vw, 440px"
  },
  "garrafa-tinto-taca": {
    "widths": [
      640,
      1024,
      1440
    ],
    "fallback": "jpg",
    "width": 1636,
    "height": 2000,
    "alt": "Garrafa do Reserva Alma com taça",
    "sizes": "(max-width: 900px) 100vw, 50vw"
  },
  "rose-servindo": {
    "widths": [
      640,
      1024,
      1333
    ],
    "fallback": "jpg",
    "width": 1333,
    "height": 2000,
    "alt": "Rosé de Altitude sendo servido",
    "sizes": "(max-width: 900px) 100vw, 50vw"
  },
  "garrafa-por-do-sol": {
    "widths": [
      608,
      1216
    ],
    "fallback": "jpg",
    "width": 1333,
    "height": 2000,
    "alt": "Branco das Neblinas ao pôr do sol",
    "sizes": "(max-width: 820px) 78vw, 608px"
  },
  "splash-taca": {
    "widths": [
      768,
      1335
    ],
    "fallback": "jpg",
    "width": 1335,
    "height": 2000,
    "alt": "Taça com splash de vinho tinto",
    "sizes": "100vw"
  },
  "mesa-rustica": {
    "widths": [
      512,
      1024
    ],
    "fallback": "jpg",
    "width": 1125,
    "height": 2000,
    "alt": "Garrafa e taças em mesa rústica",
    "sizes": "(max-width: 900px) 72vw, 512px"
  },
  "parede-garrafas": {
    "widths": [
      320,
      640
    ],
    "fallback": "jpg",
    "width": 1333,
    "height": 2000,
    "alt": "Parede de garrafas do wine bar",
    "sizes": "(max-width: 900px) 44vw, 320px"
  },
  "vinhedo-dia": {
    "widths": [
      256,
      512
    ],
    "fallback": "jpg",
    "width": 1333,
    "height": 2000,
    "alt": "Vinhedo verde à luz do dia",
    "sizes": "(max-width: 900px) 36vw, 256px"
  },
  "garrafa-hero-recorte": {
    "widths": [
      341
    ],
    "fallback": "png",
    "width": 341,
    "height": 1197,
    "alt": "Garrafa Monte Vinhedo",
    "sizes": "(max-width: 900px) 74vw, 30vw"
  }
} as const satisfies Record<string, ImageMeta>;

export type ImageName = keyof typeof IMAGES;

/** Caixas dos retalhos que cobrem o QR code e os textos "mockupfree"
 *  do rótulo, em % das dimensões intrínsecas da garrafa. */
export const LABEL_PATCHES = {
  "label-patch-c": {
    "left": 7.6246,
    "top": 51.3784,
    "width": 84.7507,
    "height": 4.3442
  },
  "label-patch-a": {
    "left": 8.2111,
    "top": 57.3099,
    "width": 83.5777,
    "height": 3.4252
  },
  "label-patch-d": {
    "left": 9.6774,
    "top": 66.249,
    "width": 80.6452,
    "height": 6.6834
  },
  "label-patch-b": {
    "left": 9.9707,
    "top": 79.0309,
    "width": 79.7654,
    "height": 6.7669
  }
} as const;
