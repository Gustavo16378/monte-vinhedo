import { useCallback, useEffect, useState } from 'react';
import { agendarLiberacao } from './motion/prontidao';
import { useSmoothScroll } from './motion/useSmoothScroll';
import { useBodyBackground } from './motion/useBodyBackground';
import { useCapituloSpy } from './motion/capituloAtivo';
import { Preloader, preloaderJaRodou } from './components/Preloader';
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
  // lido de forma síncrona: se o preloader já rodou nesta sessão, o hero
  // começa a animar no primeiro frame, sem esperar por nada
  const [mostrarPreloader] = useState(() => !preloaderJaRodou());
  const [heroLiberado, setHeroLiberado] = useState(!mostrarPreloader);
  const liberarHero = useCallback(() => setHeroLiberado(true), []);

  useSmoothScroll();
  useBodyBackground();
  useCapituloSpy();

  // O preparo das seções de baixo (SplitText + ScrollTriggers) espera o hero
  // entrar e a linha principal ficar ociosa. Nada disso está em cena antes
  // disso, e adiantá-lo custa mais de um segundo de layout no celular.
  useEffect(() => (heroLiberado ? agendarLiberacao() : undefined), [heroLiberado]);

  return (
    <>
      {mostrarPreloader && <Preloader onDone={liberarHero} />}

      <Lombada />
      <IndicadorCapitulo />

      <main>
        <Hero pronto={heroLiberado} />
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
