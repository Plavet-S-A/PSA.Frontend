/**
 * Medición y codificación de texto para los PDF de reportes.
 *
 * Capa: lib/reportes
 * Traduce UTF-8 a WinAnsi y calcula anchos aproximados de Helvetica para
 * partir líneas sin depender del DOM ni de una librería de fuentes.
 */

/** Mapa de caracteres tipográficos que WinAnsi coloca fuera de Latin-1. */
const WIN_ANSI: Record<string, number> = {
  '€': 0x80,
  '…': 0x85,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '¡': 0xa1,
  '«': 0xab,
  '»': 0xbb,
  '¿': 0xbf,
};

/**
 * Convierte texto UTF-8 a una cadena de bytes WinAnsi escapada para PDF.
 *
 * @param text Texto visible sin saltos de línea.
 * @returns Cadena con escapes de paréntesis y barras invertidas.
 */
export function encodeText(text: string): string {
  let output = '';
  for (const char of text) {
    const code = char.codePointAt(0) ?? 63;
    if (char === '\\') output += '\\\\';
    else if (char === '(') output += '\\(';
    else if (char === ')') output += '\\)';
    else if (code >= 32 && code <= 126) output += char;
    else if (WIN_ANSI[char] !== undefined) output += String.fromCharCode(WIN_ANSI[char]);
    else if (code >= 0xa0 && code <= 0xff) output += char;
    else output += '?';
  }
  return output;
}

/** Ancho aproximado de un carácter de Helvetica, en milésimas de em. */
function charWidth(char: string): number {
  if (char === ' ') return 278;
  if (/[ilI.,:;'!|]/.test(char)) return 260;
  if (/[mwMW]/.test(char)) return 850;
  if (/[A-ZÁÉÍÓÚÑÜ]/.test(char)) return 680;
  if (/[0-9]/.test(char)) return 556;
  if (/[áéíóúñü]/.test(char)) return 540;
  return 530;
}

/** Ancho estimado de un texto para una fuente Helvetica. */
export function textWidth(text: string, size: number, bold = false): number {
  let total = 0;
  for (const char of text) total += charWidth(char);
  return (total / 1000) * size * (bold ? 1.035 : 1);
}

/** Normaliza texto de una sola línea para imprimir. */
export function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Recorta un texto para que quepa en un ancho, con elipsis si hace falta. */
export function truncateText(
  text: string,
  maxWidth: number,
  size: number,
  bold = false,
): string {
  const clean = cleanText(text);
  if (textWidth(clean, size, bold) <= maxWidth) return clean;
  let result = clean;
  while (result.length > 1 && textWidth(`${result}…`, size, bold) > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result.trimEnd()}…`;
}

/**
 * Divide un texto en líneas que caben en un ancho dado.
 *
 * @param text Texto visible.
 * @param maxWidth Ancho disponible en puntos.
 * @param size Tamaño de fuente.
 * @param bold Indica si se usa Helvetica-Bold.
 * @param maxLines Límite de líneas; la última termina en elipsis.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  size: number,
  bold = false,
  maxLines = Number.POSITIVE_INFINITY,
): string[] {
  const words = cleanText(text).split(' ').filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = '';

  const pushWord = (word: string) => {
    if (lines.length >= maxLines) return;
    let remaining = word;
    while (remaining.length > 0 && lines.length < maxLines) {
      const candidate = current ? `${current} ${remaining}` : remaining;
      if (textWidth(candidate, size, bold) <= maxWidth) {
        current = candidate;
        remaining = '';
        break;
      }
      if (current) {
        lines.push(current);
        current = '';
        continue;
      }
      let cut = remaining.length;
      while (cut > 1 && textWidth(remaining.slice(0, cut), size, bold) > maxWidth) {
        cut -= 1;
      }
      lines.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut);
    }
  };

  for (const word of words) pushWord(word);
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length >= maxLines) {
    const last = lines[maxLines - 1] ?? '';
    if (last && textWidth(last, size, bold) > maxWidth) {
      lines[maxLines - 1] = truncateText(last, maxWidth, size, bold);
    } else if (lines.join(' ').length < cleanText(text).length) {
      lines[maxLines - 1] = `${last}…`;
    }
  }
  return lines.length > 0 ? lines : [''];
}
