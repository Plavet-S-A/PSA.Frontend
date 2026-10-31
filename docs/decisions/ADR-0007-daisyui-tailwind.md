# ADR-0007: daisyUI v5 con Tailwind v4 como capa de componentes

- **Estado:** aceptado
- **Fecha:** 2026-10-29
- **Decisores:** Equipo PSA
- **Referencias:** `src/styles/daisyui.css`, `src/lib/ui/daisy.ts`,
  `astro.config.mjs`, `src/layouts/AppLayout.astro`,
  `src/layouts/AuthLayout.astro`, `src/components/molecules/Modal.tsx`

## Contexto

PSA tenía su propio CSS de componentes (`.btn`, `.badge`, `.alert`, `.toast`,
`.modal`, `.field__control`) reimplementado a mano. Eso traía tres problemas:

1. **Accesibilidad del diálogo.** El modal implementaba el foco atrapado, el
   bloqueo de scroll y la tecla Escape con JavaScript propio: más bytes de
   cliente, más estados y más superficie de errores.
2. **Estados incompletos.** Cada botón repetía su hover, su focus, su estado
   disabled y su variante de tono. Un badge de advertencia y uno de peligro
   eran el mismo bloque de CSS con dos colores.
3. **Mantenimiento.** Cada componente nuevo exigía escribir sus estados a mano
   y el CSS crecía por rutas.

Se evaluaron cuatro salidas: mantener el CSS propio; daisyUI v4 sobre Tailwind
v3 con PostCSS; daisyUI v5 sobre Tailwind v4 con `@tailwindcss/vite`; y
librerías de comportamiento en JavaScript (Headless UI y similares).

## Decisión

Adoptar **daisyUI 5.7.50 + Tailwind 4.3.3** como motor visual de los
componentes reutilizables, con reglas concretas:

1. **Solo build-time.** `@tailwindcss/vite` entra en `astro.config.mjs` y
   daisyUI y Tailwind quedan como `devDependencies`. daisyUI no aporta
   JavaScript al cliente: el peso nuevo es CSS, no Bundle JS.
2. **Sin `preflight`.** PSA ya normaliza documento, tablas y formularios. Solo
   se importan `tailwindcss/theme.css` (capa `theme`) y
   `tailwindcss/utilities.css` (capa `utilities`). La capa `utilities` es
   obligatoria: sin ella no se compilan los candidatos y daisyUI no emite nada.
3. **Poda por contenido.** En Tailwind v4, `addComponents` es alias de
   `addUtilities`: el CSS de daisyUI se poda según las clases detectadas en el
   código fuente. `include`/`exclude` es un filtro grueso; el conjunto real de
   reglas emitidas lo decide la detección de contenido.
4. **Un solo tema (`psa`).** Reescribe las variables de daisyUI con tokens
   semánticos de PSA mediante `var()`: `--color-base-100: var(--surface)`,
   `--color-primary: var(--accent-fill)`, `--color-error: var(--danger)`,
   `--radius-field: var(--radius)`, `--depth: 0`, `--noise: 0`. Como las
   variables se resuelven en tiempo de uso, el tema oscuro sigue a `data-theme`
   sin duplicar la paleta.
5. **El adaptador PSA↔daisyUI va sin `@layer`.** En CSS, una regla no
   estratificada gana siempre a una estratificada, sin importar la
   especificidad. Declarar `@layer theme, base, daisyui, components,
   utilities` no funciona: Tailwind reordena las capas y deja daisyUI al final.
   El adaptador vive sin capa y los estilos propios de PSA, en
   `components.css`, se importan después para ganar por especificidad.
6. **Mapa de props a clases centralizado.** `src/lib/ui/daisy.ts` traduce las
   props de PSA (`variant`, `size`, `tone`, `iconOnly`, `block`) a clases de
   daisyUI. Ningún componente escribe `btn-primary` a mano y el mapeo es
   auditable en un solo archivo.
7. **Modal nativo.** `<dialog class="modal">` con `showModal()`: el navegador
   aporta foco atrapado, fondo inerte y Escape. Se elimina el focus-trap en
   JavaScript. El clic en el fondo cierra solo si la pulsación también cayó en
   el fondo, para que el clic que abrió el diálogo no lo cierre al terminar.
8. **Renombrado de tokens de borde.** `--border` → `--border-color` y
   `--border-strong` → `--border-strong-color`. daisyUI usa `--border` como
   grosor (`1px`), y el nombre chocaba con el color de borde de PSA. Se
   actualizaron 67 ocurrencias en `src/styles/` y la documentación del
   estándar.

## Consecuencias

### Positivas

- Cero JavaScript de daisyUI en el cliente; el presupuesto de JS no cambia.
- El modal gana foco atrapado, fondo inerte y Escape del navegador sin
  código propio.
- Los estados de hover, focus, disabled y loading dejan de duplicarse.
- El tema claro/oscuro sale de los tokens de PSA: no hay dos paletas que
  puedan desincronizarse.
- El CSS por ruta queda en 16.3 KB gzip, dentro del presupuesto de 40 KB.

### Negativas o costo

- Dos dependencias de build nuevas (daisyUI y Tailwind) y el plugin de Vite
  que las conecta.
- La poda depende de detección de contenido: una clase escrita en runtime
  (por concatenación) no se emite. El mapa centralizado de `lib/ui/daisy.ts`
  evita ese patrón.
- El tema, el adaptador y el orden de imports forman un contrato: cambiar el
  orden de los imports o estratificar el adaptador rompe las reglas propias.
- El renombrado de tokens tocó 67 lugares y la documentación del estándar.

### Riesgos y mitigación

- **Clases no detectadas:** el mapa de props usa cadenas literales, y
  `include` acota el conjunto emitido. Al agregar una clase nueva se revisa
  que aparezca en el CSS compilado.
- **Conflicto de nombre `--border`:** mitigado con el renombrado a
  `--border-color` y `--border-strong-color`.
- **Normalización de PSA contra daisyUI:** la regla `button { color: inherit }`
  de `tokens.css` no está estratificada y ganaba al `.btn` de daisyUI,
  dejando el texto del botón primario ilegible. El adaptador fija
  `color: var(--btn-fg)` sin capa.
- **Emisión de CSS no deseada:** `include` excluye `svg`, `rootscrolllock`,
  `rootscrollgutter` y `scrollbar`, que daisyUI añade por defecto.
- **Crecimiento del CSS:** el presupuesto por ruta sigue en 40 KB gzip y
  `check-budget.mjs` falla la build si se rebasa.
