# Seguridad del frontend (OWASP Top 10)

PSA es un frontend. Este documento no promete que la plataforma sea segura por
sí sola: la autorización, el rate limiting, el cifrado, la validación definitiva
y la integridad de datos viven en la API. Aquí se define lo que el frontend debe
hacer y lo que nunca debe simular que hace.

> Referencia base: OWASP Top 10 2021. Para verificación profunda, usa OWASP ASVS
> 5.0 nivel 2 como checklist de la API y nivel 1–2 para el cliente.

## 0. Reglas que resumen todo

1. Todo dato del usuario es no confiable, incluso si viene de la API.
2. Ocultar un botón no es autorizar. La API decide; la UI solo refleja.
3. Ningún secreto en el bundle. `PUBLIC_*` es público, siempre.
4. Nada de `innerHTML`, `set:html` dinámico, `eval` ni URLs `javascript:`.
5. Cookies de sesión `HttpOnly; Secure; SameSite`; nada de tokens en
   `localStorage`.
6. CSP estricta, sin `unsafe-inline` ni `unsafe-eval` en scripts.
7. Dependencias mínimas, lockfile y auditoría en CI.
8. Errores genéricos para el usuario, detalle solo en logs del servidor.
9. Sin PII en URLs, logs, analytics ni mensajes de error.
10. Cada PR de UI pasa la checklist de la sección 13.

## 1. Mapa OWASP → frontend

| # | Riesgo | Qué hace el frontend | Verificación |
| --- | --- | --- | --- |
| A01 | Broken Access Control | No renderiza datos sin sesión válida; no confía en roles del cliente; no usa IDs secuenciales como control; guardas de ruta solo para UX | Revisar que cada vista con datos sensibles tenga fetch autenticado y que ocultar UI no sea la única defensa |
| A02 | Cryptographic Failures | Solo HTTPS; sin secretos en `PUBLIC_*`; sin tokens/PII en storage persistente o query strings; `no-store` en respuestas autenticadas | Buscar `http://`, `PUBLIC_`, `localStorage`, `token` en URLs |
| A03 | Injection | Escapa por defecto; prohíbe HTML crudo; valida esquemas de URL; sanea markdown; sin `eval`/`new Function` | `audit-ui.mjs` + revisión de `set:html` |
| A04 | Insecure Design | Limita abuso en formularios sensibles; evita enumeración; uploads acotados; flujos idempotentes; no permite autoaprobaciones en UI | Revisar flujos de postulación, evaluación y documentos |
| A05 | Security Misconfiguration | CSP, headers, sin sourcemaps públicos, sin páginas demo, errores controlados, `checkOrigin` activo | Build + `curl -I` + revisión de `dist/` |
| A06 | Vulnerable Components | Lockfile, auditoría, dependencias mínimas, sin CDN sin SRI | `bun audit`, revisión de `package.json` |
| A07 | Auth Failures | Cookies seguras, sesión con expiración, logout real, errores genéricos, MFA si aplica | Revisar flujo de login/logout/401 |
| A08 | Integrity Failures | Instalación reproducible, sin scripts remotos, SRI si es inevitable, CI protegido | `bun install --frozen-lockfile` en CI |
| A09 | Logging Failures | Sin PII en consola, errores con ID de correlación, reporte saneado | `audit-ui.mjs` + revisión de `console.*` |
| A10 | SSRF | Proxies y redirects con allowlist; imágenes remotas restringidas; `next` interno | Revisar endpoints/proxy y `image.remotePatterns` |

## 2. Configuración de Astro

`astro.config.mjs` recomendado (ajusta dominios a los reales):

```js
import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';

export default defineConfig({
  site: 'https://psa.example.mx',
  integrations: [solidJs()],
  output: 'static', // cambia a 'server' si hay datos por usuario
  security: {
    checkOrigin: true, // CSRF en páginas on-demand
    csp: {
      directives: [
        "default-src 'self'",
        "connect-src 'self' https://api.psa.example.mx",
        "img-src 'self' data: blob: https://cdn.psa.example.mx",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ],
    },
  },
});
```

Notas:

- Astro genera `script-src` y `style-src` con hashes propios. No añadas
  `'unsafe-inline'` ni `'unsafe-eval'`; si algo se rompe, corrige el código o
  añade el hash específico.
- La CSP de Astro se emite como `<meta>`. `frame-ancestors`, `report-uri` y
  `sandbox` **no funcionan en meta**; van en cabeceras HTTP (sección 3).
- No dupliques `script-src`/`style-src` en cabeceras si ya los gestiona Astro:
  dos políticas se intersectan y pueden romper la app.
- CSP no se aplica en `astro dev`; valida con `bun run build && bun run preview`.
- Si usas `<ClientRouter />` (view transitions), CSP no lo soporta. Usa la View
  Transitions API nativa o desactiva CSP y compensa con otras capas (no
  recomendado).
- `checkOrigin` solo aplica a páginas on-demand. En `output: 'static'` no hay
  formularios server-side que proteger, pero la API sí debe validar origen/CSRF.

### Script inline de tema

El único inline permitido es el que aplica el tema antes del primer paint. Con
CSP, verifica que Astro incluya su hash en el `<meta>` generado. Si no lo hace,
añádelo en `security.csp.scriptDirective.hashes`. Calcula el hash del contenido
exacto (sin la etiqueta `<script>`):

```sh
printf '%s' 'CONTENIDO_EXACTO' | openssl dgst -sha256 -binary | openssl base64
```

Si el hash cambia cada build (por interpolación), mueve la lógica a un archivo
externo o acepta el costo de mantenerlo.

## 3. Cabeceras HTTP

Configúralas en el hosting (Netlify/Cloudflare `_headers`, Vercel `headers`,
nginx, etc.). Ejemplo para `public/_headers`:

```text
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Content-Security-Policy: frame-ancestors 'none'
```

| Cabecera | Valor | Motivo |
| --- | --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Fuerza HTTPS |
| `X-Content-Type-Options` | `nosniff` | Evita MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | No filtra rutas con PII |
| `Permissions-Policy` | deniega lo no usado | Reduce superficie |
| `X-Frame-Options` | `DENY` | Anti-clickjacking |
| `Content-Security-Policy` | `frame-ancestors 'none'` | Anti-clickjacking moderno |
| `Cross-Origin-Opener-Policy` | `same-origin` | Aísla ventanas |
| `Cross-Origin-Resource-Policy` | `same-origin` | Evita fugas de recursos |

No añadas `X-XSS-Protection` (obsoleto y puede introducir vulnerabilidades).
No publiques `Server`, `X-Powered-By` ni versiones.

Verifica después del deploy:

```sh
curl -sI https://psa.example.mx | sort
```

## 4. Autenticación y sesión (A02, A07)

### Preferido: cookie de sesión del backend

- `HttpOnly`, `Secure`, `SameSite=Lax` (o `Strict` si el flujo lo permite).
- El frontend **nunca** lee la cookie; solo llama a la API con
  `credentials: 'include'` si es cross-origin y el CORS lo permite.
- Expiración absoluta y por inactividad definidas en el servidor.
- Renovación silenciosa con la misma cookie o refresh token `HttpOnly`.
- Logout: `POST /auth/logout`, luego limpiar estado, cachés y redirigir.

### Si hay tokens (solo si el backend lo impone)

- Access token en memoria (variable de módulo/closure), nunca en
  `localStorage`, `sessionStorage` ni IndexedDB.
- Refresh token en cookie `HttpOnly`; el JS no lo toca.
- Al recargar, se recupera la sesión con el refresh; no persistas el access en
  storage.
- Nunca pongas el token en la URL, en un `iframe` ni en un `postMessage` a un
  origen desconocido.

### Errores y enumeración

- Login fallido: “Correo o contraseña incorrectos.” Nunca “ese correo no
  existe”.
- Recuperación: “Si el correo está registrado, recibirás instrucciones.”
- Registro: no confirmes si el correo ya existe; usa verificación por correo.
- Rate limit y bloqueo progresivo: los aplica la API. La UI solo informa
  (“Demasiados intentos. Intenta de nuevo en 5 minutos.”).

### Expiración y 401

- Un solo interceptor de 401. Evita bucles y múltiples redirecciones.
- Guarda `next` solo si es una ruta interna y segura:

```ts
export function safeNext(raw: string | null): string {
  if (!raw) return '/panel';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/panel';
  if (raw.includes('\\') || raw.includes('://')) return '/panel';
  return raw;
}
```

- Al cerrar sesión, limpia stores, cachés en memoria y cualquier `blob:` URL.
- No muestres datos cacheados de la sesión anterior después del logout.

### Contraseñas y MFA

- `autocomplete="current-password"` / `new-password`.
- Permite gestores de contraseñas; no bloquees pegar.
- Muestra/oculta contraseña con botón `aria-label` y `aria-pressed`.
- No impongas máximos arbitrarios (mínimo 12, máximo ≥64).
- MFA: código de 6 dígitos con `inputmode="numeric"`, `autocomplete="one-time-code"`,
  pegado permitido y mensaje de expiración.
- Reautenticación para cambiar contraseña, MFA o cerrar todas las sesiones.

## 5. XSS e inyección (A03)

### Reglas de renderizado

- Solid escapa texto por defecto. Mantenlo así.
- Prohibido: `innerHTML`, `outerHTML`, `insertAdjacentHTML`,
  `dangerouslySetInnerHTML`, `document.write`, `eval`, `new Function`.
- `set:html` de Astro solo con contenido estático escrito en el repo. Si el
  contenido viene de API/usuario, no lo uses.
- Markdown de usuario: renderiza como texto o sanea en el servidor con
  allowlist (markdown-it + sanitize-html). No sanes en el cliente para ahorrar
  bytes y evitar bypasses.
- Enlaces: valida el esquema antes de usarlo.

```ts
const ALLOWED = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function safeHref(raw: string): string | null {
  try {
    const url = new URL(raw, window.location.origin);
    if (!ALLOWED.has(url.protocol)) return null;
    if (url.protocol === 'http:' && url.hostname !== 'localhost') return null;
    return url.href;
  } catch {
    return null;
  }
}
```

- Si un enlace no pasa la validación, renderiza texto plano o deshabilítalo.
- `target="_blank"`: añade `rel="noopener noreferrer"`.
- JSON embebido en HTML: escapa `<` como `\u003c` para evitar cierre de
  `<script>`.
- `postMessage`: valida `event.origin` contra allowlist y el esquema del
  mensaje; nunca uses `'*'` para datos sensibles.
- `iframe`: solo orígenes allowlist, `sandbox` y `title`. No incrustes HTML de
  usuario.

### Sanitización de HTML enriquecido

Si el producto necesita descripciones con formato:

1. Prefiere un subconjunto de markdown renderizado por el servidor.
2. Usa una allowlist estricta (`p`, `strong`, `em`, `ul`, `ol`, `li`, `a`,
   `code`, `pre`, `br`).
3. Fuerza `rel="noopener noreferrer"` y esquemas `http/https/mailto`.
4. Prohíbe `style`, `class`, `id`, `iframe`, `img`, `svg`, `math` y eventos.
5. Guarda el HTML saneado, no el crudo, si se reutiliza.

## 6. CSRF (A01, A04)

- `security.checkOrigin: true` (default de Astro).
- Cookies de sesión con `SameSite=Lax` o `Strict`.
- Mutaciones solo por `POST/PUT/PATCH/DELETE`; nunca `GET`.
- Si la API usa cookies en cross-origin (`SameSite=None`), exige token CSRF
  double-submit y verifica `Origin` en el servidor.
- CORS con allowlist explícita; nunca `Access-Control-Allow-Origin: *` junto a
  `credentials: true`.
- Un header personalizado (`X-Requested-With`) ayuda, pero no sustituye CSRF.
- Formularios nativos de Astro: incluye el token que emita el backend.

## 7. Control de acceso (A01)

- Cada ruta y cada llamada se autoriza en la API. Las guardas de ruta son UX.
- No derives el rol de `localStorage`, de un query param ni de un JWT decodificado
  sin validar firma en el servidor.
- No renderices datos sensibles en HTML estático. Si usas `output: 'static'`, no
  incluyas información por usuario en el build.
- No uses IDs predecibles como control de acceso; la API debe verificar
  propiedad/relación (IDOR).
- Las acciones masivas también se autorizan por elemento en el servidor.
- Al cambiar de rol/empresa, invalida la sesión y recarga los permisos.
- Los enlaces profundos a un recurso sin permiso muestran 403, no 404 ambiguo.

## 8. Subida de archivos (A04, A05)

- El cliente valida tipo/tamaño para UX; el servidor valida contenido real
  (magic bytes), tamaño, cantidad y permisos.
- Allowlist de tipos: PDF, DOCX, JPG, PNG. No SVG ni HTML de usuario.
- Límite por archivo (p. ej. 10 MB) y por solicitud; mensaje antes de subir.
- No confíes en `Content-Type` ni en la extensión.
- Almacena fuera del web root o en almacenamiento con URLs firmadas.
- Descarga con `Content-Disposition: attachment` para tipos no visibles.
- Renombra archivos en el servidor; nunca uses el nombre original como ruta.
- Vista previa: `blob:` URL y `URL.revokeObjectURL` al cerrar; no incrustes
  PDFs/HTML de usuario en el mismo origen.
- Elimina EXIF de imágenes en el servidor (privacidad).
- Registra quién sube/descarga; no registres el contenido.

## 9. Dependencias y cadena de suministro (A06, A08)

- `bun.lock` versionado. CI con `bun install --frozen-lockfile`.
- `bun audit` en CI y semanalmente; corrige o documenta excepciones.
- Renovate/Dependabot con revisión de changelog y prueba de build.
- Dependencias mínimas. Antes de añadir una librería, mide su costo en el
  bundle y busca una API nativa.
- No instales paquetes con `postinstall` sin revisarlos; usa `bun pm trust`
  explícitamente.
- Sin `<script src="https://...">` de terceros. Si es inevitable: versión fija,
  `integrity` (SRI), `crossorigin="anonymous"`, CSP con el origen exacto y
  revisión de privacidad.
- Verifica nombres de paquetes (typosquatting) y autoría.
- No ejecutes código de `dist/` de terceros sin verificar el origen.

Ejemplo SRI (último recurso):

```html
<script
  src="https://cdn.example.com/lib-1.2.3.min.js"
  integrity="sha384-BASE64"
  crossorigin="anonymous"
  defer
></script>
```

## 10. Secretos y variables de entorno (A02, A05)

- `PUBLIC_*` termina en el bundle. Nunca pongas API keys, tokens, contraseñas,
  cadenas de conexión ni llaves privadas.
- Los secretos reales viven en el servidor o en el gestor de secretos del
  hosting.
- `.env` fuera de git; `.env.example` solo con nombres y valores falsos.
- Valida variables con `astro:env` y falla el build si faltan.
- No imprimas variables de entorno en logs de build.
- Rota cualquier secreto que haya estado en un bundle o en un repo.

```ts
// astro.config.mjs
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  env: {
    schema: {
      PUBLIC_API_URL: envField.string({ context: 'client', access: 'public' }),
    },
  },
});
```

## 11. Logging y errores (A09)

- Sin `console.log` de datos de usuario, tokens, correos, teléfonos, CURP, RFC
  ni cuerpos de request.
- `console.error` solo para fallos inesperados, sin payload.
- Reporte de errores (si se usa): scrubbing de PII, cookies y headers; muestra
  de eventos; retención definida.
- UI: mensaje comprensible + ID de referencia. Nunca stack trace, SQL, ruta
  interna ni nombre de tabla.
- Eventos de seguridad (login fallido, cambio de rol, descarga masiva) se
  registran en el servidor.
- CSP: si usas cabecera de reporte, define `report-to`/`report-uri` y revisa
  los reportes. Con la CSP en meta de Astro, no hay reporte; usa cabecera si
  lo necesitas.
- No incluyas PII en `title`, `alt`, `data-*` ni en el HTML inicial.

## 12. SSRF, redirects y terceros (A10)

- Proxies/endpoints de Astro: allowlist de hosts y rutas; nunca aceptes una URL
  arbitraria del usuario.
- Imágenes remotas: `image.remotePatterns` con host y protocolo exactos.
- Redirects: solo rutas internas con `safeNext` (sección 4).
- Webhooks/avatares: solo `https`, host allowlist, timeout y límite de tamaño.
- OAuth: `state` validado, `redirect_uri` exacta registrada, PKCE.
- Analytics/terceros: mínimo necesario, sin PII, con consentimiento si aplica y
  CSP que permita solo ese origen.
- No uses el backend como proxy abierto para evitar CORS.

## 13. Checklist de revisión de PR

- [ ] No hay `innerHTML`, `set:html` dinámico, `eval`, `new Function`,
      `document.write`.
- [ ] No hay tokens ni PII en `localStorage`/`sessionStorage`/URLs.
- [ ] No hay secretos en `PUBLIC_*` ni cadenas de conexión.
- [ ] Enlaces externos con `rel="noopener noreferrer"` y esquema validado.
- [ ] Formularios no usan `GET` para mutar; la API valida autorización.
- [ ] Subidas: tipo/tamaño en UI + validación real en servidor.
- [ ] Imágenes remotas y redirects con allowlist.
- [ ] Sin `console.*` con datos reales.
- [ ] CSP y headers verificados en `preview`/deploy.
- [ ] `bun audit` sin críticos sin justificar.
- [ ] `dist/` sin sourcemaps, `.env`, páginas demo ni assets del starter.
- [ ] Errores de UI genéricos; sin stack traces.
- [ ] Un 401/403 no revela existencia de recursos.
- [ ] El build no incluye datos de prueba ni usuarios reales.
- [ ] `audit-ui.mjs` sin errores.

## 14. Verificación rápida después del build

```sh
bun run build
node .opencode/skills/psa-design-standard/scripts/check-budget.mjs

# CSP y headers (con preview o deploy)
grep -o 'http-equiv="content-security-policy"[^>]*' dist/index.html
curl -sI https://psa.example.mx | sort

# Secretos y artefactos
grep -RIn --exclude-dir=node_modules --exclude-dir=.git \
  -E '(API_KEY|SECRET|PASSWORD|PRIVATE_KEY|postgres://|mysql://)' src public dist || true
find dist -name '*.map' -o -name '.env*'
```

Si algo falla, no lo silencies con `unsafe-inline`, `*` en CORS ni
`PUBLIC_` para “que funcione”. Corrige la causa.
