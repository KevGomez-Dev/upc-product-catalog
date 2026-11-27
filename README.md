# Prueba Técnica – Catálogo de Productos UPC

Las instrucciones completas están en **`PruebaTecnica_Productos_UPC.pdf`**. Este README explica cómo iniciar el catálogo en un entorno local de evaluación.

## Contenido del paquete

| Archivo | Descripción |
|---|---|
| `PruebaTecnica_Productos_UPC.pdf` | Instrucciones, historias de usuario y criterios de evaluación |
| `data/productos.csv` | Datos para la carga inicial |
| `docker-compose.yml` | PostgreSQL 16 listo para usar |
| `.env.example` | Variables de entorno de referencia |

## Levantar PostgreSQL

```bash
cp .env.example .env
docker compose up -d
docker compose ps          # el servicio "db" debe aparecer como (healthy)
```

Probar la conexión:

```bash
docker exec -it prueba-upc-db psql -U prueba -d productos_upc -c "select 1"
```

Cadena de conexión: `postgresql://prueba:prueba123@localhost:5432/productos_upc`

Dentro del contenedor, el CSV está disponible en `/data/productos.csv` (solo lectura).

### Opcional: Adminer (cliente web)

```bash
docker compose --profile tools up -d
```

Abre http://localhost:8080. Usa el sistema PostgreSQL, el servidor `db`, el usuario `prueba`, la contraseña `prueba123` y la base `productos_upc`.

### Reiniciar desde cero

```bash
docker compose down -v     # elimina el contenedor y los datos
```

> Puedes copiar este `docker-compose.yml` a tu repositorio y extenderlo.

## Iniciar el catálogo

Usa Node.js 22. Crea `.env` a partir de `.env.example` y sustituye el marcador de `JWT_SECRET` por un valor aleatorio de al menos 32 bytes, por ejemplo uno generado con `openssl rand -hex 32`. Después ejecuta desde la raíz:

```bash
npm ci
docker compose up -d --wait db
npm run migration:run -w api
npm run catalog:import -w api -- load
npm run dev
```

Abre [el catálogo local](http://127.0.0.1:3001). NestJS escucha en el puerto 3000. Las cuentas de demostración son:

| Usuario | Contraseña demo | Permisos |
| --- | --- | --- |
| `admin@prueba.local` | `Admin123!` | Consultar, crear, editar y eliminar |
| `manager@prueba.local` | `Manager123!` | Consultar |

Si cambias los puertos u origen web, usa `web/.env.example` como referencia para `web/.env.local`. `WEB_ORIGIN` debe coincidir con el origen exacto que abre el navegador. Next usa ese origen para validar mutaciones y establece `Secure` en la cookie cuando es HTTPS. El secreto JWT pertenece exclusivamente a la API.

El importador conserva 120 filas y proyecta 106 productos en una base limpia. Puedes consultar el diagnóstico antes de escribir con `npm run catalog:import -w api -- inspect`. Repetir la carga del mismo archivo reutiliza el lote.

## Verificación local

- `npm run validate` ejecuta lint, formato, compilación, chequeo de tipos y pruebas unitarias.
- `npm run test:integration` usa `TEST_DATABASE_URL` y esquemas temporales en PostgreSQL.
- `npm run test:e2e -w web` verifica los flujos en Playwright con la aplicación en marcha y una base de prueba recién cargada. Instala Chromium con `npm exec -w web -- playwright install chromium` o usa Chrome instalado con `E2E_BROWSER_CHANNEL=chrome`. El caso de JWT vencido requiere que `E2E_JWT_SECRET` coincida con el secreto del backend de prueba.

El límite de login en memoria cuenta por IP de conexión a NestJS. Las solicitudes que pasan por una misma instancia local de Next comparten ese límite. El adaptador no reenvía cabeceras de identificación de IP del cliente.

## API en Docker y healthcheck

El archivo `docker-compose.api.yml` complementa al Compose del ejercicio. Con `.env` configurado y un `JWT_SECRET` generado localmente, ejecuta:

```bash
docker compose -f docker-compose.yml -f docker-compose.api.yml up -d --wait db
docker compose -f docker-compose.yml -f docker-compose.api.yml build api
docker compose -f docker-compose.yml -f docker-compose.api.yml run --rm api npm exec -w api -- typeorm migration:run -d dist/database/data-source.js
docker compose -f docker-compose.yml -f docker-compose.api.yml run --rm api node api/dist/catalog/import/import-cli.js load
docker compose -f docker-compose.yml -f docker-compose.api.yml up -d --wait api
docker compose -f docker-compose.yml -f docker-compose.api.yml ps
curl -i http://127.0.0.1:3000/health
```

Next sigue disponible con `npm run dev:web`. El contenedor usa el host interno `db`, publica la API solo en loopback y monta `data/` en solo lectura. Si las credenciales de PostgreSQL necesitan codificación URL, proporciona `API_DATABASE_URL` con el host interno `db` y los valores codificados. Puedes publicar otro puerto con `API_HOST_PORT` y apuntar `API_BASE_URL` del frontend a ese puerto. Fuera del contenedor, `API_HOST` permite cambiar explícitamente la dirección local de escucha, cuyo valor predeterminado es `127.0.0.1`.

`GET /health` es público. Devuelve 200 con `{"status":"ok","api":"up","database":"up"}` cuando PostgreSQL responde, y 503 con `{"status":"unavailable","api":"up","database":"down"}` cuando deja de responder. Compose comprueba esta ruta. Al iniciar, la API espera una conexión funcional a PostgreSQL.
