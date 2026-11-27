# Correcciones de QA y regresión final

El candidato autorizó dos correcciones sobre la revisión `02414e7`. La matriz anterior ejecutó 134 casos y obtuvo 129 aprobados y 5 fallidos. [Prompt de fase 10](../prompts/10-correcciones-qa.md)

| Hallazgo | Causa confirmada | Corrección y resultado |
| --- | --- | --- |
| D-01 · JSON superior a 100 KiB devolvía 500 en Nest | El parser Express creó un `PayloadTooLargeError` con `type=entity.too.large`, `status=statusCode=413`, límite de 102400 bytes y longitud declarada. Nest lo trasladó sin envolverlo como `HttpException`. El filtro lo clasificaba como un fallo inesperado. | El filtro reconoce el tipo y ambos estados 413 antes de resolver el contrato público. Nest y Next devuelven 413 `PAYLOAD_TOO_LARGE` con `requestId` para 102401 y 112640 bytes. Los 102399 y 102400 bytes llegan al DTO. El JSON mal formado sigue en 400 y los fallos internos en 500. La nueva regresión reprodujo ambos 500 antes del cambio y comprobó que los 413 ya no se registran como 500. |
| D-02 · Chrome registraba un 404 al solicitar el favicon | El App Router carecía de un recurso para `/favicon.ico`. | `app/favicon.ico` sirve un icono de 32 × 32, con código de barras y el azul de la marca. HTTP 200 `image/x-icon`. Chrome encontró el enlace de metadatos, decodificó el icono y dejó de registrar el 404. |
| REG-01 · El build de Turbopack no abría un puerto interno | La copia con sandbox reprodujo el error de permisos. Una prueba directa de enlace a un puerto efímero falló con el mismo código en sandbox y pasó al autorizar la ejecución. | `npm run validate` predeterminado pasó con Turbopack en la ejecución autorizada de macOS y en un contenedor Linux. |

## Regresión verificada

- **134 de 134** casos de la matriz pasaron. SEC-API-01, SEC-08, FE-UX04, FE-UX05 y REG-01 quedaron aprobados.
- **80 pruebas automatizadas** pasaron. Fueron 24 unitarias, 48 de integración con PostgreSQL real y 8 de Playwright con Chrome. Se añadieron cuatro casos de integración y dos de Chrome.
- `npm run validate` completó lint, formato, builds, tipos y unitarias. Se repitió REG-02 con Webpack temporal como parte de la matriz histórica.
- Se recompilaron Nest y Next y se construyó una imagen nueva de API. Las mutaciones y la interrupción de PostgreSQL se ejecutaron en el proyecto Compose aislado. La API recuperó su salud sin reinicio.
- La API y el login originales respondieron 200 al cierre. PostgreSQL original conservó 106 productos y cero filas sintéticas. Los dos contenedores de QA quedaron detenidos.

Pruebas incorporadas en [integración de Nest](../../api/test/auth.integration.cjs) y [Playwright](../../web/e2e/catalog.spec.ts). Los registros completos y las capturas de ejecución se conservaron fuera del repositorio.
