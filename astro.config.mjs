// @ts-check
import { fileURLToPath } from 'node:url';

import node from '@astrojs/node';
import solidJs from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// El acceso y el área privada se renderizan en servidor: la sesión vive en una
// cookie HttpOnly y nunca en el cliente.
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
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
