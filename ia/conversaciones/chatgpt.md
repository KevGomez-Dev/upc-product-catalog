# Extractos de revisión técnica

## Recomendaciones de ChatGPT

Extractos entregados por el candidato en el [prompt de auditoría](../prompts/08-auditoria-final.md).

**Importación**

> No implementaría todo ese mecanismo ahora. Mantendría las tablas import_batches e import_rows, pero limitaría su alcance a la carga inicial, trazabilidad, diagnóstico e idempotencia.

El candidato acotó la reconciliación en fase 2. HU-01 implementó carga, procedencia e idempotencia. [Aprobación](../prompts/02-inicializacion.md) · [Implementación](../planes/03-modelo-importacion.md)

**Arquitectura**

> No incorporaría arquitectura hexagonal estricta, DDD complejo, Nx, Kafka ni microservicios.

El candidato aprobó un monolito modular con npm workspaces y un adaptador de Next. [Aprobación](../prompts/02-inicializacion.md) · [Decisiones](../decisiones.md)

**Autenticación**

> No incorporaría Redis ni infraestructura distribuida para resolverlo.

El límite se conserva en memoria. La fase 6 hizo explícito que una instancia local de Next comparte el límite de IP. [Aprobación y efectos](../prompts/07-healthcheck.md) · [Evidencia](../planes/06-frontend.md)

**Auditoría**

> Mi recomendación es utilizar la fecha real del servidor y, si existe una fecha histórica posterior al reloj actual, devolver un conflicto explícito en lugar de registrar una auditoría inexacta.

La fase 6 solicitó reemplazar la regla inicial por un 409 atómico. [Solicitud](../prompts/06-frontend.md) · [Evidencia](../planes/06-frontend.md)

**Documentación**

> No necesitamos generar un informe de diez páginas por cada fase.

El candidato pidió planes concisos y sustentados en evidencia en la fase 3. [Ajuste solicitado](../prompts/03-modelo-importacion.md) · [Plan revisado](../planes/02-plan-revisado.md)

**Frontend**

> Para un formulario de cuatro campos, incorporar React Hook Form, Zod y una biblioteca de estado global no era imprescindible.

Los formularios usan controles nativos y estado local. En fase 7 se aprobaron esas decisiones de frontend. [Plan de frontend](../planes/06-frontend.md) · [Aprobación](../prompts/07-healthcheck.md)

## Extractos de Codex

Los tres extractos son citas textuales cotejadas con los mensajes originales de Codex de las fases 3, 5 y 7.

**Fase 3 · Resultado de la carga**

> La primera carga produjo los conteos esperados en PostgreSQL: 106 productos, 1 duplicado vinculado y 13 filas pendientes, con las 120 filas originales preservadas. La segunda reutilizó el mismo lote y reportó cero altas.

[Pruebas de la carga](../planes/03-modelo-importacion.md)

**Fase 5 · Concurrencia y procedencia**

> En la primera validación completa, las dos altas concurrentes devolvieron 201 y 409, y quedó una sola fila con ese UPC. También comprobé que borrar un producto importado conserva su procedencia y que reimportar el CSV no lo restaura.

[Contratos y resultados](../planes/05-productos.md)

**Fase 7 · Recuperación**

> La API arrancó saludable en Docker. Al detener PostgreSQL, `/health` devolvió 503 y Docker marcó el contenedor como `unhealthy`. Al volver a iniciar la base, la misma API recuperó el 200 y el estado `healthy`, sin reiniciar su proceso. Ahora estoy comprobando la paginación y las tarjetas en Chrome.

[Healthcheck y evidencia](../planes/07-healthcheck.md)
