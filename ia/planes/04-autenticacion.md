# HU-03 · Autenticación y autorización del backend

[Prompt y alcance](../prompts/04-autenticacion.md) · [Decisiones](../decisiones.md)

1. Verificar credenciales de los usuarios demo mediante Argon2id y usar un hash ficticio con la misma configuración si la cuenta está ausente.
2. Emitir JWT HS256 desde NestJS y validar firma, algoritmo, emisor, audiencia, vencimiento e identidad antes de comprobar roles. Aplicar los guardias globalmente.
3. Validar DTO y responder con el contrato uniforme de errores. Limitar los intentos de login en memoria.
4. Probar los contratos HTTP con el módulo real y las cuentas del importador en PostgreSQL aislado. Ejecutar también la regresión de HU-01.

## Contrato y operación

| Ruta | Resultado |
| --- | --- |
| `POST /auth/login` | Recibe `username` y `password` en JSON. Devuelve 200 y `{ accessToken }`. El usuario se recorta y se convierte a minúsculas. La contraseña se verifica tal como llega. Responde 400 si el DTO es inválido, 401 genérico si fallan las credenciales y 429 si se alcanza el límite. |
| `GET /auth/me` | Requiere `Authorization: Bearer <token>`. Devuelve 200 con `id`, `username` y `role`, o 401 si la sesión es inválida. |

`JWT_SECRET` y `JWT_EXPIRES_IN` provienen de la configuración de la API existente. La vigencia predeterminada es de una hora. El emisor es `catalogo-productos-upc-api` y la audiencia `catalogo-productos-upc`. Cerrar sesión en el cliente o cambiar un rol en la base de datos no invalida un token ya emitido. Las rutas protegidas usan el rol firmado hasta el vencimiento.

En futuras consultas se declaran ambos roles con `@Roles('admin', 'manager')`. En mutaciones se declara `@Roles('admin')`. `@Public()` se aplica por método. Los errores incluyen `statusCode`, `code`, `message` y `requestId`, más `fieldErrors` cuando corresponde. El filtro registra el ID y el estado de fallos internos sin imprimir el cuerpo, el token ni datos de la base.

El limitador usa la IP de conexión y memoria local. Un reinicio elimina su estado y cada instancia cuenta por separado. Si el adaptador de Next agrupa varias sesiones detrás de una IP, el límite también será compartido hasta revisar la configuración del proxy. Usar una versión actual de Node 22, con mínimo 22.12 para el limitador instalado.

## Comandos de verificación

```bash
npm ci
npm run validate
TEST_DATABASE_URL='<URL PostgreSQL aislado>' npm run test:integration
```

La prueba HTTP ejecuta las migraciones y el importador en un esquema temporal para obtener los usuarios demo. Las rutas usadas para probar roles se registran exclusivamente en la aplicación de pruebas.

## Evidencia de cierre

| Verificación | Resultado |
| --- | --- |
| Instalación limpia | `npm ci --offline` completado con Node.js 22.19.0. |
| `npm run validate` | Lint, formato, tipos y builds de Nest y Next pasaron. 15 pruebas unitarias pasaron, incluida la verificación del costo Argon2id equivalente para cuentas ausentes. |
| `npm run test:integration` | 27 pruebas pasaron sobre PostgreSQL 16. Incluye 20 casos de autenticación y autorización y las 7 pruebas de HU-01. |
| Módulo de producción | Migraciones y carga ejecutadas sobre la base aislada. Se verificaron 120 filas, 106 productos y 2 usuarios. Login y perfil respondieron 200. La ruta auxiliar de pruebas respondió 404. |
| Cambios de alcance | CSV, importador, migraciones, Compose y frontend conservados. Contenedor temporal detenido. |

La versión 12 de `@nestjs/jwt` es ESM y el compilador de la API CommonJS rechazó esa importación. Se instaló la versión 11 compatible. Se corrigieron además una importación de Node señalada por ESLint y el generador del caso JWT sin `exp`. La instalación limpia mantuvo los avisos de deprecación del conjunto de dependencias.
