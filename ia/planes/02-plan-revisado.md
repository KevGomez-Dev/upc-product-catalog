# Plan revisado de implementación

El [plan inicial](01-plan-inicial.md) conserva el análisis y el inventario del CSV. Las [decisiones](../decisiones.md) registran el alcance aprobado por el candidato.

| Orden | Entrega y dependencia |
| --- | --- |
| Base técnica | Node.js 22, npm workspaces, NestJS, Next.js, TypeORM y Compose. Validar arranque y configuración antes de persistir el catálogo. |
| HU-01 | Crear migraciones, carga inicial auditable y usuarios demo. Verificar en PostgreSQL integridad, conteos e idempotencia antes de usar el catálogo. |
| HU-03 | Usar los usuarios demo de HU-01 para implementar login, JWT y guardias. Verificar 401 y 403 antes de exponer las rutas protegidas. |
| HU-02 y HU-04 · API | Implementar CRUD, consultas de clasificación, auditoría y validaciones usando el catálogo y los guardias. |
| HU-02 a HU-04 · Web | Integrar la sesión y el catálogo con la API. Verificar listado y detalle para ambos roles, y mutaciones para admin. |
| Validación y entrega | Reproducir desde un checkout limpio, verificar aceptación de ambos roles, completar el README y revisar la trazabilidad antes de publicar. |

Incorporar pruebas relevantes en cada bloque. Priorizar HU-01 a HU-04. La adopción de Jest comienza con HU-01, según la instrucción de fase 3. Completar la cobertura adicional de HU-E1 y evaluar HU-E2 y HU-E3 cuando el flujo obligatorio pase aceptación.

## Comprobación local de la base

Seleccionar Node.js 22 y ejecutar `npm ci`. Crear `.env` desde la plantilla, sustituir el marcador de JWT por un secreto local y levantar PostgreSQL con `docker compose up -d --wait db`. Usar `npm run dev` para levantar Nest en 3000 y Next en 3001. `npm run validate` comprueba compilación, tipos, lint, formato y pruebas.

La validación de fase 2 confirmó el arranque de ambos workspaces, el Compose original y una conexión TypeORM a PostgreSQL con `SELECT 1`.
