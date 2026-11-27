# Fase 6 · Frontend e integración del catálogo

[Prompt y alcance](../prompts/06-frontend.md) · [Decisiones](../decisiones.md)

1. Separar la corrección de auditoría del frontend. La edición captura el reloj real de PostgreSQL tras bloquear el producto. Una fecha histórica futura devuelve `409 AUDIT_DATE_CONFLICT` sin cambiar la fila.
2. Implementar rutas privadas y sesión con un adaptador de Next del mismo origen, JWT en cookie HttpOnly y validación de `WEB_ORIGIN` en login, logout y mutaciones. Nest mantiene la autenticación y los permisos definitivos.
3. Entregar login, listado y detalle para ambos roles, y formulario y diálogo de eliminación para admin. Mantener las consultas de clasificación y la comprobación previa de UPC por listado completo. Abortamos la solicitud de subcategorías al cambiar categoría.
4. Verificar ambos roles en Chrome con la API y PostgreSQL reales. Ejecutar pruebas del backend y builds de ambos workspaces.

## Verificación reproducible

Usar una instancia de Compose aislada con catálogo recién cargado. Los pasos, las cuentas demo y las variables están en el [README](../../README.md). Para ejecutar Playwright con Chrome instalado:

```bash
npm run validate
TEST_DATABASE_URL='<URL PostgreSQL de pruebas>' npm run test:integration
E2E_BROWSER_CHANNEL=chrome npm run test:e2e -w web
```

`E2E_BASE_URL` permite elegir la dirección web y `E2E_SCREENSHOTS` guarda capturas. Para probar un token firmado pero vencido, iniciar Nest con un secreto desechable y usar ese mismo valor en `E2E_JWT_SECRET`. La prueba del 429 va al final porque utiliza el límite real compartido por IP.

El adaptador valida el origen configurado y usa Bearer únicamente de Next hacia Nest. Propaga el aviso UPC y los datos de reintento. El token queda en una cookie con alcance de toda la aplicación, SameSite=Lax, Secure bajo HTTPS y vencimiento dos segundos antes del JWT para absorber el redondeo de Date observado en Chrome. Nest sigue validando la expiración del JWT. La protección de rutas privadas consulta `GET /auth/me`. Se mantiene el límite de login por IP de conexión de Nest y su alcance compartido detrás del adaptador local.

## Evidencia de cierre

| Comprobación | Resultado |
| --- | --- |
| PostgreSQL, NestJS y Next.js | Se aplicaron las migraciones y se cargó el CSV en Compose aislado. El catálogo tenía 106 productos antes y después de las pruebas web. El contenedor de prueba se detuvo. |
| Backend | Pasaron 18 pruebas unitarias y 43 de integración con PostgreSQL real. El caso de auditoría futura confirmó 409, código `AUDIT_DATE_CONFLICT` y la fila íntegra. |
| Chrome mediante Playwright | Pasaron cinco pruebas. Se verificaron login y logout de ambos roles, recarga, cookie inaccesible a JavaScript, JWT vencido, listado y auditoría, validaciones, cero inicial, checksum, subcategorías dependientes, CRUD, restricción de manager, respuesta 429 y rechazo de orígenes ajenos. |
| Interfaz | Se comprobó el listado de manager a 390 px, el reintento tras un fallo de red inducido y el foco inicial de Cancelar en el diálogo. Se capturaron login, listado admin, detalle, formulario y listado móvil. |
| Herramientas y alcance | Pasaron lint, formato, tipos y builds. Se preservaron el CSV y las migraciones. La prueba de navegador se hizo en HTTP local. La opción Secure se configura a partir de un origen HTTPS. |

La primera ejecución de Chrome perdió acceso al cuerpo 204 al navegar y luego expuso el ajuste fraccional de caducidad de Chromium. Se verificó el estado 204 sin leer el cuerpo tras la navegación y se adelantó dos segundos la expiración del cookie. Una siguiente corrida reveló una coincidencia ambigua en un selector de prueba después de editar. Se hizo exacto y se añadió limpieza del producto sintético al terminar el caso. La corrida final completó las cinco pruebas y las capturas.
