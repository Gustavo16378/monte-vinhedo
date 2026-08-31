import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * O CSS do site inteiro cabe em ~6 kB comprimidos. Como <link> ele custa uma
 * ida à rede que bloqueia o primeiro paint; embutido no <head>, o hero pinta
 * no primeiro RTT. Só vale porque é uma página só — em um site com rotas,
 * caching separado ganharia.
 */
function inlineCss(): Plugin {
  return {
    name: 'monte-vinhedo:inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_opcoes, bundle) {
      const css = Object.values(bundle).filter(
        (c) => c.type === 'asset' && c.fileName.endsWith('.css'),
      );
      const html = Object.values(bundle).find(
        (c) => c.type === 'asset' && c.fileName.endsWith('.html'),
      );
      if (!html || html.type !== 'asset' || !css.length) return;

      let fonte = String(html.source);
      for (const folha of css) {
        if (folha.type !== 'asset') continue;
        fonte = fonte.replace(
          new RegExp(`\\s*<link[^>]*href="[^"]*${folha.fileName}"[^>]*>`),
          `<style>${String(folha.source)}</style>`,
        );
        delete bundle[folha.fileName];
      }
      html.source = fonte;
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineCss()],
  build: {
    target: 'es2022',
    cssTarget: 'chrome111',
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        // GSAP + Lenis mudam muito menos que o site: cache separado.
        manualChunks: (id) =>
          /node_modules[\\/](gsap|@gsap|lenis)/.test(id) ? 'motion' : undefined,
      },
    },
  },
});
