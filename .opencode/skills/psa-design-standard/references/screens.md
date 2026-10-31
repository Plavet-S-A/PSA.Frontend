# Pantallas y patrones de PSA

Plantillas para que cualquier vista nueva se sienta parte del mismo producto.
Los valores visuales están en `design-system.md`; la ubicación, dependencia y
contratos de los componentes están en `architecture.md`; aquí se define la
estructura de las pantallas.

## 1. Arquitectura de información

Navegación principal (sidebar, en este orden):

| Sección | Rutas | Para quién |
| --- | --- | --- |
| Panel | `/panel` | Coordinación |
| Practicantes | `/practicantes`, `/practicantes/[id]` | Coordinación, tutores |
| Empresas | `/empresas`, `/empresas/[id]` | Coordinación |
| Convenios | `/convenios`, `/convenios/[id]` | Coordinación, empresa |
| Ofertas | `/ofertas`, `/ofertas/[id]` | Coordinación, empresa |
| Postulaciones | `/postulaciones`, `/postulaciones/[id]` | Coordinación, empresa, estudiante |
| Documentos | `/documentos` | Todos según permiso |
| Evaluaciones | `/evaluaciones`, `/evaluaciones/[id]` | Tutores, coordinación |
| Reportes | `/reportes` | Coordinación |
| Configuración | `/configuracion` | Todos (perfil), admin (organización) |

Reglas:

- La navegación se filtra por rol, pero **el rol no se decide en el cliente**.
  El servidor entrega solo lo permitido; la UI oculta lo que no aplica.
- No más de 8 items de primer nivel. Agrupa con labels de sección si crece.
- La marca ocupa el primer bloque; el usuario y el tema, el pie del sidebar.
- En móvil, la navegación colapsa a drawer y las acciones críticas quedan en
  la topbar.

Estructura sugerida (Atomic Design; detalle en `architecture.md`):

```text
src/
  layouts/
    AppLayout.astro        # shell + tokens + theme
    AuthLayout.astro       # login/recuperación
  components/
    atoms/                 # Button, Input, Badge, Icon...
    molecules/             # FormField, SearchField, Pagination...
    organisms/             # AppSidebar, PageHeader, PracticantesTable...
    templates/             # ListPageTemplate, DetailPageTemplate...
  lib/                     # api, auth, format, validation
  types/                   # contratos de dominio y API
  pages/
    (app)/
      panel.astro
      practicantes/index.astro
      practicantes/[id].astro
    (auth)/
      iniciar-sesion.astro
```

La isla no es una carpeta: un componente Solid (`DocumentUploader.tsx`) vive en
su capa (organismo) y se hidrata donde se usa con `client:visible` o
`client:idle`. No crees `components/islands/`.

## 2. Shell de la aplicación

```text
Sidebar 240px
  marca (logo 24px + nombre 14/600)
  nav con labels de sección
  pie: tema + usuario

Topbar 56px, sticky
  mobile: menú | breadcrumb | búsqueda | notificaciones | usuario
  desktop: breadcrumb a la izquierda, búsqueda y acciones a la derecha

Contenido
  PageHeader: título 24/600, descripción 14 muted, acciones a la derecha
  separación 24px
  secciones con gap 24–32px
```

- La topbar nunca duplica el título de la página.
- El botón “Volver” solo existe en detalles, no en listas.
- El usuario se muestra con avatar 32px + nombre en desktop; solo avatar en
  móvil. El menú incluye “Mi perfil”, “Cerrar sesión”.
- El toggle de tema es un botón icono 36px con `aria-label` (“Cambiar a tema
  oscuro” / “Cambiar a tema claro”); no un switch.

## 3. Iniciar sesión

- Layout centrado, sin sidebar, fondo `--bg-subtle`.
- Card de 400px, padding 32px, borde 1px, radio 4px.
- Marca arriba, título 24/600, descripción 14 muted.
- Campos: correo, contraseña (con mostrar/ocultar accesible), “Recordarme”
  (solo si la sesión lo permite), enlace “¿Olvidaste tu contraseña?”.
- Botón primario full width, altura 40px.
- Error general en alert soft arriba del formulario, sin indicar si el correo
  existe.
- Links legales y de soporte al pie, 12px.
- Sin imágenes de stock, sin split-screen decorativo, sin gradientes.
- En móvil, card sin borde y con padding 24px, botón full width.

Recuperación y primer acceso:

- Misma estructura; un solo campo.
- Mensaje de confirmación genérico: “Si el correo está registrado, recibirás
  instrucciones.”
- Nunca muestres el token ni enlaces de recuperación en la UI.

## 4. Panel (dashboard)

Orden de bloques:

1. PageHeader: “Panel”, fecha de hoy, acción “Nueva oferta” (si aplica).
2. Fila de 4 KPIs: practicantes activos, postulaciones pendientes, convenios
   por vencer, evaluaciones pendientes.
3. Grid 2/3 + 1/3:
   - Izquierda: “Postulaciones recientes” (tabla compacta de 5–8 filas) y
     “Convenios por vencer” (lista con fecha).
   - Derecha: “Tareas pendientes” (checklist) y “Actividad reciente” (timeline).
4. Enlaces “Ver todo” en cada bloque.

Reglas:

- Cada KPI enlaza a su lista filtrada.
- Si no hay datos, cada bloque tiene empty state propio; no ocultes el bloque.
- Nada de gráficos decorativos. Un gráfico solo si responde una pregunta
  (p. ej., postulaciones por mes) y con ejes legibles.
- Sin carruseles, sin mapas, sin widgets configurables en la v1.

## 5. Patrón de lista (maestro)

Estructura obligatoria:

```text
PageHeader
  Título + conteo ("Practicantes · 134")
  Descripción corta
  [Exportar] [Acción primaria]

FilterBar
  búsqueda | estado | empresa | carrera | [Filtros] [Limpiar]

Tabla
  checkbox | practicante | empresa | carrera | estado | inicio | acciones

Footer
  "Mostrando 1–20 de 134" | 20/50/100 | ‹ 1 2 3 ›
```

- La acción primaria es la única roja de la pantalla.
- “Exportar” siempre secundario y con confirmación si el archivo es grande.
- Búsqueda con debounce de 300ms y `Enter` para aplicar; no filtres en cada
  tecla contra el servidor.
- Filtros en URL. Al recargar, se conserva el estado.
- El conteo refleja el total filtrado, no el de la página.
- La tabla tiene un `caption` visualmente oculto (“Practicantes registrados”).
- Acciones de fila: “Ver detalle” (enlace en el nombre) + menú de 2–4 acciones.
- Eliminar nunca está en la fila sin confirmación. Para acciones destructivas,
  usa menú + modal con el nombre del registro.
- Estado vacío:
  - Sin datos: “Aún no hay practicantes registrados.” + “Registrar practicante”.
  - Sin resultados: “No encontramos resultados con estos filtros.” + “Limpiar
    filtros”.
- Estado de carga: skeleton de 8 filas con las mismas columnas.
- Error: alert inline sobre la tabla + “Reintentar”, sin borrar los filtros.

Columnas por módulo:

| Módulo | Columnas mínimas |
| --- | --- |
| Practicantes | Nombre + correo, carrera, empresa, tutor, estado, inicio, acciones |
| Empresas | Razón social, sector, contactos, convenios activos, estado |
| Convenios | Folio, empresa, vigencia, estado, documentos, acciones |
| Ofertas | Puesto, empresa, modalidad, vacantes, estado, publicación |
| Postulaciones | Estudiante, oferta, empresa, etapa, fecha, acciones |
| Documentos | Nombre, tipo, practicante/empresa, estado, actualización |
| Evaluaciones | Practicante, periodo, evaluador, puntaje, estado |
| Reportes | Nombre, periodo, generado por, fecha, acciones |

## 6. Detalle (practicante como referencia)

```text
← Volver a practicantes
Header
  Avatar 40 + Nombre 24/600 + badge de estado
  Metadatos: carrera · empresa · periodo
  [Secundario] [Primario]

Tabs: Resumen | Documentos | Evaluaciones | Bitácora

Grid 2/3 + 1/3
  Main:
    Datos del practicante (definition list 2 columnas)
    Asignación actual (empresa, tutor, horario)
    Timeline de etapas
  Aside:
    Acciones rápidas
    Documentos pendientes
    Contactos
    Metadata (folio, creado, actualizado)
```

Reglas:

- El estado va junto al nombre, no en una card aparte.
- Los datos personales se muestran en `dl` con label 12 muted y valor 14.
- Editar es una acción secundaria; “Enviar evaluación” o “Aprobar documentos”
  puede ser la primaria según la etapa.
- Las tabs no recargan la página; si el contenido es pesado, usa rutas hijas.
- El aside se apila debajo del main en <1024px.
- Zona de peligro (archivar, cancelar convenio) al final, separada por borde y
  con texto que explique la consecuencia.

Detalle de postulación:

- Header: estudiante + empresa + badge de etapa.
- Stepper horizontal con la etapa actual.
- Main: oferta, requisitos, documentos, historial de cambios.
- Aside: responsable, fechas, acciones de avance.
- “Rechazar” pide motivo (obligatorio) en modal; nunca rechaza desde la fila.

## 7. Formularios

Plantilla:

```text
PageHeader
  Título ("Nueva oferta")
  Descripción con el resultado esperado
  [Cancelar] [Guardar borrador] [Publicar]

Form (max 640px)
  Sección 1 · Datos generales
    campo | campo
  Sección 2 · Requisitos
  Sección 3 · Fechas y vigencia

Footer sticky (opcional)
  [Cancelar] [Acción primaria]
```

Reglas:

- Secciones con título 16/600, borde inferior y gap 24px.
- Dos columnas solo para campos relacionados; gap 16px. En <768px, una columna.
- Orden: identificación → detalles → fechas → confirmación.
- Etiquetas claras, sin placeholders como label.
- Validación al salir del campo (`blur`) y al enviar; no en cada tecla.
- Errores inline + resumen arriba si hay más de 3. El resumen enlaza al campo.
- Si hay “Guardar borrador”, el botón primario es “Publicar” y el borrador es
  secundario; guarda sin validar campos opcionales.
- Si el formulario se sale con cambios, muestra confirmación de descarte.
- Autosave solo en formularios largos (evaluaciones) y con indicador “Guardado
  hace un momento”; no en creación de usuarios.
- Nunca deshabilites el botón de envío como única validación; permite enviar y
  explica el error.
- La fecha usa input nativo `type="date"` o date picker accesible; no inventes
  un calendario custom sin teclado.

Campos específicos del dominio:

- Periodo: inicio y fin, con validación de rango y duración mínima/máxima.
- Horas: número con sufijo “hrs/semana”, `inputmode="numeric"`.
- Empresa: combobox con búsqueda; si no existe, acción “Registrar empresa”
  (nunca crear inline sin confirmación).
- Modalidad: radio (presencial, híbrida, remota), no select si son 3 opciones.
- Monto de beca: prefijo `MXN $`, separador de miles al perder foco, valor
  enviado como número.
- Archivos: ver patrón de uploads.

## 8. Evaluaciones

- Header con practicante, periodo, evaluador y estado.
- Resumen: puntaje total, escala y fecha límite.
- Rúbrica en tabla:

| Criterio | Peso | Puntaje 1–5 | Comentario |
| --- | --- | --- | --- |
| Desempeño técnico | 30 % | segmented control | textarea |
| Comunicación | 20 % | segmented control | textarea |

- Puntaje: 5 botones de 32px con `role="radiogroup"`, selección visible con
  `--accent` y texto “1–5” siempre legible. No un slider.
- Comentarios: textarea 3–5 líneas, máximo definido, contador.
- Total calculado en vivo, pero el servidor es la fuente de verdad.
- Acciones: “Guardar borrador” (secundario), “Enviar evaluación” (primario).
- Al enviar: modal de confirmación que resume el puntaje y advierte que no se
  podrá editar.
- Estados: borrador, enviada, evaluada. Una evaluación enviada es solo lectura.
- Si el evaluador no es el usuario, mostrar banner “Solo lectura” y ocultar
  acciones.

## 9. Documentos y carga de archivos

- Header con acción “Subir documento”.
- Filtros por tipo, estado y persona/empresa.
- Tabla: nombre, tipo, vinculado a, estado, actualizado, acciones.
- Uploader en modal o drawer de 480px:
  - Dropzone + botón.
  - Lista de archivos con progreso individual y “Reintentar” en error.
  - Validación de tipo/tamaño antes de subir y mensaje claro.
  - Al terminar, cada archivo muestra estado “En revisión”.
- Nunca muestres un archivo subido como HTML/SVG inline. Descarga con
  `Content-Disposition` desde el servidor.
- Vista previa de PDF: en producción, el servidor debe servir el archivo con
  cabeceras seguras. En la demostración local sin servidor de archivos se usa
  un `blob:` de corta vida, revocado al cerrar, con `frame-src 'self' blob:`.
  El iframe lleva `title`; no uses `srcdoc`, `data:` ni HTML del archivo. El
  visor nativo de Chromium no se monta dentro de un iframe con `sandbox`, así
  que esa excepción se documenta en el ADR correspondiente. Si el navegador no
  muestra el PDF, ofrece “Abrir en pestaña” y “Descargar”.
- Acciones destructivas “Eliminar documento” con confirmación y motivo si el
  documento está aprobado.

## 10. Reportes

- Filtros: periodo, empresa, carrera, estado, tutor.
- Acciones: “Generar reporte” (primario) y “Exportar CSV” (secundario).
- Resultado: resumen de 2–4 KPIs + tabla paginada + gráfico solo si aporta.
- Gráficos: SVG/HTML, sin librerías pesadas; barras o líneas, sin 3D, sin
  gradientes, grid `--border-color`, etiquetas legibles, leyenda si hay >1 serie.
- Exportación:
  - Indicar formato, rango y número de filas antes de generar.
  - Descarga con nombre `reporte-practicantes-2026-03.csv`.
  - Si tarda, estado de progreso y opción de cancelar.
- Sin resultados: explicar el rango y ofrecer ampliarlo.
- Nunca incluyas datos personales innecesarios en el reporte; usa las columnas
  mínimas.

## 11. Configuración

Secciones:

1. **Perfil**: nombre, correo (solo lectura si lo gestiona el SSO), teléfono,
   foto. Guardar cambios.
2. **Seguridad**: cambiar contraseña, MFA, sesiones activas, cerrar todas las
   sesiones. Acciones sensibles con reautenticación.
3. **Notificaciones**: checkboxes por evento y canal. Guardado inmediato con
   toast; no un botón “Guardar” para toggles.
4. **Organización** (solo admin): datos de la empresa/institución, dominios
   permitidos, roles.
5. **Zona de peligro**: desactivar cuenta/organización; requiere escribir el
   nombre y confirmar. Texto explícito de consecuencias.

## 12. Estados de error y permisos

| Código | Qué muestra |
| --- | --- |
| 401 | Redirige a login conservando `next` solo si es ruta interna |
| 403 | “No tienes acceso a esta sección”, acción “Volver al panel” |
| 404 | “No encontramos esta página”, búsqueda o volver |
| 500 | “Algo salió mal de nuestro lado”, ID de referencia, “Reintentar” |
| Sin conexión | Banner persistente “Sin conexión. Reintentando…”, sin bloquear lectura |

Reglas:

- Nunca muestres stack traces, rutas internas, IDs de base de datos ni nombres
  de tablas.
- El 500 incluye un ID de correlación corto para soporte.
- Los errores de permisos no revelan si el recurso existe.
- Un 403 no ofrece “Reintentar” si es de permisos.

## 13. Responsive

| Rango | Cambios |
| --- | --- |
| ≥1280 | Sidebar fija, grid completo, 4 KPIs, tabla con todas las columnas |
| 1024–1279 | Sidebar fija, 2 KPIs por fila, aside 1/3 |
| 768–1023 | Sidebar drawer, contenido full width, aside debajo, filtros en drawer |
| <768 | Una columna, tabla con scroll horizontal, acciones en menú, modales full width |

- En móvil, el botón primario de una página puede ser sticky al pie.
- Las tablas no se convierten en cards automáticamente; decide por tabla y
  documenta la decisión.
- Nunca ocultes una columna crítica (estado, nombre, acciones) en móvil.
- Prueba a 320px de ancho y con zoom 200%.

## 14. Matriz de estados por pantalla

Toda pantalla con datos debe definir:

| Estado | Implementación |
| --- | --- |
| Cargando | Skeleton con la estructura real; nunca spinner de página completa |
| Vacío | Icono + título + explicación + acción |
| Sin resultados | Explicación + limpiar filtros |
| Error | Alert + reintentar; conservar filtros y datos previos |
| Parcial | Banner “Algunos datos no se pudieron cargar” + reintentar sección |
| Sin permiso | 403 o vista de solo lectura, sin acciones |
| Éxito | Toast + actualización local o refetch silencioso |

Ninguna pantalla se entrega sin al menos carga, vacío y error.
