# Catálogo de productos UPC

Aplicación para importar, consultar y administrar un catálogo UPC. Incluye carga idempotente desde CSV, dos roles, historial de importación, auditoría en UTC y un healthcheck de PostgreSQL. Implementada con **NestJS, Next.js App Router, React, TypeScript, TypeORM y PostgreSQL 16** en un monorepo npm.

```mermaid
flowchart LR
    Browser[Navegador] -->|Mismo origen y cookie HttpOnly| Web["Next.js · web/"]
    Web -->|Bearer JWT| Api["NestJS · api/"]
    Api -->|TypeORM / pg| Db[(PostgreSQL 16)]
    Csv["data/productos.csv"] --> Cli["CLI de importación"]
    Cli --> Db
```

Next protege las páginas y adapta las solicitudes del navegador. Nest autentica, aplica los permisos y gestiona la auditoría. PostgreSQL aplica las restricciones de unicidad y clasificación. La carga conserva las filas originales junto al catálogo operativo.

## Ejecutar desde cero

Necesitas Node.js 22 (22.12 o posterior), npm 10 o posterior, Docker con Compose v2 y puertos locales 3000, 3001 y 5432 disponibles. El CLI de Nest ya forma parte del proyecto.

```bash
npm ci
node -e 'const fs=require("node:fs"); const key=require("node:crypto").randomBytes(32).toString("hex"); fs.writeFileSync(".env",fs.readFileSync(".env.example","utf8").replace(/^JWT_SECRET=.*$/m,"JWT_SECRET="+key),{flag:"wx",mode:0o600})'
docker compose up -d --wait db
npm run migration:run -w api
npm run catalog:import -w api -- load
npm run catalog:import -w api -- load
npm run dev
```

El comando de configuración crea un `.env` local en un checkout limpio. Si ya existe, conserva el archivo y configura los valores siguiendo `.env.example`. `POSTGRES_PORT` admite `host:puerto` y la plantilla publica PostgreSQL solo en loopback. Ajusta `DATABASE_URL` si cambias el puerto. En una instalación existente, verifica que `POSTGRES_PORT` incluya `127.0.0.1`. La segunda carga comprueba idempotencia y debe indicar `reused: true` con cero escrituras.

- [Catálogo web](http://127.0.0.1:3001) y [healthcheck de la API](http://127.0.0.1:3000/health).
- Para ejecutar los builds de producción localmente, usa `npm run build` y, en terminales separadas, `npm run start -w api` y `npm run start -w web`, sin los procesos de desarrollo activos.
- Si cambias el origen web o la URL de Nest, configura `web/.env.local` con `web/.env.example`. `WEB_ORIGIN` debe ser el origen exacto del navegador. `JWT_SECRET` se configura solo en la API.
- `npm run catalog:import -w api -- inspect` muestra el diagnóstico del CSV sin conectar a la base.

| Usuario demo | Contraseña demo | Consultar | Crear, editar y eliminar |
| --- | --- | --- | --- |
| `admin@prueba.local` | `Admin123!` | Sí | Sí |
| `manager@prueba.local` | `Manager123!` | Sí | Sin permiso |

Ejemplo de login directo en la API local. El navegador inicia sesión en Next y recibe una cookie HttpOnly.

```bash
curl -sS http://127.0.0.1:3000/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"username":"admin@prueba.local","password":"Admin123!"}'
```

La API devuelve `{ "accessToken": "<JWT>" }`. Las rutas de catálogo de Nest requieren el encabezado `Authorization: Bearer <JWT>`.

### Resultado de la carga inicial

| Filas originales | Productos | Duplicado vinculado | Pendientes | Categorías | Subcategorías | Usuarios demo |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 120 | 106 | 1 | 13 | 5 | 17 | 2 |

El lote se identifica por SHA-256. Los diagnósticos y las normalizaciones quedan vinculados a cada fila. [Análisis del CSV](ia/planes/01-plan-inicial.md#2-auditoría-del-csv)

## API en Docker

Con `.env` configurado y la API local detenida, usa el Compose complementario. Next puede seguir ejecutándose con `npm run dev:web`.

```bash
docker compose -f docker-compose.yml -f docker-compose.api.yml up -d --wait db
docker compose -f docker-compose.yml -f docker-compose.api.yml build api
docker compose -f docker-compose.yml -f docker-compose.api.yml run --rm api npm exec -w api -- typeorm migration:run -d dist/database/data-source.js
docker compose -f docker-compose.yml -f docker-compose.api.yml run --rm api node api/dist/catalog/import/import-cli.js load
docker compose -f docker-compose.yml -f docker-compose.api.yml up -d --wait api
docker compose -f docker-compose.yml -f docker-compose.api.yml ps
curl -i http://127.0.0.1:3000/health
```

La API del contenedor se conecta al host interno `db` y publica el puerto HTTP en loopback. Usa `API_HOST_PORT` para cambiar el puerto publicado. Si empleas credenciales de PostgreSQL que requieran escapar caracteres, define `API_DATABASE_URL` con valores codificados y host `db`. El CSV se monta en solo lectura. Las migraciones y la carga se ejecutan explícitamente.

`GET /health` es público. Devuelve 200 cuando PostgreSQL responde y 503 durante una interrupción. El HTTP de Nest sigue activo después de su arranque aunque PostgreSQL se detenga.

## Pruebas

```bash
npm run validate
TEST_DATABASE_URL=postgresql://prueba:prueba123@127.0.0.1:5432/productos_upc npm run test:integration
npm exec -w web -- playwright install chromium
E2E_JWT_SECRET="$(node --env-file=.env -p 'process.env.JWT_SECRET')" npm run test:e2e -w web
```

`validate` ejecuta lint, formato, builds, tipos y pruebas unitarias de Jest. La integración crea esquemas temporales en una instancia de PostgreSQL de pruebas. Playwright requiere API y web en marcha con los 106 productos iniciales, y ejecuta el caso de vencimiento con el secreto local de esa instancia. Si ya tienes Chrome, puedes omitir la descarga de Chromium y definir `E2E_BROWSER_CHANNEL=chrome`. Reinicia solo la API de pruebas antes de repetir Playwright si su caso de rate limiting conserva el cupo agotado.

## Decisiones y límites

- El UPC es texto de 12 dígitos y tiene una restricción única. Se conservan sus ceros iniciales. Las 120 filas se auditan y solo las válidas forman parte del catálogo operativo.
- Login mediante POST y borrado mediante DELETE. JWT HS256 con secreto de servidor y vencimiento, Argon2id, cookie HttpOnly y Bearer entre Next y Nest. Se usa `.env.example` para que cada instalación genere su secreto.
- Nest determina los autores y las fechas. Los errores incluyen un código y un ID de solicitud, con información de campo cuando procede. El catálogo web pagina localmente sobre el listado completo y el checksum se informa como aviso.
- El rate limiting en memoria se comparte entre clientes que llegan desde la misma instancia local de Next. La sesión emitida vive hasta su vencimiento de una hora por defecto. El entorno auditado es local.

Consulta el [enunciado original](PruebaTecnica_Productos_UPC.pdf), la [matriz de aceptación](docs/criterios-de-aceptacion.md), la [auditoría final](ia/planes/08-auditoria-final.md) y la [documentación de IA](ia/README.md).

## Capturas

| Inicio de sesión | Catálogo de administrador |
| --- | --- |
| [![Inicio de sesión](docs/capturas/login.png)](docs/capturas/login.png) | [![Catálogo de administrador](docs/capturas/catalogo.png)](docs/capturas/catalogo.png) |

[Detalle](docs/capturas/detalle.png) · [Formulario](docs/capturas/formulario.png) · [Catálogo móvil](docs/capturas/movil.png)
