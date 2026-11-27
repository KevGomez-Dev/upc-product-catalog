# HU-01 · Modelo relacional e importación

[Prompt y alcance aprobado](../prompts/03-modelo-importacion.md) · [Inventario original](01-plan-inicial.md#2-auditoría-del-csv)

1. Definir las seis entidades y escribir dos migraciones reversibles. `CatalogSchema` crea taxonomía, productos y usuarios. `ImportProvenance` crea lotes, filas y la referencia de cada producto importado.
2. Leer el CSV en UTF-8, identificar el lote por SHA-256 y revisar todas las filas en memoria. Conservar registros originales y distinguir normalizaciones, duplicados exactos, conflictos, avisos y pendientes.
3. Persistir un lote y su proyección en una transacción. Proteger escrituras concurrentes con restricciones de PostgreSQL y sembrar las cuentas demo con Argon2id.
4. Verificar el parser y las reglas en Jest. Ejecutar ambas migraciones, dos cargas y consultas SQL sobre un PostgreSQL aislado. Usar otro esquema temporal para pruebas que modifican o revierten datos.

## Comandos desde la raíz

```bash
npm ci
docker compose up -d --wait db
npm run migration:run -w api
npm run catalog:import -w api -- inspect
npm run catalog:import -w api -- load
npm run validate
TEST_DATABASE_URL='<URL PostgreSQL de pruebas>' npm run test:integration
```

La carga usa `DATABASE_URL` o la configuración de `.env` de raíz. El modo `inspect` funciona sin conexión. El archivo predeterminado es `data/productos.csv`. El parámetro opcional `--file` se resuelve desde el directorio de invocación. `load` devuelve el resumen histórico del lote y `writes` cuenta sus altas en esa ejecución. Las cuentas demo son las del PDF. Para reproducir desde cero usar una base de prueba limpia. La suite de integración crea y elimina solamente su propio esquema temporal.

## Evidencia de cierre

| Comprobación | Resultado |
| --- | --- |
| PostgreSQL 16 en Compose | Configuración válida. Contenedor de prueba con volumen propio y puerto 55432 limitado a loopback mediante un override temporal. El Compose del ejercicio quedó intacto y el contenedor de prueba se detuvo al terminar. |
| Migraciones | Se aplicaron ambas en una base limpia. Las pruebas de integración revirtieron y reaplicaron las dos. `typeorm schema:log` confirmó que el esquema coincide con las entidades. |
| Primera carga | SQL confirmó 5 categorías, 17 subcategorías, 106 productos, 2 usuarios, 1 lote y 120 filas fuente. Estados: 106 importadas, 1 duplicada y 13 pendientes. El duplicado de línea 17 apunta a la línea 3. |
| Preservación | Se compararon literalmente las 120 filas con el archivo de origen. Se comprobó `010433218194`, tres transformaciones de campo en dos filas, el registro de diez campos y un aviso de checksum sin bloqueo. Los dos hashes Argon2id verificaron las contraseñas demo. |
| Segunda carga | Mismo lote, mismo resumen y cero altas. Se repitió el proceso en otra base limpia y se compararon los valores y las versiones de fila (`xmin`) de las seis tablas antes y después de la segunda carga. Las pruebas comprobaron concurrencia, restricción de UPC y referencias, el conflicto con un UPC existente, reversión ante fallo y conservación de ediciones y bajas. |
| Herramientas | `npm ci --offline` pasó en un directorio limpio. `npm run validate` pasó lint, formato, tipos, builds de API y web, y 14 pruebas Jest. `npm run test:integration` pasó 7 pruebas con PostgreSQL real. |

Durante el desarrollo se ajustaron las declaraciones de tipos de CSV y fechas, el global de Node en ESLint y una aserción que interpretaba mal la respuesta de un `UPDATE` de TypeORM. Las ejecuciones finales de validación y pruebas pasaron. npm informó de deprecaciones de ESLint 9 y dependencias transitivas. Los resultados coincidieron con la proyección aprobada. Los comandos de carga quedan aquí para conservar el README original hasta que se documente la entrega.
