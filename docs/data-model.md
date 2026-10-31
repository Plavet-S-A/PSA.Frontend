# Modelo de datos de referencia

Este documento relaciona las pantallas del frontend con el esquema de base de
datos de PSA. **No implementa backend ni conexión a PostgreSQL**: las filas de
los módulos siguen siendo datos de demostración guardados en el navegador.

La referencia sirve para tres cosas:

- Mantener nombres y relaciones coherentes cuando se conecte la API real.
- Evitar que el frontend trate llaves foráneas o metadatos internos como datos
  editables.
- Documentar qué información puede mostrarse en la consulta de detalle sin
  exponer secretos ni rutas privadas de almacenamiento.

## Contrato de configuración

Cada módulo declara su pantalla en un `ResourceConfig`:

| Propiedad | Uso |
| --- | --- |
| `primaryKey` | Identifica la fila en tabla, detalle y mensajes de acciones. |
| `statusKey` | Campo de estado que alimenta el filtro y el `Badge`. |
| `columns` | Columnas de la tabla, con etiqueta, formato y columna secundaria. |
| `fields` | Campos del formulario de alta y edición. |
| `detailFields` | Atributos de la consulta, en orden y agrupados por sección. |
| `normalizeRow` | Migra filas antiguas o completa valores faltantes al cargar. |
| `deriveRow` | Calcula etiquetas y valores de presentación antes de guardar. |
| `importConfig` | Habilita CSV/XLSX, alias de encabezados, límite de filas y llaves únicas. |
| `filters` | Filtros contextuales del módulo: tipo `multi` (varios valores, opcionalmente con buscador) o `boolean` (Sí/No sobre el valor de la fila). |

Los filtros declarados en `config.filters` se combinan con el filtro de estado
y se aplican en el cliente. Los filtros booleanos interpretan el valor de la
fila: cero, cadena vacía o «No» significan falso; cualquier otro valor, verdadero.
Por eso `restriccion_edad` se filtra como «Restricción de edad: Sí/No» y no por
la edad exacta.

`ResourceDetailDialog` solo renderiza `detailFields`; no vuelca la fila completa.
Esto mantiene fuera de la vista `id`, todas las llaves `id_*`, referencias
internas no declaradas y cualquier valor que el catálogo no haya decidido
exponer. La ficha tampoco imprime el identificador de persistencia.
`ResourceFormDialog` soporta campos `textarea`, por lo que las observaciones y
descripciones largas se capturan sin convertir el formulario en una tabla de
texto.

## Correspondencia por módulo

| Pantalla | Tablas principales | Atributos del esquema modelados | Etiquetas derivadas |
| --- | --- | --- | --- |
| Estudiantes | `estudiante`, `usuario`, `direccion`, `taller`, `ciclo_escolar`, `poliza` | `nombre`, `apellido`, `fecha_nacimiento`, `nacionalidad`, `sexo`, `pasaporte`, `email_contacto`, `telefono`, `direccion`, `horas_pasantia_realizadas`, `fecha_inicio_pasantia`, `fecha_fin_pasantia`, `id_usuario`, `id_taller`, `id_ciclo`, `id_poliza`, `id_direccion`, `id_tenant` | `nombreCompleto`, `taller`, `ciclo`, `poliza`; `usuario` como referencia de lectura |
| Centros de trabajo | `centro_trabajo`, `direccion`, `usuario` | `nombre`, `validacion`, `restriccion_edad`, `email_contacto`, `telefono`, `direccion`, `fecha_creacion`, `id_usuario`, `id_direccion`, `id_tenant` | `usuario` como referencia de lectura |
| Talleres | `taller`, `familia_profesional` | `nombre`, `familia`, `codigo_titulo`, `horas_pasantia`, `id_familia`, `id_tenant` | `familia` como nombre legible de la familia profesional |
| Tutores académicos | `tutor_academico`, `usuario`, `taller`, `direccion` | `nombre`, `apellido`, `puesto`, `email_contacto`, `telefono`, `direccion`, `fecha_creacion`, `id_usuario`, `id_taller`, `id_direccion`, `id_tenant` | `nombreCompleto`, `taller` |
| Tutores empresariales | `tutor_empresarial`, `usuario`, `direccion` | `nombre`, `apellido`, `email_contacto`, `telefono`, `direccion`, `fecha_creacion`, `id_usuario`, `id_taller`, `id_direccion`, `id_tenant` | `nombreCompleto`, `taller`, `empresa`; el alcance por centro se resuelve en la API |
| Supervisores | `supervisor`, `centro_trabajo` | `nombre`, `apellido`, `email_contacto`, `telefono`, `fecha_creacion`, `id_centro_trabajo`, `id_tenant` | `nombreCompleto`, `centroTrabajo` |
| Vinculadores | `administrador`, `usuario` | `nombre`, `apellido`, `puesto`, `email_contacto`, `telefono`, `fecha_creacion`, `id_usuario`, `id_tenant` | `nombreCompleto`; el rol y el tenant se resuelven en el servidor |
| Usuarios | `usuario`, `actividad_reciente` | `nombre`, `username`, `email`, `rol`, `estado`, `cuenta_bloqueada`, `intentos_fallidos`, `fecha_creacion`, `ultimaActividad`, `id_rol`, `id_tenant` | `ultimaActividad` como fecha de consulta |
| Documentación | `documento`, `estudiante` | `tipo`, `fecha_creacion`, `estado`, `bucket`, `storage_path`, `id_estudiante`, `id_taller` | `estudiante`, `taller`; `bucket` y `storage_path` solo se muestran como referencia |
| Evaluación | `evaluacion_estudiante`, `calificacion_estudiante`, `evaluacion_centro_trabajo`, `pasantia` | `ra`, `asistencia`, `desempeno`, `disponibilidad`, `responsabilidad`, `limpieza`, `trabajo_equipo`, `resolucion_problemas`, `espacio_trabajo`, `asignacion_tareas`, `disponibilidad_centro`, `observaciones`, `observaciones_centro`, `fecha`, `fecha_centro`, `promedio`, `estado`, `id_evaluacion`, `id_estudiante`, `id_pasantia` | `estudiante`, `taller`, `plaza`; `calificacion` es un alias derivado de `promedio` para las plantillas |
| Plazas | `plaza`, `centro_trabajo`, `taller` | `id_centro_trabajo`, `id_taller`, `cantidad`, `fecha_creacion`, `estado`, `edad_minima`, `genero`, `observacion`, `solicitadoPor`, `fecha_solicitud` | `centroTrabajo`, `taller`, `plaza` (`centro · taller`) |
| Proceso de pasantía | `pasantia`, `asistencia_pasantia`, `excusa`, `visita`, `visita_estudiante`, `poliza` | `etapa`, `avance`, `horas_acumuladas`, `fecha_creacion`, `asistencias`, `faltas`, `visitas`, `ultima_visita`, `poliza`, `id_pasantia`, `id_estudiante`, `id_plaza`, `id_centro_trabajo`, `id_supervisor` | `estudiante`, `taller`, `plaza`, `centroTrabajo`, `supervisor` |

Las llaves `id_*` forman parte del modelo y de la persistencia, pero no se
muestran en tablas, fichas ni mensajes. Las relaciones se presentan con sus
etiquetas resueltas (`taller`, `ciclo`, `plaza`, `centroTrabajo`, `usuario`).

En tutores empresariales, `empresa` es una etiqueta derivada de la dirección o
del dominio del correo de contacto para el filtro y la tabla; no se edita en la
ficha. En producción, el centro de trabajo real se resuelve en la API.

`promedio` es el valor que la tabla y el detalle de evaluación muestran. El
campo heredado `calificacion` no se presenta como columna independiente: se
conserva como alias igual a `promedio` para que las plantillas y documentos ya
guardados sigan funcionando.

## Importación de estudiantes

`estudiantesConfig.importConfig` habilita un flujo que acepta `.csv` y `.xlsx`:

- Cada encabezado se compara sin acentos ni mayúsculas contra la llave, la
  etiqueta y los alias declarados. Los encabezados desconocidos se ignoran.
- Las fechas aceptan ISO, `dd/mm/aaaa` y la serie numérica de Excel; los selects
  se normalizan a la opción canónica y los números a formato decimal.
- Se aplican las reglas de `validateResourceForm`, se detectan correos repetidos
  contra las filas existentes y dentro del mismo archivo, y se muestra una vista
  previa antes de persistir.
- El archivo se procesa en el navegador con límites de 5 MB, 1 000 filas de
  importación y 20 MB de XML descomprimido. El contenido no se evalúa ni se
  inserta como HTML.

## Reglas para la consulta de detalle

`ResourceDetailDialog` recibe una `ResourceRow`, lee `detailFields` y agrupa los
valores por `section`, conservando el orden declarado. Para conectar la API:

1. Incluir en la respuesta de lista los campos de detalle necesarios o resolver
   un endpoint de detalle por registro.
2. Enviar etiquetas legibles para relaciones (`taller`, `ciclo`, `plaza`,
   `centroTrabajo`, `usuario`) en lugar de obligar a la UI a resolver llaves
   foráneas.
3. Mantener fuera de la fila los secretos, tokens, hashes y rutas internas.
   `password`, `reset_token` y `reset_token_expiry` nunca deben llegar al
   cliente.
4. Tratar `bucket` y `storage_path` como metadatos de referencia: el frontend no
   construye rutas ni URLs firmadas con ellos.
5. Repetir la autorización de lectura en el servidor; ocultar un botón no
   protege un dato.
6. Aplicar `id_tenant` y el alcance por rol en cada consulta.

## Persistencia y migración actual

- `localStorage['psa:data:<módulo>']` guarda las filas de demostración. Las
  escrituras parciales (estudiante o tutor) se marcan como `partial` y se
  combinan con las filas del alcance al cargar; las completas sustituyen la
  instantánea. Una lista de identificadores eliminados impide revivirlos.
- `localStorage['psa:grading:templates']` y `psa:grading:documents` guardan las
  plantillas y los documentos de calificación.
- `localStorage['psa-sidebar']` guarda el sidebar expandido o compacto.
- `localStorage['psa:workspace:master-hidden:<sección>']` recuerda si se ocultó
  la lista de talleres en plazas, documentación o evaluación.
- Al cargar, `loadResourceRows` combina las filas guardadas con las filas semilla
  por `id`. Así, los registros de demostración heredan columnas nuevas sin
  resucitar registros eliminados.
- `normalizeRow` migra llaves conocidas de versiones anteriores:
  `correo` → `email_contacto`, `fecha` → `fecha_creacion`,
  `vacantes` → `cantidad` y `calificacion` → `promedio`.
- Las personas se presentan con `personFullName`. `normalizePersonName` evita
  duplicar el apellido cuando una fila heredada ya lo incluía en `nombre`; las
  filas sin `apellido` se completan al editar el registro.
- Las plazas antiguas que usaban `empresa`, `puesto` o `modalidad` se convierten
  a `centroTrabajo`, `taller` y una etiqueta `plaza` derivada.
- Una solicitud de plaza de tutoría empresarial es una fila de `plaza` con
  `estado = 'En revisión'`, `solicitadoPor` y `fecha_solicitud`; vinculación la
  autoriza cambiando el estado. En producción la revisión ocurrirá en el
  servidor, no en `localStorage`.
- `localStorage` no sustituye una base de datos y no debe usarse para datos
  personales reales.
