/**
 * Archivos PDF del expediente documental.
 *
 * Capa: lib/storage
 * IndexedDB conserva los blobs entre recargas. Si el navegador no la permite,
 * un mapa en memoria mantiene la vista previa durante la sesión actual.
 * Ningún archivo se envía al servidor: la demostración trabaja solo en el
 * navegador y la API real deberá sustituir este módulo por URLs firmadas.
 */

const DATABASE_NAME = 'psa-documentos';
const DATABASE_VERSION = 1;
const STORE_NAME = 'archivos';

interface StoredDocumentFile {
  /** Identificador de la fila del documento. */
  id: string;
  /** Contenido binario del PDF. */
  blob: Blob;
  /** Nombre original del archivo. */
  name: string;
  /** Tipo MIME declarado por el navegador. */
  type: string;
  /** Tamaño en bytes. */
  size: number;
  /** Momento de la última escritura. */
  updatedAt: string;
}

const memoryFiles = new Map<string, Blob>();
let databasePromise: Promise<IDBDatabase | null> | undefined;

/** Comprueba que el archivo sea un PDF por tipo MIME o extensión. */
function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/** Abre la base local una sola vez; devuelve null si no está disponible. */
function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve) => {
    let settled = false;
    const finish = (database: IDBDatabase | null) => {
      if (settled) return;
      settled = true;
      resolve(database);
    };

    try {
      const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => finish(request.result);
      request.onerror = () => finish(null);
      request.onblocked = () => finish(null);
    } catch {
      finish(null);
    }
  });

  return databasePromise;
}

/**
 * Guarda el PDF de una entrega.
 *
 * @param id Identificador de la fila del documento.
 * @param file Archivo validado por el formulario de carga.
 * @returns true si el archivo queda disponible para la vista previa.
 */
export async function saveDocumentFile(id: string, file: File): Promise<boolean> {
  if (!isPdf(file)) return false;

  // La copia en memoria garantiza la vista previa aunque IndexedDB falle.
  memoryFiles.set(id, file);

  const database = await openDatabase();
  if (!database) return true;

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const stored: StoredDocumentFile = {
        id,
        blob: file,
        name: file.name,
        type: file.type,
        size: file.size,
        updatedAt: new Date().toISOString(),
      };
      transaction.objectStore(STORE_NAME).put(stored);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch {
    // El mapa en memoria sigue disponible para esta sesión.
  }

  return true;
}

/**
 * Recupera el PDF de una entrega.
 *
 * @param id Identificador de la fila del documento.
 * @returns Blob del archivo o null cuando no existe en este navegador.
 */
export async function loadDocumentFile(id: string): Promise<Blob | null> {
  const memoryFile = memoryFiles.get(id);
  if (memoryFile) return memoryFile;

  const database = await openDatabase();
  if (!database) return null;

  return new Promise((resolve) => {
    try {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        const stored = request.result as StoredDocumentFile | undefined;
        resolve(stored?.blob instanceof Blob ? stored.blob : null);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Elimina el PDF asociado a una entrega.
 *
 * @param id Identificador de la fila del documento.
 */
export async function deleteDocumentFile(id: string): Promise<void> {
  memoryFiles.delete(id);

  const database = await openDatabase();
  if (!database) return;

  await new Promise<void>((resolve) => {
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}
