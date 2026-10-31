# ADR-0006: Reportes descargables en PDF sin dependencias

- **Estado:** aceptado
- **Fecha:** 2026-10-28
- **Decisores:** Equipo PSA
- **Referencias:** `src/lib/reportes/reporte-pdf.ts`,
  `src/lib/reportes/reporte-pdf-datos.ts`, `src/lib/reportes/pdf-blocks.ts`,
  `src/lib/reportes/pdf-writer.ts`,
  `src/components/organisms/ReportesWorkspace.tsx`

## Contexto

Los reportes se exportaban como CSV. El uso real es entregar un documento
legible a coordinación, tutores o empresas, no abrir una hoja de cálculo. Añadir
una librería de PDF incrementaría el bundle y la superficie de mantenimiento
para un contenido que es texto y cifras.

## Decisión

Generar el PDF en el navegador con un escritor mínimo propio:

1. `lib/reportes/reporte-pdf.ts` recibe la plantilla, las métricas ya agregadas
   y la fecha de generación, y compone un documento declarativo con portada,
   indicadores, secciones y gráficos.
2. `lib/reportes/pdf-blocks.ts` pagina los bloques y `lib/reportes/pdf-*.ts`
   dibuja tarjetas, barras, encabezados y notas sobre A4 con Helvetica y texto
   WinAnsi (acentos y signos en español).
3. Devuelve un `Uint8Array`; la isla crea el `Blob`, dispara la descarga y
   revoca la URL temporal.
4. La vista previa y el PDF consumen las mismas métricas, de modo que no hay dos
   definiciones de un reporte.
5. Se retira la exportación CSV y el botón anuncia «Descargar reporte PDF».

## Consecuencias

### Positivas

- El archivo se descarga directo, sin diálogo de impresión.
- Cero dependencias nuevas y poco JavaScript adicional.
- El contenido es texto seleccionable y el documento se puede imprimir.
- La codificación cubre el español sin caracteres corruptos.
- El reporte tiene jerarquía visual: portada, indicadores en tarjetas, barras de
  distribución y pie numerado.

### Negativas o costo

- La maquetación es propia: un cambio de diseño exige tocar el compositor y las
  piezas visuales, no una plantilla HTML.
- Los reportes muy largos se parten en páginas por bloques; los gráficos con
  muchas filas continúan con el sufijo «(continuación)».

### Riesgos y mitigación

- **Caracteres fuera de WinAnsi:** se sustituyen por `?`; las etiquetas del
  producto están en español y dentro del conjunto.
- **Navegadores sin descarga de Blob:** el flujo usa APIs estándar; si el
  navegador bloquea la descarga, no se pierde información porque la vista previa
  sigue disponible.
- **Crecimiento del archivo:** el contenido actual genera pocas páginas; si se
  agregan series grandes se debe paginar por sección.

## Alternativas consideradas

| Alternativa | Por qué no |
| --- | --- |
| `window.print()` con hoja de impresión | Requiere que la persona elija «Guardar como PDF» |
| `pdf-lib` u otra librería | Peso y dependencia desproporcionados para texto |
| Generar el PDF en el servidor | No hay backend de negocio en esta etapa |
| Mantener CSV | No es el formato que se entrega ni se lee con facilidad |

## Cómo se verifica

- `bun run check` y `bun run build`.
- Descargar cada plantilla y abrir el archivo con un lector de PDF.
- `pdftotext` sobre el archivo descargado para confirmar acentos, secciones y
  cifras.
- Revisar que el botón y el nombre del archivo terminen en `.pdf`.
