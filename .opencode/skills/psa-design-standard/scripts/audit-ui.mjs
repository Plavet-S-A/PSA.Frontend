#!/usr/bin/env node
/**
 * PSA UI audit
 * Revisa src/ contra el estándar de diseño, seguridad y accesibilidad de PSA.
 *
 * Uso:
 *   node .opencode/skills/psa-design-standard/scripts/audit-ui.mjs
 *   node ... --strict   # también falla con advertencias
 *   node ... --json     # salida para CI
 *
 * Ignora una línea con el comentario: psa-audit-ignore
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const TOKENS_FILE = normalize(join(ROOT, 'src', 'styles', 'tokens.css'));
const flags = new Set(process.argv.slice(2));
const STRICT = flags.has('--strict');
const JSON_OUT = flags.has('--json');

if (flags.has('--help') || flags.has('-h')) {
  console.log(`PSA UI audit

  node .opencode/skills/psa-design-standard/scripts/audit-ui.mjs [--strict] [--json]

  --strict   Falla también con advertencias.
  --json     Emite JSON (para CI).

Ignora una línea con el comentario: psa-audit-ignore`);
  process.exit(0);
}

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.astro',
  '.git',
  '.opencode',
  'coverage',
]);
const EXTENSIONS = new Set([
  '.astro',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.css',
  '.html',
  '.mdx',
]);

const SEVERITY_ORDER = { error: 0, warning: 1 };

function normalize(path) {
  return path.split(sep).join('/');
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else if (EXTENSIONS.has(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

function snippetOf(text, index, max = 120) {
  const start = Math.max(0, text.lastIndexOf('\n', index) + 1);
  const end = text.indexOf('\n', index);
  const raw = text.slice(start, end === -1 ? text.length : end).trim();
  return raw.length > max ? `${raw.slice(0, max - 1)}…` : raw;
}

function isIgnored(text, index) {
  const start = text.lastIndexOf('\n', index) + 1;
  const end = text.indexOf('\n', index);
  const line = text.slice(start, end === -1 ? text.length : end);
  return line.includes('psa-audit-ignore');
}

function makeIssue(file, text, index, rule, message) {
  return {
    file: normalize(relative(ROOT, file)),
    line: lineOf(text, index),
    column: index - text.lastIndexOf('\n', index),
    rule: rule.id,
    severity: rule.severity,
    message: message ?? rule.message,
    snippet: snippetOf(text, index),
  };
}

function regexRule({ id, severity, message, regex, skip }) {
  return {
    id,
    severity,
    message,
    check(file, text) {
      const re = new RegExp(
        regex.source,
        regex.flags.includes('g') ? regex.flags : `${regex.flags}g`,
      );
      const issues = [];
      for (const match of text.matchAll(re)) {
        if (match.index === undefined) continue;
        if (isIgnored(text, match.index)) continue;
        if (skip?.(file, text, match)) continue;
        issues.push(makeIssue(file, text, match.index, { id, severity, message }));
      }
      return issues;
    },
  };
}

function tagRule({ id, severity, message, tag, test }) {
  return {
    id,
    severity,
    message,
    check(file, text) {
      // Las etiquetas HTML no aplican a hojas de estilo; sus comentarios pueden
      // contener ejemplos como <html data-theme="dark">.
      if (extname(file) === '.css') return [];
      const re = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
      const issues = [];
      for (const match of text.matchAll(re)) {
        if (match.index === undefined) continue;
        if (isIgnored(text, match.index)) continue;
        const result = test(match[0], match, file);
        if (result) {
          issues.push(
            makeIssue(
              file,
              text,
              match.index,
              { id, severity, message },
              typeof result === 'string' ? result : undefined,
            ),
          );
        }
      }
      return issues;
    },
  };
}

function hasAttr(tag, name) {
  return new RegExp(`\\b${name}\\s*=`, 'i').test(tag);
}

function attr(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'),
  );
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : '';
}

const RULES = [
  /* ------------------------------------------------------------------ */
  /* Diseño                                                              */
  /* ------------------------------------------------------------------ */
  regexRule({
    id: 'design/hardcoded-color',
    severity: 'warning',
    message:
      'Color literal fuera de tokens.css. Usa var(--token) definido en src/styles/tokens.css.',
    regex: /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g,
    skip(file, text, match) {
      if (normalize(file) === TOKENS_FILE) return true;
      // Fragmentos de URL/ancla que parecen color (#abc) no son colores.
      const before = text.slice(Math.max(0, match.index - 12), match.index);
      if (/(?:href|src|id|name)\s*=\s*["'][^"']*$/i.test(before)) return true;
      return false;
    },
  }),

  {
    id: 'design/border-radius',
    severity: 'error',
    message:
      'Radio no permitido. Usa 0, 2px, 4px (var(--radius)) o 9999px solo en avatar/dot.',
    check(file, text) {
      if (normalize(file) === TOKENS_FILE) return [];
      const issues = [];
      const re = /border-radius\s*:\s*([^;}\n]+)/g;
      for (const match of text.matchAll(re)) {
        if (match.index === undefined || isIgnored(text, match.index)) continue;
        const value = match[1].trim();
        const parts = value.split(/[\s/]+/).filter(Boolean);
        const allowed = (part) =>
          /^(?:0|0px|2px|4px|50%|9999px|inherit|var\(--radius[\w-]*\))$/.test(
            part,
          );
        if (parts.length > 0 && parts.every(allowed)) continue;
        issues.push(
          makeIssue(
            file,
            text,
            match.index,
            RULES.find((r) => r.id === 'design/border-radius'),
            `Radio "${value}" no permitido. Usa 0, 2px o 4px (var(--radius)).`,
          ),
        );
      }
      // Estilos inline en Solid/TS: borderRadius: '8px'
      const inline = /borderRadius\s*:\s*['"]([^'"]+)['"]/g;
      for (const match of text.matchAll(inline)) {
        if (match.index === undefined || isIgnored(text, match.index)) continue;
        const value = match[1].trim();
        if (/^(?:0|0px|2px|4px|50%|9999px|var\(--radius[\w-]*\))$/.test(value)) {
          continue;
        }
        issues.push(
          makeIssue(
            file,
            text,
            match.index,
            RULES.find((r) => r.id === 'design/border-radius'),
            `borderRadius "${value}" no permitido. Usa var(--radius) (4px).`,
          ),
        );
      }
      return issues;
    },
  },

  regexRule({
    id: 'design/tailwind-radius',
    severity: 'warning',
    message:
      'Radio mayor a 4px. En Tailwind usa rounded o rounded-sm; rounded-full solo avatar/dot.',
    regex: /\brounded-(?:md|lg|xl|2xl|3xl)\b/g,
  }),

  regexRule({
    id: 'design/gradient',
    severity: 'error',
    message:
      'Gradientes prohibidos en la UI. Usa superficies sólidas y bordes de 1px.',
    regex: /\b(?:linear|radial|conic)-gradient\s*\(/g,
  }),

  /* ------------------------------------------------------------------ */
  /* Seguridad                                                           */
  /* ------------------------------------------------------------------ */
  regexRule({
    id: 'security/inner-html',
    severity: 'error',
    message:
      'HTML crudo prohibido (innerHTML/outerHTML/insertAdjacentHTML). Solid escapa texto por defecto.',
    regex:
      /\.(?:innerHTML|outerHTML)\s*=|insertAdjacentHTML\s*\(|dangerouslySetInnerHTML/g,
  }),

  regexRule({
    id: 'security/set-html',
    severity: 'warning',
    message:
      'set:html solo se permite con contenido estático del repo. Nunca con datos de API o usuario.',
    regex: /\bset:html\b/g,
  }),

  regexRule({
    id: 'security/eval',
    severity: 'error',
    message: 'eval() y new Function() prohibidos. Reescribe la lógica.',
    regex: /\beval\s*\(|new\s+Function\s*\(/g,
  }),

  regexRule({
    id: 'security/document-write',
    severity: 'error',
    message: 'document.write() prohibido: abre la puerta a XSS.',
    regex: /\bdocument\.write(?:ln)?\s*\(/g,
  }),

  regexRule({
    id: 'security/storage-token',
    severity: 'error',
    message:
      'No guardes tokens/sesión en localStorage o sessionStorage. Usa cookie HttpOnly del backend.',
    regex:
      /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\s*\(\s*['"`][^'"`]*(?:token|jwt|auth|session|password|secret|refresh|access)/gi,
  }),

  regexRule({
    id: 'security/document-cookie',
    severity: 'warning',
    message:
      'Evita manipular cookies con JS. La sesión debe ser HttpOnly emitida por el servidor.',
    regex: /\bdocument\.cookie\s*=/g,
  }),

  regexRule({
    id: 'security/public-secret',
    severity: 'error',
    message:
      'Posible secreto en variable PUBLIC_*. Todo PUBLIC_* termina en el bundle.',
    regex:
      /\bPUBLIC_[A-Z0-9_]*(?:_SECRET|_TOKEN|_PASSWORD|_PRIVATE_KEY|_API_KEY|_ACCESS_KEY|_CREDENTIALS?)\b/g,
  }),

  regexRule({
    id: 'security/insecure-url',
    severity: 'warning',
    message:
      'URL http:// insegura. Usa https:// (o localhost en desarrollo).',
    regex: /\bhttp:\/\/[^\s"'<>]+/g,
    skip(file, text, match) {
      const url = match[0].toLowerCase();
      return (
        url.startsWith('http://localhost') ||
        url.startsWith('http://127.0.0.1') ||
        url.startsWith('http://0.0.0.0') ||
        url.startsWith('http://[::1]') ||
        url.startsWith('http://www.w3.org') ||
        url.startsWith('http://host.docker.internal')
      );
    },
  }),

  regexRule({
    id: 'security/javascript-url',
    severity: 'error',
    message: 'URL javascript: prohibida. Valida el esquema antes de renderizar.',
    regex: /\b(?:href|src|action)\s*=\s*["']\s*javascript:/gi,
  }),

  regexRule({
    id: 'security/postmessage-wildcard',
    severity: 'warning',
    message:
      'postMessage con "*" filtra datos a cualquier origen. Valida el origen destino.',
    regex: /\.postMessage\s*\([^)]*,\s*['"]\*['"]/g,
  }),

  regexRule({
    id: 'security/window-open',
    severity: 'warning',
    message:
      'window.open sin noopener puede exponer window.opener. Añade "noopener,noreferrer".',
    regex: /window\.open\s*\(/g,
  }),

  tagRule({
    id: 'security/target-blank',
    severity: 'warning',
    message:
      'Enlace target="_blank" sin rel="noopener noreferrer". Añádelo siempre.',
    tag: 'a',
    test(tag) {
      if (attr(tag, 'target').toLowerCase() !== '_blank') return false;
      const rel = attr(tag, 'rel').toLowerCase();
      if (rel.includes('noopener')) return false;
      return 'Añade rel="noopener noreferrer" al enlace target="_blank".';
    },
  }),

  tagRule({
    id: 'security/external-script',
    severity: 'error',
    message:
      'Script externo prohibido. Self-host, fija versión y usa SRI solo si es inevitable.',
    tag: 'script',
    test(tag) {
      const src = attr(tag, 'src');
      if (!src) return false;
      if (!/^(?:https?:)?\/\//i.test(src)) return false;
      return 'Script externo detectado. CSP/rendimiento/privacidad: self-host.';
    },
  }),

  tagRule({
    id: 'security/external-style',
    severity: 'warning',
    message:
      'CSS externo: self-host para evitar latencia, privacidad y problemas de CSP.',
    tag: 'link',
    test(tag) {
      const rel = attr(tag, 'rel').toLowerCase();
      const href = attr(tag, 'href');
      if (!rel.includes('stylesheet') || !href) return false;
      if (!/^(?:https?:)?\/\//i.test(href)) return false;
      return 'Hoja de estilos externa detectada. Self-host los estilos.';
    },
  }),

  regexRule({
    id: 'security/srcdoc',
    severity: 'warning',
    message:
      'iframe srcdoc puede ejecutar HTML no confiable. Evítalo o sanea con allowlist.',
    regex: /\bsrcdoc\s*=/g,
  }),

  /* ------------------------------------------------------------------ */
  /* Accesibilidad                                                       */
  /* ------------------------------------------------------------------ */
  tagRule({
    id: 'a11y/img-alt',
    severity: 'error',
    message:
      'Toda <img> necesita alt. Decorativa: alt=""; informativa: descripción breve.',
    tag: 'img',
    test(tag) {
      if (hasAttr(tag, 'alt')) return false;
      return 'Añade alt (vacío si es decorativa).';
    },
  }),

  tagRule({
    id: 'a11y/iframe-title',
    severity: 'warning',
    message: 'Todo <iframe> necesita title para lectores de pantalla.',
    tag: 'iframe',
    test(tag) {
      if (hasAttr(tag, 'title')) return false;
      return 'Añade title="..." al iframe.';
    },
  }),

  regexRule({
    id: 'a11y/viewport-scalable',
    severity: 'error',
    message:
      'No bloquees el zoom (user-scalable=no o maximum-scale=1); rompe WCAG.',
    regex: /(?:user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0+)?)\b/gi,
  }),

  regexRule({
    id: 'a11y/outline-none',
    severity: 'warning',
    message:
      'Eliminar el outline sin reemplazo rompe el foco visible. Usa :focus-visible.',
    regex: /\boutline\s*:\s*(?:none|0(?:px)?)\b/gi,
  }),

  regexRule({
    id: 'a11y/div-click',
    severity: 'warning',
    message:
      'onClick en div/span no es accesible. Usa <button> o <a>, o añade role/tabindex/teclado.',
    regex: /<(?:div|span)\b[^>]*\bon(?:click|Click)\s*=/g,
  }),

  tagRule({
    id: 'a11y/html-lang',
    severity: 'error',
    message: 'El elemento <html> necesita lang="es-MX".',
    tag: 'html',
    test(tag) {
      const lang = attr(tag, 'lang');
      if (/^es\b/i.test(lang)) return false;
      return 'Añade lang="es-MX" a <html> (el idioma actual no es español).';
    },
  }),

  regexRule({
    id: 'a11y/autofocus',
    severity: 'warning',
    message:
      'autofocus puede desorientar y robar foco. Úsalo solo en el campo principal de un flujo modal.',
    regex: /\bautofocus\b/gi,
  }),

  /* ------------------------------------------------------------------ */
  /* Rendimiento                                                         */
  /* ------------------------------------------------------------------ */
  regexRule({
    id: 'perf/heavy-import',
    severity: 'warning',
    message:
      'Dependencia pesada. Importa solo funciones concretas o usa APIs nativas (Intl, fetch).',
    regex:
      /from\s+['"](?:moment|lodash|jquery|@mui\/material|antd|chart\.js|three|@fortawesome\/fontawesome-free)['"]/g,
  }),

  regexRule({
    id: 'perf/transition-all',
    severity: 'warning',
    message:
      'transition: all provoca repaints. Anima propiedades específicas (opacity, transform).',
    regex: /\btransition\s*:\s*all\b/gi,
  }),

  regexRule({
    id: 'perf/inline-base64-image',
    severity: 'warning',
    message:
      'Imagen base64 grande en el HTML. Usa astro:assets y un archivo cacheable.',
    regex: /data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]{2000,}/gi,
  }),

  regexRule({
    id: 'perf/client-only-hydration',
    severity: 'warning',
    message:
      'client:only evita SSR. Verifica que sea imprescindible y reserva altura con skeleton.',
    regex: /\bclient:only\b/g,
  }),
];

function run() {
  let files;
  try {
    files = walk(SRC);
  } catch {
    console.error(`No se encontró ${normalize(relative(ROOT, SRC))}/. Ejecuta desde la raíz del proyecto.`);
    process.exit(2);
  }

  const issues = [];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const rule of RULES) {
      issues.push(...rule.check(file, text));
    }
  }

  issues.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  if (JSON_OUT) {
    console.log(
      JSON.stringify(
        {
          ok: errors.length === 0 && (!STRICT || warnings.length === 0),
          files: files.length,
          errors: errors.length,
          warnings: warnings.length,
          issues,
        },
        null,
        2,
      ),
    );
    process.exit(errors.length > 0 || (STRICT && warnings.length > 0) ? 1 : 0);
  }

  const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
  const red = (value) => (useColor ? `\u001b[31m${value}\u001b[0m` : value);
  const yellow = (value) => (useColor ? `\u001b[33m${value}\u001b[0m` : value);
  const dim = (value) => (useColor ? `\u001b[2m${value}\u001b[0m` : value);

  console.log(`\nPSA UI audit · ${files.length} archivos · ${RULES.length} reglas\n`);

  let currentFile = '';
  for (const issue of issues) {
    if (issue.file !== currentFile) {
      currentFile = issue.file;
      console.log(currentFile);
    }
    const label = issue.severity === 'error' ? red('ERROR') : yellow('WARN ');
    const location = `${issue.line}:${issue.column}`.padEnd(7);
    console.log(
      `  ${label} ${dim(location)} ${issue.rule}\n         ${issue.message}\n         ${dim(issue.snippet)}`,
    );
  }

  if (issues.length === 0) {
    console.log('Sin hallazgos. La UI cumple el estándar revisado.\n');
    process.exit(0);
  }

  console.log(
    `\n${errors.length} error(es), ${warnings.length} advertencia(s).` +
      (STRICT ? ' Modo estricto: las advertencias también fallan.' : '') +
      '\n',
  );
  process.exit(errors.length > 0 || (STRICT && warnings.length > 0) ? 1 : 0);
}

run();
