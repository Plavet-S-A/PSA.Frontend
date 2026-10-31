# Rendimiento

El rendimiento es parte del diseño, no una optimización posterior. Una pantalla
de gestión se usa decenas de veces al día: cada kilobyte y cada hidratación se
pagan en la operación.

## 1. Presupuesto

| Métrica | Presupuesto | Cómo se mide |
| --- | --- | --- |
| LCP | ≤ 2.0 s | Lighthouse móvil, 4G lenta, CPU 4× |
| INP | ≤ 150 ms | interacción real / campo |
| CLS | ≤ 0.05 | carga y navegación |
| TTFB | ≤ 500 ms | hosting/SSR |
| JS por ruta | ≤ 120 KB gzip | `check-budget.mjs` |
| CSS por ruta | ≤ 40 KB gzip | `check-budget.mjs` |
| HTML por ruta | ≤ 40 KB gzip | `check-budget.mjs` |
| Fuentes web | 0 por defecto | build |
| Imagen LCP | ≤ 200 KB | red |
| Solicitudes al primer render | ≤ 25 | DevTools |

El presupuesto es un techo, no una meta. Si una ruta llega a 118 KB de JS,
cualquier feature nueva necesita justificar el espacio o reemplazar algo.

## 2. Regla de oro: cero JS por defecto

En Astro, una página sin islas es HTML + CSS. Eso es el estado deseado para:

- Listas y tablas paginadas en servidor.
- Detalles de practicante, empresa, convenio, oferta.
- Paneles de solo lectura.
- Reportes renderizados en servidor.
- Formularios que pueden usar navegación nativa.
- Login con `<form method="post">` si el backend lo soporta.

La interactividad se añade solo cuando el usuario necesita respuesta inmediata
sin recargar. Cada isla es una decisión consciente, no un default.

## 3. Elegir la hidratación correcta

| Necesidad | Directiva | Por qué |
| --- | --- | --- |
| Control que se usa al instante (login, buscador principal, menú móvil) | `client:load` | Debe responder al primer toque |
| Contenido interactivo bajo el pliegue | `client:visible` | No se hidrata hasta ser visible |
| Interacción secundaria (tema, tooltip, menú de usuario) | `client:idle` | Espera al idle del navegador |
| Solo en un breakpoint | `client:media="(max-width: 768px)"` | Evita JS en desktop |
| Componente que no puede renderizar en servidor | `client:only` + skeleton | Último recurso; siempre altura reservada |

Reglas:

- **Nunca** pongas `client:load` en el layout completo ni en un contenedor que
  envuelve la página. Hidrata el componente pequeño y aislado.
- Un formulario de filtros puede ser un `<form method="get">` nativo; no
  necesita isla.
- Un modal puede ser `<dialog>` + 30 líneas de JS; no requiere una librería.
- La paginación es un enlace; no necesitas estado de cliente.
- Si necesitas dos islas que comparten estado, considera una sola isla que las
  contenga o pasa props desde Astro.

## 4. Datos

Orden de preferencia:

1. **Build time** si el dato es público y estable.
2. **SSR** (`output: 'server'` + adapter) si depende de la sesión.
3. **Server islands** (`server:defer`) para fragmentos personalizados dentro de
   una página cacheable.
4. **Fetch en cliente** solo para interacción posterior a la carga.

Reglas:

- No hidrates una página para hacer `fetch` al montar. Pasa los datos como props
  serializables desde Astro.
- En islas Solid, si necesitas fetch, usa `createResource` con `AbortController`,
  deduplicación y skeleton. Evita cascadas: `Promise.all` para peticiones
  independientes.
- Pagina en servidor. No descargues 5,000 filas para filtrar en el cliente.
- Filtros y orden en la URL; el servidor responde a `?page=2&estado=activa`.
- Respeta `Cache-Control` y `ETag` de la API. No inventes caché de PII.
- No guardes datos de sesión en caché persistente. Al logout, limpia stores.

## 5. Islas Solid

- Mantén las islas pequeñas y con una sola responsabilidad (filtros, uploader,
  rúbrica). No portes el árbol de la página a Solid.
- Props desde Astro: datos planos y serializables; no funciones ni clases.
- Evita `createEffect` para derivar estado; usa `createMemo`.
- No uses stores globales para estado que solo vive en una isla.
- No cargues librerías de UI completas. Un botón no necesita un design system
  de 80 KB.
- Importa iconos individuales y componentes concretos.
- Para listas largas dentro de una isla, virtualiza a partir de ~200 filas; si
  puedes paginar en servidor, hazlo.
- Desmonta listeners, observers, timers y `blob:` URLs en `onCleanup`.

## 6. Imágenes

- Usa `astro:assets` (`<Image>`, `<Picture>`) con `widths`, `sizes` y formatos
  AVIF/WebP.
- Dimensiones explícitas o `aspect-ratio` para evitar CLS.
- La imagen LCP: sin `loading="lazy"`, con `fetchpriority="high"`, dimensionada
  al tamaño real de render.
- Todo lo demás: `loading="lazy" decoding="async"`.
- Calidad 70–80; no subas JPEG de 3 MB.
- Avatares: 24/32/40px, no la foto original de 2000px.
- Logos: SVG optimizado; nunca un PNG de 1 MB.
- No uses imágenes decorativas de stock. Si hay una ilustración de empty state,
  que sea SVG pequeño y cacheable.

## 7. Fuentes

- Por defecto: system UI stack. Cero requests, cero CLS.
- Si el proyecto exige una fuente de marca:
  - Self-hosted, WOFF2, subset latino.
  - Máximo 2 pesos y 1 familia.
  - `font-display: swap`.
  - Precarga solo el peso del LCP.
  - `size-adjust` en la fallback para reducir CLS.
  - Sin Google Fonts ni CDNs de fuentes (privacidad + latencia).
- No cargues icon fonts. Usa SVG inline.

## 8. CSS

- Tokens globales + estilos scoped de Astro. Sin CSS-in-JS en runtime.
- Sin frameworks de utilidades sin purge; si se usa Tailwind, configura el
  content y evita clases dinámicas.
- Mantén el CSS por ruta bajo 40 KB gzip. Si crece, divide por layout/página.
- Evita `!important`, selectores profundos y `transition: all`.
- `content-visibility: auto` solo en secciones largas bajo el pliegue y con
  `contain-intrinsic-size`; no en tablas con búsqueda.
- No animes `width`, `height`, `top`, `left` ni `box-shadow`.
- Sombras y filtros son caros en móvil; úsalos solo en overlays.

## 9. JavaScript

- Prefiere APIs nativas: `<dialog>`, `<details>`, validación HTML, `fetch`,
  `URLSearchParams`, `Intl.DateTimeFormat`, `Intl.NumberFormat`.
- Nada de `moment` (usa `Intl`), `lodash` completo, `jQuery` ni librerías de
  gráficos pesadas.
- Si una librería es imprescindible, impórtala dinámicamente en la isla que la
  usa y solo cuando se necesita.
- Evita polyfills innecesarios; define los navegadores objetivo.
- No uses `setInterval` para polling agresivo; usa eventos, SSE o intervalos
  largos con pausa en pestaña oculta.
- `console.*` fuera de producción (o mínimo y sin datos).

## 10. Caché y navegación

- Assets con hash (`/_astro/*`): `Cache-Control: public, max-age=31536000,
  immutable`.
- HTML: `no-cache` o max-age corto; autenticado: `no-store`.
- `prefetch` solo para rutas probables (hover/viewport), no para todo el menú.
- Precarga selectiva de la fuente/imagen LCP; nada más.
- No uses service workers por defecto. Si se añaden, nunca cacheen HTML
  autenticado ni respuestas con PII.

## 11. Medición

- CI: `bun run build` + `check-budget.mjs`. Falla el PR si excede.
- Lighthouse CI con presupuesto de LCP/CLS/INP y tamaños.
- Prueba en un móvil medio (Moto G4 emulado) con 4G lenta, no solo en desktop.
- Mide en campo (RUM) si hay consentimiento; no envíes PII.
- Revisa el bundle antes/después de cada dependencia nueva.
- Un cambio de diseño que añade una isla debe incluir su costo.

```sh
bun run build
node .opencode/skills/psa-design-standard/scripts/check-budget.mjs
node .opencode/skills/psa-design-standard/scripts/check-budget.mjs --js 100 --css 30
```

## 12. Anti-patrones prohibidos

| Anti-patrón | Consecuencia | Alternativa |
| --- | --- | --- |
| `client:load` en el layout | Hidrata toda la app | Islas pequeñas |
| Fetch en isla al montar | Cascada + spinner | Pasar props desde Astro/SSR |
| Descargar todo el dataset | Memoria y CPU | Paginación en servidor |
| Tabla de 1,000 filas ocultas | DOM inflado | Virtualización o paginación |
| `moment`/`lodash` completo | +70 KB | `Intl`, helpers propios |
| Fuente de Google Fonts | 2 requests + CLS | System UI o self-host |
| Hero JPEG de 2 MB | LCP > 4 s | AVIF/WebP responsive |
| Icon font | FOIT + peso | SVG inline |
| Analytics en `<head>` | Bloquea render | Diferido/Partytown + consentimiento |
| `transition: all` | Repaints innecesarios | Propiedades específicas |
| Animación de `height` | Layout thrashing | `transform`/`opacity` |
| Skeleton sin altura | CLS | Altura reservada |
| Cargar PDF embebido pesado | LCP/CPU | Descarga o preview bajo demanda |
| Polling cada 5 s | Red/batería | Eventos o intervalos largos |

## 13. Checklist de rendimiento por PR

- [ ] La página no hidrata el layout completo.
- [ ] Cada isla tiene una directiva justificada (`visible`/`idle` preferidas).
- [ ] No hay fetch en cliente si el dato podía venir del servidor.
- [ ] Imágenes con dimensiones, formato moderno y lazy salvo LCP.
- [ ] Sin fuentes nuevas sin justificación y medición.
- [ ] Sin dependencias nuevas sin revisar bundle.
- [ ] Tablas paginadas en servidor.
- [ ] `check-budget.mjs` en verde.
- [ ] Lighthouse móvil ≥ 90 en rendimiento o justificación documentada.
- [ ] CLS ≤ 0.05 con datos reales, no solo con el estado vacío.
