import { useCallback, useEffect, useState } from 'react';
import { agendarLiberacao } from './motion/prontidao';
import { useSmoothScroll } from './motion/useSmoothScroll';
import { useBodyBackground } from './motion/useBodyBackground';
import { useCapituloSpy } from './motion/capituloAtivo';
import { preloaderJaRodou } from './components/Preloader';
import { Lombada } from './components/Lombada';
import { IndicadorCapitulo } from './components/IndicadorCapitulo';
import { Hero } from './components/Hero';
import { Manifesto } from './components/Manifesto';
import { Terroir } from './components/Terroir';
import { Historia } from './components/Historia';
import { Vinhos } from './components/Vinhos';
import { DivisorIntensidade } from './components/DivisorIntensidade';
import { Visite } from './components/Visite';
import { Footer } from './components/Footer';

/**
 * A degustação inteira, na ordem em que o scroll a serve.
 *
 * As seções não têm background: quem viaja entre bordô e creme é o body,
 * lendo o `data-bg` de cada uma (ver `useBodyBackground`).
 */
export function App(): React.JSX.Element {
  // lido de forma síncrona: se o preloader já rodou nesta sessão, a abertura
  // pula direto para a entrada do hero
  const [comPreloader] = useState(() => !preloaderJaRodou());
  const [aberturaFim, setAberturaFim] = useState(false);
  const fecharAbertura = useCallback(() => setAberturaFim(true), []);

  useSmoothScroll();
  useBodyBackground();
  useCapituloSpy();

  // O preparo das seções de baixo (SplitText + ScrollTriggers) espera a
  // abertura terminar e a linha principal ficar ociosa. Nada disso está em
  // cena antes disso, e adiantá-lo custa mais de um segundo de layout no
  // celular.
  useEffect(() => (aberturaFim ? agendarLiberacao() : undefined), [aberturaFim]);

  return (
    <>
      <Lombada />
      <IndicadorCapitulo />

      <main>
        {/* o preloader é a primeira cena da abertura do hero, e por isso vive
            dentro dele: as duas animações são uma timeline só */}
        <Hero comPreloader={comPreloader} onAberturaFim={fecharAbertura} />
        <Manifesto />
        <Terroir />
        <Historia />
        <Vinhos />
        <DivisorIntensidade />
        <Visite />
      </main>

      <Footer />
    </>
  );
}
