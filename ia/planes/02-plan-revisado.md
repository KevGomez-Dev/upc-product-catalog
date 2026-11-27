# Fase 2 · Plan revisado

La fase 2 autoriza solo la inicialización técnica. Antes de avanzar a HU-01, el candidato revisará el diff y decidirá el commit. El [plan inicial](01-plan-inicial.md) conserva el detalle de requisitos y el inventario del CSV. Las [decisiones](../decisiones.md) distinguen aprobación humana y propuestas.

## Base técnica y comprobación local

1. Seleccionar Node.js 22 con `nvm use` o un gestor equivalente. Ejecutar `npm ci` en la raíz para instalar los dos workspaces.
2. Crear `.env` a partir de `.env.example` si todavía no existe. Sustituir el marcador de JWT por un secreto generado localmente con `openssl rand -hex 32`. La API valida ese secreto aunque el login se implemente más adelante. `API_PORT` es opcional y por defecto vale 3000. Para usar otro puerto, especificar también el origen correspondiente en `web/.env.local` a partir de `web/.env.example`.
3. Ejecutar `docker compose up -d --wait db` sobre un entorno local de prueba. El Compose original proporciona PostgreSQL y el CSV montado de solo lectura.
4. Ejecutar `npm run dev` para iniciar ambos procesos o `npm run dev:api` y `npm run dev:web` por separado. Next escucha en `http://127.0.0.1:3001` y Nest en `http://127.0.0.1:3000`. Esta fase inicia Nest con conexión de BD y sin controladores de catálogo.
5. Ejecutar `npm run validate` para lint, formato, builds, tipos y pruebas de entorno. `npm test` prepara y ejecuta las pruebas de API. Para migraciones, usar `npm run migration:show -w api`, `npm run migration:run -w api` o `npm run migration:revert -w api`. Crear la primera migración en HU-01 con `npm run migration:create -w api -- src/database/migrations/CatalogSchema`.

## Presupuesto y orden después de la revisión

Al estimar a las 15:38 de Santiago del 27 de noviembre (12:38 de El Salvador), quedaban unas 7 h 22 min hasta las 22:00 de El Salvador de ese día, si ese es el corte confirmado por el reclutador. El PDF indica la hora y la fecha de versión. El presupuesto propuesto usa 410 minutos y deja unos 32 minutos para revisión y variaciones del horario. Recalcular al aprobar el siguiente bloque y confirmar la fecha absoluta del corte antes del envío.

| Bloque | Tiempo | Resultado y commit sugerido |
| --- | ---: | --- |
| HU-01 | 85 min | Entidades, migraciones, CLI y pruebas de CSV, conciliación, conservación de literales e idempotencia. Verificar en BD los conteos esperados. `feat(import): cargar catálogo con trazabilidad` |
| HU-03 | 60 min | Credenciales demo con hash, JWT, guardias y pruebas de login, 401 y 403. `feat(auth): proteger acceso al catálogo` |
| HU-02 y HU-04 · API | 65 min | CRUD y consultas de clasificación, validación, auditoría y pruebas de unicidad y permisos. `feat(products): agregar CRUD y clasificación` |
| HU-02 a HU-04 · Web | 100 min | Adaptador, sesión y pantallas de listado, detalle y CRUD, con verificación de los dos roles. `feat(web): completar catálogo por rol` |
| Validación obligatoria | 45 min | Ejecutar pruebas, recorrer ambos roles y verificar una instalación limpia. Registrar resultados reales. Hacer commits de correcciones concretas cuando proceda. |
| README y entrega | 55 min | Documentar arranque, carga, decisiones y desviaciones. Revisar evidencia de IA, preparar defensa y comprobar enlace público antes del corte. `docs: documentar instalación y entrega` |

Si sobra tiempo después de verificar HU-01 a HU-04, priorizar HU-E1 con Jest, HU-E2 con salud de API y PostgreSQL y HU-E3 si el comportamiento aún falta. La pareja categoría/subcategoría válida forma parte de HU-02 desde el inicio. El candidato conserva control de commits y publicación.

## Evidencia de la fase 2

- En Node.js 22.19.0, `npm install` y una reinstalación limpia con `npm ci --offline` resolvieron 660 paquetes. La instalación avisó de deprecación de ESLint 9 y de dos dependencias transitivas. Se conservó ESLint 9 porque los plugins incluidos con la configuración de Next declaran compatibilidad hasta esa versión.
- `npm run validate` pasó lint, formato, compilación de Nest y Next, chequeo estricto de tipos y las cuatro pruebas de configuración. El primer intento de Turbopack quedó bloqueado al abrir un puerto dentro del sandbox. La validación completa con permisos locales pasó.
- `docker compose config --quiet` validó el Compose original. PostgreSQL 16 alcanzó estado healthy en un proyecto de prueba aislado con puerto limitado a loopback mediante un override temporal. TypeORM ejecutó `SELECT 1` en `productos_upc` y el CLI ejecutó `migration:show` sin migraciones de negocio. El contenedor de prueba quedó detenido.
- Con los builds de producción, Nest respondió en 3000 con el 404 esperado para la raíz y Next respondió en 3001 con HTTP 200 y el título de la pantalla base.
- `git check-ignore` confirmó la exclusión de archivos de entorno locales, claves, dependencias, compilaciones y cobertura. Las dos plantillas de entorno están disponibles para versionar.
