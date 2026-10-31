/**
 * Contratos de plantillas y documentos de calificación.
 *
 * Capa: types
 * Sin runtime: describen el contenido editable que vive en el navegador
 * mientras no existe la API de documentos.
 */

/** Origen de una plantilla de calificación. */
export type GradeTemplateSource = 'custom' | 'uploaded';

/** Plantilla reutilizable para generar documentos de calificación. */
export interface GradeTemplate {
  /** Identificador estable de la plantilla. */
  id: string;
  /** Nombre interno para reconocerla en el listado. */
  name: string;
  /** Título del documento; admite marcadores. */
  title: string;
  /** Cuerpo principal; admite marcadores. */
  body: string;
  /** Pie o firma; admite marcadores. */
  footer: string;
  /** Indica si se creó en la interfaz o se importó de un archivo. */
  source: GradeTemplateSource;
  /** Nombre del archivo importado, si aplica. */
  fileName?: string;
  /** Última actualización en ISO 8601. */
  updatedAt: string;
}

/** Documento generado para una evaluación concreta. */
export interface GradeDocument {
  /** Identificador estable del documento. */
  id: string;
  /** Evaluación de origen; una evaluación tiene un documento editable. */
  evaluationId: string;
  /** Plantilla usada al generar el documento. */
  templateId: string;
  /** Título editable del documento. */
  heading: string;
  /** Contenido editable del documento. */
  body: string;
  /** Pie o firma editable. */
  footer: string;
  /** Fecha de emisión en formato ISO corto (YYYY-MM-DD). */
  issuedAt: string;
  /** Última edición en ISO 8601. */
  updatedAt: string;
}
