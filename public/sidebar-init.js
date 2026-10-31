/*
 * Aplica el estado compacto del sidebar antes del primer pintado.
 * Se sirve como archivo externo para que la CSP no dependa de un hash inline.
 */
(() => {
  try {
    if (localStorage.getItem('psa-sidebar') === 'collapsed') {
      document.documentElement.dataset.sidebar = 'collapsed';
    }
  } catch {
    /* Sin almacenamiento disponible: se usa el menú expandido. */
  }
})();
