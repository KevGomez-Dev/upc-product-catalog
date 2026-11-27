# Decisiones del proyecto

## Evidencia y autoría

| Fuente | Intervención verificable |
| --- | --- |
| ChatGPT | Los hallazgos preliminares sobre calidad del CSV y riesgos del enunciado están atribuidos a ChatGPT en el prompt de fase 1. El candidato informó que revisó el informe junto con ChatGPT. Los extractos aportados posteriormente se identifican en [Conversaciones](conversaciones/chatgpt.md). |
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

Proyección aprobada para HU-01: 106 productos, 1 duplicado exacto vinculado, 13 filas pendientes, 5 categorías y 17 subcategorías.

## Aplicación de Codex en la base técnica

- La instalación usa `.nvmrc` y un lockfile raíz. Prettier excluye el material original y la trazabilidad para evitar cambios de formato sin relación con esta fase.
- Nest usa loopback y puerto 3000 por defecto. Next usa loopback y puerto 3001. El entorno de la API usa `.env` de raíz y el de Next usa `web/.env.local` para su origen interno opcional. El ejemplo original de JWT sigue siendo una plantilla y la API exige un secreto local apto para configurarse.
- El data source compilado y el módulo Nest comparten opciones. El CLI carga migraciones JavaScript compiladas cuando se ejecute explícitamente. Las primeras migraciones de entidades quedaron para HU-01.
- En fase 2 se usó el runner nativo de Node para las pruebas de configuración.
- El borrado físico y la ausencia de revocación inmediata se aprobaron posteriormente en [fase 5](prompts/05-productos.md). El detalle de cualquier manifiesto de reconciliación futura queda fuera del alcance.

## HU-01 · Revisión e implementación

- **Aprobado por el candidato.** La fase 3 habilita las seis entidades, migraciones explícitas, carga, pruebas con Jest y verificación en PostgreSQL real. Los 106 productos eran una expectativa con base en el análisis. [Prompt de fase 3](prompts/03-modelo-importacion.md)
- **Implementado por Codex.** La heurística de clasificación quedó aprobada en [fase 4](prompts/04-autenticacion.md). El duplicado exacto se vincula por igualdad de los nueve campos decodificados y conserva ambos registros originales. Para la clasificación se aceptan parejas observadas inequívocas. Ante un conflicto de categoría, se comprueba la convención observada `CATEGORÍA-SUBCÓDIGO` para confirmar una pareja presente en el archivo. El mapeo desde minúsculas exige una pareja en mayúsculas confirmada.
- **Implementado por Codex y aprobado en [fase 4](prompts/04-autenticacion.md).** La repetición del mismo SHA reproduce el resultado registrado. En un archivo con otro SHA, un UPC proyectado anteriormente queda pendiente aunque se haya eliminado o editado su producto. También quedan pendientes los choques con UPC operativos existentes. Así se preservan bajas, ediciones y datos de instalaciones previas mediante el historial y la restricción única.
- **Aplicado por Codex.** Las cuatro comprobaciones de configuración migraron a Jest junto con los casos HU-01. Las pruebas destructivas usan un esquema temporal en la instancia aislada. [Comandos y evidencia](planes/03-modelo-importacion.md)

## HU-03 · Revisión y autenticación del backend

- **Aprobado por el candidato tras la revisión con ChatGPT.** Conservar la heurística de prefijos solo para resolver contradicciones del CSV. Usarla cuando confirma una pareja ya observada evita convertir el prefijo en una regla universal de negocio.
- **Aprobado por el candidato.** Preservar productos existentes, ediciones y bajas aunque cambie el SHA-256 del archivo. Mantener separadas la revisión y la persistencia del importador, y conservar las restricciones en PostgreSQL para proteger integridad y unicidad en cualquier escritura. [Aprobación de fase 4](prompts/04-autenticacion.md)
- **Observación de la revisión comunicada por el candidato.** Algunas pruebas de HU-01 comparten estado. Las nuevas pruebas HTTP reutilizan datos de lectura en un esquema aislado y recrean la aplicación en cada caso para reiniciar el limitador. El candidato autorizó avanzar sin reestructurar las pruebas de HU-01.
- **Implementado por Codex y aprobado en [fase 5](prompts/05-productos.md).** Los guardias globales requieren identidad y roles explícitos, con excepciones públicas por método. Una ruta protegida sin roles responde 403 al usuario autenticado. Así una omisión de metadatos no habilita por defecto una mutación.
- **Implementado por Codex y aprobado en [fase 5](prompts/05-productos.md).** El login limita 10 solicitudes por minuto por IP del par de red y bloquea durante un minuto al superar el cupo. El estado es local al proceso. La revisión de frontend aceptó el cupo compartido por instancia como límite local, sin confiar en cabeceras de IP.
- **Decisión aprobada de sesión.** La firma y validación usan HS256, emisor y audiencia fijos y el secreto del backend. La autorización conserva el rol firmado hasta que vence el token. La API de perfil comprueba que el usuario exista. Las solicitudes protegidas no consultan la cuenta en cada petición.

## HU-02 y HU-04 · Revisión y backend de catálogo

- **Aprobado por el candidato tras revisar HU-03 con ChatGPT.** Mantener guardias globales restrictivos, rutas públicas explícitas, rol firmado hasta el vencimiento, ausencia de renovación y revocación inmediata, y `@nestjs/jwt` 11 por compatibilidad con CommonJS.
- **Aprobado por el candidato.** Mantener el límite provisional de 10 solicitudes de login por minuto por IP en memoria. La integración con Next debe revisar cómo identifica a cada cliente sin confiar en cabeceras de IP no verificadas. Se mantiene el diseño sin Redis ni estado distribuido. [Prompt de fase 5](prompts/05-productos.md)
- **Aprobado por el candidato para esta fase.** Usar PostgreSQL como autoridad del UPC único. Mantener la auditoría en el servidor y borrar físicamente productos sin tocar su procedencia. Las consultas de clasificación son de solo lectura.
- **Implementado por Codex y aprobado en [fase 6](prompts/06-frontend.md).** El checksum incorrecto en altas y ediciones se informa mediante `X-UPC-Warning: UPC_CHECKSUM`. La cabecera mantiene los campos públicos del producto y permite mostrar el aviso en Next.
- **Propuesta histórica reemplazada en [fase 6](prompts/06-frontend.md).** La fase 5 conservaba la fecha histórica futura para evitar retrocesos. La corrección posterior responde 409 y mantiene la fila sin cambios. La comparación exacta de códigos se aprobó.

## Frontend e integración de HU-02, HU-03, HU-04 y HU-E3

- **Aprobado por el candidato tras revisar la fase 5 con ChatGPT.** Se mantienen las operaciones atómicas con `RETURNING`, la identificación específica del UPC duplicado, el borrado físico con procedencia, los permisos restrictivos, la comparación exacta de códigos y `X-UPC-Warning`. [Prompt de fase 6](prompts/06-frontend.md)
- **Corrección solicitada por el candidato.** Una edición registra el reloj real de PostgreSQL a segundos. Si la auditoría previa está en el futuro, responde con `409 AUDIT_DATE_CONFLICT` y conserva la fila. Codex implementó la decisión en una sentencia que bloquea la fila antes de tomar la hora y distingue el conflicto de un 404 o `UPC_CONFLICT`. El cambio y su prueba se pueden revisar por separado.
- **Implementado por Codex y aprobado en [fase 7](prompts/07-healthcheck.md).** Next usa un adaptador del mismo origen con rutas y cabeceras permitidas. La cookie HttpOnly vence con el JWT y Next valida el origen confiable en las mutaciones. El adaptador no reenvía cabeceras de IP. El límite de Nest se comparte por instancia de Next en este despliegue local.
- **Implementado por Codex y aprobado en [fase 7](prompts/07-healthcheck.md).** Los formularios pequeños usan controles nativos, estado local y mensajes compartidos. Lucide aporta iconos coherentes y Playwright verifica el flujo real. El listado, sus búsquedas y filtros se resuelven en memoria sobre la colección completa.

## HU-E2 y ajustes de catálogo

- **Aprobado por el candidato tras revisar la fase 6 con ChatGPT.** Conservar el adaptador del mismo origen, la cookie HttpOnly con margen de dos segundos respecto del JWT, estado local y controles nativos, Lucide, Playwright y filtros locales. Se acepta el límite de login compartido por instancia de Next en local, manteniendo fuera las cabeceras de IP no verificadas. [Prompt de fase 7](prompts/07-healthcheck.md)
- **Implementado por Codex y aprobado en [fase 8](prompts/08-auditoria-final.md).** El healthcheck usa `pg`, que ya era una dependencia de la API. Evita agregar Terminus para una única comprobación de PostgreSQL. Usa una conexión de prueba desechable, comparte la comprobación en curso y aplica un límite de 1,5 segundos. Se agregaron solo los tipos de `pg` para compilar.
- **Implementado por Codex y aprobado en [fase 8](prompts/08-auditoria-final.md).** El Dockerfile usa Node 22 y el lockfile, con ejecución como usuario `node`. Un Compose complementario configura la red interna y el healthcheck. La ejecución de migraciones y carga permanece explícita.
- **Implementado por Codex y aprobado en [fase 8](prompts/08-auditoria-final.md).** La vista muestra 20 productos por página tras aplicar búsqueda y filtros al catálogo completo. El móvil usa tarjetas con las seis columnas representadas y botones de administrador aptos para toque. La vista de escritorio conserva su tabla.

## Auditoría final

- **Aprobado por el candidato.** Se conserva el alcance de las historias y se autoriza corregir defectos concretos y preparar la entrega. Se mantienen el healthcheck con `pg`, el plazo y el chequeo compartido, la imagen con usuario no privilegiado y los ajustes de frontend. [Prompt de fase 8](prompts/08-auditoria-final.md)
- **Implementado por Codex y aprobado en [el cierre](prompts/09-cierre.md).** El adaptador limita los cuerpos JSON antes de autenticación o reenvío. La plantilla publica PostgreSQL en loopback. El ZIP de entrega local se excluye del árbol actual, con copia de respaldo.
- **Evaluación de Codex y riesgo aceptado por el candidato en [el cierre](prompts/09-cierre.md).** Los avisos moderados transitorios de npm se documentan con su alcance de ejecución. Cambiar de versión mayor de TypeORM o Jest sin una exposición observada en las rutas de catálogo ampliaría innecesariamente la auditoría. [Hallazgos](planes/08-auditoria-final.md)

## Cierre de revisión técnica

- **Aprobado por el candidato tras revisar la auditoría con ChatGPT.** Se aceptan las correcciones de seguridad y las pruebas unitarias adicionales. [Solicitud de cierre](prompts/09-cierre.md) · [Auditoría y evidencias](planes/08-auditoria-final.md)
- **Aceptado por el candidato.** Se conservan las dependencias actuales y el lockfile con los avisos moderados y sus límites de exposición documentados. Se conserva también el historial incremental, incluidos los ZIP históricos, tras la revisión de secretos. El ZIP de frontend queda fuera del árbol de entrega.
- **Alcance final.** La matriz conserva las adaptaciones del enunciado y el README mantiene los límites del entorno local. El candidato conserva el control del commit, el push y la publicación. [Matriz de aceptación](../docs/criterios-de-aceptacion.md) · [README](../README.md)
