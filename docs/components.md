# Catálogo de componentes

Actualiza este documento al crear, renombrar o retirar un organismo, template o
layout. Los átomos y moléculas se documentan en su docblock; aquí se incluyen
solo los contratos compartidos por más de un dominio.

## Organismos

| Componente | Dominio | Propósito | Props principales | Usado en |
| --- | --- | --- | --- | --- |
| `AppSidebar` | shell | Navegación principal, identidad y cierre de sesión; los módulos únicos son enlaces directos y las secciones con varios módulos solo se pliegan cuando el menú no cabe (máximo tres abiertas, ajustadas al alto disponible), con contexto inicial por rol | `user`, `currentPath` | `AppLayout` |
| `AppTopbar` | shell | Ruta actual, menú móvil, colapso del sidebar y cambio de tema | `title` | `AppLayout` |
| `PageHeader` | shell | Título, descripción, conteo y acciones de la pantalla | `title`, `description`, `count`; slot `default` | `ListPageTemplate` |
| `LoginForm` | auth | Formulario de acceso con credencial numérica y redirección segura | Ninguna | `iniciar-sesion.astro` |
| `ResourceManager` | módulos | Isla CRUD: búsqueda, filtros combinables declarados en `config.filters` más el filtro de estado, tabla, paginación, detalle, alta, edición, borrado e importación cuando `config.importConfig` existe; `readOnly` conserva la consulta y oculta las mutaciones | `config`, `initialRows`, `readOnly` | Catálogos de gestión |
| `ResourceTable` | módulos | Tabla accesible con columnas declarativas y acciones por fila; el detalle se mantiene en modo consulta | `config`, `rows`, `onDetail`, `onEdit`, `onDelete` | `ResourceManager`, `DocumentStudentPanel` y `PlazaDetail` |
| `ResourceDetailDialog` | módulos | Consulta de una fila con `detailFields` ordenados por sección, etiquetas, formato por tipo, contenido destacado y edición opcional; oculta llaves internas `id` e `id_*` | `open`, `config`, `row`, `size`, `onClose`, `onEdit`, `preview` | `ResourceManager`, documentación, espacios de trabajo y evaluación |
| `ResourceFormDialog` | módulos | Alta y edición con validación, foco en el primer error, errores de guardado inline, modal, campos `textarea`, etiqueta de envío, descripción e identificadores propios configurables | `open`, `config`, `row`, `onClose`, `onSave`, `submitLabel?`, `description?`, `idPrefix?`, `error?` | `ResourceManager`, espacios de trabajo, plazas y excusas del estudiante |
| `ResourceImportDialog` | módulos | Lee CSV/XLSX en el navegador, mapea encabezados, muestra vista previa y errores, descarga plantilla y confirma la importación | `open`, `config`, `existingRows`, `onClose`, `onImport` | `ResourceManager` |
| `DocumentWorkspace` | documentación | Navegación por taller → estudiante, edición y eliminación de documentos con alcance por rol; la carga de PDF queda en Mis documentos y, con un solo taller, entra directo al detalle | `initialRows`, `canManage`, `talleres`, `roleLabel`, `guidance` | `documentacion.astro` |
| `DocumentStudentPanel` | documentación | Detalle de documentos de un estudiante con breadcrumb, vista previa del PDF, edición, revisión y regreso a estudiantes alineado a la derecha; oculta la raíz cuando no hay lista de talleres | `taller`, `estudiante`, `documentos`, `pendientes`, `canManage`, `onRoot?`, callbacks | `DocumentWorkspace` |
| `PlazaWorkspace` | plazas | Lista maestra de talleres y persistencia de plazas con alcance por rol; con un solo taller entra directo al detalle y conserva el resto del catálogo en escrituras parciales | `initialRows`, `canManage`, `canRequest`, `requesterName`, `partialSave`, `talleres`, `roleLabel`, `guidance` | `plazas.astro` |
| `PlazaDetail` | plazas | Plazas de un taller con búsqueda, filtro, CRUD y modo consulta; tutoría empresarial solicita plazas con sus características y quedan en revisión | `taller`, `rows`, `canManage`, `canRequest`, `requesterName`, `onPersistRows`, `onBack?` | `PlazaWorkspace` |
| `PlazaRequestDialog` | plazas | Solicitud de plaza con las características del catálogo, centro precargado y estado fijado en revisión | `open`, `taller`, `center`, `onClose`, `onSubmit` | `PlazaDetail` |
| `EvaluationWorkspace` | evaluación | Navegación por taller y persistencia de calificaciones; conserva el resto del módulo en escrituras parciales y con un solo taller entra directo al detalle | `initialRows`, `canGrade`, `talleres`, `roleLabel`, `guidance`, `partialSave?` | `evaluacion.astro` |
| `ExcusesReview` | excusas | Bandeja de revisión con filtros por estado; vinculación y tutoría académica ven todas las excusas y solo se resuelven las del destino permitido; registra revisor y fecha | `initialRows`, `canReview`, `scope`, `reviewScope`, `reviewerName` | `excusas.astro` |
| `StudentDocuments` | documentación | Expediente propio: lista entregas, abre la vista previa del PDF y la carga validada; comparte la persistencia del módulo de documentación | `initialRows`, `studentName`, `studentCode`, `taller`, `tallerCode`, `tipos` | `mis-documentos.astro` |
| `DocumentPdfViewer` | documentación | Vista previa embebida de un PDF con carga desde IndexedDB, PDF de demostración cuando no hay archivo local y acciones de abrir/descargar | `row` | `DocumentStudentPanel` y `StudentDocuments` |
| `StudentDocumentDialog` | documentación | Alta de documento con tipo, fecha, PDF obligatorio y límite de 5 MB; el archivo se persiste en IndexedDB | `open`, `tipos`, `onSubmit`, `onClose` | `StudentDocuments` |
| `StudentExcuses` | excusas | Envío de excusas propias con formulario sin estado, listado y ficha de seguimiento | `initialRows`, `studentName` | `mis-excusas.astro` |
| `ReportesWorkspace` | reportes | Métricas agregadas de estudiantes, plazas, evaluaciones, documentación y proceso con descarga en PDF | Ninguno | `reportes.astro` |
| `EvaluationGradingPanel` | evaluación | Calificaciones, plantillas y documentos de un taller; oculta el regreso cuando no hay lista de talleres | `taller`, `rows`, `canGrade`, `onPersistRows`, `onBack?` | `EvaluationWorkspace` |
| `TemplateManagerDialog` | evaluación | Alta, importación, edición y borrado de plantillas | `open`, `templates`, `onClose`, `onSave`, `onDelete` | `EvaluationGradingPanel` |
| `TemplateEditorForm` | evaluación | Formulario de plantilla con inserción de marcadores | `formId`, valores, errores, cambios y `onSubmit` | `TemplateManagerDialog` |
| `GradeDocumentDialog` | evaluación | Genera, previsualiza, guarda y descarga el documento de una evaluación | `open`, `row`, `templates`, `saved`, `onClose`, `onSave`, `onManageTemplates` | `EvaluationGradingPanel` |
| `GradeDocumentEditor` | evaluación | Campos editables del documento: plantilla, título, cuerpo y firma | `formId`, `templates`, valores, errores, cambios y `onSubmit` | `GradeDocumentDialog` |

## Templates

| Componente | Dominio | Propósito | Props principales | Usado en |
| --- | --- | --- | --- | --- |
| `ListPageTemplate` | shell | Encabezado común de una página de lista y slot para la isla | `title`, `description`, `count`; slot `default` | Páginas de módulos y del estudiante |

## Layouts

| Componente | Dominio | Propósito | Props principales | Usado en |
| --- | --- | --- | --- | --- |
| `AuthLayout` | auth | Shell público con marca, tema, tarjeta y pie | `title`, `description`; slot `default` | `iniciar-sesion.astro` |
| `AppLayout` | shell | Shell privado con sidebar colapsable, topbar, drawer móvil y contenido | `user`, `title`, `currentPath`, `description` | `panel.astro` y las páginas de módulos |

## Átomos y moléculas compartidos

| Componente | Capa | Propósito | Nota de contrato |
| --- | --- | --- | --- |
| `Button` | atom | Acción con variantes visuales y tamaños | Variante `.astro` y `.tsx`; en Solid se importa sin extensión |
| `Icon` | atom | Icono SVG del catálogo interno | `name`, `size`; sin dependencias externas |
| `Badge` | atom | Estado o etiqueta corta | Tono derivado de `statusTone()` |
| `Brand` | atom | Marca PSA con enlace opcional | `href`, `compact` |
| `ThemeInit` | atom | Aplica el tema antes del primer pintado | Carga `public/theme-init.js`; sin hash inline |
| `SidebarInit` | atom | Aplica el sidebar compacto antes del primer pintado | Carga `public/sidebar-init.js`; solo lee `psa-sidebar` |
| `ThemeToggle` | atom | Alterna y persiste tema claro/oscuro | Solo escribe `psa-theme` en `localStorage` |
| `Alert` | molecule | Mensaje de error, éxito o información | `tone`, `children` |
| `FormField` | molecule | Campo etiquetado con ayuda y error | `type` incluye `password`; error con `aria-describedby` |
| `Modal` | molecule | Diálogo nativo de la plataforma con foco atrapado y cierre por Escape | `open`, `title`, `description`, `size`, `onClose`, `children`, `footer` |
| `ConfirmDialog` | molecule | Confirmación destructiva sobre `Modal` | `open`, `title`, `description`, `confirmLabel`, `onConfirm`, `onClose` |
| `Pagination` | molecule | Navegación entre páginas de la tabla | `page`, `pageCount`, `onPageChange` |
| `ResourceToolbar` | molecule | Búsqueda, botón de filtros combinables, chips activos por valor en orden alfabético, limpiar, importación opcional y alta | Contrato completo en su docblock |
| `FiltersDialog` | molecule | Selección combinada de los filtros de la tabla con borrador y aplicación explícita | `open`, `filters`, `values`, `onApply`, `onClose` |
| `FilterField` | molecule | Controles de un filtro: lista con casillas, opciones booleanas con radio o buscador de opciones | `filter`, `selected`, `search`, `prefix`, `open`, `focusOnOpen`, `onSearchChange`, `onToggle`, `onSelectSingle` |
| `ActiveFilters` | molecule | Chips de filtros activos ordenados por etiqueta y valor, con remoción individual | `filters`, `values`, `onRemove` |
| `Toast` | molecule | Confirmación efímera de una acción | `message`, `tone`, `onDismiss` |
| `EmptyState` | molecule | Estado vacío de tabla o búsqueda | `title`, `description`, `actionLabel`, `onAction`, `icon` |
| `StatCard` | molecule | Indicador del panel | `label`, `value`, `meta`, `icon` |
| `TallerMasterList` | molecule | Lista maestra de talleres con conteo, aviso y selección; se pliega sin perder el disparador | `id`, `hidden`, `items`, `selected`, `onSelect` |
| `WorkspaceMasterToggle` | molecule | Disparador estable para mostrar u ocultar el panel de talleres; conserva posición y ancho | `expanded`, `controls`, `count`, `onToggle` |
| `StudentDocumentationList` | molecule | Estudiantes de un taller con documentos y pendientes | `taller`, `estudiantes`, `onSelect`, `onBack` |
| `PlazaAssignedStudents` | molecule | Estudiantes vinculados que se muestran en la ficha de una plaza | `students` |
| `EvaluationTable` | molecule | Promedios y criterios de un taller con consulta, captura y acceso al documento | `taller`, `items`, `canGrade`, `onGrade`, `onDocument`, `onDetail`, `documentIds` |
| `TextAreaField` | molecule | Campo multilínea con etiqueta, ayuda y error | `id`, `label`, `value`, `onInput`, `rows`, `maxlength` |
| `GradeDocumentPreview` | molecule | Vista previa de solo texto del documento de calificación | `heading`, `body`, `footer`, datos del estudiante y `issuedAt` |
| `TemplateList` | molecule | Listado de plantillas con edición y confirmación de borrado | `templates`, `confirmingId`, `onEdit`, `onDeleteRequest`, `onDeleteCancel`, `onDeleteConfirm` |
| `TemplateManagerToolbar` | molecule | Conteo, importación y alta de plantillas | `count`, `uploading`, `onUpload`, `onCreate` |

## Reglas de mantenimiento

- Una fila por componente y nombre exacto del archivo entre backticks.
- Si cambia un contrato público, actualiza esta tabla y el docblock del archivo.
- Si un organismo supera 300 líneas (máximo duro 450), divídelo antes de añadir
  otra responsabilidad.
- No documentes aquí detalles de estilo que ya estén en
  `.opencode/skills/psa-design-standard/SKILL.md`.
