# Decisiones del proyecto

## Evidencia y autoría

| Fuente | Intervención verificable |
| --- | --- |
| ChatGPT | Los hallazgos preliminares sobre calidad del CSV y riesgos del enunciado están atribuidos a ChatGPT en el prompt de fase 1. El candidato informó que revisó el informe junto con ChatGPT. La conversación disponible no contiene un extracto adicional ni atribuciones individuales de esa revisión. |
| Codex | Contrastó los hallazgos preliminares contra los archivos, perfiló el CSV con Python, propuso las alternativas del plan inicial y preparó la base técnica en fase 2. |
| Candidato | Aprobó y modificó el plan en el mensaje de fase 2. Autorizó la inicialización técnica y reservó la revisión antes de continuar. |

[Prompt inicial](prompts/01-analisis.md) · [Plan inicial](planes/01-plan-inicial.md) · [Aprobación y alcance de fase 2](prompts/02-inicializacion.md)

## Decisiones aprobadas por el candidato

Las justificaciones de esta tabla sintetizan el criterio técnico del plan y su revisión. El estado de aprobación proviene del mensaje de fase 2.

| Decisión | Justificación técnica y efecto |
| --- | --- |
| NestJS modular, Next.js App Router con Tailwind, Node.js 22, npm workspaces y TypeScript estricto. | Mantiene el stack obligatorio con un repositorio simple y una sola instalación. Nest concentra las reglas y Next se ocupa de presentación y transporte de sesión. |
| TypeORM, migraciones explícitas, `synchronize: false` y PostgreSQL con el Compose entregado. | El esquema se reproduce desde migraciones versionadas. Los cambios en la base requieren un comando explícito. |
| JWT HS256 con secreto exclusivo de Nest y caducidad configurable de una hora. Contraseñas con Argon2id, acceso por POST, borrado por DELETE y permisos por guardias y roles. | Evita exponer secreto o contraseña en URL, limita la vigencia de credenciales y separa autenticación de permisos. Cambia los mecanismos literales de HU-02 #9, HU-03 #1 y #4, las notas de autenticación y la ruta de borrado de la sección 9. |
| Cookie HttpOnly y adaptador acotado en Next.js. | Mantiene la sesión al recargar y limita la lectura del JWT desde JavaScript. El mecanismo de transporte cambia respecto de HU-02 #9 y HU-03 #4. |
| Auditoría de escrituras en Nest y errores controlados. | El servidor conserva la atribución y evita exponer detalles internos. Cambian el payload de HU-02 #7 y la respuesta de HU-02 #10. |
| UPC como texto con restricción única. | Conserva ceros iniciales y evita carreras al escribir. |
| Conservar todas las filas originales mediante `import_batches` e `import_rows` y proyectar las válidas. | Conserva los registros de origen respetando unicidad, clasificación y trazabilidad. HU-01 #3 queda cubierto en preservación del origen y diverge en el total de productos visibles. |
| Registrar recorte de espacios del UPC y mapeo desde minúsculas cuando la clasificación sea inequívoca. Para checksum incorrecto, advertir y continuar. | Hay evidencia para estas normalizaciones y se deben conservar valores originales. La verificación de checksum funciona como diagnóstico. |
| Documentar validaciones de descripción no vacía y cronología como decisiones técnicas. | La descripción permite identificar el producto y el orden temporal mantiene coherencia entre alta y modificación. Estas reglas forman parte de la proyección esperada. |
| Excluir reconciliación completa, UI de importación y arquitecturas adicionales. Agregar pruebas relevantes por bloque y justificar dependencias. | Reduce el alcance operativo y permite comprobar cada incremento antes de acumular cambios. |
| Conservar los archivos originales y ajustar el esfuerzo a la hora de corte. | Mantiene el material entregado y prioriza HU-01 a HU-04 antes de extras. |

Objetivo de carga por verificar en una ejecución real de HU-01: 106 productos, 1 duplicado exacto vinculado, 13 filas pendientes, 5 categorías y 17 subcategorías.

## Aplicación de Codex en la base técnica

- La instalación usa `.nvmrc` y un lockfile raíz. Prettier excluye el material original y la trazabilidad para evitar cambios de formato sin relación con esta fase.
- Nest usa loopback y puerto 3000 por defecto. Next usa loopback y puerto 3001. El entorno de la API usa `.env` de raíz y el de Next usa `web/.env.local` para su origen interno opcional. El ejemplo original de JWT sigue siendo una plantilla y la API exige un secreto local apto para configurarse.
- El data source compilado y el módulo Nest comparten opciones. El CLI carga migraciones JavaScript compiladas cuando se ejecute explícitamente. Las primeras migraciones de entidades quedaron para HU-01.
- Se usó el runner nativo de Node para pruebas de configuración. La posible suite Jest de HU-E1 se evaluará una vez cubierto el flujo obligatorio.
- Decisiones de detalle como revocación inmediata, borrado físico y el formato final del manifiesto se mantienen como propuestas de Codex donde el candidato no las aprobó expresamente.
