# ADR-0004: Plantillas y documentos de calificación en el cliente

- **Estado:** aceptado
- **Fecha:** 2026-10-27
- **Decisores:** Equipo PSA
- **Referencias:** `src/lib/grading/`, `src/lib/storage/grading-store.ts`,
  `src/components/organisms/EvaluationGradingPanel.tsx`,
  `src/components/organisms/GradeDocumentDialog.tsx`,
  `src/components/organisms/TemplateManagerDialog.tsx`

## Contexto

Evaluación necesitaba emitir constancias y reportes de calificación sin depender
todavía de un backend de documentos. El personal debe poder crear una plantilla,
importar el texto de un documento existente, generar un documento por estudiante,
ajustarlo, guardarlo en el navegador y descargarlo.

Los archivos importados son contenido no confiable. Renderizar su HTML, SVG o
macros abriría una vía de XSS y rompería la CSP estricta del proyecto.

## Decisión

1. Las plantillas viven en `localStorage['psa:grading:templates']` y los
   documentos generados en `localStorage['psa:grading:documents']`. Se validan
   al cargar y se siembran dos plantillas iniciales.
2. Una plantilla tiene nombre, título, cuerpo, pie, origen y fecha. El cuerpo
   admite marcadores `{{estudiante}}`, `{{taller}}`, `{{plaza}}`,
   `{{calificacion}}`, `{{estado}}` y `{{fecha}}`; el motor solo sustituye
   texto y nunca interpreta HTML.
3. La importación acepta `.docx`, `.html`, `.htm`, `.txt` y `.md`. El HTML se
   convierte a texto, el `.docx` se lee extrayendo `word/document.xml` con
   `DecompressionStream`, y se descartan macros, scripts, estilos y recursos
   externos. Hay límites de 2 MB por archivo, 12 000 caracteres de cuerpo y 4 MB
   de XML descomprimido.
4. El documento se edita en un formulario Solid y se previsualiza con nodos de
   texto. No se usa `innerHTML` ni `set:html`.
5. La descarga genera un HTML autónomo con contenido escapado, colores del
   sistema, sin scripts ni recursos externos. El nombre del archivo se
   normaliza y se descarga como `Blob` local.
6. Las acciones de plantillas y documentos dependen de `canGrade`. Supervisión
   y vinculación no capturan calificaciones ni generan documentos.

## Consecuencias

### Positivas

- El flujo completo de plantilla a documento descargable funciona sin backend.
- El contenido importado nunca se ejecuta ni se inserta como HTML.
- La CSP estricta y la política de escapes de Solid se mantienen.
- Los documentos guardados sobreviven a la recarga y a la eliminación de la
  plantilla original.

### Negativas o costo

- Los documentos son locales al navegador; no hay colaboración ni respaldo.
- La extracción de `.docx` no conserva formato, tablas ni imágenes.
- El texto importado requiere revisión humana antes de guardarse.
- El `Blob` de descarga se genera en el cliente; en equipos muy limitados
  podría tardar con documentos largos.

### Riesgos y mitigación

- **Zip bomb o XML gigante:** se rechazan tamaños por encima de los límites y se
  corta la descompresión al máximo permitido.
- **HTML malicioso:** se descartan scripts, estilos, objetos, formularios y
  recursos; solo se conserva texto.
- **Pérdida de la plantilla:** el documento guardado conserva su contenido y
  sigue siendo editable aunque la plantilla ya no exista.
- **Datos manipulados:** la API real deberá validar y autorizar la emisión y
  descarga de documentos.

## Alternativas consideradas

| Alternativa | Por qué no |
| --- | --- |
| Renderizar el HTML importado | Abre XSS y exige relajar la CSP |
| Guardar el `.docx` original y editarlo en el navegador | Requiere una librería pesada y conserva macros |
| Generar PDF en el servidor | No hay backend de documentos en esta etapa |
| Guardar en IndexedDB | La API asíncrona no aporta ventaja para registros pequeños |

## Cómo se verifica

- `bun run check` valida contratos y tipos de plantillas y documentos.
- `bun run build`, `bun run check:csp` y `bun run budget` confirman que la
  descarga y los formularios no introducen scripts inline ni exceden el bundle.
- La verificación CDP crea una plantilla, genera y edita un documento, lo
  recarga y descarga el HTML resultante.
- `audit-ui.mjs` y `check-architecture.mjs` revisan la separación de capas.

## Notas de migración

Cuando exista el servicio de documentos:

1. Sustituir `grading-store` por endpoints autenticados de plantillas y
   documentos.
2. Mover la validación de tamaño, tipo y contenido al servidor.
3. Emitir el documento en el formato institucional definitivo y firmar la
   descarga.
4. Mantener la previsualización como texto escapado o usar un renderizador
   seguro con CSP.
