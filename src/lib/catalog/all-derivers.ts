/**
 * Entrada de cliente para los derivadores de catálogo.
 *
 * Capa: lib/catalog
 * Importa todos los módulos de catálogo para que sus llamadas de nivel de
 * módulo a `registerDerivers` se ejecuten en el navegador. Astro no serializa
 * funciones en los props de las islas, por lo que `normalizeRow` y
 * `deriveRow` llegan como `undefined` al cliente; este archivo asegura que
 * queden registradas por nombre para poder resolverse con
 * `resolveNormalizeRow` / `resolveDeriveRow`.
 */

import '@/lib/catalog/centros-trabajo';
import '@/lib/catalog/documentacion';
import '@/lib/catalog/estudiantes';
import '@/lib/catalog/evaluacion';
import '@/lib/catalog/excusas';
import '@/lib/catalog/cierre-pasantia';
import '@/lib/catalog/plazas';
import '@/lib/catalog/proceso-pasantia';
import '@/lib/catalog/supervisores';
import '@/lib/catalog/talleres';
import '@/lib/catalog/tutores';
import '@/lib/catalog/tutores-empresariales';
import '@/lib/catalog/usuarios';
import '@/lib/catalog/vinculadores';
