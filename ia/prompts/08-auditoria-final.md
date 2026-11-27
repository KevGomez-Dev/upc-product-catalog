# Fase 8 — Auditoría técnica final y preparación de entrega

La fase 7 ha sido revisada junto con ChatGPT mediante la documentación y las evidencias proporcionadas.

Se aprueba:

- Healthcheck mediante pg sin incorporar Terminus.
- Timeout de 1,5 segundos.
- Reutilización de la comprobación de salud en curso.
- Dockerfile con Node.js 22 y usuario no privilegiado.
- Compose complementario, conservando el original.
- Migraciones y carga inicial explícitas.
- Paginación local de 20 productos.
- Tarjetas móviles.
- Ayuda de formato UPC.

Todas las historias obligatorias y adicionales están implementadas según las evidencias disponibles.

Se autoriza realizar exclusivamente la auditoría final, corregir defectos concretos y preparar la documentación definitiva.

## 1. Auditoría de requisitos

Releer completamente el PDF original y contrastar cada criterio de aceptación con la implementación actual.

Construir una matriz concisa que incluya:

- Historia de usuario.
- Criterio de aceptación.
- Implementación correspondiente.
- Evidencia de verificación.
- Estado: cumplido, adaptado justificadamente, parcial o pendiente.

No declarar cumplimiento literal cuando se hayan modificado deliberadamente mecanismos solicitados en el enunciado.

Documentar especialmente las desviaciones relacionadas con:

- Preservación de las 120 filas y proyección de 106 productos.
- UPC almacenado como texto.
- Login mediante POST.
- Eliminación mediante DELETE.
- JWT con expiración y secreto exclusivo del servidor.
- Contraseñas hasheadas.
- Cookie HttpOnly.
- Auditoría gestionada por el backend.
- Respuestas de error controladas.
- Uso de .env.example en lugar de publicar secretos.

No implementar alternativas inseguras para obtener cumplimiento literal.

## 2. Auditoría del código

Revisar API, frontend, migraciones, importador, configuración y pruebas.

Buscar defectos reales relacionados con:

- Seguridad.
- Autenticación y autorización.
- Exposición de información sensible.
- Validación de entradas.
- Concurrencia.
- Integridad relacional.
- Manejo de errores.
- Recursos no liberados.
- Código muerto.
- Configuración incorrecta.
- Dependencias innecesarias.
- Duplicación de lógica relevante.
- Problemas de accesibilidad.

Clasificar los hallazgos por severidad e impacto.

Corregir defectos concretos y proporcionados al alcance. No realizar refactorizaciones arquitectónicas generales ni cambios cosméticos innecesarios.

## 3. Auditoría de dependencias y repositorio

Revisar las dependencias mediante npm audit y distinguir vulnerabilidades de producción de aquellas correspondientes exclusivamente al desarrollo.

No ejecutar npm audit fix --force ni actualizar indiscriminadamente dependencias.

Analizar el impacto real de cualquier vulnerabilidad encontrada.

Verificar:

- Archivos ignorados.
- Archivos versionados.
- Historial de commits.
- Ausencia de secretos reales, tokens y archivos .env privados, incluso en el historial.
- Ausencia de node_modules, dist, .next, coverage y archivos temporales.
- Existencia y consistencia del lockfile.
- Compatibilidad de Node.js.
- Ausencia de rutas absolutas dependientes del computador del candidato en las instrucciones de instalación.

No imprimir secretos encontrados ni reescribir el historial sin autorización.

Distinguir las credenciales demo del enunciado de los secretos reales.

## 4. Reproducibilidad desde un entorno limpio

Crear una copia temporal aislada del repositorio, incluyendo los cambios de esta fase que aún no estén confirmados.

Seguir exclusivamente los pasos documentados en el README.

Verificar:

- Instalación mediante npm ci.
- Configuración de variables de entorno.
- Arranque de PostgreSQL.
- Ejecución de migraciones.
- Primera importación.
- Segunda importación idempotente.
- Arranque de API y frontend.
- Login con ambos usuarios demo.
- CRUD de productos.
- Permisos de manager.
- Healthcheck.
- Ejecución alternativa de la API mediante Docker.

Utilizar una base de datos aislada.

No depender de configuraciones, dependencias o archivos privados existentes en el entorno de desarrollo original.

Registrar cualquier instrucción incorrecta o paso omitido y corregir el README.

## 5. Validación definitiva

Ejecutar:

- Lint.
- Formato.
- Type checking.
- Build de NestJS.
- Build de Next.js.
- Pruebas unitarias.
- Pruebas de integración con PostgreSQL real.
- Pruebas Playwright.
- Validación de Docker Compose.
- Healthcheck y recuperación de PostgreSQL.

Comprobar nuevamente que la carga inicial conserva:

- 120 filas originales.
- 106 productos.
- 1 duplicado exacto vinculado.
- 13 filas pendientes.
- 5 categorías.
- 17 subcategorías.
- 2 usuarios demo.

No modificar ni eliminar pruebas para conseguir resultados exitosos.

Registrar únicamente comprobaciones realmente ejecutadas.

## 6. README definitivo

El README raíz debe ser profesional, conciso y suficiente para que un evaluador ejecute el proyecto.

Incluir:

- Descripción del proyecto.
- Stack tecnológico.
- Arquitectura general.
- Requisitos previos.
- Instalación.
- Configuración.
- Migraciones.
- Carga inicial.
- Arranque de API y frontend.
- URLs locales.
- Credenciales demo exactas.
- Matriz de permisos.
- Comandos de pruebas.
- Ejecución mediante Docker.
- Resultado de la importación.
- Decisiones técnicas relevantes.
- Desviaciones justificadas respecto del enunciado.
- Limitaciones conocidas.
- Referencia a la documentación de IA.

Incorporar un diagrama Mermaid sencillo de la arquitectura y, si aporta valor, del modelo relacional.

Añadir capturas reales y actualizadas del login, catálogo, detalle, formulario y versión móvil, previa revisión de que no contengan información sensible.

Evitar documentación redundante o afirmaciones que no estén respaldadas por la implementación.

## 7. Documentación de inteligencia artificial

Revisar completamente ia/.

Conservar todos los prompts originales y planes históricos.

Actualizar ia/README.md para explicar las herramientas utilizadas, sus responsabilidades y cómo se organizó el proceso de desarrollo y revisión.

Actualizar ia/decisiones.md:

- Vincular decisiones iniciales con aprobaciones o modificaciones posteriores.
- Identificar decisiones reemplazadas por otras.
- Resolver estados pendientes cuando exista evidencia real de aprobación.
- No eliminar propuestas anteriores relevantes.
- No atribuir al candidato recomendaciones formuladas exclusivamente por ChatGPT o Codex.

Crear:

ia/conversaciones/chatgpt.md

Incorporar los siguientes extractos reales de las revisiones de ChatGPT:

Importación:

«No implementaría todo ese mecanismo ahora. Mantendría las tablas import_batches e import_rows, pero limitaría su alcance a la carga inicial, trazabilidad, diagnóstico e idempotencia.»

Arquitectura:

«No incorporaría arquitectura hexagonal estricta, DDD complejo, Nx, Kafka ni microservicios.»

Autenticación:

«No incorporaría Redis ni infraestructura distribuida para resolverlo.»

Auditoría:

«Mi recomendación es utilizar la fecha real del servidor y, si existe una fecha histórica posterior al reloj actual, devolver un conflicto explícito en lugar de registrar una auditoría inexacta.»

Documentación:

«No necesitamos generar un informe de diez páginas por cada fase.»

Frontend:

«Para un formulario de cuatro campos, incorporar React Hook Form, Zod y una biblioteca de estado global no era imprescindible.»

Identificar cada extracto como una recomendación de ChatGPT y vincularlo con los prompts, decisiones y cambios correspondientes.

Incorporar también extractos relevantes y auténticos de las conversaciones de Codex que estén disponibles.

No reconstruir conversaciones ficticias ni fabricar intervenciones humanas.

## 8. Evidencia final

Registrar este prompt en:

ia/prompts/08-auditoria-final.md

Registrar el plan conciso y los resultados reales en:

ia/planes/08-auditoria-final.md

Incluir la matriz de aceptación en un documento apropiado y referenciarla desde el README.

Evitar horarios específicos y presupuestos detallados de tiempo.

## 9. Restricciones

- No incorporar nuevas funcionalidades.
- No modificar el CSV original.
- No modificar migraciones existentes sin una necesidad demostrable.
- No introducir infraestructura adicional.
- No realizar actualizaciones masivas de dependencias.
- No inventar resultados de pruebas.
- No realizar commits ni push automáticamente.
- No cambiar la visibilidad del repositorio.
- No enviar la prueba al reclutador.

## 10. Informe de cierre

Entregar un informe final conciso con:

- Cumplimiento de historias y criterios.
- Hallazgos de auditoría.
- Correcciones realizadas.
- Resultados definitivos de las pruebas.
- Resultado de la instalación limpia.
- Estado de seguridad y dependencias.
- Limitaciones conocidas.
- Estado del README y documentación de IA.
- Archivos modificados.
- Commits recomendados.
- Bloqueos pendientes de entrega, si existen.

Detenerse al finalizar para permitir la aprobación definitiva del candidato.