# PSA · Frontend de gestión de pasantías

Interfaz de la Plataforma de Seguimiento de Pasantías (PSA). Incluye acceso con
credenciales, panel operativo y administración de los módulos de gestión
académica, empresas, roles y personal, documentación, evaluación y proceso de
pasantía.

> Alcance actual: **solo frontend de demostración**. Los datos de negocio viven
> en el navegador; la autenticación es real dentro de este repo, pero se
> reemplaza por la API de identidad en producción.

## Requisitos

- Node.js >= 22.23.4
- [Bun](https://bun.sh/) para instalar y ejecutar los scripts

## Inicio rápido

```sh
bun install
bun run dev
```

Abre `http://localhost:4321/iniciar-sesion`.

### Cuentas de demostración

| Cuenta | Credencial | Contraseña |
| --- | --- | --- |
| Coordinación | `20260001` | `Psa2026!` |
| Tutor académico | `20260002` | `Psa2026!` |
| Supervisor institucional | `20260003` | `Psa2026!` |
| Vinculador | `20260004` | `Psa2026!` |
| Tutor empresarial | `20260005` | `Psa2026!` |
| Tutor empresarial con una sola plaza (Tecnologías del Bajío) | `20260011` | `Psa2026!` |
| Estudiante | `20260010` | `Psa2026!` |

La pantalla de acceso pide la credencial numérica y la contraseña. La contraseña
se valida en el servidor con PBKDF2-SHA256 (600 000 iteraciones); nunca se guarda
en `localStorage`.

Cada rol ve solo las secciones que necesita y las acciones se ajustan al rol. El
vinculador administra los catálogos académicos y de empresas, la documentación y
el proceso; el tutor académico consulta los catálogos, califica, revisa las
excusas y solo ve la documentación de su taller; el tutor empresarial califica
los talleres de su empresa, revisa las excusas dirigidas a su rol y solicita
plazas nuevas con sus características (quedan en revisión para vinculación); el
supervisor consulta; coordinación administra todo. El estudiante entra a «Mi
pasantía», donde consulta su plaza, su tutor empresarial y sus calificaciones,
sube documentos en PDF y envía excusas que el tutor acepta o rechaza. Los
reportes se descargan en PDF. Los catálogos y el proceso que el rol no gestiona
se muestran en modo consulta. El middleware aplica el mismo permiso en el
servidor, no solo en el menú.

## Comandos

```sh
bun run dev          # servidor de desarrollo
bun run build        # build de producción con @astrojs/node
bun run check        # Astro + TypeScript (0 errores esperados)
bun run check:csp    # CSP, cabeceras y cookie en el build de producción
bun run budget       # presupuesto de JS/CSS (requiere build)
```

En producción, el adaptador standalone se inicia con el secreto de sesión
configurado en el entorno:

```sh
PSA_SESSION_SECRET="$(openssl rand -base64 48)" \
HOST=127.0.0.1 PORT=4321 node dist/server/entry.mjs
```

`PSA_SESSION_SECRET` debe tener al menos 32 caracteres. En desarrollo existe un
valor de respaldo; en producción el acceso falla de forma segura si falta.

### Validadores del estándar de diseño

```sh
node .opencode/skills/psa-design-standard/scripts/audit-ui.mjs
node .opencode/skills/psa-design-standard/scripts/check-architecture.mjs
node .opencode/skills/psa-design-standard/scripts/check-budget.mjs
```

## Estructura

```text
src/
  pages/          # rutas SSR y endpoints de auth
  layouts/        # shell público (AuthLayout) y privado (AppLayout)
  components/
    atoms/        # Button, Icon, Badge, Brand, ThemeInit, ThemeToggle
    molecules/    # Alert, FormField, Modal, Pagination, Toast, …
    organisms/    # LoginForm, ResourceManager, AppSidebar, …
    templates/    # ListPageTemplate
  lib/
    auth/         # JWT, PBKDF2, sesión, rate limit, usuarios demo
    catalog/      # configuración y filas semilla de los módulos
    format/       # formato de fechas para la interfaz
    grading/      # plantillas, importación segura y documentos HTML
    import/       # lectura CSV/XLSX y mapeo de filas de recursos
    storage/      # persistencia ficticia en localStorage
    ui/           # navegación, iconos, roles y tonos de estado
    validation/   # correo, credencial y formularios de recursos
  styles/         # tokens y CSS global por dominio
  middleware.ts   # sesión, rutas privadas y cabeceras de seguridad
  types/          # contratos de auth y recursos
```

La fuente de verdad de arquitectura, diseño, seguridad y rendimiento es
`.opencode/skills/psa-design-standard/`. El resumen aplicado está en
`docs/architecture.md` y el catálogo en `docs/components.md`.

## Autenticación y sesión

1. El formulario envía credenciales a `POST /api/auth/login` con `fetch`.
2. El servidor aplica rate limit, valida PBKDF2 y firma un JWT HS256.
3. El token viaja en la cookie `psa_session` con `HttpOnly`, `SameSite=Lax`,
   `Secure` en producción y vigencia de ocho horas.
4. El middleware lee la cookie en cada request, valida firma y expiración,
   protege las rutas privadas y aplica el permiso del rol. Sin sesión redirige a
   `/iniciar-sesion?next=<ruta>`; sin permiso, a `/panel`.
5. El cierre de sesión solo acepta `POST /api/auth/logout` y elimina la cookie.

El cliente nunca lee el token. `localStorage` solo conserva el tema
(`psa-theme`), los datos ficticios de negocio (`psa:data:<módulo>`), las
plantillas y documentos de calificación (`psa:grading:templates` y
`psa:grading:documents`) y preferencias de interfaz (`psa-sidebar` y la
visibilidad de la lista de talleres).

## Persistencia de los módulos

Los catálogos de gestión usan la isla Solid `ResourceManager`, configurada de
forma declarativa en `src/lib/catalog/`. La tabla, búsqueda, filtro de estado,
paginación, alta, edición y borrado se resuelven en el cliente.

Documentación, evaluación y plazas usan espacios de trabajo propios
(`DocumentWorkspace`, `EvaluationWorkspace` y `PlazaWorkspace`) con navegación
por taller. Documentación y evaluación añaden el detalle por estudiante; plazas
filtra su catálogo por el taller seleccionado. Reutilizan la misma persistencia
y los mismos formularios, pero muestran solo las acciones que permite el rol.
Cada fila incluye una consulta de detalle con los atributos declarados en
`detailFields`, agrupados por sección. Los roles de solo lectura conservan esa
consulta aunque no puedan editar ni eliminar.

Las configuraciones usan los nombres de atributo del esquema de referencia
(`fecha_nacimiento`, `id_taller`, `horas_pasantia_realizadas`, etc.) y derivan
las etiquetas de presentación (`nombreCompleto`, `taller`, `plaza`,
`centroTrabajo`). Al cargar, las filas guardadas se migran y se combinan con las
semilla por `id`; cuando la pantalla solo recibió un subconjunto (estudiante o
tutor), la escritura se marca como parcial para no borrar el resto del módulo.
Los detalles de la correspondencia están en
[`docs/data-model.md`](docs/data-model.md). Las llaves internas `id` e `id_*` no
se muestran en la interfaz.

Estudiantes se puede importar desde CSV o Excel `.xlsx` con el botón
`Importar estudiantes`. El diálogo reconoce encabezados del esquema y alias,
muestra vista previa, valida las mismas reglas del formulario y evita correos
repetidos. El archivo se procesa en el navegador; no se sube a un servidor.

El sidebar de escritorio puede contraerse a iconos desde la barra superior. Si
el menú no cabe en el alto disponible, se pliega en un acordeón de máximo tres
secciones abiertas y recuerda cuáles quedaron abiertas; así no obliga a
desplazarse para encontrar un módulo. En plazas, documentación y evaluación, la
lista de talleres se puede ocultar y mostrar de nuevo; ambas preferencias se
recuerdan por navegador.

Evaluación incluye un administrador de plantillas y un generador de documentos.
Las plantillas se crean desde cero o se importan como texto (`.docx`, `.html`,
`.txt` o `.md`); el documento resultante se puede editar, guardar en el navegador
y descargar como HTML autónomo. El HTML importado nunca se renderiza: se
convierte a texto y la salida se escapa.

Reportes agrega métricas del proceso de pasantía (`/reportes`) con tarjetas
resumen y gráficos de barras para estudiantes, plazas, evaluaciones,
documentación y proceso. Los datos se agregan de todos los módulos y se pueden
descargar en PDF desde la vista previa. El PDF incluye portada, indicadores,
gráficos de distribución y pie numerado. La sección está protegida por el
permiso de documentos y aparece en el sidebar.

Las filas semilla se renderizan en el servidor y luego se reemplazan por lo
guardado en `localStorage`. Cuando exista la API real,
`src/lib/storage/resource-store.ts` se sustituye por llamadas al servidor. El
frontend no debe usarse como control de autorización de datos.

## Seguridad

- CSP estricta sin `unsafe-inline` ni `unsafe-eval`; los hashes los emite Astro y
  se verifican con `bun run check:csp`.
- `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`
  y `Permissions-Policy` en cada respuesta.
- `Cache-Control: no-store` en rutas privadas y respuestas de auth.
- Redirección posterior al login limitada al mismo origen.
- Sin secretos en el bundle ni tokens en almacenamiento persistente.
- Las plantillas y archivos importados se tratan como texto; no se usa
  `innerHTML` ni `set:html` con contenido del usuario.

## Rendimiento

El presupuesto es 120 KB de JS, 40 KB de CSS y 40 KB de HTML (gzip) por ruta.
Las islas usan `client:idle`; el acceso usa `client:load`. El build actual ronda
45 KB de JS y 7 KB de CSS en el bundle cliente.

## Documentación

- [`docs/architecture.md`](docs/architecture.md): decisiones aplicadas y flujo.
- [`docs/components.md`](docs/components.md): catálogo de organismos,
  templates y layouts.
- [`docs/data-model.md`](docs/data-model.md): correspondencia con el esquema de
  base de datos, reglas de detalle y límites del frontend.
- [`docs/decisions/`](docs/decisions/): ADR de autenticación, CRUD genérico,
  CSP y documentos de calificación.
- [Estándar PSA](.opencode/skills/psa-design-standard/SKILL.md): reglas completas.
