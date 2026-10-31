/*
 * Aplica el tema antes del primer pintado para evitar el destello claro.
 * Se sirve como archivo externo para que la CSP no dependa de un hash inline.
 */
(() => {
  try {
    const stored = localStorage.getItem('psa-theme');
    const theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.dataset.theme = theme;
  } catch {
    /* Sin almacenamiento disponible: se usa el tema del sistema. */
  }
})();
