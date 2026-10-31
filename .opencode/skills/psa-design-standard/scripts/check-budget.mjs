#!/usr/bin/env node
/**
 * PSA performance budget
 * Revisa dist/ y falla si una ruta excede el presupuesto de JS, CSS o HTML.
 *
 * Uso:
 *   bun run build
 *   node .opencode/skills/psa-design-standard/scripts/check-budget.mjs
 *   node ... --js 100 --css 30 --html 40
 *   node ... --dist dist --json
 *
 * Tamaños en KB gzip.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

const argv = process.argv.slice(2);

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`PSA performance budget

  node .opencode/skills/psa-design-standard/scripts/check-budget.mjs \\
    [--dist dist] [--js 120] [--css 40] [--html 40] [--json]

  --js     Presupuesto de JS por ruta en KB gzip (default 120).
  --css    Presupuesto de CSS por ruta en KB gzip (default 40).
  --html   Presupuesto de HTML por ruta en KB gzip (default 40).
  --dist   Directorio de build (default dist).
  --json   Emite JSON (para CI).

  Con el adaptador Node, los assets viven en dist/client. Si no hay HTML
  estático (todo es SSR), se mide el bundle cliente completo como una ruta
  conservadora llamada "(bundle cliente)".`);
  process.exit(0);
}

function option(name, fallback) {
  const index = argv.indexOf(name);
  if (index === -1) return fallback;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Falta el valor de ${name}.`);
    process.exit(2);
  }
  return value;
}

const DIST = resolve(process.cwd(), option('--dist', 'dist'));
const CLIENT_DIR = join(DIST, 'client');
const WEB_ROOT = existsSync(CLIENT_DIR) ? CLIENT_DIR : DIST;
const BUDGETS = {
  js: Number(option('--js', '120')) * 1024,
  css: Number(option('--css', '40')) * 1024,
  html: Number(option('--html', '40')) * 1024,
};
const JSON_OUT = argv.includes('--json');

if (![BUDGETS.js, BUDGETS.css, BUDGETS.html].every(Number.isFinite)) {
  console.error('Los presupuestos deben ser números en KB.');
  process.exit(2);
}

if (!existsSync(DIST)) {
  console.error(
    `No existe ${relative(process.cwd(), DIST) || DIST}/. Ejecuta "bun run build" primero.`,
  );
  process.exit(2);
}

const SKIP_DIRS = new Set(['node_modules', '.git']);
const sizeCache = new Map();

function walk(dir, filter, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, filter, out);
    } else if (filter(full)) {
      out.push(full);
    }
  }
  return out;
}

function gzipSize(file) {
  if (sizeCache.has(file)) return sizeCache.get(file);
  const size = gzipSync(readFileSync(file), { level: 9 }).length;
  sizeCache.set(file, size);
  return size;
}

function gzipText(text) {
  return gzipSync(Buffer.from(text), { level: 9 }).length;
}

function normalize(path) {
  return path.split(sep).join('/');
}

function routeName(file) {
  let route = `/${normalize(relative(WEB_ROOT, file))}`;
  route = route.replace(/\/index\.html$/, '/');
  if (route === '/index.html') return '/';
  return route.replace(/\.html$/, '');
}

function localAsset(url) {
  if (!url) return null;
  if (/^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith('data:')) return null;
  const clean = url.split('?')[0].split('#')[0];
  if (!clean.startsWith('/')) return null;
  const full = join(WEB_ROOT, clean.slice(1));
  return existsSync(full) ? full : null;
}

function matchAll(text, regex) {
  return [...text.matchAll(regex)];
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const htmlFiles = walk(WEB_ROOT, (file) => extname(file) === '.html');
const routes = [];

// Build SSR sin HTML estático: se audita el bundle cliente completo. Es una
// cota conservadora porque todas las rutas comparten esos chunks.
if (htmlFiles.length === 0) {
  const clientJs = walk(WEB_ROOT, (file) => extname(file) === '.js');
  const clientCss = walk(WEB_ROOT, (file) => extname(file) === '.css');

  if (clientJs.length === 0 && clientCss.length === 0) {
    console.error(`No se encontraron HTML ni assets en ${normalize(WEB_ROOT)}/.`);
    process.exit(1);
  }

  const js = clientJs.reduce((total, asset) => total + gzipSize(asset), 0);
  const css = clientCss.reduce((total, asset) => total + gzipSize(asset), 0);
  const violations = [];
  if (js > BUDGETS.js) violations.push({ type: 'js', bytes: js, budget: BUDGETS.js });
  if (css > BUDGETS.css) {
    violations.push({ type: 'css', bytes: css, budget: BUDGETS.css });
  }

  routes.push({
    route: '(bundle cliente)',
    file: normalize(relative(process.cwd(), WEB_ROOT)),
    js,
    css,
    html: 0,
    jsAssets: clientJs.map((asset) => normalize(relative(process.cwd(), asset))),
    cssAssets: clientCss.map((asset) => normalize(relative(process.cwd(), asset))),
    violations,
  });
}

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const jsAssets = new Set();
  const cssAssets = new Set();

  for (const match of matchAll(
    html,
    /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi,
  )) {
    const asset = localAsset(match[1]);
    if (asset) jsAssets.add(asset);
  }

  for (const match of matchAll(html, /<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\brel\s*=\s*["'][^"']*stylesheet/i.test(tag)) continue;
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    const asset = localAsset(href);
    if (asset) cssAssets.add(asset);
  }

  const inlineStyles = matchAll(html, /<style\b[^>]*>([\s\S]*?)<\/style>/gi)
    .map((match) => match[1])
    .join('');
  const inlineScripts = matchAll(
    html,
    /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi,
  )
    .map((match) => match[1])
    .join('');

  const js =
    [...jsAssets].reduce((total, asset) => total + gzipSize(asset), 0) +
    (inlineScripts ? gzipText(inlineScripts) : 0);
  const css =
    [...cssAssets].reduce((total, asset) => total + gzipSize(asset), 0) +
    (inlineStyles ? gzipText(inlineStyles) : 0);
  const htmlSize = gzipSize(file);

  const violations = [];
  if (js > BUDGETS.js) violations.push({ type: 'js', bytes: js, budget: BUDGETS.js });
  if (css > BUDGETS.css) {
    violations.push({ type: 'css', bytes: css, budget: BUDGETS.css });
  }
  if (htmlSize > BUDGETS.html) {
    violations.push({ type: 'html', bytes: htmlSize, budget: BUDGETS.html });
  }

  routes.push({
    route: routeName(file),
    file: normalize(relative(process.cwd(), file)),
    js,
    css,
    html: htmlSize,
    jsAssets: [...jsAssets].map((asset) => normalize(relative(process.cwd(), asset))),
    cssAssets: [...cssAssets].map((asset) => normalize(relative(process.cwd(), asset))),
    violations,
  });
}

routes.sort((a, b) => b.js - a.js || a.route.localeCompare(b.route));

const assets = walk(
  WEB_ROOT,
  (file) => ['.js', '.css'].includes(extname(file)),
).map((file) => ({
  file: normalize(relative(process.cwd(), file)),
  bytes: gzipSize(file),
}));
assets.sort((a, b) => b.bytes - a.bytes);

const violations = routes.flatMap((route) =>
  route.violations.map((violation) => ({ route: route.route, ...violation })),
);

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      {
        ok: violations.length === 0,
        budgets: BUDGETS,
        routes,
        assets: assets.slice(0, 20),
        violations,
      },
      null,
      2,
    ),
  );
  process.exit(violations.length === 0 ? 0 : 1);
}

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const red = (value) => (useColor ? `\u001b[31m${value}\u001b[0m` : value);
const green = (value) => (useColor ? `\u001b[32m${value}\u001b[0m` : value);
const dim = (value) => (useColor ? `\u001b[2m${value}\u001b[0m` : value);

console.log('\nPSA performance budget');
console.log(
  `Presupuesto por ruta: JS ${BUDGETS.js / 1024} KB · CSS ${BUDGETS.css / 1024} KB · HTML ${BUDGETS.html / 1024} KB (gzip)\n`,
);

const routeWidth = Math.max(24, ...routes.map((route) => route.route.length));
console.log(
  `${'Ruta'.padEnd(routeWidth)}  ${'JS'.padStart(9)}  ${'CSS'.padStart(9)}  ${'HTML'.padStart(9)}`,
);
console.log(
  `${'-'.repeat(routeWidth)}  ${'-'.repeat(9)}  ${'-'.repeat(9)}  ${'-'.repeat(9)}`,
);
for (const route of routes) {
  const mark = route.violations.length > 0 ? red('  ✗') : '';
  console.log(
    `${route.route.padEnd(routeWidth)}  ${formatKb(route.js).padStart(9)}  ${formatKb(route.css).padStart(9)}  ${formatKb(route.html).padStart(9)}${mark}`,
  );
}

console.log('\nAssets más pesados (gzip):');
for (const asset of assets.slice(0, 8)) {
  console.log(`  ${formatKb(asset.bytes).padStart(9)}  ${asset.file}`);
}

if (violations.length > 0) {
  console.log('');
  for (const violation of violations) {
    const over = violation.bytes - violation.budget;
    console.log(
      `${red('✗')} ${violation.route} · ${violation.type.toUpperCase()} ${formatKb(violation.bytes)} (excede ${formatKb(over)} sobre ${formatKb(violation.budget)})`,
    );
  }
  console.log(
    `\n${red(`${violations.length} violación(es) de presupuesto.`)} Reduce dependencias, HTML o CSS antes de mergear.\n`,
  );
  process.exit(1);
}

console.log(`\n${green('OK')} Todas las rutas están dentro del presupuesto.${dim('')}\n`);
