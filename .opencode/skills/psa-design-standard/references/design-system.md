# Sistema de diseño PSA

Referencia de implementación. Todos los valores salen de `assets/tokens.css`; si
un valor no existe, se añade al token file, no se escribe en el componente.

## 1. Paleta

Los tonos corporativos de partida son rojo `#DC001D`, gris `#51626F` y
pantone `#DADCDE`. El rojo aplicado a la interfaz es `#B3182B`: la misma
familia, 3 puntos más oscuro y 24 puntos menos saturado para reducir fatiga
visual. El resto de las escalas se deriva de ellos; no introduzcas variantes
fuera de los tokens.

### Neutros (gris plomo)

| Token | Hex | Uso |
| --- | --- | --- |
| `--psa-white` | `#FFFFFF` | Fondo base, superficie |
| `--psa-gray-50` | `#F7F8F9` | Fondo de sección, hover de fila |
| `--psa-gray-100` | `#F0F2F4` | Fondo de tabla, inputs deshabilitados |
| `--psa-gray-200` | `#DADCDE` | **Pantone de marca**: borde estándar |
| `--psa-gray-300` | `#C5CBD1` | Borde fuerte, divisores |
| `--psa-gray-400` | `#8F9BA4` | Placeholder, icono inactivo |
| `--psa-gray-500` | `#51626F` | **Gris de marca**: texto secundario, metadatos |
| `--psa-gray-600` | `#3D4B55` | Texto de énfasis medio |
| `--psa-gray-700` | `#2C3740` | Títulos secundarios |
| `--psa-gray-800` | `#1B232A` | Texto principal |
| `--psa-gray-900` | `#12181D` | Fondo oscuro profundo |
| `--psa-gray-950` | `#0D1216` | Fondo de app en oscuro |

### Rojo de marca

| Token | Hex | Uso |
| --- | --- | --- |
| `--psa-red-50` | `#FDF1F3` | Fondo de acento suave, selección |
| `--psa-red-100` | `#FBE0E4` | Hover de acento suave |
| `--psa-red-200` | `#F6BCC4` | Borde de acento suave |
| `--psa-red-300` | `#F08B98` | Decorativo, nunca texto |
| `--psa-red-400` | `#EA4D62` | Decorativo y gráficos |
| `--psa-red-500` | `#E51F38` | Acento claro y gráficos |
| `--psa-red-600` | `#CE1C34` | Transición hacia el rojo de marca |
| `--psa-red-700` | `#B3182B` | **Rojo de marca**: texto, enlace, foco, botón primario |
| `--psa-red-800` | `#9E1426` | Hover/active del primario |
| `--psa-red-900` | `#7A1220` | Active profundo |
| `--psa-red-950` | `#4D0C15` | Solo gráficos/decoración |

El rojo de marca no es el rojo de peligro. `--danger` (`#9B1C1C`) se usa para
errores y acciones destructivas; el rojo de marca para identidad y acción
primaria. Nunca mezcles ambos en el mismo componente.

### Semánticos

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--success` | `#2F6B4F` | `#7FBFA1` | Aprobado, activo, completado |
| `--warning` | `#8A5A00` | `#E0B25E` | Pendiente, por vencer, revisión |
| `--danger` | `#9B1C1C` | `#F08A8A` | Error, rechazo, destructivo |
| `--info` | `#2C5A7A` | `#8FB8D6` | En proceso, entrevista, informativo |

Cada uno tiene `-soft` (fondo) y `-border` (borde) para badges y alerts. Éxito
y peligro añaden `-fill` y `-fill-hover` para botones sólidos. No introduzcas
verdes, azules o morados fuera de estos tokens.

### Proporción de uso

- 80–90 % neutros (blanco, gris plomo, bordes).
- 5–10 % rojo de marca (una acción primaria, enlaces, foco, item activo).
- < 5 % semánticos (solo estados reales).

Si una pantalla tiene más de un botón rojo sólido, algo está mal.

## 2. Tipografía

### Familias

```css
--font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, ...;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, ...;
```

- **Sin fuentes web por defecto.** Cero requests, cero FOIT/FOUT, cero CLS.
- `--font-mono` solo para IDs, códigos de convenio, folios y montos alineados.
- Si el proyecto exige una fuente de marca, debe ser self-hosted, WOFF2,
  subset latino, máximo 2 pesos, `font-display: swap` y precarga del peso del
  LCP. Justifícalo con medición.

### Escala

| Token | Tamaño | Peso | Line-height | Uso |
| --- | --- | --- | --- | --- |
| `--text-xs` | 12px | 500 | 1.4 | Labels uppercase, badges, metadatos, paginación |
| `--text-sm` | 13px | 400/500 | 1.5 | Celdas de tabla, labels de formulario, ayudas |
| `--text-base` | 14px | 400 | 1.5 | UI general, botones, párrafos cortos |
| `--text-md` | 16px | 400 | 1.65 | Texto de lectura, descripciones largas, auth |
| `--text-lg` | 20px | 600 | 1.3 | Título de sección / h3 |
| `--text-xl` | 24px | 600 | 1.25 | Título de página / h2 |
| `--text-2xl` | 32px | 600 | 1.2 | h1, valor de KPI |
| `--text-3xl` | 40px | 600 | 1.15 | Solo login/portada, nunca en app interna |

Reglas:

- Máximo dos pesos por pantalla (`400` + `500`/`600`).
- No uses `700+`; el sistema se apoya en tamaño y color, no en negritas.
- Títulos con `letter-spacing: -0.01em`; labels uppercase de 11–12px con
  `letter-spacing: 0.04em`.
- No uses mayúsculas en títulos ni botones. Solo en labels cortos.
- Números en tablas y KPIs: `font-variant-numeric: tabular-nums`.
- No justifiques texto. Alineación a la izquierda.
- Ancho de lectura: 65–75 caracteres (`max-width: 70ch`).

### Jerarquía en una pantalla

```
Título de página     24/600  + descripción 14/400 muted
Título de sección    20/600  + borde inferior 1px
Label de campo       13/500
Texto de tabla       13/400
Metadato             12/400 muted
```

## 3. Espaciado y retícula

Escala de 4px. No uses valores intermedios (`10px`, `18px`, `22px`).

| Token | px | Uso típico |
| --- | --- | --- |
| `--space-1` | 4 | Gap icono-texto, padding de badge |
| `--space-2` | 8 | Gap entre label y control, padding vertical de celda |
| `--space-3` | 12 | Padding de botón compacto, gap de formulario |
| `--space-4` | 16 | Padding de card, gap de grid |
| `--space-5` | 20 | Padding de sección compacta |
| `--space-6` | 24 | Separación entre secciones, padding de página |
| `--space-8` | 32 | Separación entre bloques mayores |
| `--space-10` | 40 | Márgenes de página en desktop |
| `--space-12` | 48 | Separación de secciones en auth/portada |
| `--space-16` | 64 | Solo portada |
| `--space-20/24` | 80/96 | Solo portada, nunca app interna |

Retícula:

- App: sidebar 240px + contenido fluido con `padding-inline: 24px` (mobile) /
  `32px` (≥1280px), `max-width: 1440px`.
- Formularios: `max-width: 640px`; dos columnas solo para campos relacionados
  (ciudad/estado, inicio/fin), con gap de 16px.
- Detalle: main 2/3 + aside 1/3, gap 24px; en <1024px se apila.
- Grid de KPIs: 4 columnas ≥1280, 2 columnas 768–1279, 1 columna <768.
- Breakpoints: 480, 768, 1024, 1280. Mobile-first.

## 4. Bordes, radios y sombras

```css
border: 1px solid var(--border-color);
border-radius: var(--radius); /* 4px */
```

- Radios: `0`, `2px`, `4px`. `--radius-full` solo avatar, dot y spinner.
- Cards, tablas, inputs, botones, badges, modales y tabs: 4px.
- Nunca uses 6px, 8px, 12px, 16px ni `rounded-lg` en UI.
- Sombras: solo `--shadow-overlay` en modal, drawer, dropdown y toast. Las
  cards se separan con borde, no con sombra.
- No uses `box-shadow` para simular foco; usa `outline`.
- Divisores internos: `1px solid var(--border-color)`.
- No uses bordes de color en cards salvo el indicador de estado (2px a la
  izquierda) en listas de atención.

## 5. Movimiento

| Token | Valor | Uso |
| --- | --- | --- |
| `--duration-fast` | 120ms | Hover, focus, color |
| `--duration-base` | 180ms | Dropdown, tooltip, toast |
| `--duration-slow` | 240ms | Drawer, modal |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Todo lo que entra/sale |

- Anima solo `opacity` y `transform`. Nunca `width`, `height`, `top`, `left`.
- No hay animaciones de entrada en cada carga de página.
- Respeta `prefers-reduced-motion` (ya incluido en tokens.css).
- Sin autoplay, parallax ni scroll animations.

## 6. Iconografía

- SVG inline, 16px (inline con texto), 18px (botones), 20px (nav), 24px
  (empty state).
- Trazo 1.5px, `stroke="currentColor"`, `fill="none"`.
- Sin icon fonts, sin sprites externos, sin emojis.
- Icono solo no reemplaza texto: todo botón con icono requiere `aria-label` o
  texto visible.
- Iconos decorativos: `aria-hidden="true"` y `focusable="false"`.
- Un icono por acción; no combines dos iconos en un botón.

## 7. App shell

```
┌──────────────┬────────────────────────────────────────────┐
│ Marca        │ Topbar 56px: breadcrumb · búsqueda · tema  │
│ 240px        ├────────────────────────────────────────────┤
│              │ Page header 24px padding                   │
│ Nav          │ Título 24/600 + descripción + acciones     │
│ (secciones)  ├────────────────────────────────────────────┤
│              │ Contenido (max 1440)                       │
│ Footer       │                                            │
└──────────────┴────────────────────────────────────────────┘
```

- Sidebar: fondo `--surface`, borde derecho `1px`, padding 16px.
- Item de nav: altura 36px, radio 4px, padding 0 12px, gap 8px, texto 14/500.
- Item activo: fondo `--accent-soft`, texto `--accent`, borde izquierdo 2px
  `--accent` (con `border-radius` 0 4px 4px 0 para no romper la línea).
- Item hover: fondo `--bg-subtle`.
- Secciones de nav: label 11/600 uppercase, `--text-muted`, margen superior 24px.
- Topbar: 56px, borde inferior 1px, fondo `--surface`, sticky.
- Breadcrumb: 13px, separador `/`, último item `--text` sin enlace.
- Mobile <1024px: sidebar oculta; botón menú abre drawer de 280px. Topbar
  mantiene marca y acciones críticas.
- El contenido nunca hace scroll horizontal; las tablas lo hacen dentro de su
  contenedor.

## 8. Componentes

### Capa daisyUI

Los componentes reutilizables se construyen sobre **daisyUI v5 con Tailwind v4**
como motor visual: `btn`, `badge`, `alert`, `input`, `select`, `textarea`,
`modal`, `toast` y `file-input`. Todo se compila en build: **daisyUI no aporta
JavaScript al cliente**.

- Entrada única: `src/styles/daisyui.css`. Declara el tema `psa`, la lista
  `include` de componentes emitidos y el adaptador de PSA.
- Un solo tema (`psa`) que reescribe las variables de daisyUI con tokens
  semánticos: `--color-primary: var(--accent-fill)`,
  `--color-base-100: var(--surface)`, `--color-error: var(--danger)`,
  `--radius-field: var(--radius)`, `--depth: 0`, `--noise: 0`. Como las
  variables se resuelven en tiempo de uso, el tema oscuro sigue a `data-theme`
  sin duplicar la paleta.
- **Sin `preflight` de Tailwind:** PSA ya normaliza documento, tablas y
  formularios. Un reset global pisaría las reglas propias y el espaciado
  administrativo.
- **El adaptador va sin `@layer`:** las reglas de PSA (alto 36px, radio 4px,
  bordes, tipografía) se declaran sin capa para que ganen a las de daisyUI. Si
  se estratifican, el orden de capas las deja sin efecto.
- El color del texto de los botones lo fija el adaptador
  (`.btn { color: var(--btn-fg) }`): la normalización de PSA
  (`button { color: inherit }`), al no estar estratificada, gana a la regla de
  daisyUI.
- El mapeo de props a clases vive en `src/lib/ui/daisy.ts`; los componentes de
  PSA no escriben `btn-primary` a mano.
- Solo se admiten las clases de la lista `include`. Agregar una nueva exige
  añadirla a la lista y revisar el presupuesto de CSS (≤ 40 KB gzip por ruta).
- Los estilos propios que daisyUI no cubre (`.master-item`, `.data-table`,
  `.workspace`) siguen en `src/styles/components.css`, con las clases
  semánticas de PSA. Ver `docs/decisions/ADR-0007-daisyui-tailwind.md`.

### Botones

| Variante | Fondo | Texto | Borde | Uso |
| --- | --- | --- | --- | --- |
| Primario | `--accent-fill` | `--on-accent` | mismo | Acción principal, una por vista |
| Secundario | `--surface` | `--text` | `--border-color` | Acción alternativa |
| Ghost | transparente | `--text-muted` | transparente | Acción terciaria, toolbar |
| Éxito | `--success-fill` | `--on-accent` | mismo | Confirmar acción positiva (aprobar, aceptar) |
| Peligro | `--danger-fill` | `#FFF` | mismo | Confirmar acción destructiva |
| Enlace | transparente | `--accent` | 0 | Navegación dentro de texto |

- Alturas: 32 / 36 / 40px (`sm` / `md` / `lg`). Default 36.
- Padding: 0 16px (md), 0 12px (sm), 0 20px (lg). Gap icono 8px.
- Fuente: 14/500. Nunca uppercase.
- Hover: un paso más oscuro (`--accent-fill-hover`), sin cambiar tamaño.
- Active: mismo color + `transform: translateY(1px)` opcional.
- Disabled: `opacity: .45`, `cursor: not-allowed`, sin hover.
- Loading: spinner 14px + texto “Guardando…”, ancho fijo para no saltar.
- Ancho completo solo en auth y mobile de formularios.
- Un solo primario por vista. Si hay dos acciones igual de importantes, usa
  primario + secundario.

### Enlaces

- Color `--accent`, subrayado en hover, `text-underline-offset: 2px`.
- En tablas y listas, el título es el enlace; no pongas “Ver” repetido en cada
  fila si toda la fila navega (usa una acción clara y accesible).
- Nunca uses azul por defecto del navegador.

### Campos de formulario

- Label arriba, 13/500, gap 6px (usa 8px de la escala).
- Control: altura 36px, padding 0 12px, borde 1px `--border-color`, radio 4px,
  fondo `--surface`, texto 14px.
- Placeholder: `--text-muted`, nunca como sustituto del label.
- Ayuda: 12px `--text-muted`, debajo del control, gap 4px.
- Error: borde `--danger`, mensaje 12px `--danger`, icono 14px; `aria-invalid`
  y `aria-describedby`.
- Focus: borde `--accent` + `outline: 2px solid var(--focus); offset 2px`.
  No elimines el outline.
- Disabled: fondo `--bg-muted`, texto `--text-muted`, cursor not-allowed.
- Readonly: fondo `--bg-subtle`, borde normal, sin candado.
- Select: chevron 16px a la derecha, padding-right 32px. No uses select nativo
  estilizado a medias; si necesitas búsqueda, patrón combobox accesible.
- Textarea: min-height 96px, resize vertical, contador solo si hay límite.
- Checkbox/radio: 16px, acento `--accent`, label 14px con gap 8px, área
  clickable de 44px de alto. No uses switches para opciones que no son
  inmediatas; usa checkbox.
- Campos obligatorios: texto “Obligatorio” o asterisco con leyenda; no solo
  color.
- `autocomplete` correcto: `name`, `email`, `organization`, `current-password`,
  `new-password`, `tel`, `postal-code`.

### Barra de filtros

- Fila con `display: flex; flex-wrap: wrap; gap: 12px; align-items: end`.
- Búsqueda: 280–360px, icono 16px a la izquierda.
- Selects: 160–200px.
- Acción “Filtros” si hay más de 3; panel desplegable con borde y padding 16px.
- “Limpiar” como ghost a la derecha, solo si hay filtros activos.
- En mobile: búsqueda full width + botón “Filtros” que abre drawer; chips de
  filtros activos con “×” accesible.
- Los filtros se reflejan en la URL (`?estado=activa&q=ana`) para poder
  compartir y recargar sin perder contexto.

### Diálogo de filtros combinables

- Cuando la tabla tiene filtros por contexto (empresa, taller, centro de
  trabajo), la barra muestra solo búsqueda + botón “Filtros” y el detalle vive
  en un diálogo nativo con el patrón de `Modal`.
- Cada dimensión admite varios valores: casillas de verificación con etiqueta
  visible, opción “todas” implícita cuando no hay selección.
- Los filtros booleanos (`Sí`/`No`) usan radio y se evalúan contra el valor de
  la fila: cero, cadena vacía o “No” son falso.
- Los listados largos de relaciones incluyen buscador dentro del diálogo
  (16px, icono a la izquierda) que filtra las opciones sin cerrar el popup.
- El diálogo ordena sus dimensiones y sus chips por etiqueta, en orden
  alfabético; cada valor seleccionado genera su propio chip con “×” para
  quitarlo sin abrir el diálogo.
- El borrador vive en el diálogo: “Cancelar” descarta y “Aplicar filtros”
  confirma. “Limpiar” aparece deshabilitado cuando no hay borrador.

### Tabla de datos

- Contenedor con borde 1px y radio 4px; `overflow-x: auto`.
- Header: fondo `--bg-subtle`, altura 40px, texto 12/600 uppercase tracking
  wide, `--text-muted`, borde inferior.
- Fila: altura 44–48px, borde inferior 1px, hover `--bg-subtle`.
- Celda: padding 12px 16px, texto 13px, alineación izquierda; números y montos
  a la derecha con `tabular-nums`.
- Primera columna: identificador + metadato en dos líneas (nombre + correo o
  folio). No más de 2 líneas.
- Última columna: acciones alineadas a la derecha; máximo 2 iconos visibles +
  menú “Más acciones”.
- Sticky header en tablas largas (`position: sticky; top: 0`).
- Sin zebra por defecto; si hay muchas columnas, usa divisores verticales
  suaves, no colores alternos.
- Selección múltiple: checkbox 16px en la primera columna, barra de acciones
  masivas aparece sobre la tabla indicando “N seleccionados”.
- Ordenamiento: indicador 12px junto al header, `aria-sort`.
- Paginación: “Mostrando 1–20 de 134”, selector 20/50/100, anterior/siguiente.
  La paginación va en el footer, no flotando.
- Estado vacío dentro del contenedor, nunca una tabla vacía sin explicación.
- Mobile: scroll horizontal con `tabindex="0"` y `aria-label`; o vista de cards
  si la tabla tiene ≤5 columnas. No ocultes columnas sin alternativa.

### Cards y KPIs

- Card: fondo `--surface`, borde 1px, radio 4px, padding 16px. Sin sombra.
- KPI: label 12/500 uppercase muted, valor 32/600 tabular, delta 12/500 con
  icono y color semántico, texto de contexto 12 muted.
- No pongas más de 4 KPIs en la primera fila.
- Si el KPI no tiene comparación, no inventes una flecha.

### Badges de estado

- Altura 20–22px, padding 0 8px, radio 4px, texto 12/500, gap 6px con dot 6px.
- Fondo `-soft`, texto `-`, borde `-border`.
- No uses pills (`border-radius: 9999px`) ni mayúsculas.
- El estado siempre se lee: “Activa”, no solo un punto verde.

### Tabs

- Altura 36px, borde inferior 1px en el contenedor.
- Tab activa: texto `--text`, borde inferior 2px `--accent`, sin fondo.
- Inactiva: `--text-muted`, hover `--text`.
- Gap 24px; sin cajas ni pills.
- En mobile: scroll horizontal con fade, no wrap.
- `role="tablist"`, `role="tab"`, `aria-selected`, flechas para navegar.

### Breadcrumb

- 13px, items separados por `/` o chevron 12px, último `--text` sin enlace.
- No lo uses si la jerarquía tiene un solo nivel.
- En mobile, colapsa a “← Volver a Practicantes”.

### Modal

- Ancho 480px (confirmación) / 640px (formulario), máx 90vw.
- Fondo `--surface`, borde 1px, radio 4px, sombra `--shadow-overlay`.
- Padding 24px; título 20/600; descripción 14 muted; acciones alineadas a la
  derecha, gap 8px, primario al final.
- Scrim `--scrim`; cierra con Escape, click en scrim y botón “×” accesible.
- Foco atrapado, retorno al disparador, scroll del body bloqueado.
- En mobile: hoja inferior a pantalla completa o modal con margen 16px.
- No apiles modales. Si necesitas un formulario largo, usa página o drawer.

### Drawer

- Ancho 360–480px, entra desde la derecha, borde izquierdo 1px, sin sombra
  excesiva. Header 56px, contenido con scroll, footer sticky con acciones.
- Úsalo para filtros, detalle rápido y formularios de 3–8 campos.

### Dropdown / menú

- Ancho mínimo 180px, fondo `--surface`, borde 1px, radio 4px, sombra overlay,
  padding 4px.
- Item: 32px, padding 0 8px, gap 8px, texto 14px; hover `--bg-subtle`.
- Item destructivo: texto `--danger`, separador antes.
- Cierra con click fuera, Escape y al seleccionar. Foco devuelve al disparador.

### Tooltip

- Solo para aclaraciones cortas, nunca para información esencial.
- Fondo `--psa-gray-900`, texto blanco, 12px, padding 6px 8px, radio 4px.
- Se muestra con hover y focus; no en mobile.
- No lo uses en iconos de acción sin `aria-label`.

### Toasts

- Esquina inferior derecha, ancho 320–400px, fondo `--surface`, borde 1px,
  radio 4px, sombra overlay, padding 12px 16px.
- Éxito: borde izquierdo 2px `--success` + icono; error: `--danger`; info:
  `--info`.
- Auto-dismiss 5s (errores 8s o manual), pausa al hover/focus.
- `role="status"` (éxito/info) o `role="alert"` (error).
- Máximo 3 apilados. No uses toast para errores de formulario (van inline).

### Empty state

- Centrado, padding 48px 24px, icono 24px `--text-muted`, título 16/600,
  descripción 14 muted (`max-width: 45ch`), acción primaria.
- Distingue “no hay datos” de “no hay resultados para el filtro”. En el segundo
  caso, ofrece “Limpiar filtros”.

### Skeleton

- Fondo `--skeleton`, radio 4px, sin shimmer agresivo; pulso suave de opacidad.
- Replica la estructura real (título, filas, celdas) y reserva altura para
  evitar CLS.
- No muestres skeleton más de 10s sin mensaje de reintento.

### Avatar

- 24/32/40px, circular (`--radius-full`), fondo `--bg-muted`, iniciales
  12/600 `--text-muted`, borde 1px.
- Si hay foto, `alt` con el nombre; si es decorativo junto al nombre, `alt=""`.
- Nunca uses avatar como único identificador.

### Carga de archivos

- Dropzone: borde 1px dashed `--border-strong-color`, radio 4px, padding 32px,
  fondo `--bg-subtle`. Hover/drag: borde `--accent`, fondo `--accent-soft`.
- Texto: “Arrastra tus archivos aquí o **selecciona desde tu equipo**”.
- Especifica tipos y tamaño máximo antes de seleccionar.
- Lista de archivos: nombre, tamaño, estado (subiendo/procesando/listo/error),
  acción eliminar. Barra de progreso 4px.
- Validación de tipo/tamaño en cliente es UX; el servidor valida de nuevo.
- Nunca renderices SVG/HTML subidos inline. PDFs en pestaña nueva, no embebidos
  en el mismo origen sin control.

### Timeline / stepper

- Timeline vertical: línea 1px, punto 8px, título 14/500, fecha 12 muted,
  descripción 13. Evento actual con punto `--accent`; completados `--success`.
- Stepper horizontal: círculos 24px, línea 1px, label 12/500. Completado:
  fondo `--accent`, texto blanco; actual: borde 2px `--accent`, fondo
  `--accent-soft`; pendiente: borde `--border-color`, texto muted.
- En mobile, el stepper se vuelve vertical o scroll horizontal; no se rompe en
  dos líneas.

### Alert / banner

- Borde 1px, radio 4px, padding 12px 16px, icono 16px, título 14/600,
  descripción 13.
- Variantes soft: fondo `-soft`, borde `-border`, texto `-`.
- Para errores de formulario, usa resumen arriba + mensajes inline.

## 9. Estados de dominio

Mapeo canónico para no inventar colores por pantalla:

| Estado | Badge | Token |
| --- | --- | --- |
| Borrador | Neutro | `--bg-muted` / `--text-muted` |
| Postulada | Informativo | `--info` |
| En revisión | Pendiente | `--warning` |
| Entrevista | Informativo | `--info` |
| Aceptada | Éxito | `--success` |
| Activa | Éxito | `--success` |
| Rechazada | Peligro | `--danger` |
| Cancelada | Neutro | `--text-muted` |
| Finalizada | Neutro | `--text-muted` |
| Vencida | Pendiente | `--warning` |

Los estados no se traducen a colores distintos por rol ni por empresa. Si un
estado necesita más detalle, usa texto, no otro color.

## 10. Tema oscuro

No es una inversión automática. Superficies: `#0F1216` → `#161B20` →
`#1D2329`. Los bordes (`#2C343B`) sostienen la estructura.

- Texto principal `#E8EAED`, secundario `#9BA9B4`. Nunca blanco puro en párrafos.
- El rojo de marca se aclara para texto (`#F47A88`), pero los botones sólidos
  usan `#B3182B` con texto blanco para mantener contraste (6.8:1).
- Sombras más profundas; úsalas solo en overlays.
- Imágenes y logos: no los inviertas ni filtres; usa variante si el logo no
  contrasta.
- Gráficos: ajusta ejes y grillas a `--border-color`; no uses blanco puro.
- Prueba ambos temas con datos reales, no solo con el estado vacío.

Implementación base (el script debe ejecutarse antes del primer paint para
evitar el flash). Guarda solo la preferencia de tema, nunca datos de sesión:

```astro
<!-- src/layouts/AppLayout.astro -->
<script is:inline>
  try {
    const saved = localStorage.getItem('psa-theme');
    const theme =
      saved === 'light' || saved === 'dark'
        ? saved
        : matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.dataset.theme = theme;
  } catch {}
</script>
```

```js
// Toggle accesible: botón con aria-label dinámico
const root = document.documentElement;
const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
root.dataset.theme = next;
localStorage.setItem('psa-theme', next);
```

- Con `security.csp: true`, verifica que el hash de este inline aparezca en la
  CSP generada; si no, añádelo en `security.csp.scriptDirective.hashes`. Es el
  único script inline permitido.
- `localStorage` aquí solo guarda `'light'`/`'dark'`. Nunca tokens, correo ni
  preferencias sensibles.
- El toggle es un `<button>` de 36px con icono sol/luna 18px y `aria-label`
  (“Cambiar a tema oscuro” / “Cambiar a tema claro”), no un switch.

## 11. Do / Don't

| Haz | No hagas |
| --- | --- |
| Bordes de 1px para separar | Sombras difusas en cada card |
| Un botón primario por vista | Tres botones rojos compitiendo |
| 4px de radio | `rounded-xl`, pills, burbujas |
| Texto 13–14px en app | 16px en tablas densas |
| Blanco + gris + un acento | Gradientes, glass, neón |
| Iconos SVG 16–20px | Emojis o icon fonts |
| Estado con texto + color | Solo un punto de color |
| Tabla con paginación | Cargar 5,000 filas al cliente |
| Formularios de 640px | Formularios a todo el ancho |
| Fechas `dd/mm/aaaa` | `MM/DD/YYYY` |
| “Guardar cambios” | “OK”, “Enviar”, “Aceptar” genéricos |
| Mensajes específicos | “Ocurrió un error” sin contexto |

## 12. Microcopy

- Español es-MX, sentence case, sin exclamaciones.
- Botones: verbo + objeto (“Crear oferta”, “Guardar cambios”, “Rechazar
  postulación”). No “Sí”/“No” en acciones destructivas.
- Títulos: describen la tarea, no el módulo (“Postulaciones pendientes” mejor
  que “Postulaciones”).
- Vacíos: explica qué falta y qué hacer (“Aún no hay empresas registradas.
  Agrega la primera para crear convenios.”).
- Errores: qué pasó + cómo resolverlo, sin culpar al usuario. No reveles
  detalles internos ni si un correo existe.
- Confirmaciones destructivas: nombra el objeto (“¿Rechazar la postulación de
  Ana Pérez?”), explica la consecuencia y usa un botón con el verbo.
- Fechas relativas (“hace 2 días”) solo como complemento; siempre incluye la
  fecha absoluta en `title` o texto.
- Números: `1,234.50` con locale es-MX; moneda con código (`MXN $1,234.50`).
- No uses “por favor” en cada instrucción; una vez basta.
- No uses jerga técnica en la UI (“payload”, “token”, “endpoint”).
