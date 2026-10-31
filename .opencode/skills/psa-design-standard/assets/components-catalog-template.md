# Catálogo de componentes

Actualiza esta tabla al crear, renombrar o retirar un organismo, template o
layout. Los átomos y moléculas se documentan en su docblock; agrégalos aquí solo
si los usa más de un dominio o si su contrato no es evidente.

| Componente | Capa | Dominio | Propósito | Props principales | Usado en |
| --- | --- | --- | --- | --- | --- |
| `AppSidebar` | organism | shell | Navegación principal filtrada por rol | `user`, `currentPath` | `AppLayout` |
| `PageHeader` | organism | shell | Título, descripción y acciones de una página | `title`, `description`, `actions` | `ListPageTemplate`, `DetailPageTemplate` |
| `PracticantesTable` | organism | practicantes | Lista paginada de practicantes | `rows`, `total`, `page`, `pageSize` | `practicantes/index.astro` |
| `ListPageTemplate` | template | shell | Esqueleto de página de lista con filtros y paginación | `title`, `filters`, `table`, `pagination` | Varias páginas de lista |

Reglas:

- Una fila por componente; nombre exacto del archivo con backticks.
- `Propósito` en una frase: qué problema resuelve, no cómo está hecho.
- `Props principales` solo nombres; los tipos viven en el código.
- `Usado en` apunta al layout, template o página que lo compone.
- Si la tabla crece, agrúpala por dominio. Al renombrar, actualiza la fila y
  todas las referencias; no dejes filas obsoletas.
- El catálogo se actualiza en el mismo PR que el componente.
