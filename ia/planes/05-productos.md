# HU-02 y HU-04 · Backend de catálogo

[Prompt y alcance](../prompts/05-productos.md) · [Decisiones](../decisiones.md)

1. Exponer productos y clasificación con `CatalogModule` y `ProductsModule`, reusando entidades, guardias, perfil autenticado y contrato de errores.
2. Validar los DTO y resolver las parejas de categoría y subcategoría en PostgreSQL. Compartir las reglas UPC con la importación y mantener las normalizaciones del CSV en el importador.
3. Ejecutar altas, ediciones y bajas de forma atómica. Obtener la respuesta de altas y ediciones en la misma sentencia que escribe la fila. Traducir exclusivamente la restricción única del UPC a 409.
4. Probar los endpoints de producción con Supertest en PostgreSQL aislado. Repetir las pruebas de importación y autenticación.

## Contratos HTTP

Toda ruta requiere `Authorization: Bearer <token>`. Se declaran los roles en cada método para mantener el comportamiento restrictivo de los guardias.

| Método y ruta | Rol | Éxito y respuesta |
| --- | --- | --- |
| `GET /products` | Admin y manager | 200. Array completo ordenado por `id` ascendente. Campos `id`, `upcCode`, `upcDescription`, `categoryCode`, `subCategoryCode`, `dateAdded` y `updatedDate`. Filtro opcional con los dos parámetros `categoryCode` y `subCategoryCode`. Una pareja inválida o parcial devuelve 400. |
| `GET /products/:id` | Admin y manager | 200. Añade `addedBy` y `modifiedBy` a los campos del listado. |
| `POST /products` | Admin | 201, detalle guardado y cabecera `Location: /products/:id`. |
| `PUT /products/:id` | Admin | 200 con el detalle actualizado. Se conserva la fecha y el autor del alta. |
| `DELETE /products/:id` | Admin | 204 sin cuerpo. Borrado físico, con fila de procedencia conservada. |
| `GET /categories` | Admin y manager | 200. Array de objetos `{ code }`, ordenado por código. |
| `GET /categories/:categoryCode/subcategories` | Admin y manager | 200. Array de `{ code, categoryCode }`, ordenado por código. Categoría inexistente da 404. |

Altas y ediciones requieren `upcCode`, `upcDescription`, `categoryCode` y `subCategoryCode`. El UPC es texto de 12 dígitos ASCII. El checksum inválido mantiene el éxito con `X-UPC-Warning: UPC_CHECKSUM`. Las fechas se serializan como `YYYY-MM-DDTHH:mm:ssZ`. Los campos de auditoría enviados por el cliente se rechazan.

Se mantiene el formato de error con `statusCode`, `code`, `message`, `requestId` y `fieldErrors` cuando aplica. Datos inválidos dan 400, sesión inválida 401, permiso insuficiente 403, producto inexistente 404 y UPC ocupado 409. Los errores inesperados dan 500 genérico.

## Comprobación

```bash
npm run validate
TEST_DATABASE_URL='<URL PostgreSQL aislado>' npm run test:integration
```

Las pruebas de productos crean un esquema y una aplicación nuevos por caso, ejecutan las migraciones y cargan el CSV mediante el importador existente. No incorporan controladores auxiliares.

## Evidencia de cierre

- `npm run validate` pasó lint, formato, tipos y builds de API y web. Las 18 pruebas unitarias pasaron.
- `npm run test:integration` pasó 43 casos contra PostgreSQL 16 en Docker Compose con un proyecto aislado. Incluyó 16 casos de catálogo, 20 de autenticación y 7 de importación.
- Dos creaciones concurrentes con un mismo UPC devolvieron un 201 y un 409. SQL confirmó una sola fila. Un fallo de otra restricción devolvió 500 sin detalles internos.
- El borrado físico mantuvo intacta la fila de importación y reimportar el mismo archivo conservó la baja. La inspección del CLI confirmó la proyección de 120 filas, 106 productos, 1 duplicado vinculado y 13 pendientes.
- El CSV, las migraciones, Compose, las dependencias y el frontend se conservaron. El importador usa ahora las funciones UPC comunes y conserva sus resultados. La validación final terminó sin fallos pendientes.
