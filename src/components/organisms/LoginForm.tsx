/**
 * LoginForm — formulario de acceso con credenciales.
 *
 * Capa: organism
 * Props: ninguno
 * Efectos: envía el POST a /api/auth/login y redirige tras autenticar.
 */
import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Alert from '@/components/molecules/Alert';
import FormField from '@/components/molecules/FormField';
import { PANEL_PATH } from '@/lib/ui/navigation';
import { isValidCredential } from '@/lib/validation/credential';

/** Destino posterior al acceso, sin permitir redirecciones externas. */
function resolveNextPath(): string {
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next) return PANEL_PATH;

  try {
    // Normaliza también variantes como `/\evil.example` que el navegador
    // interpreta como otro origen.
    const target = new URL(next, window.location.origin);
    if (target.origin !== window.location.origin) return PANEL_PATH;
    if (target.pathname.startsWith('/api/')) return PANEL_PATH;
    return `${target.pathname}${target.search}`;
  } catch {
    return PANEL_PATH;
  }
}

export const LoginForm: Component = () => {
  const [credential, setCredential] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [pending, setPending] = createSignal(false);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    setError('');

    if (!isValidCredential(credential())) {
      setError('Escribe una credencial numérica de 4 a 12 dígitos.');
      return;
    }
    if (password().length === 0) {
      setError('Escribe tu contraseña.');
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credential().trim(), password: password() }),
      });

      if (response.ok) {
        window.location.assign(resolveNextPath());
        return;
      }

      setError(
        response.status === 429
          ? 'Demasiados intentos. Espera un minuto antes de volver a intentar.'
          : 'La credencial o la contraseña no son correctas.',
      );
    } catch {
      setError('No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setPending(false);
    }
  };

  return (
    <form class="auth__form" onSubmit={submit} noValidate>
      <Show when={error()}>
        <Alert tone="error">{error()}</Alert>
      </Show>

      <FormField
        id="login-credential"
        label="Credencial"
        type="text"
        value={credential()}
        onInput={setCredential}
        placeholder="Ej. 12345678"
        autocomplete="username"
        inputmode="numeric"
        maxlength={12}
        hint="Solo números, sin espacios."
        required
      />

      <FormField
        id="login-password"
        label="Contraseña"
        type="password"
        value={password()}
        onInput={setPassword}
        placeholder="Tu contraseña"
        autocomplete="current-password"
        required
      />

      <Button type="submit" variant="primary" size="lg" block loading={pending()}>
        {pending() ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
};

export default LoginForm;
