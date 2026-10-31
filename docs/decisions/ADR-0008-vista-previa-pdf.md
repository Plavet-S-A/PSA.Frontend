# ADR-0008: Vista previa local de PDF en el expediente documental

- **Estado:** aceptado
- **Fecha:** 2026-10-30
- **Decisores:** Equipo PSA
- **Referencias:** `src/components/organisms/DocumentPdfViewer.tsx`,
  `src/lib/storage/document-files.ts`,
  `src/lib/documentos/preview-pdf.ts`,
  `src/components/organisms/ResourceDetailDialog.tsx`, `astro.config.mjs`,
  `scripts/check-csp.mjs`

## Contexto

El módulo de documentación solo guardaba los metadatos de cada entrega. Al
pulsar «Ver» se abría una ficha con tipo, estado y ruta de referencia, pero el
PDF no se mostraba. La demostración no tiene servidor de archivos ni URLs
firmadas, así que no era posible usar una vista previa remota.

La vista previa debía cumplir tres condiciones: mostrar el PDF dentro de la
interfaz, no introducir una librería de renderizado pesada y no debilitar la CSP
ni ejecutar HTML del archivo subido.

## Decisión

1. **Persistencia local del binario.** Los PDF cargados por el estudiante se
   guardan en IndexedDB (`psa-documentos`, almacén `archivos`) con la misma
   llave de la fila. Si IndexedDB no está disponible, se conserva una copia en
   memoria para la sesión actual. Al eliminar la fila se elimina el blob.
2. **Respaldo de demostración.** Las filas de ejemplo y las altas
   administrativas no tienen binario. `createDocumentPreviewPdf` genera un PDF
   válido de una página con los metadatos del expediente para que el visor
   nunca quede vacío.
3. **Visor nativo en un iframe.** El componente `DocumentPdfViewer` crea un
   `blob:` URL de corta vida, lo asigna a un `<iframe>` con `title` y lo revoca
   al desmontar. El PDF lo renderiza el visor del navegador; no se usa
   `object`/`embed`, `srcdoc`, `data:` ni `innerHTML`. El atributo `sandbox` se
   omite a propósito: Chromium no monta su visor de PDF dentro de un iframe
   sandboxeado (el `contentDocument` queda nulo). El contenido es un PDF, no
   HTML, y el blob se genera en el propio origen.
4. **CSP explícita.** Se añade `frame-src 'self' blob:` y se conserva
   `object-src 'none'`. `scripts/check-csp.mjs` verifica ambas condiciones en
   producción.
5. **Sin dependencias nuevas.** No se incorpora PDF.js ni otro motor de
   renderizado: el costo de JavaScript se mantiene en el presupuesto y el
   navegador aporta la paginación, el zoom y la descarga.

## Consecuencias

- La vista previa funciona sin servidor de archivos y sin subir información
  fuera del navegador.
- El archivo persiste entre recargas en el mismo perfil; no se comparte entre
  navegadores ni dispositivos, algo aceptable para la demostración.
- En producción, el blob local debe sustituirse por una URL firmada servida con
  cabeceras seguras. La interfaz ya está encapsulada en un solo componente.
- Los navegadores sin visor de PDF integrado muestran las acciones «Abrir en
  pestaña» y «Descargar» como respaldo.
- La CSP sigue sin permitir objetos incrustados y el iframe solo acepta
  documentos generados por la propia aplicación.
