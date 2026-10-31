// @ts-check
import { fileURLToPath } from 'node:url';

import solidJs from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

// Configuración para Vercel con renderizado híbrido
export default defineConfig({
  adapter: vercel(),
  output: 'server',
  integrations: [solidJs()],
  security: {
    checkOrigin: true,
    csp: {
      directives: [
        "default-src 'self'",
        "connect-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "object-src 'none'",
        "frame-src 'self' blob:",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ],
      // Solid inyecta su script de hidratación como inline antes de las islas.
      // Astro no lo hashea automáticamente; se fija aquí y se verifica en el
      // smoke test de producción.
      scriptDirective: {
        hashes: ['sha256-VmEf2BGdqVUwcvyhTyarJo/bY7DNqS2+T2sz4IO/kbw='],
      },
    },
  },
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
