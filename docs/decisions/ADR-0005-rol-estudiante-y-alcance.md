# ADR-0005: Rol estudiante y alcance de datos por taller

- **Estado:** aceptado
- **Fecha:** 2026-10-28
- **Decisores:** Equipo PSA
- **Referencias:** `src/types/auth.ts`, `src/lib/ui/permissions.ts`,
  `src/lib/catalog/student-context.ts`, `src/pages/mi-pasantia.astro`,
  `src/pages/documentacion.astro`

## Contexto

La demostración solo tenía roles de personal. Quien cursa la pasantía no podía
entrar a consultar su plaza, su tutor empresarial, sus calificaciones ni enviar
documentos o excusas, aunque esos son los flujos que justifican la plataforma.

Además, el tutor académico veía la documentación de todos los talleres. El
requisito es que solo consulte la de su taller; ocultar filas en el cliente no
basta porque el HTML seguiría entregando datos ajenos.

## Decisión

1. Agregar el rol `estudiante` a la sesión y al JWT. La sesión incluye
   `studentId` cuando aplica, para resolver la ficha sin depender del nombre.
2. Reservar el permiso `student` para cuatro pantallas propias: resumen de
   pasantía, documentos, calificaciones y excusas. El middleware protege las
   rutas; el panel redirige al estudiante a `/mi-pasantia`.
3. Resolver el contexto personal en `lib/catalog/student-context.ts`: pasantía,
   tutor empresarial del taller, evaluación, documentos y excusas. Las islas
   reciben solo las filas propias.
4. Fijar el alcance del tutor académico a su taller en
   `ROLE_TALLER_SCOPE` (demo: «Taller de empleabilidad», tut-001). La página de
   documentación filtra las filas en el servidor antes de pasarlas a la isla.
5. Mantener las excusas en el mismo almacén para personal y estudiante: el
   estudiante crea con estado `Pendiente`; el tutor acepta o rechaza y se
   registran `revisado_por` y `fecha_revision`.

## Consecuencias

### Positivas

- El rol que usa la plataforma a diario tiene un recorrido completo y acotado.
- Los datos de otros talleres no viajan en el HTML del tutor.
- El flujo de excusas tiene responsables y estados explícitos.
- El alcance se concentra en un solo mapa de permisos, reutilizado por sidebar,
  middleware y páginas.

### Negativas o costo

- La demostración añade una cuenta y filas de usuarios al catálogo.
- El alcance por taller sigue siendo estático; en producción lo resolverá la API
  con la asignación docente real.
- `localStorage` no separa cuentas: en un mismo navegador el personal puede ver
  datos creados por el estudiante. Es aceptable para la demo y no para
  producción.

### Riesgos y mitigación

- **Acceso por URL directa:** el middleware revalida el permiso y la página
  vuelve a comprobar el rol antes de renderizar datos personales.
- **Fuga de datos en props:** las páginas envían solo las filas del estudiante o
  del taller; no se confía en el filtrado del cliente.
- **Suplantación por nombre:** la resolución prioriza `studentId` de la sesión y
  usa el nombre solo como respaldo de datos semilla.

## Alternativas consideradas

| Alternativa | Por qué no |
| --- | --- |
| Un panel único con condicionales por rol | Mezcla responsabilidades y expone métricas globales al estudiante |
| Filtrar solo en el cliente | El HTML seguiría conteniendo documentos de otros talleres |
| Un backend ficticio para el alcance | Añade infraestructura sin resolver la demo |
| Roles por cadena de texto libre | Rompe la verificación del JWT y el mapa de permisos |

## Cómo se verifica

- `bun run check` y `bun run build`.
- Inicio de sesión con `20260010` y recorrido de las cuatro pantallas.
- Con `20260002`, el HTML de `/documentacion` solo contiene filas del «Taller de
  empleabilidad».
- Enviar una excusa como estudiante y aceptarla como tutor; recargar y confirmar
  estado, revisor y fecha.
