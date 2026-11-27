# Fase 3 — Modelo relacional e importación de catálogo (HU-01)

La fase 2 ha sido revisada. Se autoriza continuar con la implementación de HU-01.

Consulta el estado actual del repositorio, el PDF original, el CSV, el plan inicial, el plan revisado y las decisiones aprobadas en ia/.

## 1. Objetivo

Implementar el modelo de persistencia, las migraciones, la carga inicial del catálogo y las pruebas correspondientes a HU-01.

Mantener las decisiones arquitectónicas aprobadas anteriormente.

## 2. Modelo de datos

Implementar las entidades y migraciones correspondientes a:

- categories
- subcategories
- products
- users
- import_batches
- import_rows

Aplicar las siguientes reglas:

- Claves primarias, foráneas y restricciones explícitas.
- UPC como varchar(12), preservando ceros iniciales.
- Restricción UNIQUE de UPC en PostgreSQL.
- Validación de exactamente 12 dígitos ASCII.
- Relación consistente entre categoría, subcategoría y producto.
- Identificadores internos independientes de los IDs originales del CSV.
- Fechas UTC con precisión de segundos.
- Campos de auditoría.
- Índices justificados por restricciones y consultas previstas.
- Roles admin y manager.
- Contraseñas almacenadas mediante Argon2id.
- synchronize desactivado.

No duplicar información relacional innecesariamente.

No inventar nombres de categorías ni cuentas autenticables a partir de los actores históricos del CSV.

Utilizar migraciones explícitas, reproducibles y reversibles.

## 3. Importación del CSV

Implementar un comando CLI documentable, con modo de inspección sin escrituras y modo de carga.

Requisitos:

- Utilizar un parser CSV confiable que soporte comillas, comas y registros mal formados identificables.
- Conservar las 120 filas originales con su número de línea, contenido, estado y diagnósticos.
- Identificar el lote por SHA-256.
- Registrar las normalizaciones realizadas.
- Detectar duplicados exactos y conflictos de UPC.
- Validar formato, clasificación y coherencia temporal.
- Preservar las descripciones que contienen comas y comillas.
- Conservar los ceros iniciales.
- No corregir valores ambiguos mediante suposiciones.
- Registrar el checksum incorrecto como advertencia no bloqueante.
- Ejecutar la persistencia de manera transaccional.
- Garantizar idempotencia.
- No sobrescribir ni restaurar productos modificados o eliminados después de la importación.
- No sobrescribir usuarios existentes al reejecutar la carga.
- Mostrar un resumen claro de resultados e incidencias.

Mantener el importador modular, separando lectura, validación, clasificación y persistencia cuando exista una responsabilidad diferenciada.

No implementar un sistema de reconciliación posterior ni interfaces administrativas.

## 4. Resultados esperados

Sobre una base limpia, el análisis previo proyecta:

- 120 filas originales preservadas.
- 106 productos operativos.
- 1 duplicado exacto vinculado.
- 13 filas pendientes de conciliación.
- 5 categorías.
- 17 subcategorías.
- 2 usuarios demo, con las credenciales del enunciado y contraseñas hasheadas.

Estos conteos son expectativas, no resultados confirmados.

No fuerces el código para obtenerlos. Si existen diferencias, identifica su causa y repórtala.

## 5. Pruebas automatizadas

Incorporar Jest desde esta fase, dado que corresponde a HU-E1.

Conservar las cuatro pruebas de configuración existentes o migrarlas si existe una justificación concreta, sin perder cobertura.

Incluir pruebas relevantes para:

- Parsing de CSV.
- UPC con cero inicial.
- UPC inválido.
- Normalizaciones aprobadas.
- Duplicados exactos.
- Conflictos de UPC entre productos distintos.
- Clasificación inconsistente.
- Fechas inválidas.
- Descripción vacía.
- Idempotencia.

Realizar también verificaciones de integración contra PostgreSQL real, incluyendo restricciones de unicidad e integridad relacional.

Utilizar una base o instancia aislada para las pruebas destructivas.

No mockear PostgreSQL para afirmar que sus restricciones funcionan.

## 6. Validación real

Levantar PostgreSQL mediante el Docker Compose entregado.

Ejecutar las migraciones y la carga inicial.

Comprobar mediante consultas reales:

- Conteos de todas las entidades.
- Estados de las 120 filas.
- Preservación de valores originales.
- Restricciones de unicidad.
- Relaciones de clasificación.
- Contraseñas demo almacenadas como hashes.
- Segunda ejecución sin duplicados ni modificaciones inesperadas.

Ejecutar lint, formato, type checking, tests y builds.

Verificar que los resultados sean reproducibles y que los archivos originales permanezcan intactos.

## 7. Documentación de IA

Registrar este prompt en:

ia/prompts/03-modelo-importacion.md

Registrar el plan breve de ejecución en:

ia/planes/03-modelo-importacion.md

Actualizar ia/decisiones.md únicamente con decisiones reales, distinguiendo las decisiones aprobadas por el candidato de las propuestas pendientes de revisión.

Registrar los resultados reales de las comprobaciones y cualquier desviación.

No sobrescribir los planes anteriores.

## 8. Restricciones

- No implementar todavía endpoints CRUD.
- No implementar todavía login, JWT ni guards.
- No implementar pantallas de frontend.
- No modificar el CSV original.
- No introducir dependencias innecesarias.
- No realizar commits ni push automáticamente.
- No ocultar errores de ejecución ni pruebas fallidas.

## 9. Informe de cierre

Entregar un informe conciso con:

- Resumen de la implementación.
- Entidades y migraciones creadas.
- Dependencias añadidas y justificación.
- Resultado real de la primera y segunda importación.
- Conteos comprobados mediante SQL.
- Pruebas ejecutadas y resultados.
- Decisiones nuevas pendientes de revisión.
- Problemas detectados.
- Resumen del diff.
- Commit recomendado en inglés.

## Ajuste de documentación

- Simplificar ia/planes/02-plan-revisado.md, eliminando horarios específicos, cálculos de tiempo restante y estimaciones detalladas en minutos.
- Mantener las prioridades, el orden de implementación y las dependencias entre funcionalidades.
- Conservar los prompts originales como evidencia histórica.
- Registrar únicamente información que aporte valor técnico a la evaluación.
- En adelante, mantener los planes, decisiones e informes de implementación concisos, profesionales y respaldados por evidencia verificable.

Este ajuste no requiere una fase independiente. Realízalo junto con la implementación de HU-01.

Priorizar una solución funcional, mantenible y defendible.

Detenerse al completar HU-01 para permitir la revisión humana.
