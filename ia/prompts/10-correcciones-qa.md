# Fase 10 — Corrección de hallazgos de QA y regresión final

La prueba de aceptación independiente ejecutó 134 casos, con 129 aprobados y 5 fallidos. Se identificaron dos defectos confirmados y una restricción del entorno de compilación.

Se ha revisado el informe junto con ChatGPT y se autoriza corregir exclusivamente los hallazgos descritos a continuación.

Consultar las evidencias originales:

- /private/tmp/qa-upc.pZdTNF5R/entrega/Informe-QA.md
- /private/tmp/qa-upc.pZdTNF5R/entrega/Comandos.md
- /private/tmp/qa-upc.pZdTNF5R/QA-final-UPC.zip

## 1. D-01 — Tratamiento incorrecto de cuerpos JSON excesivos

Actualmente NestJS devuelve HTTP 500 INTERNAL_ERROR cuando un cuerpo JSON supera 100 KiB, mientras que Next.js devuelve correctamente HTTP 413 PAYLOAD_TOO_LARGE.

Identificar la causa exacta en el código y confirmar el tipo, estructura y código de la excepción generada por el parser HTTP.

Revisar especialmente el filtro global de excepciones.

Implementar una corrección acotada que:

- Mantenga el límite actual de 100 KiB.
- Reconozca específicamente la excepción de tamaño excesivo del parser.
- Devuelva HTTP 413.
- Utilice el código PAYLOAD_TOO_LARGE.
- Mantenga el contrato uniforme de errores.
- Preserve el requestId.
- No exponga cuerpos de solicitudes, credenciales, stack traces ni información interna.
- No registre estos rechazos esperados como errores internos HTTP 500.
- No convierta indiscriminadamente cualquier excepción desconocida en un error 413.

Mantener HTTP 500 para los errores internos reales.

No modificar el comportamiento de autenticación, autorización, CRUD ni validación de datos.

## 2. Pruebas de regresión de D-01

Agregar pruebas automatizadas que reproduzcan el defecto mediante solicitudes HTTP reales.

Comprobar cuerpos JSON válidos de:

- 102399 bytes.
- 102400 bytes.
- 102401 bytes.
- 112640 bytes.

Los primeros dos tamaños deben alcanzar la validación habitual del DTO. Los tamaños superiores deben devolver 413 PAYLOAD_TOO_LARGE.

Verificar también:

- JSON mal formado continúa devolviendo 400.
- El contrato de errores conserva requestId.
- No se exponen detalles internos.
- Los errores internos genuinos continúan devolviendo 500.
- Next.js y NestJS mantienen un comportamiento consistente para cuerpos excesivos.

No limitar las pruebas a invocar manualmente el filtro de excepciones. Verificar el parser HTTP y la respuesta real de la aplicación.

## 3. D-02 — Favicon inexistente

Agregar un favicon válido mediante la convención apropiada de Next.js App Router.

Reutilizar la identidad visual existente del catálogo, preferentemente el icono de código de barras y los colores actuales.

Mantener un diseño sencillo y reconocible.

No incorporar dependencias adicionales para resolverlo.

Comprobar:

- GET /favicon.ico devuelve HTTP 200.
- El navegador reconoce correctamente el recurso.
- Chrome deja de registrar el 404.
- No se introducen errores de consola ni solicitudes inesperadamente fallidas.

## 4. Compilación con Turbopack

Reejecutar npm run validate utilizando el pipeline predeterminado.

El error anterior indicó Operation not permitted al intentar abrir un puerto interno de Turbopack.

Determinar si corresponde a las restricciones del sandbox.

Si se requiere autorización para ejecutar el comando fuera del sandbox, solicitarla mediante el mecanismo habitual de Codex.

No cambiar permanentemente a Webpack para ocultar el problema.

No modificar package.json, versiones de dependencias ni configuración de compilación salvo que exista un defecto real demostrado y sea autorizado posteriormente.

Si no puede ejecutarse fuera del sandbox, informar el bloqueo y proporcionar el comando que debo ejecutar personalmente en mi terminal.

## 5. Regresión funcional

Utilizar una instancia aislada y compilar nuevamente la API y el frontend con las correcciones.

Repetir los cinco casos fallidos:

- SEC-API-01.
- SEC-08.
- FE-UX04.
- FE-UX05.
- REG-01.

Ejecutar nuevamente la matriz de QA de 134 casos sobre la nueva revisión, reutilizando los scripts existentes cuando sea posible.

No reutilizar binarios o imágenes Docker anteriores a la corrección. Reconstruir los componentes necesarios.

Ejecutar también:

- Todas las pruebas unitarias.
- Todas las pruebas de integración con PostgreSQL real.
- Todas las pruebas Playwright con Chrome.
- Lint.
- Formato.
- Type checking.
- Builds.

Actualizar el número de pruebas automatizadas según los nuevos casos incorporados.

Evitar interferencias del rate limiting entre suites utilizando instancias de QA independientes o reiniciando exclusivamente la API de pruebas cuando corresponda.

## 6. Documentación de IA

Registrar este prompt en:

ia/prompts/10-correcciones-qa.md

Registrar los hallazgos, causas confirmadas, correcciones y resultados reales en:

ia/planes/10-correcciones-qa.md

Actualizar ia/decisiones.md con las decisiones de esta revisión.

Actualizar las referencias a cantidades de pruebas en la documentación vigente si corresponde, conservando intacta la evidencia histórica.

No incorporar los ZIP completos, logs masivos ni capturas temporales al repositorio.

## 7. Restricciones

- No realizar refactorizaciones generales.
- No incorporar nuevas funcionalidades.
- No modificar dependencias.
- No aumentar el límite de los cuerpos JSON.
- No debilitar las medidas de seguridad.
- No modificar los productos originales de mi instancia local.
- No realizar commits ni push automáticamente.
- No cambiar la visibilidad del repositorio.
- No eliminar ni reducir pruebas para obtener resultados exitosos.

## 8. Informe de cierre

Entregar un informe conciso indicando:

- Causa confirmada de cada defecto.
- Correcciones realizadas.
- Archivos modificados.
- Resultados anteriores y posteriores.
- Resultado de los 134 casos de QA.
- Nuevo total de pruebas automatizadas.
- Resultado del pipeline predeterminado.
- Bloqueos pendientes, si existen.
- Recomendación GO o NO-GO.
- Commits recomendados en inglés.

Conservar disponible mi aplicación local y verificar que mantiene sus 106 productos.

Detenerse al finalizar para permitir la revisión humana.