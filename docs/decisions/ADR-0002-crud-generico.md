# ADR-0002: CRUD genérico declarativo para los módulos

- **Estado:** aceptado
- **Fecha:** 2026-10-26
- **Decisores:** Equipo PSA
- **Referencias:** `src/components/organisms/ResourceManager.tsx`,
  `src/components/organisms/DocumentWorkspace.tsx`,
  `src/components/organisms/EvaluationWorkspace.tsx`, `src/lib/catalog/`,
  `src/lib/storage/resource-store.ts`

## Contexto

Los módulos comparten la misma forma: una lista con búsqueda, filtro de
estado, paginación, alta, edición y borrado. Escribir una isla por módulo
multiplicaría el código, el bundle y las inconsistencias de accesibilidad.

En esta etapa no hay API de negocio. Se necesita una demostración funcional que
persista mientras se navega, sin introducir un backend ficticio ni una base de
datos.

## Decisión

Implementar un único organismo Solid, `ResourceManager`, con `client:idle`, que
recibe una configuración declarativa y filas semilla:

```ts
interface ResourceManagerProps {
  config: ResourceConfig;
  initialRows: readonly ResourceRow[];
  readOnly?: boolean;
}
```

Cada módulo aporta su configuración en `src/lib/catalog/<módulo>.ts`:

- Identificador, singular, plural y descripción.
- Columnas de la tabla y formato (`status`, `mono`, `number`).
- Campos del formulario, tipos, opciones y validaciones.
- Estados disponibles y textos de alta/edición.
- Filtros contextuales (`config.filters`): selección múltiple, booleanos y
  buscador de opciones dentro del diálogo de filtros.

Los filtros de todas las tablas comparten una barra única: búsqueda, botón
«Filtros» que abre un diálogo y chips de filtros activos ordenados
alfabéticamente. Cada dimensión admite varios valores; los filtros booleanos
(`Sí`/`No`) se evalúan contra el valor de la fila y los listados largos de
relaciones (empresa, taller, centro de trabajo) incluyen buscador dentro del
diálogo.

La página renderiza las filas semilla en el servidor. Al hidratar, la isla lee
`localStorage['psa:data:<módulo>']`; si no existe o no es válido, conserva las
filas semilla. Las altas, ediciones y borrados se guardan en la misma clave.

La validación de campos es de experiencia de usuario (`lib/validation`); no se
considera un control de seguridad.

`readOnly` oculta el alta, la edición y el borrado para los roles que solo
consultan un catálogo o el proceso de pasantía. Al igual que el resto de la
autorización de la demo, la interfaz aplica el permiso y el middleware protege
la ruta; la API real deberá revalidar cada escritura.

## Consecuencias

### Positivas

- Un solo flujo de tabla, formulario, confirmación, paginación y toast para los
  módulos.
- Añadir un catálogo requiere configuración y una página delgada, no duplicar
  la isla.
- El HTML inicial contiene filas reales, así que la tabla es legible antes de
  hidratar.
- El bundle de la isla se comparte entre rutas.

### Negativas o costo

- La configuración es un contrato propio que hay que mantener documentado.
- Los datos no salen del navegador ni se sincronizan entre dispositivos.
- La tabla no está pensada para volúmenes grandes ni para edición concurrente.
- `localStorage` puede estar deshabilitado; en ese caso se muestran las filas
  semilla y los cambios no persisten.

### Riesgos y mitigación

- **Datos manipulados en el navegador:** se validan forma y tipos al cargar; aun
  así, no son datos confiables. La API real validará en servidor.
- **Pérdida de cambios:** el almacenamiento es local y no hay copia remota; es
  una limitación aceptada de la demo.
- **Crecimiento del organismo:** si supera el límite duro de 450 líneas, se
  separan tabla, formulario y estado en piezas más pequeñas.

## Adenda (2026-10-27): espacios de trabajo jerárquicos

Documentación y evaluación no encajan en una tabla plana: el flujo real es
taller → estudiante → documentos o calificación. Plazas también necesita una
lista maestra de talleres para filtrar su catálogo. Para esas rutas se crearon
`DocumentWorkspace`, `EvaluationWorkspace` y `PlazaWorkspace`, que reutilizan
`ResourceTable`, `ResourceFormDialog`, `ConfirmDialog`, `EmptyState`, `Toast` y
el almacenamiento local. Documentación y evaluación añaden el detalle por
estudiante; plazas conserva el taller elegido como filtro.

`ResourceManager` sigue siendo la opción para catálogos y para el proceso de
pasantía. Los permisos se resuelven en `src/lib/ui/permissions.ts`: el sidebar y
el middleware filtran secciones, `visibleTalleres` limita los talleres del tutor
empresarial y las capacidades (`canManageCatalogs`, `canManageDocuments`,
`canGrade`, `canManageProcess`) deciden qué acciones se muestran. El filtrado de
datos por empresa o estudiante en el servidor queda para la API real.

## Alternativas consideradas

| Alternativa | Por qué no |
| --- | --- |
| Un componente por módulo | Duplica lógica y estilos; las correcciones se aplican módulo por módulo |
| Backend ficticio con JSON Server | Añade proceso y despliegue que no se piden en esta etapa |
| Solo estado en memoria | Pierde los cambios al navegar o recargar |
| IndexedDB | Complejidad y API asíncrona innecesarias para filas pequeñas |
| Tabla + formulario en el servidor | Requiere endpoints y persistencia real; queda para la integración |

## Cómo se verifica

- El smoke test de navegador crea, edita, busca, filtra y elimina una fila, y
  recarga para comprobar la persistencia.
- `bunx astro check` valida los contratos de configuración y props.
- `check-architecture.mjs` comprueba capas y límites de tamaño.
- `check-budget.mjs` confirma que compartir la isla no excede el presupuesto.

## Notas de migración

Cuando exista la API real:

1. Sustituir `loadResourceRows`/`saveResourceRows` por un cliente HTTP.
2. Mantener `ResourceConfig` para la presentación, pero mover permisos y
   validaciones al servidor.
3. Añadir estados de carga, error y reintento en `ResourceManager`.
4. Evaluar paginación del servidor antes de superar unas pocas decenas de filas.
