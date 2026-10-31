# Arquitectura, código limpio y documentación

Este documento define dónde vive cada cosa, cómo se nombra, cómo se documenta y
qué se considera código legible en PSA. La regla superior es simple: **el código
se escribe para que otra persona lo entienda y lo cambie sin miedo**, no para
demostrar ingenio.

La arquitectura es Atomic Design adaptado a Astro + SolidJS. No es una capa
decorativa: evita que una página termine con fetch, estado, markup y estilos
mezclados en 400 líneas.

## 1. Atomic Design en Astro + Solid

### Capas

| Capa | Ubicación | Responsabilidad | Puede importar | No puede |
| --- | --- | --- | --- | --- |
| Átomo | `src/components/atoms/` | Un primitivo visual: botón, input, badge, icono, spinner | Átomos, `types`, `lib/ui` | Moléculas, organismos, templates, `lib/api`, datos de dominio |
| Molécula | `src/components/molecules/` | 2–4 átomos con un solo propósito: campo, búsqueda, paginación, estado vacío | Átomos, moléculas, `types`, `lib/format`, `lib/ui` | Organismos, templates, fetch inicial |
| Organismo | `src/components/organisms/` | Una sección con responsabilidad de dominio o de shell: tabla, sidebar, formulario, uploader | Átomos, moléculas, organismos, `lib`, `types` | Templates, páginas |
| Template | `src/components/templates/` | Esqueleto de un tipo de página; recibe datos y slots, no los busca | Átomos, moléculas, organismos, templates, `types`, `lib/ui`, `lib/format` | Páginas, datos (`lib/api`, auth, servicios) |
| Layout | `src/layouts/` | Shell global: `<html>`, tokens, tema, sidebar/topbar, `<slot />` | Átomos, moléculas, organismos, layouts, `lib/ui`, `types` | Páginas, templates, `lib/api` |
| Página | `src/pages/` | Ruta: lee datos, decide permisos, compone template y estados | Todo | — |
| Lógica | `src/lib/` | Funciones puras, API, auth, formato, validación; sin Astro/Solid | `lib`, `types`, APIs del runtime | Componentes, layouts, páginas, `astro:*`, `solid-js` |
| Tipos | `src/types/` | Contratos de dominio y de API; sin runtime | `types` | Componentes, `lib`, Astro, cualquier runtime local |

### Estructura de carpetas

```text
src/
  components/
    atoms/
      Button.astro
      Icon.astro
      Input.astro
      Badge.astro
    molecules/
      FormField.astro
      SearchField.astro
      Pagination.astro
      EmptyState.astro
    organisms/
      AppSidebar.astro
      AppTopbar.astro
      PageHeader.astro
      PracticantesTable.astro
      DocumentUploader.tsx      # isla Solid
    templates/
      ListPageTemplate.astro
      DetailPageTemplate.astro
      FormPageTemplate.astro
  layouts/
    AppLayout.astro
    AuthLayout.astro
  lib/
    api/
      client.ts
      practicantes.ts
    auth/
      session.ts
    format/
      date.ts
      currency.ts
    validation/
      practicante.ts
  types/
    api.ts
    practicante.ts
  styles/
    tokens.css
  pages/
    (app)/
      panel.astro
      practicantes/
        index.astro
        [id].astro
    (auth)/
      iniciar-sesion.astro
```

Reglas de la estructura:

- **No existe `components/islands/`.** La isla es una decisión de hidratación,
  no una capa. Un componente Solid vive en su capa (`organisms/DocumentUploader.tsx`)
  y se hidrata donde se usa (`<DocumentUploader client:visible />`).
- `.astro` es el valor por defecto: cero JS. `.tsx` solo cuando hay estado,
  eventos o APIs del navegador. Un átomo casi nunca es `.tsx`.
- `components/templates/` es el esqueleto de una página; `layouts/` es el shell
  que envuelve el documento completo. No los mezcles.
- Los tests viven junto al archivo: `format-date.test.ts` al lado de
  `format-date.ts`.
- Agrupa por dominio dentro de la capa cuando crezca, sin cambiar la capa:
  `organisms/practicantes/PracticantesTable.astro`. Hazlo cuando un dominio
  tenga 6+ componentes o la capa supere 40 archivos; antes es prematuro.
- `lib/` también se agrupa por dominio: `lib/practicantes/api.ts`,
  `lib/practicantes/mappers.ts`. No crees `lib/utils.ts` como cajón de sastre.
- Sin barrels (`index.ts` que reexporta todo): complican el tree-shaking,
  esconden dependencias y facilitan ciclos. Importa el archivo directo.
- Sin carpetas `common/`, `shared/` o `helpers/` sin alcance explícito. Si algo
  es compartido, su nombre debe decir de qué (`lib/ui`, `lib/format`).

### Regla de dependencia

El flujo es **unidireccional**:

```text
pages → templates → organisms → molecules → atoms
  │           │            │
  └───────────┴────────────┴──→ lib → types
```

- Un átomo nunca importa una molécula, organismo, template, página ni `lib/api`.
- Una molécula nunca importa un organismo ni un template.
- Un organismo nunca importa un template ni una página.
- Un template nunca importa una página ni hace fetch.
- Un layout nunca importa una página ni un template. La página compone el
  layout; el layout solo compone shell y componentes.
- `lib` nunca importa componentes, layouts, páginas, `astro:*` ni `solid-js`.
- `types` no importa runtime.
- Misma capa permitida (un átomo puede usar otro átomo), pero sin ciclos.
- `psa-audit-ignore` es solo para un falso positivo justificado en el PR; no
  se usa para saltarse estas reglas. La dependencia se corrige.

Excepción controlada: un organismo que **es una isla** puede importar
`lib/api` para ejecutar una acción del usuario (subir un archivo, guardar un
borrador). Nunca para cargar los datos iniciales de la página; eso lo hace la
página en el servidor.

### Cómo decidir la capa

Hazte estas preguntas en orden:

1. ¿Es un solo control visual sin dominio? → **átomo**.
2. ¿Es un grupo pequeño de átomos con un único trabajo? → **molécula**.
3. ¿Representa una sección de la página o conoce el dominio? → **organismo**.
4. ¿Es el esqueleto de un tipo de página, sin datos? → **template**.
5. ¿Es el documento completo (head, shell, tema)? → **layout**.
6. ¿Es una ruta que lee datos y decide permisos? → **página**.

Promociona o degrada sin vergüenza:

- Si una molécula empieza a conocer `Practicante`, `Convenio` o `Postulacion`,
  es un organismo.
- Si un organismo no tiene dominio y solo compone átomos, puede ser molécula.
- Si un átomo necesita `fetch`, estado global o reglas de negocio, está en la
  capa equivocada.
- Si un template recibe datos y decide cómo cargarlos, ya es una página.

### Regla de tres

No extraigas un componente la primera vez. Si el mismo markup aparece tres
veces, extrae la molécula u organismo. Dos duplicados son más baratos que una
abstracción equivocada. Cuando extraigas, elimina todas las copias y actualiza
el catálogo.

### Escalar sin romper la arquitectura

- Empieza plano. Crea subcarpetas por dominio dentro de la capa cuando un
  dominio tenga 6+ componentes o la capa supere 40 archivos; antes es ruido.
- Las piezas compartidas **bajan de capa** (organismo → molécula → átomo) o se
  quedan en `atoms`/`molecules`. No crees `shared/` como cuarto contenedor.
- Un organismo de un dominio no importa otro organismo de otro dominio solo
  para reutilizar markup. Extrae la molécula común o pasa el dato ya resuelto.
- `lib/<dominio>` puede depender de otro dominio solo por una regla de negocio
  real y sin ciclos. Si es una utilidad, muévela a `lib/format` o `lib/ui`.
- Un módulo de `lib` no mezcla cliente HTTP, mapeo y validación. Sepáralos en
  `api.ts`, `mappers.ts` y `validation.ts`.
- Una página que necesita dos templates o más de tres organismos de primer
  nivel probablemente son dos rutas. Divídela antes de que crezca.
- Estado global solo con ADR. Por defecto: URL para filtros/paginación, estado
  local para la UI, contexto solo para sesión y tema.
- Dependencia nueva solo con ADR y revisión de peso, seguridad y alternativa
  nativa. Un endpoint nuevo deja tipo en `types`, cliente en `lib/api` y mapeo
  a dominio.
- Permiso nuevo: se valida en el servidor; la UI solo oculta. No agregues
  reglas de acceso en un componente de presentación.

## 2. Contratos de componentes

### Astro

```astro
---
/**
 * TextField — label, input y mensajes de ayuda/error.
 *
 * Capa: molecule
 * Props: label, name, value, error, hint, required
 * Efectos: ninguno.
 */
interface Props {
  label: string;
  name: string;
  value?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const { label, name, value = '', error, hint, required = false } = Astro.props;
const errorId = `${name}-error`;
const hintId = `${name}-hint`;
const describedBy =
  [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
---

<div class:list={['field', { 'field--invalid': Boolean(error) }]}>
  <label class="field__label" for={name}>
    {label}
    {required && <span aria-hidden="true"> *</span>}
  </label>
  <input
    class="field__control"
    id={name}
    name={name}
    type="text"
    value={value}
    required={required}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={describedBy}
  />
  {hint && <p class="field__hint" id={hintId}>{hint}</p>}
  {error && <p class="field__error" id={errorId} role="alert">{error}</p>}
</div>
```

Reglas de Astro:

- Frontmatter en este orden: docblock, imports, `interface Props`, `Astro.props`,
  derivados, handlers. El markup no contiene lógica de negocio.
- `interface Props` siempre que haya props; nunca `Astro.props as any`.
- Defaults en el destructuring, no con `||` en el markup.
- `class` del consumidor se recibe y se pasa con `class:list`; no lo ignores.
- Slots: documenta si son requeridos, opcionales o con fallback.
- `<style>` scoped por defecto. `is:global` solo en tokens/base.
- `set:html` solo con contenido estático del repo; nunca con API o usuario.
- Inputs con `id` estable y `label for`. No generes IDs aleatorios en SSR.
- Un componente, un archivo. El nombre del archivo es el nombre del componente.

### SolidJS

```tsx
/**
 * DocumentUploader — sube documentos y muestra el progreso por archivo.
 *
 * Capa: organism (isla)
 * Props: practicanteId, onUploaded
 * Efectos: red, listeners y limpieza con onCleanup.
 */
import type { Component } from 'solid-js';
import { createSignal, onCleanup, splitProps } from 'solid-js';

export interface DocumentUploaderProps {
  practicanteId: string;
  onUploaded?: (documentId: string) => void;
  class?: string;
}

export const DocumentUploader: Component<DocumentUploaderProps> = (props) => {
  const [local, rest] = splitProps(props, ['practicanteId', 'onUploaded', 'class']);
  const [isUploading, setIsUploading] = createSignal(false);

  // ...

  onCleanup(() => {
    // cancela requests, timers o listeners
  });

  const className = () =>
    ['uploader', local.class].filter(Boolean).join(' ');

  return (
    <section class={className()} {...rest}>
      {/* ... */}
    </section>
  );
};
```

Reglas de Solid:

- **No desestructures props** (`const { title } = props`): pierdes
  reactividad. Usa `splitProps` o accede a `props.title`.
- Props tipadas con `interface Props` en Astro y `interface <Componente>Props`
  en Solid; `Component<Props>` para el componente.
- Derivados con `createMemo`; `createEffect` solo para efectos externos
  (DOM, red, storage). No sincronices estado derivable.
- Listas dinámicas con `<For>`; primitivos con `<Index>`; condicionales con
  `<Show>` o `<Switch>`. No encadenes ternarios en JSX.
- `classList` para clases condicionales; no concatenes strings con `undefined`.
- IDs únicos con `createUniqueId()`.
- `onCleanup` para timers, listeners, observers y requests cancelables.
- `createResource` para datos de isla; maneja `loading`, `error` y `refetch`.
- Eventos con handler nombrado (`handleSubmit`); no lógica compleja inline.
- Sin `any`; usa `unknown` + guardas o el tipo de `JSX`.

### Props y variantes

- Las variantes son uniones discriminadas, no booleanos acumulados:

```ts
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
}
```

- No uses `isPrimary`, `isSecondary`, `isDanger` como props separadas.
- No pases 8 props sueltas: agrupa en objetos con nombre (`pagination`,
  `filters`, `user`) o usa composición con slots/children.
- No prop drilling de más de dos niveles. Usa composición, slots o contexto
  (`createContext`) para el tema, la sesión o el layout.
- Los datos de API se mapean a tipos de dominio en `lib/api/mappers`; el
  componente no debería conocer la forma cruda del backend.

## 3. Código limpio

### Nombres

| Elemento | Convención | Ejemplo |
| --- | --- | --- |
| Componente / archivo de componente | PascalCase | `PracticantesTable.astro` |
| Página / ruta | kebab-case | `practicantes/[id].astro` |
| Layout | PascalCase | `AppLayout.astro` |
| Módulo de lógica | kebab-case | `format-date.ts` |
| Variable / función | camelCase | `activePracticantes` |
| Constante de módulo | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE_BYTES` |
| Tipo / interfaz | PascalCase, sin prefijo `I` | `Practicante`, `ApiError` |
| Booleano | `is`, `has`, `can`, `should` | `isLoading`, `canEdit` |
| Handler | `handle` + evento | `handleSubmit`, `handlePageChange` |
| Predicado | `is` / `has` | `isPracticanteActivo` |
| Clase CSS | BEM ligero | `.field`, `.field__label`, `.field--invalid` |

- La estructura y los verbos van en inglés (`loadPracticantes`, `handleSubmit`,
  `formatDate`); los sustantivos del dominio pueden quedarse en español
  (`Practicante`, `Convenio`, `practicanteId`) para no romper el lenguaje
  ubicuo. Comentarios, documentación y microcopy en español; UI en es-MX.
- Sin abreviaturas inventadas (`prac`, `emp`, `usr`). Permitidas las estándar:
  `id`, `url`, `api`, `db`, `ui`, `http`, `dto`.
- Un nombre debe responder qué es y para qué sirve. `data`, `item`, `temp`,
  `handleClick2` no son nombres.
- Evita negaciones dobles: `isVisible`, no `isNotHidden`.
- No uses el mismo nombre para el DTO y el modelo de dominio.

### Funciones y módulos

- Una función hace una cosa. Si necesitas `y` en el nombre, probablemente son
  dos.
- Máximo **40 líneas** y **3 parámetros**. Más de 3 → objeto con nombre.
- Sin flags booleanos que cambian el comportamiento (`render(true)`); divide en
  dos funciones o usa una unión explícita.
- Guard clauses y retornos tempranos; evita el `if` anidado profundo.
- Máximo 3 niveles de anidación. Si no cabe, extrae.
- Sin ternarios anidados. Usa `if`, una lookup table o un componente.
- Funciones puras primero. Los efectos van en el borde (página, isla, API).
- Un módulo, una responsabilidad. Si el archivo supera el límite de la capa,
  divídelo por responsabilidad, no por ocurrencia.
- Sin `export *`; exporta lo que el consumidor necesita.
- Sin side effects al importar (excepto CSS). Nada de registrar listeners o
  lanzar fetches a nivel de módulo.
- Sin código muerto ni comentado. Se borra; Git conserva el historial.

### Límites de tamaño

Son objetivos de legibilidad. El script marca advertencia al pasar el objetivo
y error al pasar el límite duro.

| Archivo | Objetivo | Límite duro |
| --- | ---: | ---: |
| Átomo | 120 líneas | 180 |
| Molécula | 180 | 260 |
| Organismo | 300 | 450 |
| Template | 200 | 300 |
| Layout | 250 | 400 |
| Página | 250 | 400 |
| Módulo de `lib` | 250 | 400 |

Si un archivo crece, las salidas son: extraer un átomo/molécula, mover lógica a
`lib`, dividir por sección o convertir en template. No reduzcas líneas
metiendo todo en una línea.

### Valores y estado

- Sin números, strings o colores mágicos. Usa tokens o constantes con nombre:
  `const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;`.
- Sin `any`. Usa `unknown` y estrecha con guardas; `satisfies` para configurar
  objetos sin perder el tipo.
- Sin `@ts-ignore`; si es inevitable, `@ts-expect-error` con una razón al lado.
- Sin doble cast `as unknown as T`; si lo necesitas, aísla y documenta el borde.
- `readonly` en props y arrays que no se mutan.
- Una sola fuente de verdad. Deriva con `createMemo`, no sincronices con
  `createEffect`.
- Estado de URL para filtros, paginación y búsqueda; así se comparte y se
  recarga sin perder contexto.
- Estados de datos como unión discriminada:

```ts
type LoadState<T> =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };
```

- Fechas: ISO en API, `Intl.DateTimeFormat('es-MX')` en UI. No formatees a mano.
- Dinero: entero en centavos en la lógica; `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })` en UI.
- IDs: `string`, nunca `number`.

### Errores

- No tragues errores (`catch {}`). Si no puedes actuar, deja que suban al borde
  que sí puede.
- Un `catch` debe añadir contexto o transformar el error, no solo loguear.
- Errores de `lib` tipados (`ApiError`, `ValidationError`); mensajes de UI
  genéricos y en español.
- Sin PII, tokens, stack traces ni rutas internas en mensajes de usuario.
- En el cliente, un error de red no borra los datos previos: muestra banner y
  permite reintentar.
- `console.log` solo en desarrollo y nunca con datos reales. En producción, el
  error va al logger del servidor con un ID de correlación.

### Imports y formato

- Orden: built-in (`node:*`), externos, alias `@/`, relativos, tipos, estilos.
  Una línea en blanco entre grupos.
- Usa el alias `@/` para cruzar carpetas. Relativo solo para hermanos o un
  nivel arriba. Evita `../../` o más.
- Sin barrels. Importa `@/components/atoms/Button.astro`, no
  `@/components`.
- Formato: 2 espacios, comillas simples, punto y coma, coma final, ancho 100.
  Un solo formateador en el repo. No reformatees archivos ajenos en el mismo PR.
- Un archivo se formatea al tocarlo; el reformateo masivo va en un commit
  aparte.

Configura el alias en `astro.config.mjs` y en `tsconfig.json`:

```js
// astro.config.mjs
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';

export default defineConfig({
  integrations: [solid()],
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
```

```json
// tsconfig.json (extracto)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### TypeScript

- `strict: true`; sin `any`, sin `@ts-ignore`.
- `unknown` en el borde (API, `JSON.parse`, `postMessage`) y guardas explícitas.
- `as` solo en un borde documentado; nunca para “arreglar” un tipo de dominio.
- Uniones discriminadas para estados y variantes; no `string` para enums
  cerrados.
- `readonly` en contratos; arrays mutables solo donde se construyen.
- `satisfies` para objetos de configuración.
- `noUncheckedIndexedAccess` si el equipo lo adopta; mientras tanto, trata
  `array[i]` como posible `undefined` en lógica nueva.

### Solid y Astro: errores comunes

| Error | Corrección |
| --- | --- |
| `const { title } = props` en Solid | `splitProps` o `props.title` |
| `createEffect` para calcular un total | `createMemo` |
| `items.map()` en JSX de Solid | `<For each={items}>` |
| `class={\`btn ${active ? 'is-active' : ''}\`}` | `classList={{ 'is-active': active }}` |
| Fetch inicial en un átomo | Mover a la página o a una isla de organismo |
| `set:html` con un comentario de API | Mostrar como texto o sanear |
| Lógica de permisos en el cliente | Validar en servidor; la UI solo oculta |
| `id="input"` repetido | `id` por props o `createUniqueId()` en Solid |

## 4. Documentación

### Qué se documenta y dónde

```text
docs/
  architecture.md          # resumen del repo y enlaces a este estándar
  components.md            # catálogo de organismos, templates y layouts
  decisions/
    ADR-0001-cliente-http.md
    ADR-0002-estado-de-filtros.md
```

- La skill es la fuente de verdad del estándar. `docs/architecture.md` es el
  resumen aplicado al repo y no debe duplicar todos los detalles.
- `docs/components.md` lista organismos, templates y layouts: nombre, capa,
  dominio, propósito, props principales y quién lo usa. Plantilla en
  `assets/components-catalog-template.md`. Se actualiza al añadir o renombrar
  uno.
- Cada decisión estructural se registra como ADR: arquitectura, cliente HTTP,
  autenticación, estado, estrategia de formularios, elección de dependencia,
  estructura de carpetas o contrato de API. No para cambios visuales.
- El README raíz explica instalación, comandos, estructura y enlace a `docs/`.
- Los cambios de documentación van en el mismo PR que el código. Un PR que
  cambia una regla y no actualiza el estándar está incompleto.

### Docblock obligatorio

Organismos, templates, layouts y módulos de `lib` llevan un docblock al inicio:

```ts
/**
 * PracticantesTable — tabla paginada de practicantes.
 *
 * Capa: organism
 * Props: rows, total, page, pageSize, onPageChange
 * Slots: empty (estado vacío personalizado)
 * Efectos: ninguno; los datos llegan por props.
 * Ejemplo:
 *   <PracticantesTable rows={rows} total={134} page={1} pageSize={20} />
 */
```

- Propósito en una frase.
- Capa y dependencias relevantes.
- Props y slots, con unidades o formato si no son obvios.
- Efectos secundarios (red, storage, timers) y limpieza.
- Ejemplo solo si la firma no es evidente.
- En `lib`, usa JSDoc con `@param`, `@returns` y `@throws` en funciones
  públicas; no repitas lo que el tipo ya dice.

### Comentarios

- Comenta el **por qué**, la restricción o el caso raro; no el qué.
- Un comentario que repite el código se borra.
- `TODO` y `FIXME` llevan issue o enlace:
  `// TODO(#123): mover el filtro al servidor cuando exista el endpoint.`
- No dejes código comentado, credenciales, ejemplos con datos reales ni
  `console.log` de depuración.
- Si una decisión sorprende, documéntala en el código y, si es estructural, en
  un ADR.

### ADR

Plantilla en `assets/adr-template.md`. Un ADR es corto: contexto, decisión,
consecuencias y alternativas. Se escribe cuando la decisión es costosa de
revertir, afecta a varias personas o cambia un contrato. No se reescribe: si
cambia, se crea otro y se marca el anterior como reemplazado.

## 5. Pruebas

- `lib/`: tests unitarios de formato, validación, mappers y reglas puras. Son
  rápidos y no necesitan DOM.
- Componentes Astro: `Astro Container API` para templates críticos o estados
  vacío/error, si aporta. No hagas snapshots de páginas completas.
- E2E con Playwright para los flujos que rompen el negocio: iniciar sesión,
  crear postulación, subir documento, enviar evaluación.
- No midas cobertura como objetivo. Cubre las rutas críticas y los bordes que
  ya fallaron.
- Un bug corregido deja un test que falla sin el arreglo.
- Tests junto al código (`*.test.ts`). Describe en español; los identificadores
  siguen la convención del código (estructura/verbos en inglés, dominio en
  español).

## 6. Aplicar el estándar en el repo

Checklist para una pantalla nueva:

1. Define la ruta en `src/pages/` y el permiso que exige.
2. Lee los datos en el servidor con `lib/api`; mapea el DTO a dominio.
3. Elige el template: lista, detalle o formulario.
4. Coloca cada sección en organismos; cada campo en moléculas; cada control en
   átomos.
5. La isla Solid solo para lo interactivo; hidrata con `client:visible` o
   `client:idle`.
6. Documenta el organismo/template con su docblock.
7. Añade el componente a `docs/components.md` si es organismo/template/layout.
8. Ejecuta los checks y corrige.

Ejemplo de descomposición:

```text
pages/practicantes/index.astro        # ruta, fetch, permisos, errores
  └─ ListPageTemplate                # esqueleto sin datos
       ├─ PageHeader                 # organismo
       ├─ PracticantesFilters.tsx    # organismo (isla Solid)
       ├─ PracticantesTable          # organismo
       └─ Pagination                 # molécula
```

Antipatrón: una página de 500 líneas con `fetch`, `map`, condicionales de
permisos, tabla, filtros y estilos. Si no puedes nombrar las secciones, no
está descompuesta.

## 7. Cumplimiento

```sh
# Estructura, capas, nombres, tamaño, tipos y documentación
node .opencode/skills/psa-design-standard/scripts/check-architecture.mjs

# UI, seguridad y accesibilidad
node .opencode/skills/psa-design-standard/scripts/audit-ui.mjs

# Tipos y plantillas de Astro (requiere @astrojs/check)
bunx astro check

# Build + presupuesto
bun run build
node .opencode/skills/psa-design-standard/scripts/check-budget.mjs
```

`check-architecture.mjs` revisa:

- componentes fuera de `atoms/molecules/organisms/templates`;
- imports hacia arriba (átomo → organismo, molécula → template, etc.);
- `lib` importando componentes, Astro, Solid o estilos;
- ciclos de imports;
- layouts que componen templates o páginas;
- templates que cargan datos (`lib/api`, auth, servicios);
- átomos/moléculas que importan lógica fuera de `lib/ui`/`lib/format`;
- organismos que importan datos (advertencia; la isla puede justificarlo);
- imports relativos profundos (`../../` o más);
- barrels (`index.ts`) fuera de `pages/`;
- nombres PascalCase/kebab-case;
- tamaño por capa;
- `any`, `@ts-ignore`, doble cast;
- `Astro.props` sin `interface Props`;
- falta de docblock en organismos, templates, layouts y `lib`;
- funciones públicas de `lib` sin JSDoc;
- `TODO/FIXME` sin issue.

Se recomienda añadir Biome para formato y lint (`biome check`), con reglas
`noExplicitAny`, `noUnusedVariables`, `useConst`, `noConsole` (warn) y
`organizeImports`. El CI ejecuta, en orden: formato/lint, `astro check`,
`audit-ui`, `check-architecture`, build, `check-budget` y tests.

## 8. Checklist de código limpio

- [ ] El componente está en la capa correcta y no importa hacia arriba.
- [ ] El nombre del archivo coincide con el componente; página en kebab-case.
- [ ] Sin barrels ni `export *`; imports directos.
- [ ] Props tipadas (`interface Props` en Astro; `<Componente>Props` en Solid);
      sin `any` ni `@ts-ignore`.
- [ ] Una sola responsabilidad; ≤40 líneas por función y ≤3 parámetros.
- [ ] Sin valores mágicos; tokens o constantes con nombre.
- [ ] Sin lógica de negocio en el markup; sin fetch inicial en átomos.
- [ ] Sin `createEffect` para estado derivable; sin destructuring de props en Solid.
- [ ] Docblock en organismos, templates, layouts y `lib`.
- [ ] ADR si la decisión es estructural; `docs/components.md` actualizado.
- [ ] Archivo dentro del límite; si no, dividido por responsabilidad.
- [ ] Sin código muerto, `console.log` ni TODO sin issue.
- [ ] `check-architecture.mjs` sin errores (y sin advertencias en modo estricto).
