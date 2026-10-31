# Accesibilidad (WCAG 2.2 AA)

La accesibilidad no es una capa final ni un modo alternativo. Es una condición
del diseño. Un formulario de pasantías que no se puede completar con teclado
está roto, aunque se vea bien.

## 1. Contraste

| Combinación | Ratio | Uso |
| --- | --- | --- |
| `#1B232A` sobre `#FFFFFF` | 15.9:1 | Texto principal |
| `#51626F` sobre `#FFFFFF` | 6.3:1 | Texto secundario |
| `#51626F` sobre `#F7F8F9` | 5.9:1 | Texto secundario en superficie sutil |
| `#51626F` sobre `#DADCDE` | 4.6:1 | Texto secundario sobre pantone |
| `#B3182B` sobre `#FFFFFF` | 6.8:1 | Enlaces y acento |
| `#FFFFFF` sobre `#B3182B` | 6.8:1 | Botón primario |
| `#FFFFFF` sobre `#9E1426` | 8.1:1 | Primario en hover/active |
| `#E8EAED` sobre `#0F1216` | 15.6:1 | Texto en oscuro |
| `#9BA9B4` sobre `#161B20` | 7.2:1 | Secundario en oscuro |
| `#F47A88` sobre `#161B20` | 6.6:1 | Acento en oscuro |

Reglas:

- Texto normal ≥ 4.5:1; texto grande (≥24px o ≥19px semibold) ≥ 3:1.
- Componentes e iconos informativos ≥ 3:1.
- No uses gris claro para texto “elegante”. Si dudas, mide.
- El color nunca es el único indicador: añade texto, icono o patrón.
- Los placeholders no son labels y suelen fallar contraste; no los uses como
  única instrucción.

## 2. Foco y teclado

- `:focus-visible` siempre visible: 2px `--focus`, offset 2px.
- Nunca `outline: none` sin reemplazo visible.
- El foco no puede quedar oculto por headers sticky, sidebars o modales
  (WCAG 2.4.11).
- Orden de tabulación = orden visual. No uses `tabindex` positivos.
- Todo control se opera con teclado: Enter/Espacio para botones, flechas para
  radios/tabs/menús, Escape para cerrar overlays.
- Enlaces y botones deben ser elementos nativos (`<a>`, `<button>`), no `div`
  con `onClick`.
- Si usas un `div` interactivo por una razón inevitable, añade `role`, `tabindex`
  y manejo de teclado; aun así, prefiere el elemento nativo.
- Skip link al inicio: “Saltar al contenido principal”, visible al enfocar.

## 3. Semántica y estructura

- Un solo `<h1>` por página; jerarquía sin saltos (`h1 → h2 → h3`).
- Landmarks: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`.
- `lang="es-MX"` en `<html>`.
- Título de página único y descriptivo (`Practicantes · PSA`).
- Enlaces con texto descriptivo; nunca “clic aquí” ni “leer más” sin contexto.
- Iconos decorativos con `aria-hidden="true"`; iconos con acción, `aria-label`.
- Si un icono comunica estado, incluye texto o `aria-label` con el estado.

## 4. Formularios

- Cada campo con `<label for="id">` visible. El placeholder complementa, no
  sustituye.
- Campos obligatorios: indicador textual (“Obligatorio”) o asterisco con
  leyenda; `required` y `aria-required="true"` cuando aplique.
- Ayuda: `aria-describedby` al texto de ayuda.
- Error:
  - `aria-invalid="true"`.
  - Mensaje inline asociado con `aria-describedby`.
  - Resumen de errores al inicio del formulario si hay ≥3; enlaces al campo.
  - El mensaje dice qué pasó y cómo corregirlo.
- No deshabilites el botón de envío como única validación. Permite enviar y
  muestra errores; el usuario debe poder descubrir qué falta.
- Agrupa radios/checkboxes con `<fieldset>` y `<legend>`.
- `autocomplete` correcto (`email`, `name`, `organization`, `current-password`,
  `new-password`, `tel`, `postal-code`). No bloquees el autofill ni pegar
  contraseñas.
- No pidas el mismo dato dos veces en el mismo flujo (WCAG 3.3.7); si necesitas
  confirmarlo, autocompleta.
- Errores de servidor: preserva los datos del formulario y enfoca el resumen o
  el primer campo con error.
- Instrucciones antes del campo, no después de cometer el error.
- No uses CAPTCHA cognitivo como única barrera; si es necesario, ofrece
  alternativa accesible.

## 5. Tablas

- `<caption>` visible o `.psa-visually-hidden`.
- `<th scope="col">` y `<th scope="row">` cuando corresponda.
- `aria-sort="ascending|descending|none"` en columnas ordenables.
- Acciones de fila con nombre accesible: “Editar oferta de Ana Pérez”, no solo
  un icono de lápiz.
- Checkbox de selección con label accesible por fila.
- Scroll horizontal: contenedor con `tabindex="0"`, `role="region"` y
  `aria-label` (“Tabla de practicantes, desplazable horizontalmente”).
- No conviertas la tabla en `div`s. Si usas cards en móvil, mantén la semántica
  equivalente.
- Paginación con `nav aria-label="Paginación"` y página actual con
  `aria-current="page"`.
- Anuncia el cambio de resultados con una región `aria-live="polite"`
  (“Mostrando 1–20 de 134”).

## 6. Modales y drawers

- Usa `<dialog>` nativo con `showModal()`; gestiona foco, Escape y backdrop.
- Si es custom:
  - `role="dialog"`, `aria-modal="true"`.
  - `aria-labelledby` al título y `aria-describedby` a la descripción.
  - Foco inicial en el primer control relevante (no en “×”).
  - Foco atrapado dentro; Escape cierra.
  - Al cerrar, devuelve el foco al disparador.
  - Bloquea el scroll del body, pero no el del diálogo.
- No apiles modales. No uses modal para contenido que debería ser página.
- El botón “×” tiene `aria-label="Cerrar"`.
- Las acciones destructivas explican la consecuencia y el botón dice el verbo.

## 7. Menús, tabs y navegación

- Menú desplegable: `<button aria-expanded="false" aria-controls="...">`.
- `role="menu"` solo si implementas navegación con flechas; si no, usa una lista
  de enlaces/botones normal.
- Escape cierra y devuelve foco; click fuera cierra.
- Tabs: `role="tablist"`, `role="tab"` con `aria-selected`, `role="tabpanel"`,
  flechas para cambiar, `tabindex="-1"` en tabs inactivas.
- Breadcrumb: `<nav aria-label="Migas de pan">` y `<ol>`.
- Sidebar: `<nav aria-label="Navegación principal">`; item activo con
  `aria-current="page"`.

## 8. Feedback y estados

- Toasts: `role="status"` (éxito/info) o `role="alert"` (error); `aria-live`
  polite/assertive. No muevas el foco.
- Errores críticos: inline, no solo toast.
- Carga: `aria-busy="true"` en la región; skeleton con texto alternativo si
  aporta (“Cargando practicantes”).
- Cambios de filtros: anuncia el conteo en una región live, no cada tecla.
- Progreso de subida: `<progress>` o `role="progressbar"` con
  `aria-valuenow/min/max` y texto.
- Estado vacío: texto claro, no solo ilustración.
- Confirmaciones: el foco va al mensaje o al siguiente paso lógico.

## 9. Movimiento y tiempo

- Respeta `prefers-reduced-motion` (incluido en tokens.css).
- Nada de autoplay con audio/video; si hay video, controles y pausa.
- Sin parallax, scroll hijacking ni animaciones que duren más de 5s.
- No uses animaciones para comunicar información esencial.
- Si hay límite de tiempo (evaluación, sesión), avisa y permite extender cuando
  sea posible.
- No hagas parpadear contenido más de 3 veces por segundo.

## 10. Zoom, reflow y táctil

- Funciona a 200% de zoom sin pérdida de contenido ni scroll horizontal de
  página.
- Reflow a 320px de ancho (equivalente a 400% en desktop).
- Objetivos táctiles: mínimo 24×24px (WCAG 2.5.8); recomendado 44×44px.
- Separa controles adyacentes al menos 8px.
- No dependas de hover para información esencial; ofrece focus/click.
- Cualquier acción de arrastre (drag & drop, sliders) tiene alternativa con
  botones/inputs (WCAG 2.5.7).
- Inputs numéricos con `inputmode` adecuado, no solo `type="number"`.

## 11. Imágenes y multimedia

- Informativa: `alt` describe el propósito, no la apariencia (“Logo de la
  empresa” / “Gráfico de postulaciones por mes”).
- Decorativa: `alt=""`.
- No empieces con “imagen de…”; el lector ya lo anuncia.
- Gráficos: tabla de datos alternativa o resumen textual; no solo color.
- Avatares junto al nombre: `alt=""`; avatares solos: `alt` con el nombre.
- PDFs/imágenes de documentos: enlace con nombre, tipo y tamaño
  (“Convenio 2026 (PDF, 240 KB)”).

## 12. Autenticación accesible (WCAG 3.3.8)

- Permite pegar y autocompletar contraseñas.
- No impongas tests cognitivos (rompecabezas, memoria) sin alternativa.
- MFA con código: `autocomplete="one-time-code"`, `inputmode="numeric"`,
  pegado permitido, mensaje de expiración claro.
- Errores de login genéricos y accionables.
- No uses “recordarme” como único mecanismo de sesión.

## 13. Checklist por pantalla

- [ ] `h1` único y título de página.
- [ ] Skip link funcional.
- [ ] Todo se opera con teclado, sin trampas de foco.
- [ ] Foco visible y no oculto por sticky.
- [ ] Formularios con labels, ayudas, errores y `autocomplete`.
- [ ] Resumen de errores si hay varios.
- [ ] Tablas con caption, scope y `aria-sort`.
- [ ] Modales con título, foco atrapado, Escape y retorno.
- [ ] Toasts anunciados sin robar foco.
- [ ] Estado con texto, no solo color.
- [ ] Contraste AA en claro y oscuro.
- [ ] 320px y zoom 200% sin pérdida.
- [ ] Objetivos táctiles ≥24px.
- [ ] Imágenes con alt correcto.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Sin hover como única vía de información.
