/**
 * Preferencias de interfaz de los espacios de trabajo.
 *
 * Capa: lib/storage
 * Solo guarda decisiones de presentación en el navegador; no contiene datos de
 * negocio ni credenciales.
 */

const MASTER_HIDDEN_PREFIX = 'psa:workspace:master-hidden:';

/**
 * Consulta si el panel de talleres está oculto para una sección.
 *
 * @param scope Identificador estable de la sección, por ejemplo `plazas`.
 * @returns true si la persona ocultó el panel en este navegador.
 */
export function loadMasterHidden(scope: string): boolean {
  try {
    return localStorage.getItem(`${MASTER_HIDDEN_PREFIX}${scope}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Guarda la visibilidad del panel de talleres.
 *
 * @param scope Identificador estable de la sección.
 * @param hidden true para ocultarlo.
 */
export function saveMasterHidden(scope: string, hidden: boolean): void {
  try {
    if (hidden) {
      localStorage.setItem(`${MASTER_HIDDEN_PREFIX}${scope}`, 'true');
    } else {
      localStorage.removeItem(`${MASTER_HIDDEN_PREFIX}${scope}`);
    }
  } catch {
    /* La preferencia es opcional; el panel sigue funcionando. */
  }
}
