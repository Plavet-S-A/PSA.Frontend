/**
 * Verifica en producción que la CSP permita exactamente los scripts y estilos
 * inline que emite Astro/Solid, y que las cabeceras de sesión sean seguras.
 *
 * Uso: `bun run build && node scripts/check-csp.mjs`
 * No forma parte del bundle; levanta `dist/server/entry.mjs` en un puerto libre.
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';

const ENTRY = 'dist/server/entry.mjs';
const SECRET = 'psa-csp-check-secret-with-more-than-32-characters';
const ROUTES = [
  '/iniciar-sesion',
  '/panel',
  '/usuarios',
  '/estudiantes',
  '/tutores',
  '/talleres',
  '/tutores-empresariales',
  '/supervisores',
  '/vinculadores',
  '/centros-trabajo',
  '/plazas',
  '/documentacion',
  '/evaluacion',
  '/proceso-pasantia',
];
const REQUIRED_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
};

const failures = [];

function fail(message) {
  failures.push(message);
  console.error(`FALLO: ${message}`);
}

function sha256(content) {
  return `sha256-${createHash('sha256').update(content).digest('base64')}`;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function parseDirectives(csp) {
  const directives = new Map();
  for (const part of csp.split(';')) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (!name) continue;
    directives.set(name.toLowerCase(), values);
  }
  return directives;
}

function pageCsp(headers, html) {
  const header = headers.get('content-security-policy');
  if (header) return header;
  const meta = html.match(
    /<meta[^>]+http-equiv=["']content-security-policy["'][^>]+content=["']([^"']+)["']/i,
  );
  return meta?.[1] ?? '';
}

function checkInlineCode(path, html, directives) {
  const scriptValues = [
    ...(directives.get('script-src') ?? []),
    ...(directives.get('script-src-elem') ?? []),
  ];
  const styleValues = [
    ...(directives.get('style-src') ?? []),
    ...(directives.get('style-src-elem') ?? []),
  ];

  if (scriptValues.includes("'unsafe-inline'")) {
    fail(`${path}: script-src permite 'unsafe-inline'.`);
  }
  if (scriptValues.includes("'unsafe-eval'")) {
    fail(`${path}: script-src permite 'unsafe-eval'.`);
  }
  if (styleValues.includes("'unsafe-inline'")) {
    fail(`${path}: style-src permite 'unsafe-inline'.`);
  }

  const inlineScripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi);
  for (const match of inlineScripts) {
    if (/\bsrc\s*=/i.test(match[1]) || match[2].trim() === '') continue;
    const hash = sha256(match[2]);
    if (!scriptValues.includes(`'${hash}'`)) {
      fail(`${path}: falta el hash ${hash} de un script inline.`);
    }
  }

  const inlineStyles = html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi);
  for (const match of inlineStyles) {
    const hash = sha256(match[1]);
    if (!styleValues.includes(`'${hash}'`)) {
      fail(`${path}: falta el hash ${hash} de un style inline.`);
    }
  }

  if (/\sstyle\s*=/i.test(html)) {
    fail(`${path}: hay atributos style inline sin 'unsafe-hashes'.`);
  }
  if (/\son[a-z]+\s*=/i.test(html)) {
    fail(`${path}: hay manejadores de eventos inline.`);
  }
}

async function checkPage(base, path, cookie) {
  const response = await fetch(`${base}${path}`, {
    headers: cookie ? { cookie } : undefined,
    redirect: 'manual',
  });
  if (response.status !== 200) {
    fail(`${path}: se esperaba 200 y llegó ${response.status}.`);
    return;
  }

  for (const [name, expected] of Object.entries(REQUIRED_HEADERS)) {
    if (response.headers.get(name) !== expected) {
      fail(`${path}: cabecera ${name} incorrecta.`);
    }
  }

  const html = await response.text();
  const csp = pageCsp(response.headers, html);
  if (!csp) {
    fail(`${path}: no se encontró Content-Security-Policy.`);
    return;
  }

  const directives = parseDirectives(csp);
  if (!(directives.get('object-src') ?? []).includes("'none'")) {
    fail(`${path}: object-src no está en 'none'.`);
  }
  const frameSrc = directives.get('frame-src') ?? [];
  if (!frameSrc.includes("'self'") || !frameSrc.includes('blob:')) {
    fail(`${path}: frame-src debe permitir 'self' y blob: para la vista previa de PDF.`);
  }
  if (!(directives.get('base-uri') ?? []).includes("'self'")) {
    fail(`${path}: base-uri no está en 'self'.`);
  }
  if (!(directives.get('frame-ancestors') ?? []).includes("'none'")) {
    fail(`${path}: frame-ancestors no está en 'none'.`);
  }
  checkInlineCode(path, html, directives);
}

async function loginAs(base, credential) {
  const response = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({ credential, password: 'Psa2026!' }),
  });
  if (response.status !== 200) {
    fail(`/api/auth/login (${credential}): se esperaba 200 y llegó ${response.status}.`);
    return null;
  }
  return response.headers.get('set-cookie')?.match(/psa_session=[^;]+/)?.[0] ?? null;
}

async function expectRedirect(base, path, cookie, target) {
  const response = await fetch(`${base}${path}`, {
    headers: { cookie },
    redirect: 'manual',
  });
  const location = response.headers.get('location') ?? '';
  if (response.status !== 302 || !location.endsWith(target)) {
    fail(`${path}: se esperaba 302 a ${target}, llegó ${response.status} ${location}.`);
  }
}

async function checkRoleGuard(base) {
  const tutor = await loginAs(base, '20260005');
  if (tutor) {
    await checkPage(base, '/documentacion', tutor);
    await checkPage(base, '/evaluacion', tutor);
    await expectRedirect(base, '/talleres', tutor, '/panel');
    await expectRedirect(base, '/usuarios', tutor, '/panel');
  }

  const vinculador = await loginAs(base, '20260004');
  if (vinculador) {
    await checkPage(base, '/documentacion', vinculador);
    await checkPage(base, '/estudiantes', vinculador);
    await expectRedirect(base, '/evaluacion', vinculador, '/panel');
    await expectRedirect(base, '/usuarios', vinculador, '/panel');
  }
}

async function waitForServer(base, server) {
  let output = '';
  const onData = (chunk) => {
    output += chunk.toString();
  };
  server.stdout.on('data', onData);
  server.stderr.on('data', onData);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`El servidor terminó antes de responder.\n${output}`);
    }
    try {
      const response = await fetch(`${base}/iniciar-sesion`);
      if (response.ok) return output;
    } catch {
      // Aún no escucha.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`El servidor no respondió a tiempo.\n${output}`);
}

async function main() {
  if (!existsSync(ENTRY)) {
    throw new Error('Falta dist/server/entry.mjs. Ejecuta `bun run build` primero.');
  }

  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [ENTRY], {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      PSA_SESSION_SECRET: SECRET,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServer(base, server);

    await checkPage(base, '/iniciar-sesion');

    const login = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ credential: '20260001', password: 'Psa2026!' }),
    });
    if (login.status !== 200) {
      fail(`/api/auth/login: se esperaba 200 y llegó ${login.status}.`);
      return;
    }
    if (login.headers.get('cache-control') !== 'no-store') {
      fail('/api/auth/login: falta Cache-Control: no-store.');
    }

    const setCookie = login.headers.get('set-cookie') ?? '';
    const cookie = setCookie.match(/psa_session=[^;]+/)?.[0];
    if (!cookie) fail('/api/auth/login: no emitió la cookie de sesión.');
    for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Lax']) {
      if (!setCookie.includes(attribute)) {
        fail(`/api/auth/login: la cookie no incluye ${attribute}.`);
      }
    }
    if (!cookie) return;

    for (const path of ROUTES.slice(1)) {
      await checkPage(base, path, cookie);
    }

    await checkRoleGuard(base);
  } finally {
    server.kill('SIGTERM');
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} hallazgo(s) de CSP, cabeceras o permisos.`);
    process.exitCode = 1;
    return;
  }
  console.log(`OK CSP, cabeceras y permisos en ${ROUTES.length} rutas de producción.`);
}

main().catch((error) => {
  console.error(`FALLO: ${error.message}`);
  process.exitCode = 1;
});
