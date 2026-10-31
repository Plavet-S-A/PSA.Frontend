/**
 * Extracción de texto de archivos .docx en el navegador.
 *
 * Capa: lib/grading
 * Lee el ZIP de Office con la API nativa DecompressionStream y convierte
 * word/document.xml a texto plano. No interpreta HTML ni macros: solo extrae
 * párrafos para convertirlos en una plantilla editable.
 */

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const MAX_XML_BYTES = 4 * 1024 * 1024;
const DECODER = new TextDecoder('utf-8');

interface ZipEntry {
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localOffset: number;
}

function findEndOfCentralDirectory(view: DataView): number {
  const minimum = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let offset = view.byteLength - 22; offset >= minimum; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }
  return -1;
}

function findDocumentEntry(buffer: ArrayBuffer): ZipEntry {
  const view = new DataView(buffer);
  const eocd = findEndOfCentralDirectory(view);
  if (eocd < 0) throw new Error('El archivo no es un documento .docx válido.');

  const entries = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);

  for (let index = 0; index < entries; index += 1) {
    if (offset + 46 > view.byteLength) break;
    if (view.getUint32(offset, true) !== CENTRAL_SIGNATURE) break;

    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const nameStart = offset + 46;

    if (nameStart + nameLength > view.byteLength) break;
    const name = DECODER.decode(new Uint8Array(buffer, nameStart, nameLength));

    if (name === 'word/document.xml') {
      return { method, compressedSize, uncompressedSize, localOffset };
    }

    offset = nameStart + nameLength + extraLength + commentLength;
  }

  throw new Error('El archivo .docx no contiene word/document.xml.');
}

async function readLimited(
  stream: ReadableStream<Uint8Array>,
  limit: number,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      total += result.value.byteLength;
      if (total > limit) {
        await reader.cancel();
        throw new Error('El contenido del .docx es demasiado grande.');
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  const output = new Uint8Array(total);
  let position = 0;
  for (const chunk of chunks) {
    output.set(chunk, position);
    position += chunk.byteLength;
  }
  return output;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Este navegador no puede leer .docx. Sube la plantilla en .html o .txt.');
  }
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const stream = new Blob([copy.buffer]).stream().pipeThrough(
    new DecompressionStream('deflate-raw'),
  );
  return readLimited(stream, MAX_XML_BYTES);
}

function paragraphText(paragraph: Element): string {
  let text = '';

  const visit = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    const localName = element.localName;

    if (localName === 't') {
      text += element.textContent ?? '';
      return;
    }
    if (localName === 'tab') {
      text += '\t';
      return;
    }
    if (localName === 'br' || localName === 'cr') {
      text += '\n';
      return;
    }
    for (const child of Array.from(element.childNodes)) visit(child);
  };

  for (const child of Array.from(paragraph.childNodes)) visit(child);
  return text.replace(/[ \t]+$/g, '').trimEnd();
}

/**
 * Extrae el texto de los párrafos de un archivo .docx.
 *
 * @param buffer Contenido binario del archivo.
 * @returns Texto plano con un salto por párrafo.
 */
export async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const entry = findDocumentEntry(buffer);
  if (entry.uncompressedSize > MAX_XML_BYTES) {
    throw new Error('El contenido del .docx es demasiado grande.');
  }
  if (entry.compressedSize === 0 || entry.localOffset + 30 > buffer.byteLength) {
    throw new Error('El archivo .docx está incompleto.');
  }

  const view = new DataView(buffer);
  if (view.getUint32(entry.localOffset, true) !== LOCAL_SIGNATURE) {
    throw new Error('El archivo .docx tiene un encabezado inválido.');
  }

  const nameLength = view.getUint16(entry.localOffset + 26, true);
  const extraLength = view.getUint16(entry.localOffset + 28, true);
  const dataStart = entry.localOffset + 30 + nameLength + extraLength;
  const dataEnd = dataStart + entry.compressedSize;
  if (dataEnd > buffer.byteLength) throw new Error('El archivo .docx está incompleto.');

  const compressed = new Uint8Array(buffer, dataStart, entry.compressedSize);
  let xmlBytes: Uint8Array;
  if (entry.method === 0) {
    xmlBytes = compressed;
  } else if (entry.method === 8) {
    xmlBytes = await inflateRaw(compressed);
  } else {
    throw new Error('El método de compresión del .docx no es compatible.');
  }

  const xml = DECODER.decode(xmlBytes);
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror')) {
    throw new Error('No se pudo interpretar el contenido del .docx.');
  }

  const paragraphs = Array.from(document.getElementsByTagNameNS('*', 'p'));
  const text = paragraphs
    .map((paragraph) => paragraphText(paragraph))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (text === '') throw new Error('El .docx no contiene texto legible.');
  return text;
}
