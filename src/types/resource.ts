/**
 * Contratos genéricos de los módulos de gestión.
 *
 * Capa: types
 * Sin runtime: describen filas, columnas, campos y configuración de cada
 * catálogo. Permiten reutilizar una sola interfaz de administración sin atar
 * los módulos a un dominio concreto.
 */

/** Valor serializable de una celda de recurso. */
export type ResourceValue = string | number;

/** Fila genérica de un módulo; siempre lleva un identificador estable. */
export type ResourceRow = Record<string, ResourceValue> & { id: string };

/** Tipo de control que se renderiza en el formulario. */
export type ResourceFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'select'
  | 'textarea';

/** Definición de un campo editable. */
export interface ResourceField {
  key: string;
  label: string;
  type: ResourceFieldType;
  required?: boolean;
  options?: readonly string[];
  placeholder?: string;
  hint?: string;
  autocomplete?: string;
  /** Ocupa las dos columnas del formulario. */
  wide?: boolean;
  /** Límite inferior para campos numéricos. */
  min?: number;
  /** Límite superior para campos numéricos. */
  max?: number;
  defaultValue?: string;
  /** Altura del textarea cuando `type` es `textarea`. */
  rows?: number;
}

/** Formato de presentación de un atributo de detalle. */
export type ResourceDetailFormat = 'text' | 'status' | 'date' | 'number' | 'mono';

/**
 * Atributo de la ficha de detalle.
 *
 * Permite mostrar columnas del modelo de datos que no se editan en el
 * formulario (llaves foráneas, fechas de creación o metadatos de servidor).
 */
export interface ResourceDetailField {
  key: string;
  label: string;
  format?: ResourceDetailFormat;
  /** Agrupa los atributos bajo un encabezado en el diálogo. */
  section?: string;
  /** Omite el atributo cuando la fila no trae valor. */
  hideWhenEmpty?: boolean;
}

/** Valores serializables que entran o salen de un formulario. */
export type ResourceValues = Record<string, ResourceValue>;

/**
 * Configuración de importación masiva de un módulo.
 *
 * Solo los módulos que declaran esta configuración muestran el botón de
 * importación. El archivo se procesa en el navegador; nunca se sube a un
 * servidor desde la interfaz de demostración.
 */
export interface ResourceImportConfig {
  /** Extensiones aceptadas sin punto, por ejemplo `csv` o `xlsx`. */
  acceptedExtensions: readonly string[];
  /** Nombre sugerido para la plantilla descargable. */
  templateName: string;
  /** Texto del botón de importación. Default: `Importar`. */
  buttonLabel?: string;
  /** Máximo de filas importables en una sola operación. Default: 1000. */
  maxRows?: number;
  /** Encabezados adicionales aceptados por llave de campo. */
  aliases?: Readonly<Record<string, readonly string[]>>;
  /** Llaves que no se pueden repetir entre registros existentes o importados. */
  uniqueKeys?: readonly string[];
}

/**
 * Calcula campos derivados de presentación.
 *
 * Recibe los valores editables y, en edición, la fila completa. El resultado se
 * mezcla con la fila antes de persistir. Sirve para componer nombres, etiquetas
 * de relaciones o llaves foráneas a partir de los campos visibles.
 */
export type ResourceDeriveRow = (
  values: ResourceValues,
  current?: ResourceRow,
) => ResourceValues;

/** Formato de presentación de una columna. */
export type ResourceColumnFormat = 'text' | 'status' | 'mono' | 'number';

/** Definición de una columna de tabla. */
export interface ResourceColumn {
  key: string;
  label: string;
  format?: ResourceColumnFormat;
  /** Segunda línea de la celda principal (por ejemplo, correo). */
  secondaryKey?: string;
  align?: 'left' | 'right';
  /** Se oculta en pantallas angostas; nunca debe ser estado ni acciones. */
  optional?: boolean;
}

/** Tipo de control de un filtro dentro del diálogo. */
export type ResourceFilterType = 'multi' | 'boolean';

/** Filtro de una columna del catálogo. */
export interface ResourceFilter {
  /** Campo de la fila por el que se filtra. */
  key: string;
  /** Etiqueta visible del filtro. */
  label: string;
  /** Texto mostrado cuando el filtro no tiene selección. */
  allLabel: string;
  /**
   * Valores disponibles.
   * En filtros booleanos, la primera opción es la afirmativa y la segunda la
   * negativa; el valor de la fila define cuál aplica.
   */
  options: readonly string[];
  /** Tipo de control. Default: 'multi'. */
  type?: ResourceFilterType;
  /** Muestra un buscador dentro del diálogo para localizar opciones. */
  searchable?: boolean;
}

/** Valores activos por llave de filtro; un arreglo vacío significa sin filtrar. */
export type ResourceFilterValues = Record<string, string[]>;

/** Configuración completa de un módulo de gestión. */
export interface ResourceConfig {
  /** Identificador usado también como llave de persistencia local. */
  id: string;
  singular: string;
  plural: string;
  description: string;
  /** Campo que identifica visualmente la fila. */
  primaryKey: string;
  searchKeys: readonly string[];
  searchPlaceholder: string;
  columns: readonly ResourceColumn[];
  fields: readonly ResourceField[];
  /**
   * Atributos de la ficha de detalle, en orden de lectura.
   * Cuando se omite, el diálogo usa las llaves de la fila como respaldo.
   */
  detailFields?: readonly ResourceDetailField[];
  /** Ajusta filas antiguas al esquema actual antes de mostrarlas. */
  normalizeRow?: (row: ResourceRow) => ResourceRow;
  /** Nombre de la función de normalización para resolverla en el cliente (Astro
   * no serializa funciones en los props de las islas). */
  normalizeRowKey?: string;
  /** Campos calculados que no se capturan directamente. */
  deriveRow?: ResourceDeriveRow;
  /** Nombre de la función de derivación para resolverla en el cliente (Astro
   * no serializa funciones en los props de las islas). */
  deriveRowKey?: string;
  /** Habilita la importación desde CSV o Excel para este módulo. */
  importConfig?: ResourceImportConfig;
  /** Filtros contextuales del módulo, además del filtro de estado. */
  filters?: readonly ResourceFilter[];
  statusKey: string;
  statusOptions: readonly string[];
  emptyTitle: string;
  emptyDescription: string;
  createLabel: string;
}
