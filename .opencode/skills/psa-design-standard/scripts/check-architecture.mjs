#!/usr/bin/env node
/**
 * PSA architecture check
 * Revisa src/ contra la arquitectura Atomic Design, las reglas de código limpio
 * y la documentación mínima de PSA.
 *
 * Uso:
 *   node .opencode/skills/psa-design-standard/scripts/check-architecture.mjs
 *   node ... --strict   # también falla con advertencias
 *   node ... --json     # salida para CI
 *
 * Ignora una línea con el comentario: psa-audit-ignore
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import {
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const flags = new Set(process.argv.slice(2));
const STRICT = flags.has('--strict');
const JSON_OUT = flags.has('--json');

if (flags.has('--help') || flags.has('-h')) {
  console.log(`PSA architecture check

  node .opencode/skills/psa-design-standard/scripts/check-architecture.mjs [--strict] [--json]

  --strict   Falla también con advertencias.
  --json     Emite JSON (para CI).

Revisa capas Atomic Design, dependencias, ciclos, nombres, tamaño,
tipos, props y documentación. Ignora una línea con psa-audit-ignore; para
un hallazgo de archivo completo, ponlo en las primeras líneas.`);
  process.exit(0);
}

const LAYERS = ['atoms', 'molecules', 'organisms', 'templates'];
const LAYER_RANK = { atoms: 0, molecules: 1, organisms: 2, templates: 3 };
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.astro',
  '.git',
  '.opencode',
  'coverage',
]);
const EXTENSIONS = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx', '.mjs']);
const SEVERITY_ORDER = { error: 0, warning: 1 };
const FRAMEWORK_IMPORT =
  /^(?:astro(?::|\/|$)|@astrojs\/|solid-js(?:\/|$)|@solidjs\/)/;

// [objetivo, límite duro]
const LAYER_LIMITS = {
  atoms: [120, 180],
  molecules: [180, 260],
  organisms: [300, 450],
  templates: [200, 300],
};
const AREA_LIMITS = {
  layouts: [250, 400],
  pages: [250, 400],
  lib: [250, 400],
};
const DEFAULT_LIMITS = [300, 450];

function normalize(path) {
  return path.split(sep).join('/');
}

function absolute(path) {
  return normalize(resolve(path));
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
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

function isCommentLine(text, index) {
  const start = text.lastIndexOf('\n', index) + 1;
  return /^\s*(?:\/\/|\/\*|\*|<!--)/.test(text.slice(start, index));
}

function isFileIgnored(text) {
  return text
    .split('\n')
    .slice(0, 6)
    .some(
      (line) =>
        /^\s*(?:\/\/|\/\*|\*|<!--)/.test(line) &&
        line.includes('psa-audit-ignore'),
    );
}

function isTestFile(file) {
  return /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file);
}

function isDeclaration(file) {
  return /\.d\.[cm]?ts$/.test(file);
}

function areaOf(file) {
  const path = normalize(file);
  for (const layer of LAYERS) {
    if (path.includes(`/src/components/${layer}/`)) return layer;
  }
  if (path.includes('/src/components/')) return 'components';
  if (path.includes('/src/layouts/')) return 'layouts';
  if (path.includes('/src/pages/')) return 'pages';
  if (path.includes('/src/lib/')) return 'lib';
  if (path.includes('/src/types/')) return 'types';
  if (path.includes('/src/styles/')) return 'styles';
  return 'other';
}

function layerOf(file) {
  const area = areaOf(file);
  return LAYERS.includes(area) ? area : null;
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

function rule(id, severity, message) {
  return { id, severity, message };
}

function stripQuery(spec) {
  return spec.split('?')[0].split('#')[0];
}

function resolveSpec(file, spec) {
  const clean = stripQuery(spec);
  if (clean.startsWith('@/')) return absolute(join(SRC, clean.slice(2)));
  if (clean.startsWith('.')) return absolute(resolve(dirname(file), clean));
  return null;
}

const RESOLVE_SUFFIXES = [
  '',
  '.astro',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '/index.astro',
  '/index.ts',
  '/index.tsx',
  '/index.js',
  '/index.mjs',
];

function resolveExisting(base, byPath) {
  if (!base) return null;
  for (const suffix of RESOLVE_SUFFIXES) {
    const candidate = absolute(`${base}${suffix}`);
    if (byPath.has(candidate)) return candidate;
  }
  return null;
}

function extractImports(text) {
  const found = [];
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match.index === undefined) continue;
      if (isIgnored(text, match.index)) continue;
      if (isCommentLine(text, match.index)) continue;
      found.push({ spec: match[1], index: match.index });
    }
  }
  const seen = new Set();
  return found.filter(({ spec, index }) => {
    const key = `${index}:${spec}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function firstDocHeader(text) {
  const head = text.split('\n').slice(0, 24).join('\n');
  return /\/\*\*[\s\S]*?\*\//.test(head);
}

function checkFolder(file, info, issues) {
  if (!normalize(file).includes('/src/components/')) return;
  if (areaOf(file) !== 'components') return;
  if (isFileIgnored(info.text)) return;
  issues.push(
    makeIssue(
      file,
      info.text,
      0,
      rule(
        'arch/component-folder',
        'warning',
        'Componente fuera de capa. Muévelo a atoms/, molecules/, organisms/ o templates/.',
      ),
      'Componente en la raíz de components/. Ubícalo en atoms, molecules, organisms o templates.',
    ),
  );
}

function checkName(file, info, issues) {
  if (isDeclaration(file)) return;
  if (isFileIgnored(info.text)) return;
  const area = areaOf(file);
  const name = basename(file);
  const withoutTest = name.replace(/\.(?:test|spec)(?=\.)/, '');

  if (/^index\.(?:ts|tsx|js|jsx|mjs)$/.test(name) && area !== 'pages') {
    issues.push(
      makeIssue(
        file,
        info.text,
        0,
        rule(
          'clean/barrel',
          'warning',
          'Barrel detectado. Importa el archivo directo; no reexportes todo desde index.',
        ),
        `"${name}" es un barrel.`,
      ),
    );
    return;
  }

  if (LAYERS.includes(area) || area === 'components') {
    if (!/^[A-Z][A-Za-z0-9]*\.(?:astro|tsx|jsx)$/.test(withoutTest)) {
      issues.push(
        makeIssue(
          file,
          info.text,
          0,
          rule(
            'clean/component-name',
            'warning',
            'El archivo de componente debe ser PascalCase y coincidir con el componente (ej. Button.astro).',
          ),
          `"${name}" no es PascalCase. Renombra el archivo y el componente.`,
        ),
      );
    }
    return;
  }

  if (area === 'layouts') {
    if (!/^[A-Z][A-Za-z0-9]*\.astro$/.test(withoutTest)) {
      issues.push(
        makeIssue(
          file,
          info.text,
          0,
          rule(
            'clean/layout-name',
            'warning',
            'El layout debe ser PascalCase (ej. AppLayout.astro).',
          ),
          `"${name}" no es PascalCase.`,
        ),
      );
    }
    return;
  }

  if (area === 'pages') {
    if (/[A-Z_]/.test(name)) {
      issues.push(
        makeIssue(
          file,
          info.text,
          0,
          rule(
            'clean/page-name',
            'warning',
            'La ruta debe ser kebab-case y en minúsculas (sin guiones bajos).',
          ),
          `"${name}" contiene mayúsculas o guiones bajos.`,
        ),
      );
    }
    return;
  }

  if (area === 'lib' || area === 'types') {
    if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.(?:ts|tsx|js|mjs)$/.test(withoutTest)) {
      issues.push(
        makeIssue(
          file,
          info.text,
          0,
          rule(
            'clean/module-name',
            'warning',
            'Los módulos de lógica/tipos deben ser kebab-case (ej. format-date.ts).',
          ),
          `"${name}" no es kebab-case.`,
        ),
      );
    }
  }
}

function checkSize(file, info, issues) {
  if (isDeclaration(file) || isTestFile(file)) return;
  if (isFileIgnored(info.text)) return;
  const area = areaOf(file);
  const layer = LAYERS.includes(area) ? area : null;
  const [target, hard] = LAYER_LIMITS[layer] ?? AREA_LIMITS[area] ?? DEFAULT_LIMITS;
  const lines = info.text.split('\n').length;
  if (lines <= target) return;
  const severity = lines > hard ? 'error' : 'warning';
  issues.push(
    makeIssue(
      file,
      info.text,
      0,
      rule(
        'clean/file-size',
        severity,
        `El archivo supera el límite de la capa (${lines} líneas; objetivo ${target}, límite ${hard}). Divide por responsabilidad.`,
      ),
    ),
  );
}

function checkTypes(file, info, issues) {
  const text = info.text;
  const anyRule = rule(
    'clean/any',
    'error',
    'Uso de any. Usa unknown + guardas o un tipo de dominio.',
  );
  const anyPattern =
    /(?::\s*any\b|\bas\s+any\b|<\s*any\s*>|,\s*any\b|=\s*any\b|\|\s*any\b|\bany\s*\||\[\s*any\b)/g;
  for (const match of text.matchAll(anyPattern)) {
    if (match.index === undefined || isIgnored(text, match.index)) continue;
    if (isCommentLine(text, match.index)) continue;
    const before = text[match.index - 1];
    const after = text[match.index + match[0].length];
    const quote = /['"`]/;
    if (quote.test(before) || quote.test(after)) continue;
    issues.push(makeIssue(file, text, match.index, anyRule));
  }

  const tsIgnore = /@ts-ignore\b/g;
  for (const match of text.matchAll(tsIgnore)) {
    if (match.index === undefined || isIgnored(text, match.index)) continue;
    issues.push(
      makeIssue(
        file,
        text,
        match.index,
        rule(
          'clean/ts-ignore',
          'error',
          '@ts-ignore prohibido. Corrige el tipo o usa @ts-expect-error con una razón.',
        ),
      ),
    );
  }

  const tsExpect = /@ts-expect-error\b/g;
  for (const match of text.matchAll(tsExpect)) {
    if (match.index === undefined || isIgnored(text, match.index)) continue;
    const start = text.lastIndexOf('\n', match.index) + 1;
    const end = text.indexOf('\n', match.index);
    const line = text.slice(start, end === -1 ? text.length : end);
    if (/@ts-expect-error\s*[:—-]/.test(line)) continue;
    issues.push(
      makeIssue(
        file,
        text,
        match.index,
        rule(
          'clean/ts-expect-error',
          'warning',
          '@ts-expect-error necesita una razón en la misma línea (ej. @ts-expect-error: API legacy).',
        ),
      ),
    );
  }

  const doubleCast = /as\s+unknown\s+as\s+/g;
  for (const match of text.matchAll(doubleCast)) {
    if (match.index === undefined || isIgnored(text, match.index)) continue;
    issues.push(
      makeIssue(
        file,
        text,
        match.index,
        rule(
          'clean/double-cast',
          'warning',
          'Doble cast (as unknown as). Aísla y documenta el borde; no lo uses para “arreglar” un tipo.',
        ),
      ),
    );
  }
}

function checkProps(file, info, issues) {
  if (extname(file) !== '.astro') return;
  if (!/\bAstro\.props\b/.test(info.text)) return;
  if (/\binterface\s+Props\b/.test(info.text)) return;
  const index = info.text.search(/\bAstro\.props\b/);
  if (isIgnored(info.text, index)) return;
  issues.push(
    makeIssue(
      file,
      info.text,
      index,
      rule(
        'clean/untyped-props',
        'error',
        'Astro.props sin interface Props. Declara el contrato y destructura los valores.',
      ),
    ),
  );
}

function checkDocs(file, info, issues) {
  if (isTestFile(file) || isDeclaration(file)) return;
  const area = areaOf(file);
  const required = ['organisms', 'templates', 'layouts', 'lib'].includes(area);
  if (!required) return;
  if (isFileIgnored(info.text)) return;
  if (!firstDocHeader(info.text)) {
    issues.push(
      makeIssue(
        file,
        info.text,
        0,
        rule(
          'docs/header',
          'warning',
          'Falta el docblock de módulo: propósito, capa, props/slots y efectos.',
        ),
      ),
    );
  }

  // En lib, las funciones públicas llevan JSDoc propio.
  if (area !== 'lib') return;
  const patterns = [
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g,
    /export\s+const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:function\b|\()/g,
  ];
  const seen = new Set();
  for (const pattern of patterns) {
    for (const match of info.text.matchAll(pattern)) {
      if (match.index === undefined || seen.has(match.index)) continue;
      if (isIgnored(info.text, match.index)) continue;
      seen.add(match.index);
      const before = info.text.slice(Math.max(0, match.index - 1000), match.index);
      if (/\*\/\s*$/.test(before)) continue;
      issues.push(
        makeIssue(
          file,
          info.text,
          match.index,
          rule(
            'docs/jsdoc',
            'warning',
            'Función pública sin JSDoc. Explica el comportamiento, los parámetros y los errores.',
          ),
        ),
      );
    }
  }
}

function checkTodos(file, info, issues) {
  if (isDeclaration(file)) return;
  const pattern = /(?:\/\/|\/\*|<!--)\s*(TODO|FIXME)\b[^\n]*/g;
  for (const match of info.text.matchAll(pattern)) {
    if (match.index === undefined || isIgnored(info.text, match.index)) continue;
    if (/#\d+|https?:\/\//.test(match[0])) continue;
    issues.push(
      makeIssue(
        file,
        info.text,
        match.index,
        rule(
          'docs/todo',
          'warning',
          'TODO/FIXME sin issue o enlace. Añade #123 o la URL de seguimiento.',
        ),
      ),
    );
  }
}

function checkImports(file, info, issues, byPath) {
  const sourceArea = areaOf(file);
  const sourceLayer = layerOf(file);

  for (const imported of info.imports) {
    const base = resolveSpec(file, imported.spec);
    const target = resolveExisting(base, byPath);
    const targetPath = target ?? base;
    const targetArea = targetPath ? areaOf(targetPath) : 'other';
    const targetLayer = targetPath ? layerOf(targetPath) : null;
    const index = imported.index;

    const push = (id, severity, message) =>
      issues.push(makeIssue(file, info.text, index, rule(id, severity, message)));

    // Dirección de capas.
    if (sourceLayer && targetLayer) {
      if (LAYER_RANK[targetLayer] > LAYER_RANK[sourceLayer]) {
        push(
          'arch/upward-import',
          'error',
          `Import hacia arriba: ${sourceLayer} no puede importar ${targetLayer}. Mueve la composición a una capa superior.`,
        );
      }
    }

    if (
      (sourceLayer || sourceArea === 'components') &&
      (targetArea === 'layouts' || targetArea === 'pages')
    ) {
      push(
        'arch/component-to-page',
        'error',
        'Un componente no puede importar layouts ni páginas. Invierte la dependencia.',
      );
    }

    if (sourceArea === 'layouts' && targetArea === 'pages') {
      push(
        'arch/layout-to-page',
        'error',
        'Un layout no puede importar páginas. Usa <slot /> y recibe datos por props.',
      );
    }

    if (sourceArea === 'layouts' && targetLayer === 'templates') {
      push(
        'arch/layout-to-template',
        'error',
        'Un layout no compone templates; el template se usa dentro de la página. El layout solo aporta el shell.',
      );
    }

    // Pureza de lib.
    if (sourceArea === 'lib') {
      if (
        ['atoms', 'molecules', 'organisms', 'templates', 'components', 'layouts', 'pages'].includes(
          targetArea,
        )
      ) {
        push(
          'arch/lib-purity',
          'error',
          'lib/ no puede importar componentes, layouts ni páginas. Mantén la lógica independiente del framework.',
        );
      }
      if (FRAMEWORK_IMPORT.test(imported.spec)) {
        push(
          'arch/lib-framework',
          'error',
          'lib/ no puede importar Astro ni SolidJS. Mueve el código específico a la capa de UI.',
        );
      }
      if (targetArea === 'styles') {
        push(
          'arch/lib-style',
          'error',
          'lib/ no importa hojas de estilo. Los estilos viven en componentes, layouts o tokens.',
        );
      }
    }

    // Tipos sin runtime local ni framework.
    if (sourceArea === 'types') {
      const runtimeArea = [
        'atoms',
        'molecules',
        'organisms',
        'templates',
        'components',
        'layouts',
        'pages',
        'lib',
        'styles',
      ].includes(targetArea);
      const runtimeSpec = FRAMEWORK_IMPORT.test(imported.spec);
      if (runtimeArea || runtimeSpec) {
        push(
          'arch/types-runtime',
          'error',
          'types/ solo contiene contratos. No importes componentes, layouts, páginas, estilos, Astro/Solid ni módulos con runtime.',
        );
      }
    }

    // Utilidades permitidas por capa. Templates y layouts nunca cargan datos.
    if (targetArea === 'lib') {
      const libPath = targetPath ?? '';
      const isUi = /\/src\/lib\/ui\//.test(libPath);
      const isFormat = /\/src\/lib\/format\//.test(libPath);
      const isData =
        /\/src\/lib\/(?:[^/]+\/)*(?:api|client|auth|data|services?|repositories?)(?:\/|\.(?:[cm]?[jt]s)$)/.test(
          libPath,
        );

      if (sourceLayer === 'templates' && !(isUi || isFormat)) {
        push(
          'arch/data-in-presentation',
          'error',
          'Un template no importa datos ni lógica con efectos. Solo puede usar lib/ui y lib/format; los datos llegan por props.',
        );
      }
      if (sourceArea === 'layouts' && !isUi) {
        push(
          'arch/data-in-presentation',
          'error',
          'Un layout solo puede importar lib/ui. No carga datos, auth ni lógica de dominio; recibe todo por props.',
        );
      }
      if (sourceLayer === 'atoms' && !isUi) {
        push(
          'arch/atom-lib',
          'warning',
          'Un átomo solo puede importar lib/ui. Mueve formato o reglas de negocio a una molécula u organismo.',
        );
      }
      if (sourceLayer === 'molecules' && !(isUi || isFormat)) {
        push(
          'arch/molecule-lib',
          'warning',
          'Una molécula solo puede importar lib/ui o lib/format. Mueve la lógica de dominio a un organismo o a la página.',
        );
      }
      if (sourceLayer === 'organisms' && isData) {
        push(
          'arch/data-in-component',
          'warning',
          'Un organismo importa la capa de datos. Si es una isla con acción de usuario, documenta la excepción; si es carga inicial, muévela a la página.',
        );
      }
    }

    // Imports relativos profundos.
    if (/^\.\.\/\.\.\//.test(imported.spec)) {
      push(
        'arch/deep-import',
        'warning',
        'Import relativo profundo. Usa el alias @/ para cruzar carpetas.',
      );
    }
  }
}

function findCycles(files, byPath) {
  const graph = new Map();
  for (const info of files) {
    const edges = [];
    for (const imported of info.imports) {
      const target = resolveExisting(resolveSpec(info.file, imported.spec), byPath);
      if (!target || !byPath.has(target)) continue;
      edges.push({ to: target, index: imported.index });
    }
    graph.set(info.file, edges);
  }

  const state = new Map();
  const stack = [];
  const cycles = [];

  function visit(node) {
    state.set(node, 1);
    stack.push(node);
    for (const edge of graph.get(node) ?? []) {
      const nextState = state.get(edge.to) ?? 0;
      if (nextState === 0) {
        visit(edge.to);
      } else if (nextState === 1) {
        const start = stack.indexOf(edge.to);
        if (start !== -1) {
          cycles.push({ cycle: stack.slice(start), edge });
        }
      }
    }
    stack.pop();
    state.set(node, 2);
  }

  for (const info of files) {
    if ((state.get(info.file) ?? 0) === 0) visit(info.file);
  }

  const seen = new Set();
  return cycles.filter(({ cycle }) => {
    const key = [...new Set(cycle)].sort().join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function run() {
  let filePaths;
  try {
    filePaths = walk(SRC);
  } catch {
    console.error(
      `No se encontró ${normalize(relative(ROOT, SRC))}/. Ejecuta desde la raíz del proyecto.`,
    );
    process.exit(2);
  }

  const files = [];
  const byPath = new Map();
  for (const file of filePaths) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const info = {
      file: absolute(file),
      text,
      imports: extractImports(text),
    };
    files.push(info);
    byPath.set(info.file, info);
  }

  const issues = [];
  for (const info of files) {
    checkFolder(info.file, info, issues);
    checkName(info.file, info, issues);
    checkSize(info.file, info, issues);
    checkTypes(info.file, info, issues);
    checkProps(info.file, info, issues);
    checkDocs(info.file, info, issues);
    checkTodos(info.file, info, issues);
    checkImports(info.file, info, issues, byPath);
  }

  for (const { cycle, edge } of findCycles(files, byPath)) {
    // Los tipos son hojas; un ciclo con types ya se reporta como types-runtime.
    if (cycle.some((file) => areaOf(file) === 'types')) continue;
    const origin = cycle[cycle.length - 1];
    const originInfo = byPath.get(origin);
    if (!originInfo) continue;
    const chain = [...cycle, cycle[0]]
      .map((file) => normalize(relative(ROOT, file)))
      .join(' → ');
    issues.push(
      makeIssue(
        origin,
        originInfo.text,
        edge.index,
        rule(
          'arch/cycle',
          'error',
          `Ciclo de imports: ${chain}. Rompe el ciclo moviendo el tipo o la composición a una capa inferior.`,
        ),
      ),
    );
  }

  issues.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  const ok = errors.length === 0 && (!STRICT || warnings.length === 0);

  if (JSON_OUT) {
    console.log(
      JSON.stringify(
        {
          ok,
          files: files.length,
          errors: errors.length,
          warnings: warnings.length,
          issues,
        },
        null,
        2,
      ),
    );
    process.exit(ok ? 0 : 1);
  }

  const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
  const red = (value) => (useColor ? `\u001b[31m${value}\u001b[0m` : value);
  const yellow = (value) => (useColor ? `\u001b[33m${value}\u001b[0m` : value);
  const dim = (value) => (useColor ? `\u001b[2m${value}\u001b[0m` : value);

  console.log(
    `\nPSA architecture check · ${files.length} archivos · Atomic Design + código limpio\n`,
  );

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
    console.log('Sin hallazgos. La estructura y el código cumplen el estándar.\n');
    process.exit(0);
  }

  console.log(
    `\n${errors.length} error(es), ${warnings.length} advertencia(s).` +
      (STRICT ? ' Modo estricto: las advertencias también fallan.' : '') +
      '\n',
  );
  process.exit(ok ? 0 : 1);
}

run();
