# ADR-0003: CSP estricta por hashes

- **Estado:** aceptado
- **Fecha:** 2026-10-26
- **Decisores:** Equipo PSA
- **Referencias:** `astro.config.mjs`, `src/middleware.ts`, `scripts/check-csp.mjs`

## Contexto

El proyecto maneja credenciales y sesión, por lo que una CSP débil o ausente no
es aceptable. La regla del estándar prohíbe `unsafe-inline` y `unsafe-eval`; a la
vez, Astro inserta scripts inline para el arranque del tema y Solid inserta su
script de hidratación antes de las islas.

Astro 7 puede generar la CSP y los hashes de los recursos que procesa, pero su
soporte tiene límites: los scripts inline de un renderer no siempre se registran
en `script-src`, y el resaltado de Shiki usa estilos inline incompatibles. En SSR
la política se emite por cabecera; sobrescribirla desde el middleware borraría
las directivas generadas.

## Decisión

1. Activar `security.csp` en `astro.config.mjs` con `default-src 'self'`,
   `connect-src 'self'`, `img-src 'self' data:`, `font-src 'self'`,
   `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` y
   `frame-ancestors 'none'`.
2. No escribir `Content-Security-Policy` desde el middleware. Astro la emite y
   el middleware solo agrega cabeceras complementarias.
3. Servir el arranque del tema como `public/theme-init.js` externo, en lugar de
   un `<script is:inline>`.
4. Añadir a `scriptDirective.hashes` el hash del script de hidratación de Solid
   (`sha256-VmEf…`). Es el único inline que Astro no hashea automáticamente.
5. Desactivar el resaltado de Shiki (`markdown.syntaxHighlight: false`) para no
   generar estilos inline incompatibles.
6. Verificar el resultado con `scripts/check-csp.mjs`: levanta el build, inicia
   sesión y comprueba hashes, directivas, cabeceras y cookie en las catorce rutas.

## Consecuencias

### Positivas

- No se permite JavaScript inline sin hash ni `eval`.
- `frame-ancestors 'none'` impide el framing; se complementa con
  `X-Frame-Options: DENY`.
- El tema se aplica antes del primer pintado sin necesitar un hash adicional.
- La verificación es reproducible y detecta regresiones en CI o antes de un PR.

### Negativas o costo

- El hash de Solid está acoplado a la versión del renderer. Una actualización de
  `solid-js` o `@astrojs/solid-js` puede cambiarlo.
- `check:csp` requiere un build y arranca un servidor; no es una prueba unitaria.
- La política se sirve por cabecera, no por `<meta>`, porque las rutas son SSR.

### Riesgos y mitigación

- **Hash desactualizado:** el smoke de CSP falla de inmediato; el mensaje indica
  el hash faltante. Actualizar el valor en `astro.config.mjs` tras revisar el
  cambio de dependencia.
- **Nuevo inline de un componente:** el mismo check falla y evita publicar una
  página con estilos o scripts bloqueados.
- **Cabecera sobrescrita:** el test comprueba que las directivas completas estén
  presentes, no solo `frame-ancestors`.

## Alternativas consideradas

| Alternativa | Por qué no |
| --- | --- |
| `script-src 'unsafe-inline'` | Anula la protección principal ante XSS |
| Desactivar la CSP | Incumple el estándar de seguridad |
| Nonce por request | Astro 7 no ofrece integración para todos los scripts del renderer; habría que parchear el HTML |
| CSP solo con `<meta>` | No admite `frame-ancestors`; además las rutas son SSR |
| Mantener Shiki y permitir estilos inline | Abre `style-src` sin necesidad; el proyecto no renderiza markdown |

## Cómo se verifica

```sh
bun run build
bun run check:csp
```

El script comprueba en `/iniciar-sesion`, `/panel` y los módulos:

- Cada script inline no vacío tiene su hash en `script-src` (o
  `script-src-elem`).
- Cada `<style>` inline tiene su hash en `style-src`.
- No hay `unsafe-inline`, `unsafe-eval`, atributos `style` ni manejadores
  `on*` inline.
- `object-src 'none'`, `base-uri 'self'` y las cabeceras de endurecimiento.
- La cookie de sesión es `HttpOnly`, `Secure` y `SameSite=Lax`.

## Notas de migración

Al actualizar Solid, Astro o el adaptador:

1. Ejecutar `bun run build`.
2. Ejecutar `bun run check:csp`.
3. Si falla por el hash de hidratación, copiar el hash reportado a
   `security.csp.scriptDirective.hashes`.
4. Revisar que el cambio no haya introducido otros scripts inline.
