---
name: psa-design-standard
description: Estándar obligatorio de diseño, arquitectura, código limpio, seguridad y rendimiento del frontend de PSA (plataforma de gestión de pasantías), construido con Astro y SolidJS. Úsala siempre que se cree, modifique o revise una pantalla, layout, componente, formulario, tabla, modal, menú, tema claro/oscuro, token CSS, microcopy o estilo visual; cuando se elija tipografía, color, espaciado, borde o radio; cuando se decida la capa Atomic Design, el nombre de un archivo, la estructura de carpetas, los contratos de props, la documentación, la legibilidad del código o la división de un componente grande; cuando se implemente autenticación, sesión, subida de archivos, enlaces externos o cualquier control del OWASP Top 10; y cuando se optimicen carga, islas, imágenes, fuentes o presupuesto de JS/CSS. También al planear una vista nueva, refactorizar o preparar un PR, aunque el pedido no mencione "diseño", "arquitectura", "código limpio" ni "estándar".
compatibility: opencode
metadata:
  project: PSA
  stack: Astro + SolidJS
  language: es-MX
---

# Estándar PSA de diseño, arquitectura, código limpio, seguridad y rendimiento

PSA es la plataforma de gestión de pasantías: practicantes, empresas, convenios,
ofertas, postulaciones, documentos, evaluaciones y reportes. El frontend es
Astro + SolidJS, en español (es-MX), con tema claro y oscuro.

Este documento es la fuente de verdad visual, arquitectónica y técnica del
proyecto. Si un valor o patrón no existe aquí, no lo inventes: propón el token,
componente o decisión, justifica el costo y añádelo al estándar antes de usarlo.

## Principios

1. **Claridad operativa.** Cada pantalla responde una pregunta de negocio y deja
   claro el siguiente paso. Sin decoración que compita con los datos.
2. **Estructura visible.** La jerarquía se construye con alineación, espacio y
   bordes de 1px, no con sombras, gradientes ni tarjetas flotantes.
3. **Rojo con propósito.** El rojo oscuro es escaso: acción primaria, enlace,
   foco y estados críticos. Nunca como fondo dominante ni decoración.
4. **Rápido por defecto.** HTML y CSS primero; JavaScript solo donde hay
   interacción real. Presupuesto antes que funcionalidad.
5. **Seguro por diseño.** El frontend es una capa de presentación: no concede
   permisos, no guarda secretos y no confía en sus propias validaciones.
6. **Accesible sin excepciones.** WCAG 2.2 AA es el piso, no el objetivo.
7. **Legible antes que ingenioso.** Nombres explícitos, funciones pequeñas, una
   responsabilidad por capa. El código se lee más veces de las que se escribe.

## Flujo obligatorio

### Antes de escribir código

- Lee `references/design-system.md` para tokens, tipografía, spacing,
  componentes y estados. Es obligatorio si vas a crear o tocar UI.
- Lee `references/architecture.md` antes de crear, mover o dividir un
  componente, definir una carpeta, escribir un módulo de lógica o documentar una
  decisión. Es obligatorio si tocas estructura, nombres o props.
- Si es una pantalla nueva o un flujo completo, lee `references/screens.md`.
- Si toca auth, sesión, formularios, archivos, enlaces, datos personales,
  dependencias o cabeceras, lee `references/security.md`.
- Si añade interactividad, islas, imágenes, fuentes o datos, lee
  `references/performance.md`.
- Si hay formularios, tablas, modales, menús o toasts, lee
  `references/accessibility.md`.

### Mientras implementas

- Usa los tokens de `assets/tokens.css`. No escribas colores, radios,
  espaciados, sombras ni tipografías literales en componentes.
- Reutiliza los patrones de `references/screens.md` antes de inventar uno.
- Ubica cada pieza en su capa: átomo, molécula, organismo, template o página.
  La dependencia va en un solo sentido; nunca importes hacia arriba.
- Nombra la estructura y los verbos en inglés; los sustantivos del dominio
  pueden ir en español (`Practicante`, `practicanteId`). Documentación en
  español. Componentes en PascalCase, rutas y lógica en kebab-case.
- Documenta el contrato de organismos, templates, layouts y `lib` con un
  docblock: propósito, props/slots y efectos.
- Mantén el español de interfaz en es-MX, frases en sentence case y verbos de
  acción concretos.
- Renderiza en servidor todo lo que no necesite estado del cliente. Hidrata
  solo el componente interactivo, nunca la página completa.
- Trata todo dato del usuario como no confiable, incluso si viene de tu API.

### Antes de terminar

```sh
# Violaciones de diseño, XSS, secretos y accesibilidad básica
node .opencode/skills/psa-design-standard/scripts/audit-ui.mjs

# Arquitectura, capas, nombres, tamaño, tipos y documentación
node .opencode/skills/psa-design-standard/scripts/check-architecture.mjs

# Presupuesto de JS/CSS/HTML por ruta (requiere build)
bun run build
node .opencode/skills/psa-design-standard/scripts/check-budget.mjs
```

Corrige todos los errores. Las advertencias se justifican en el PR o se
corrigen. Después completa la checklist de "Definición de terminado".

## Reglas duras

| Regla | Valor permitido | Por qué |
| --- | --- | --- |
| Radio de borde | `0`, `2px`, `4px`. `9999px` solo avatares, puntos de estado y spinners | El sistema es semi-recto; radios mayores rompen la retícula |
| Fondo base | Blanco `#FFFFFF` (claro) / `#0F1216` (oscuro) | Superficie neutra para datos |
| Acento | Rojo de marca `#B3182B`; en oscuro texto `#F47A88` | Contraste AA y jerarquía |
| Neutro de texto | `#1B232A`; secundario `#51626F`; pantone `#DADCDE` | Contraste 15.9:1, 6.3:1 y 1.4:1 sobre blanco (pantone solo para estructura) |
| Bordes | `1px solid var(--border-color)` | La estructura se ve, no se insinúa |
| Sombras | Solo overlays (modal, dropdown, drawer) | Evita el look de tarjetas flotantes |
| Gradientes / glass / neumorfismo | Prohibidos | Ruido visual y costo de render |
| Tipografía | System UI; máximo 2 pesos por pantalla | Cero requests de fuente por defecto |
| Capa visual | daisyUI v5 sobre Tailwind v4, solo build-time; tema `psa` y adaptador sin `@layer` en `src/styles/daisyui.css` | Cero JavaScript de daisyUI en el cliente y control total del tema |
| Body de app | 14px / 1.5 | Densidad de herramienta administrativa |
| Texto de lectura | 16px / 1.65 | Formularios largos y ayuda |
| Espaciado | Escala de 4px | Alineación predecible |
| Botón primario | Uno por vista | Evita competencia de acciones |
| Emojis en UI | Prohibidos | Usa iconos SVG de 16/18/20px |
| Idioma | `lang="es-MX"`, fechas `dd/mm/aaaa` o `12 mar 2026` | Consistencia regional |
| Arquitectura | `pages → templates → organisms → molecules → atoms`; sin imports hacia arriba | La dependencia unidireccional evita ciclos y permite mover piezas |
| Nombres | Componentes PascalCase; rutas y lógica kebab-case; estructura/verbos en inglés, dominio y docs en español | Nombres predecibles y búsquedas simples |
| Tamaño | Objetivo: átomo ≤120, molécula ≤180, organismo ≤300, template ≤200, página ≤250 líneas; límites duros en `architecture.md` | Un archivo grande mezcla responsabilidades |
| Props | `interface Props` en Astro; `<Componente>Props` en Solid; sin `any` ni `@ts-ignore` | El contrato se lee y se verifica |
| Documentación | Docblock en organismos, templates, layouts y `lib`; ADR para decisiones estructurales | El porqué sobrevive al autor |
| Formato | 2 espacios, comillas simples, punto y coma, ancho 100 | Diffs pequeños y legibles |

## Tokens esenciales

La lista completa y los valores de tema oscuro están en `assets/tokens.css`.

| Grupo | Tokens |
| --- | --- |
| Superficie | `--bg`, `--bg-subtle`, `--bg-muted`, `--surface`, `--surface-raised` |
| Texto | `--text`, `--text-muted`, `--text-inverse` |
| Marca | `--accent`, `--accent-hover`, `--accent-fill`, `--accent-fill-hover`, `--accent-soft`, `--on-accent` |
| Bordes | `--border-color`, `--border-strong-color`, `--accent-border` |
| Semánticos | `--success`, `--warning`, `--danger`, `--info` (+ `-soft` y `-border`; éxito y peligro también `-fill` y `-fill-hover`) |
| Tipografía | `--font-sans`, `--font-mono`, `--text-xs`…`--text-3xl`, `--weight-*` |
| Espacio | `--space-1` (4px) … `--space-24` (96px) |
| Radio | `--radius-none`, `--radius-xs` (2px), `--radius` (4px), `--radius-full` |
| Controles | `--control-sm` (32px), `--control-md` (36px), `--control-lg` (40px) |
| Layout | `--sidebar-w` (240px), `--topbar-h` (56px), `--content-max` (1440px), `--form-max` (640px) |
| Movimiento | `--duration-fast` (120ms), `--duration-base` (180ms), `--ease-out` |

## Sistema visual en 10 decisiones

1. **Fondo blanco, estructura gris.** Agrupa con `--bg-subtle` y separa con
   bordes; no con sombras.
2. **Un solo acento.** El rojo marca lo accionable y lo activo. El resto es
   neutro. El rojo de peligro (`--danger`) es distinto del rojo de marca.
3. **Radios de 4px.** Inputs, botones, tarjetas, badges, modales y tablas.
   Excepción: avatares y puntos de estado circulares.
4. **Densidad administrativa.** Filas de tabla de 44–48px, controles de 36px,
   labels de 13px. Nada de aire de landing page dentro de la app.
5. **Jerarquía tipográfica corta.** 12/13/14/16/20/24/32. Sin 48px ni 64px en
   pantallas internas.
6. **Alineación a la izquierda.** Títulos, labels y datos. Números a la derecha
   con `font-variant-numeric: tabular-nums`.
7. **Bordes de 1px.** Visibles en cards, tablas, inputs y divisiones. El borde
   es la herramienta principal de estructura.
8. **Estados explícitos.** Hover, focus-visible, active, disabled, loading,
   vacío, error y éxito. Ningún control puede carecer de focus visible.
9. **Movimiento discreto.** 120–180ms, solo opacidad/transform. Respeta
   `prefers-reduced-motion`.
10. **Tema oscuro estructural.** No es una inversión mecánica: los bordes y las
    superficies elevadas sostienen la jerarquía; el rojo se aclara para texto.

## Capa de componentes daisyUI

daisyUI v5 con Tailwind v4 es el motor visual de los componentes reutilizables
(`btn`, `badge`, `alert`, `input`, `select`, `textarea`, `modal`, `toast`,
`file-input`). El CSS se compila en build: **no hay JavaScript de daisyUI en el
cliente**.

- Todo entra por `src/styles/daisyui.css`: tema `psa`, lista `include` de
  componentes y adaptador de PSA.
- El tema reescribe las variables de daisyUI con tokens semánticos de PSA
  (`--color-primary: var(--accent-fill)`, `--color-base-100: var(--surface)`,
  `--radius-field: var(--radius)`), de modo que el tema oscuro sigue a
  `data-theme` sin una paleta duplicada.
- **Sin `preflight`:** PSA normaliza documento, tablas y formularios; un reset
  global pisaría las reglas propias.
- **El adaptador se escribe sin `@layer`:** si se estratifica, el orden de
  capas deja sus reglas sin efecto sobre las de daisyUI.
- El mapeo de props a clases está en `src/lib/ui/daisy.ts`; nadie escribe
  `btn-primary` a mano.
- Agregar una clase nueva de daisyUI implica añadirla a `include` y revisar el
  presupuesto de CSS (≤ 40 KB gzip por ruta).
- Detalle en `references/design-system.md` y en
  `docs/decisions/ADR-0007-daisyui-tailwind.md`.

## Arquitectura y código limpio

Atomic Design adaptado a Astro + SolidJS. El detalle, los ejemplos y las reglas
de documentación están en `references/architecture.md`.

| Capa | Ubicación | Ejemplo | Regla |
| --- | --- | --- | --- |
| Átomo | `components/atoms/` | `Button.astro`, `Input.astro` | Primitivo visual; sin dominio, fetch ni estado |
| Molécula | `components/molecules/` | `FormField.astro`, `Pagination.astro` | 2–4 átomos con un solo propósito |
| Organismo | `components/organisms/` | `PracticantesTable.astro`, `AppSidebar.astro` | Sección de página o responsabilidad de dominio |
| Template | `components/templates/` | `ListPageTemplate.astro` | Esqueleto sin datos; recibe props y slots |
| Layout | `layouts/` | `AppLayout.astro`, `AuthLayout.astro` | Shell global; sin fetch ni templates |
| Página | `pages/` | `practicantes/index.astro` | Ruta: datos, permisos y composición |

Reglas que no se negocian:

- **Dependencia unidireccional:** `pages → templates → organisms → molecules →
  atoms`; todos pueden usar `lib → types`. La página también compone el layout;
  el layout no importa páginas ni templates. Nunca al revés.
- **La isla es hidratación, no carpeta.** No existe `components/islands/`. Un
  `.tsx` Solid vive en su capa y se hidrata con `client:visible` o `client:idle`.
- **`lib` es independiente del framework:** no importa componentes, Astro ni
  Solid. Los datos se cargan en la página; una isla solo llama a la API por una
  acción del usuario.
- **Sin barrels ni imports profundos.** Importa el archivo directo y usa `@/`
  para cruzar carpetas. Sin ciclos.
- **Regla de tres:** no extraigas una abstracción hasta que el patrón aparezca
  tres veces. Dos duplicados son más baratos que una abstracción equivocada.
- **Un archivo, una responsabilidad.** Si supera el límite de su capa, divide
  por responsabilidad, no por ocurrencia.
- **Contrato explícito.** `interface Props` en Astro, `<Componente>Props` en
  Solid; defaults, variantes como uniones y slots documentados. En Solid, no
  desestructures props: usa `splitProps`.
- **Documentación obligatoria.** Docblock en organismos, templates, layouts y
  `lib`; ADR para decisiones de arquitectura, datos, auth o dependencias; el
  catálogo `docs/components.md` se actualiza al añadir o renombrar piezas.

## Seguridad: OWASP Top 10 en el frontend

Resumen operativo. Detalle, ejemplos y checklist en `references/security.md`.

| Categoría | Regla de oro en PSA |
| --- | --- |
| A01 Broken Access Control | Ocultar UI no autoriza. Toda decisión de acceso se valida en el servidor/API. |
| A02 Cryptographic Failures | HTTPS, sin secretos en `PUBLIC_*`, sin tokens ni PII en localStorage o URLs. |
| A03 Injection | Prohibido `innerHTML`, `set:html` dinámico, `eval` y URLs `javascript:`. |
| A04 Insecure Design | Limita abuso: rate limit, idempotencia, no enumerar cuentas, uploads acotados. |
| A05 Security Misconfiguration | CSP, headers, sin sourcemaps públicos, sin páginas de ejemplo, errores genéricos. |
| A06 Vulnerable Components | Lockfile, auditoría en CI, dependencias mínimas y actualizadas. |
| A07 Auth Failures | Cookies httpOnly/Secure/SameSite, sesión con expiración, errores genéricos. |
| A08 Integrity Failures | Instalaciones reproducibles, sin scripts de CDN, SRI si es inevitable. |
| A09 Logging Failures | Sin PII ni tokens en consola; errores con ID de referencia, no stack traces. |
| A10 SSRF | Proxies, imágenes remotas y redirects con allowlist de hosts y rutas internas. |

Reglas adicionales que no se negocian:

- Ningún secreto en el bundle. Astro solo expone `PUBLIC_*`; eso es público.
- Ningún HTML de usuario renderizado como HTML. Markdown de usuario se sanea o
  se muestra como texto.
- Ningún `target="_blank"` sin `rel="noopener noreferrer"`.
- Ningún dato personal en logs, analytics, URLs, `title` o mensajes de error.
- Ninguna validación de formulario se considera control de seguridad: el
  servidor valida otra vez.
- Ningún script de terceros sin justificación, CSP y revisión de privacidad.

## Rendimiento: presupuesto

| Métrica | Presupuesto | Se mide en |
| --- | --- | --- |
| LCP | ≤ 2.0 s | móvil medio, 4G lenta |
| INP | ≤ 150 ms | interacción real |
| CLS | ≤ 0.05 | carga y navegación |
| TTFB | ≤ 500 ms | host |
| JS por ruta | ≤ 120 KB gzip | build |
| CSS por ruta | ≤ 40 KB gzip | build |
| HTML por ruta | ≤ 40 KB gzip | build |
| Fuentes web | 0 por defecto | build |
| Imágenes sobre el pliegue | ≤ 200 KB | red |

Reglas:

- La página por defecto es **cero JavaScript**. La interactividad se aísla en
  islas Solid con `client:visible` o `client:idle`; `client:load` solo para el
  control crítico que el usuario usa de inmediato.
- `client:only` es el último recurso y siempre lleva skeleton con altura fija.
- Datos en servidor siempre que sea posible; si el dato es por usuario, usa SSR
  o server islands en lugar de hidratar y hacer fetch al montar.
- Tablas: paginación y filtros en servidor/URL. Nunca cargues el dataset
  completo para filtrar en el cliente.
- Imágenes con `astro:assets`, dimensiones explícitas, `loading="lazy"` salvo la
  imagen LCP (`fetchpriority="high"`).
- Sin librerías de UI pesadas, sin `moment`, sin icon fonts, sin CSS-in-JS en
  runtime.

## Accesibilidad: mínimos

- Contraste: 4.5:1 texto normal, 3:1 texto grande y componentes.
- `:focus-visible` siempre visible, 2px, offset 2px.
- Objetivos táctiles de 44×44px cuando sea posible; mínimo 24×24px.
- Todo input con `<label for>`. Errores con `aria-invalid` y `aria-describedby`.
- Tablas con `caption`, `scope` y `aria-sort` si ordenan.
- Modales con `role="dialog"`, `aria-modal`, título, foco atrapado, Escape y
  retorno de foco.
- Estado nunca solo por color: punto + texto.
- Toasts con `role="status"` o `role="alert"`, sin robar foco.
- Respeta `prefers-reduced-motion`; sin autoplay; zoom 200% sin pérdida.

## Definición de terminado

Antes de dar una tarea por terminada, verifica:

- [ ] La pantalla usa tokens; no hay hex, rgb, radios ni spacing literales.
- [ ] Claro y oscuro se ven correctamente, con contraste AA.
- [ ] Existe estado vacío, de carga (skeleton) y de error.
- [ ] Teclado: se llega a todo, el foco se ve, overlays cierran con Escape.
- [ ] Formularios: labels, ayudas, errores, `autocomplete` y resumen de errores.
- [ ] Tabla: caption/encabezados, acciones con nombre accesible, paginación.
- [ ] Sin `innerHTML`, `set:html` dinámico, `eval` ni secretos.
- [ ] Enlaces externos con `rel="noopener noreferrer"`; URLs validadas.
- [ ] Islas mínimas; la página no hidrata el layout completo.
- [ ] Componente en la capa correcta; sin imports hacia arriba ni ciclos.
- [ ] Nombres: componente PascalCase, ruta y módulo kebab-case.
- [ ] Props tipadas; sin `any`, `@ts-ignore` ni doble cast.
- [ ] Archivo dentro del límite; funciones ≤40 líneas y ≤3 parámetros.
- [ ] Docblock en organismos/templates/layouts/lib; ADR y catálogo actualizados.
- [ ] `audit-ui.mjs` sin errores, `check-architecture.mjs` sin errores y
      `check-budget.mjs` en verde.
- [ ] Sin `console.log` de datos reales ni PII en el HTML.
- [ ] Microcopy en es-MX, sentence case y verbos concretos.

## Referencias

| Archivo | Cuándo leerlo |
| --- | --- |
| `references/design-system.md` | Tokens, paleta, tipografía, spacing, componentes, tablas, formularios, overlays, dark mode |
| `references/architecture.md` | Atomic Design, capas, dependencias, nombres, tamaño, código limpio, documentación, ADR y pruebas |
| `references/screens.md` | App shell y plantillas de login, dashboard, listas, detalle, formularios, evaluación, documentos, reportes, errores |
| `references/security.md` | OWASP Top 10 detallado, CSP, headers, auth, XSS, CSRF, uploads, dependencias, checklist |
| `references/performance.md` | Islas, Astro/Solid, imágenes, fuentes, datos, caché, medición y anti-patrones |
| `references/accessibility.md` | WCAG 2.2 AA aplicado a formularios, tablas, modales y navegación |
| `assets/tokens.css` | Copiar a `src/styles/tokens.css` e importar en el layout global |
| `assets/component-template.astro` | Plantilla de componente Astro con docblock, `Props`, tokens y slot |
| `assets/component-template.tsx` | Plantilla de isla Solid con `splitProps`, props tipadas y docblock |
| `assets/components-catalog-template.md` | Plantilla de `docs/components.md` para el catálogo de organismos, templates y layouts |
| `assets/adr-template.md` | Plantilla de decisión de arquitectura (ADR) |

## Scripts

```sh
node .opencode/skills/psa-design-standard/scripts/audit-ui.mjs [--strict] [--json]
node .opencode/skills/psa-design-standard/scripts/check-architecture.mjs [--strict] [--json]
node .opencode/skills/psa-design-standard/scripts/check-budget.mjs [--js 120] [--css 40] [--html 40] [--dist dist] [--json]
```

`audit-ui.mjs` revisa diseño, seguridad y accesibilidad en `src/`.
`check-architecture.mjs` revisa capas, dependencias, ciclos, barrels, nombres,
tamaño, tipos y documentación. `check-budget.mjs` revisa `dist/` y falla si una
ruta excede el presupuesto. Los tres aceptan `--json` para CI; `audit-ui` y
`check-architecture` aceptan `--strict` para fallar también con advertencias.

Con el adaptador de Node, `check-budget.mjs` busca `dist/client`. Si el build es
totalmente SSR y no hay HTML estático por ruta, mide el bundle cliente completo y
lo reporta como pseudo-ruta `(bundle cliente)`. Es el modo esperado en PSA
mientras todas las páginas privadas usen `prerender = false`.
