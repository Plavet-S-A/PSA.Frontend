# ADR-0001: Sesión SSR en cookie HttpOnly

- **Estado:** aceptado
- **Fecha:** 2026-10-26
- **Decisores:** Equipo PSA
- **Referencias:** `src/middleware.ts`, `src/lib/auth/`, `docs/architecture.md`

## Contexto

El frontend necesita proteger el panel y los módulos de gestión desde el primer
request. Todavía no existe una API de identidad corporativa, pero la base no
puede depender de ocultar botones ni de un guard de JavaScript: eso dejaría las
páginas accesibles por URL directa.

La demostración debe ser usable, no un mock visual: credenciales validadas,
sesión con expiración y cierre de sesión. A la vez, no se pueden guardar tokens
en `localStorage` por el riesgo de XSS y no se debe exigir una infraestructura
externa para ejecutar el repo.

## Decisión

Usar Astro en SSR con el adaptador `@astrojs/node` en modo `standalone` y una
cookie de sesión firmada:

1. El login es una isla Solid que envía `POST /api/auth/login` con `fetch`.
2. El endpoint aplica rate limit en memoria, valida la contraseña con
   PBKDF2-SHA256 (600 000 iteraciones, sal por cuenta, comparación de tiempo
   constante) y firma un JWT HS256 con vigencia de ocho horas.
3. El JWT viaja en `psa_session` con `HttpOnly`, `SameSite=Lax`, `Path=/` y
   `Secure` en producción.
4. `src/middleware.ts` valida la cookie en cada request, publica el usuario en
   `Astro.locals.user` y redirige a `/iniciar-sesion?next=<ruta>` cuando falta
   una sesión válida.
5. El cierre de sesión solo acepta `POST /api/auth/logout` y elimina la cookie.
6. `PSA_SESSION_SECRET` es obligatorio en producción y se lee de `process.env`
   en tiempo de ejecución; en desarrollo existe un secreto de respaldo.

Las cuentas demo y sus hashes viven solo en el servidor. La credencial inexistente
también ejecuta PBKDF2 con un hash de relleno para no filtrar por tiempo qué
cuentas existen.

## Consecuencias

### Positivas

- Las rutas privadas se protegen en el servidor, antes de renderizar.
- El navegador nunca puede leer el token; un XSS no obtiene la sesión.
- El flujo completo se prueba sin servicios externos.
- El secreto no se embebe en el bundle cliente.

### Negativas o costo

- El despliegue requiere Node o un runtime compatible con el adaptador; no es
  un sitio puramente estático.
- El rate limit es de un proceso. Con varias instancias hay que moverlo a Redis
  o al proveedor.
- La lista de usuarios demo se reemplaza cuando exista la API real.
- La autorización de secciones por rol está implementada en la demo
  (`src/lib/ui/permissions.ts` + middleware). La autorización de datos por
  estudiante o empresa queda para el backend.

### Riesgos y mitigación

- **Secreto débil o ausente:** el servidor falla de forma segura en producción y
  rechaza secretos de menos de 32 caracteres.
- **Fuerza bruta:** límite de cinco intentos por minuto por IP en la demo.
- **Open redirect en `next`:** el cliente normaliza con `URL` y exige el mismo
  origen antes de navegar.
- **Cookies en HTTP:** `Secure` se activa en producción; el sitio debe servirse
  por HTTPS.

## Alternativas consideradas

| Alternativa | Por qué no |
| --- | --- |
| SPA con JWT en `localStorage` | Expone el token a XSS y no protege el render inicial |
| Guard solo en el cliente | Las URLs privadas siguen siendo accesibles |
| Astro Sessions con almacenamiento en archivos | Válido, pero añade estado en disco y no demuestra la firma/expiración explícita que se busca |
| Basic Auth del servidor | No permite formulario propio, roles ni cierre de sesión |
| Proveedor de identidad externo | Fuera del alcance y bloquea la demo local |

## Cómo se verifica

- `bun run check:csp` inicia sesión contra el build de producción y comprueba
  que la cookie sea `HttpOnly`, `Secure` y `SameSite=Lax`.
- Pruebas manuales con `curl`: sin cookie, `/panel` responde 302; con cookie,
  200; contraseña incorrecta, 401; logout, 303 y cookie eliminada.
- `bunx astro check` y el smoke test de navegador cubren login, rutas privadas y
  cierre de sesión.

## Notas de migración

Al integrar la API real:

1. Sustituir `findDemoUser`/`verifyPassword` por la llamada de identidad.
2. Mantener la cookie HttpOnly o cambiar a la sesión que emita el backend.
3. Mover el rate limit a un almacén compartido.
4. Reemplazar los permisos de demostración por los del backend y filtrar la
   navegación con datos del servidor.
