# Arquitectura aplicada

Resumen operativo de la implementación. Las reglas completas de diseño,
seguridad y rendimiento viven en
[`.opencode/skills/psa-design-standard/SKILL.md`](../.opencode/skills/psa-design-standard/SKILL.md).

## 1. Contexto y alcance

PSA necesita una base de frontend para gestionar pasantías. En esta etapa:

- El acceso es real dentro del repo: credenciales, sesión firmada, rutas
  privadas y permisos de navegación por rol.
- Los módulos de negocio son una demostración funcional: los datos son
  ficticios y se guardan en el navegador.
- No hay backend de negocio ni autorización de datos por rol. El servidor ya
  filtra secciones por rol; cuando exista la API real, será la autoridad de
  permisos y datos.

## 2. Stack

| Pieza | Versión / uso |
| --- | --- |
| Astro | 7.x, páginas SSR con `prerender = false` |
| Adaptador | `@astrojs/node` en modo `standalone` |
| Islas | SolidJS para login y CRUD; Astro para el resto |
| Estilos | CSS global por dominio y tokens; sin framework CSS |
| Tipos | TypeScript estricto, sin `any` |
| Runtime | Node.js >= 22.23.4 |

`astro.config.mjs` concentra el adaptador, la integración de Solid, el alias
`@/`, `checkOrigin` y la CSP. El alias también está declarado en
`tsconfig.json` para el editor y `astro check`.

## 3. Capas y dependencias

```text
pages ──▶ templates ──▶ organisms ──▶ molecules ──▶ atoms
  │            │             │
  └────────────┴─────────────┴──▶ lib ──▶ types
layouts (shell) ──▶ organisms / lib / styles
```

Reglas aplicadas:

- `layouts` es el shell de página, no una capa de negocio.
- No hay imports ascendentes entre capas.
- `lib` no importa componentes ni páginas.
- Los contratos compartidos viven en `src/types/`.
- Los componentes de dominio usan PascalCase; rutas, archivos de lógica y
  utilidades usan kebab-case.
- `.astro` es la opción por defecto. `.tsx` se reserva para islas Solid y cada
  isla tiene variante Astro solo cuando se necesita en ambos mundos.

## 4. Flujo de autenticación

```text
LoginForm (Solid, client:load)
  └─ POST /api/auth/login { credential, password }
       ├─ rate limit por IP (5 / minuto, en memoria)
       ├─ PBKDF2-SHA256 600 000 iteraciones
       ├─ JWT HS256 con id, name, email, role, studentId (si aplica), iat, exp (8 h)
       └─ Set-Cookie: psa_session=…; HttpOnly; SameSite=Lax; Secure (prod)

Request privada
  └─ middleware
       ├─ lee la cookie, verifica firma y expiración
       ├─ expone el usuario en Astro.locals.user
       ├─ sin sesión → /iniciar-sesion?next=<ruta>
       ├─ sin permiso para la ruta → /panel
       └─ agrega cabeceras de seguridad y Cache-Control: no-store
```

Los permisos viven en `src/lib/ui/permissions.ts`. `navigation.ts` declara el
permiso de cada sección y el middleware lo revalida; el sidebar solo oculta lo
que el servidor ya no permitiría.

Decisiones asociadas:

- [ADR-0001](decisions/ADR-0001-sesion-ssr-cookie.md): sesión SSR en cookie
  HttpOnly, no tokens en `localStorage`.
- [ADR-0003](decisions/ADR-0003-csp-estricta.md): CSP estricta por hashes y
  verificación automatizada.

### Rutas

| Ruta | Tipo | Acceso | Contenido |
| --- | --- | --- | --- |
| `/` | SSR | público | Redirige según haya sesión |
| `/iniciar-sesion` | SSR | público | Formulario de acceso |
| `/panel` | SSR | privado | Resumen operativo; el estudiante va a `/mi-pasantia` |
| `/mi-pasantia` | SSR | privado, estudiante | Pasantía, tutor empresarial y accesos propios |
| `/mis-documentos` | SSR + isla | privado, estudiante | Expediente propio y carga de PDF |
| `/mis-calificaciones` | SSR | privado, estudiante | Evaluación académica y del centro |
| `/mis-excusas` | SSR + isla | privado, estudiante | Envío y seguimiento de excusas |
| `/usuarios` | SSR + isla | privado, staff | Catálogo de usuarios |
| `/estudiantes` | SSR + isla | privado, académica | Catálogo de estudiantes |
| `/tutores` | SSR + isla | privado, académica | Catálogo de tutores académicos |
| `/talleres` | SSR + isla | privado, académica | Catálogo de talleres |
| `/tutores-empresariales` | SSR + isla | privado, empresas | Catálogo de tutores empresariales con filtro por empresa |
| `/supervisores` | SSR + isla | privado, staff | Catálogo de supervisores con filtro por centro de trabajo |
| `/vinculadores` | SSR + isla | privado, staff | Catálogo de vinculadores |
| `/centros-trabajo` | SSR + isla | privado, empresas | Catálogo de centros con filtro booleano de restricción de edad |
| `/plazas` | SSR + isla | privado, empresas | Taller → plazas del taller |
| `/documentacion` | SSR + isla | privado, documentación | Taller → estudiante → documentos |
| `/evaluacion` | SSR + isla | privado, evaluación | Taller → estudiante → calificación y documentos |
| `/proceso-pasantia` | SSR + isla | privado, proceso | Etapa y avance del proceso |
| `/reportes` | SSR + isla | privado, documentos | Métricas del proceso y descarga en PDF |
| `/api/auth/login` | endpoint | público | Valida credenciales |
| `/api/auth/logout` | endpoint | público | Elimina la cookie (solo POST) |

El rate limit es de un solo proceso. En un despliegue con varias instancias debe
moverse a Redis o al rate limit del proveedor.

## 5. Módulos y persistencia

Hay dos patrones de pantalla:

1. **Catálogos de gestión:** las páginas de estudiantes, talleres, tutores,
   empresas, plazas, personal, usuarios y proceso usan `ResourceManager`
   (`client:idle`). Cada página aporta `config` (columnas, campos, estados,
   detalle y textos) e `initialRows` (filas semilla).
2. **Espacios de trabajo por cohorte:** documentación, evaluación y plazas usan
   `DocumentWorkspace`, `EvaluationWorkspace` y `PlazaWorkspace` (`client:idle`).
   Los tres navegan primero por taller. Documentación y evaluación añaden el
   detalle por estudiante; plazas filtra su catálogo por el taller elegido.
   Reutilizan `ResourceTable`, `ResourceDetailDialog` y `ResourceFormDialog`.
   Cada fila ofrece una consulta de solo lectura con los atributos declarados en
   `detailFields`; el rol decide si además se muestra el alta, la edición o solo
   la consulta.

Las configuraciones de catálogo usan nombres de atributo del esquema
(`fecha_nacimiento`, `id_taller`, `horas_pasantia_realizadas`, etc.) y derivan
las etiquetas que necesita la interfaz (`nombreCompleto`, `taller`, `ciclo`,
`poliza`, `centroTrabajo`, `plaza`). `normalizeRow` migra filas guardadas por
versiones anteriores y `deriveRow` completa esos valores de presentación antes
de persistir. La lógica compartida vive en `src/lib/resource/row-values.ts` y
`src/lib/catalog/person-name.ts`.

Los catálogos pueden declarar `importConfig` para habilitar la importación
masiva. Estudiantes acepta CSV y Excel `.xlsx`; el archivo se lee en el
navegador, se mapean encabezados visibles o alias a las llaves del formulario y
se aplican las mismas reglas de validación. Las filas con errores se muestran en
la vista previa y no se guardan; los correos repetidos se omiten. La lectura
XLSX usa `fflate` y limita el tamaño del archivo, las filas y el contenido
descomprimido. La importación no convierte celdas en HTML ni ejecuta fórmulas.

El sidebar puede contraerse a iconos en escritorio desde la barra superior. El
estado se aplica antes del primer pintado con `public/sidebar-init.js` y se
guarda en `localStorage['psa-sidebar']`. Los módulos únicos son enlaces
directos; las secciones con varios módulos se muestran planas si caben y, si
no, `src/lib/ui/sidebar-accordion.ts` las convierte en acordeón con máximo tres
abiertas, cierra la más antigua cuando hace falta y persiste el orden en
`localStorage['psa:sidebar:sections']`. La medición incluye márgenes y deja
cero altura a los paneles plegados. Los espacios de trabajo de plazas,
documentación y evaluación permiten ocultar su lista de talleres; cada sección
conserva su preferencia en `localStorage`. Ninguna de estas preferencias
contiene datos de negocio ni credenciales.

En el navegador, `src/lib/storage/resource-store.ts`:

- Carga y valida `localStorage['psa:data:<módulo>']`.
- Si no existe o está corrupto, usa las filas semilla.
- Las pantallas con alcance parcial (estudiante o tutor) guardan una instantánea
  marcada como `partial`; al cargarla se combina con las filas de su alcance para
  no borrar los demás registros de la demostración. Las pantallas con alcance
  completo sustituyen la instantánea.
- Una lista de identificadores eliminados evita que una escritura parcial
  posterior reviva registros borrados por coordinación.
- Combina las filas guardadas con las semilla por `id`, para que los registros
  de demostración hereden columnas nuevas.
- Persiste altas, ediciones y borrados.

La consulta de detalle no vuelca la fila completa: renderiza `detailFields`, que
excluye `id`, cualquier llave `id_*`, la llave primaria y el estado (visible en
el encabezado). La interfaz no muestra identificadores internos de la base de
datos. Los campos de almacenamiento (`bucket`, `storage_path`) se muestran solo
como referencia y nunca se convierten en URLs firmadas desde el cliente.

Evaluación añade un flujo de documentos con almacenamiento propio:

- `psa:grading:templates` guarda las plantillas creadas o importadas.
- `psa:grading:documents` guarda el documento editable por evaluación.
- `src/lib/grading/templates.ts` resuelve los marcadores `{{estudiante}}`,
  `{{taller}}`, `{{plaza}}`, `{{calificacion}}`, `{{estado}}` y `{{fecha}}`.
- `src/lib/grading/import-template.ts` acepta `.docx`, `.html`, `.htm`, `.txt`
  y `.md`, pero solo conserva texto. El HTML y el XML de Word nunca se insertan
  como marcado.
- `src/lib/grading/document-html.ts` genera una descarga HTML autónoma con todo
  el contenido escapado y sin scripts ni recursos externos.

Las plantillas y documentos son datos locales de demostración. La API real
deberá autorizar la emisión, validar el contenido y conservar la versión
inmutable de cada documento.

El alcance de talleres también depende del rol: coordinación, vinculación y
supervisión ven todos; el tutor académico solo el taller que imparte y el tutor
empresarial los talleres asignados a su empresa. El servidor filtra las filas de
documentación antes de enviarlas al navegador. En esta demo la asignación está
en `src/lib/ui/permissions.ts`; en producción vendrá de la API.

| Rol | Secciones | Acciones |
| --- | --- | --- |
| Coordinación | Todas | Catálogos, documentos, calificaciones, proceso y revisión de excusas |
| Vinculador | Académica, empresas, documentación, proceso | Catálogos académicos y de empresas, documentos, proceso y todas las excusas |
| Tutor académico | Académica, documentación, evaluación, proceso | Catálogos y proceso en consulta; calificaciones y documentos de su taller; consulta todas las excusas y resuelve las dirigidas a su rol |
| Tutor empresarial | Plazas, documentación, evaluación, seguimiento | Consulta sus plazas y solicita plazas nuevas (quedan en revisión); calificaciones de sus talleres; excusas empresariales |
| Supervisor | Empresas, documentación, evaluación, proceso | Solo consulta |
| Estudiante | Mi pasantía | Consulta su plaza y calificaciones; sube documentos y envía excusas |

Los catálogos de gestión académica y de empresas usan `readOnly` cuando el rol
solo consulta: tutoría académica y supervisión. El catálogo de proceso también
es de solo consulta para tutoría académica, tutoría empresarial y supervisión.

Decisiones asociadas:

- [ADR-0002](decisions/ADR-0002-crud-generico.md): CRUD declarativo y
  persistencia local de demostración.
- [ADR-0004](decisions/ADR-0004-plantillas-documentos-calificacion.md):
  plantillas, importación segura y documentos de calificación.

Limitaciones explícitas:

- `localStorage` es por navegador y no se comparte entre dispositivos.
- Las plantillas, documentos de calificación y preferencias de interfaz también
  viven solo en el navegador.
- La validación del formulario y de la importación es de experiencia de usuario,
  no de seguridad.
- La autorización de datos por estudiante/empresa queda para el backend. El
  middleware solo protege secciones y la UI solo oculta acciones.

## 6. Seguridad

Controles implementados:

- **A01 / acceso:** middleware protege todas las rutas privadas en el servidor y
  revalida el permiso del rol; no se depende de JavaScript del cliente.
- **A02 / criptografía:** PBKDF2-SHA256 con 600 000 iteraciones, sal por cuenta,
  comparación de tiempo constante y hash de relleno para correos inexistentes.
- **A03 / inyección:** Solid y Astro escapan la salida; no se usa `innerHTML`
  ni `set:html`. Las plantillas importadas se convierten a texto y la descarga
  HTML se construye con valores escapados.
- **A04 / diseño inseguro:** rate limit, mensajes de error uniformes, cookies
  HttpOnly, secreto obligatorio en producción.
- **A05 / configuración:** CSP sin `unsafe-inline` ni `unsafe-eval`,
  `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy` y `checkOrigin`.
- **A07 / autenticación:** JWT HS256 firmado en servidor, expiración de ocho
  horas y cierre de sesión por POST.
- **A08 / integridad:** sin dependencias de CDN ni scripts de terceros.
- **A10 / SSRF:** no hay fetch del servidor hacia URLs controladas por el
  usuario.

La redirección `next` se normaliza con `URL` y se limita al mismo origen para
evitar open redirects.

## 7. Rendimiento

- Las islas de módulos usan `client:idle`; el login usa `client:load`.
- No se cargan fuentes web ni librerías de UI.
- El presupuesto se mide con
  `node .opencode/skills/psa-design-standard/scripts/check-budget.mjs` después
  del build: 120 KB JS, 40 KB CSS y 40 KB HTML gzip por ruta.
- En builds totalmente SSR, el script mide el bundle cliente como pseudo-ruta
  `(bundle cliente)`.

## 8. Variables y despliegue

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `PSA_SESSION_SECRET` | sí en producción | Firma del JWT; mínimo 32 caracteres |
| `HOST` | no | Interfaz del adaptador Node |
| `PORT` | no | Puerto del adaptador Node |

```sh
bun run build
PSA_SESSION_SECRET="$(openssl rand -base64 48)" \
HOST=127.0.0.1 PORT=4321 node dist/server/entry.mjs
```

El adaptador no lee `.env` en producción; el secreto debe venir del entorno del
proceso.

## 9. Verificación

```sh
bun run check
bun run build
bun run check:csp
bun run budget
node .opencode/skills/psa-design-standard/scripts/audit-ui.mjs
node .opencode/skills/psa-design-standard/scripts/check-architecture.mjs
```

`check:csp` levanta el build en un puerto libre, inicia sesión y comprueba en las
catorce rutas que cada script y estilo inline tenga su hash, que no exista
`unsafe-inline`, que las cabeceras estén presentes y que la cookie sea
`HttpOnly`, `Secure` y `SameSite=Lax`.

La verificación CDP complementaria recorre las pantallas por rol y valida el
flujo de taller a estudiante, el CRUD de plazas, la captura de calificaciones y
la creación, edición, persistencia y descarga de documentos de calificación.
