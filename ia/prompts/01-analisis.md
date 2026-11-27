# Fase 1 — Análisis de requisitos y planificación

Estoy realizando una prueba técnica para un cargo Full Stack Senior de Talento GOES.



El objetivo es construir una aplicación de catálogo de productos UPC utilizando obligatoriamente NestJS, Next.js y PostgreSQL.



Disponemos de aproximadamente 10 horas para desarrollar, validar, documentar y entregar.

## Instrucciones iniciales

Lee completamente los siguientes archivos:

- PruebaTecnica_Productos_UPC.pdf
- data/productos.csv
- docker-compose.yml
- .env.example
- README.md

No implementes todavía código funcional ni inicialices los frameworks.

## Contexto de evaluación

- Funcionalidad obligatoria: 30%.
- Historial incremental de commits: 15%.
- Uso documentado de IA: 15%.
- Calidad y arquitectura: 15%.
- Validaciones y manejo de errores: 10%.
- README: 5%.
- Extras: 10%.

La prueba permite expresamente herramientas agénticas y evalúa el criterio del candidato.



Las historias de usuario fueron redactadas por un Product Owner no técnico.

## Análisis solicitado

1. Extrae todos los requisitos funcionales, técnicos y criterios de aceptación de HU-01 a HU-04.
2. Separa los extras HU-E1 a HU-E3.
3. Identifica contradicciones, ambigüedades y decisiones técnicas inseguras.
4. Analiza programáticamente las 120 filas del CSV.
5. Identifica duplicados, problemas de formato, fechas inválidas, filas mal formadas, campos vacíos, inconsistencias de clasificación y pérdida potencial de información.
6. Genera un inventario exacto de incidencias, indicando número de línea, ID original, valor afectado y propuesta de tratamiento.
7. Propón una estrategia de importación idempotente, auditable y reproducible.
8. No modifiques silenciosamente datos ni inventes información de negocio.
9. Analiza todos los requisitos de autenticación, autorización, auditoría y seguridad.
10. Distingue objetivos funcionales de decisiones de implementación inseguras.
11. Propón alternativas seguras y explica qué criterios de aceptación podrían verse afectados.
12. Propón una arquitectura proporcional al alcance y al plazo.
13. Diseña el modelo relacional, restricciones, índices y migraciones.
14. Propón los contratos de API y las pantallas necesarias.
15. Define una estrategia de testing.
16. Genera un plan incremental de implementación y commits.
17. Estima el esfuerzo y prioriza completar HU-01 a HU-04 antes de los extras.

## Hallazgos preliminares de ChatGPT

Ya se identificaron posibles problemas relacionados con:

- IDs y UPC duplicados.
- UPC con ceros iniciales, caracteres inválidos y notación científica.
- Campos vacíos.
- Clasificaciones contradictorias.
- Fechas inválidas.
- Una fila CSV con una columna adicional.
- Contradicción entre importar todas las filas y garantizar unicidad.
- JWT_SECRET controlado por el cliente.
- Contraseñas almacenadas de forma legible.
- Login y eliminación mediante GET.
- JWT sin expiración.
- Auditoría controlada por el frontend.
- Exposición de errores técnicos.
- Publicación de variables de entorno.

Verifica independientemente estos hallazgos. No los aceptes automáticamente.

## Restricciones

- No introducir microservicios, CQRS, DDD complejo ni abstracciones innecesarias.
- No inventar requisitos de negocio.
- No implementar mecanismos de autenticación deliberadamente vulnerables.
- No ignorar criterios de aceptación sin documentar el motivo.
- Mantener el proyecto simple, mantenible y defendible.
- No utilizar datos o credenciales reales en el repositorio público.
- No fabricar evidencias de pruebas ni decisiones humanas.

## Trazabilidad de IA

La carpeta ia/ es obligatoria.



Registra este prompt y el plan generado en:

- ia/prompts/01-analisis.md
- ia/planes/01-plan-inicial.md

Las decisiones propuestas deben quedar pendientes de aprobación humana. No declares que fueron aceptadas hasta que yo lo confirme.



Entrega el informe de análisis completo y detente.



No comiences la implementación hasta recibir mi aprobación.                                                                                    &#x20;

## Feedback adicional del reclutador

El reclutador confirmó expresamente:



"Recordar que puede hacer uso de la IA, y lo que se estará evaluando también es la aplicación del criterio propio del desarrollador en el código y las buenas prácticas."



Por lo tanto:

- Actúa como pair programmer, no como responsable autónomo de las decisiones técnicas.
- Cuestiona los requisitos contradictorios o técnicamente inseguros.
- Presenta alternativas cuando existan decisiones arquitectónicas relevantes.
- Explica ventajas, desventajas y trade-offs.
- Diferencia requisitos obligatorios, decisiones técnicas y mejoras opcionales.
- No agregues patrones, dependencias o abstracciones sin una necesidad demostrable.
- Registra las propuestas como pendientes de aprobación humana.
- Conserva evidencia auténtica de los prompts, planes, revisiones y decisiones.
- No inventes intervenciones humanas ni resultados de pruebas.
- No realices commits automáticamente sin mi autorización.

La prioridad es entregar una solución funcional, segura, mantenible, reproducible y defendible.



Tenemos un plazo estricto. El análisis debe ser exhaustivo pero orientado a decisiones concretas, evitando documentación redundante.



Finaliza esta primera fase con un informe técnico y un plan de implementación priorizado. No comiences a desarrollar todavía.

## Seguimientos del usuario

> vuelve analizar ahora todo

> vuelve analizar todo en modo Planificación
