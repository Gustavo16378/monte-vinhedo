/** Os cinco capítulos da degustação, na ordem em que o scroll os serve. */
export type Capitulo = {
  readonly id: string;
  /** numeral romano exibido na lombada */
  readonly numeral: string;
  readonly titulo: string;
};

export const CAPITULOS: readonly Capitulo[] = [
  { id: 'manifesto', numeral: 'I', titulo: 'Manifesto' },
  { id: 'terroir', numeral: 'II', titulo: 'O Terroir' },
  { id: 'historia', numeral: 'III', titulo: 'Nossa História' },
  { id: 'vinhos', numeral: 'IV', titulo: 'Os Vinhos' },
  { id: 'visite', numeral: 'V', titulo: 'A Experiência' },
] as const;
