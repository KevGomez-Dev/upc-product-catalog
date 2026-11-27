# Fase 5 — CRUD de productos, clasificación y permisos (HU-02 y HU-04)

La fase 4 ha sido revisada junto con ChatGPT mediante la documentación y las evidencias de ejecución proporcionadas.

Se autoriza continuar con la implementación de las funcionalidades de negocio del backend.

## 1. Revisión de la fase anterior

Se aprueban las siguientes decisiones:

- Guards globales con autorización restrictiva por defecto.
- Declaración explícita de rutas públicas.
- Rate limiting en memoria para el alcance de esta prueba.
- Límite provisional de 10 solicitudes de login por minuto por IP.
- JWT con rol firmado válido hasta su vencimiento.
- Ausencia de refresh tokens y revocación inmediata.
- Uso de @nestjs/jwt versión 11 por compatibilidad con la configuración CommonJS existente.

Durante la integración de Next.js deberá revisarse el comportamiento del rate limiting detrás del adaptador HTTP, evitando confiar en cabeceras de identificación de IP provenientes de clientes no confiables.

No incorporar Redis ni infraestructura distribuida para este propósito.

Registrar estas aprobaciones y observaciones en ia/decisiones.md.

## 2. Objetivo

Completar HU-02 y HU-04 en el backend utilizando las entidades, migraciones, autenticación y autorización existentes.

Consultar el PDF original, los planes y las decisiones previamente aprobadas.

Mantener la arquitectura de monolito modular y evitar duplicar responsabilidades.

## 3. Módulos y endpoints

Implementar los módulos, controladores, servicios y DTO necesarios para productos y clasificación.

Endpoints:

- GET /products
- GET /products/:id
- POST /products
- PUT /products/:id
- DELETE /products/:id
- GET /categories
- GET /categories/:categoryCode/subcategories

Los endpoints de consulta estarán disponibles para admin y manager.

Los endpoints de creación, modificación y eliminación estarán disponibles exclusivamente para admin.

Utilizar los guardias y decoradores existentes.

No duplicar los mecanismos de autenticación y autorización.

## 4. Contrato de productos

Mantener los nombres de propiedades solicitados en el enunciado:

- id
- upcCode
- upcDescription
- categoryCode
- subCategoryCode
- dateAdded
- updatedDate
- addedBy
- modifiedBy

El listado debe proporcionar los campos requeridos por la tabla del frontend, con orden determinista.

El detalle debe devolver toda la información solicitada.

Mantener el listado completo previsto por el enunciado. No incorporar paginación obligatoria ni funcionalidades de búsqueda que modifiquen el contrato existente.

Implementar el filtro opcional por categoría y subcategoría previsto en el plan, siempre que no introduzca complejidad innecesaria.

No exponer directamente entidades de persistencia ni información interna de importación.

## 5. Validaciones

Validar mediante DTO y reglas de negocio:

- UPC como cadena de exactamente 12 dígitos ASCII.
- Preservación de ceros iniciales.
- Descripción no vacía.
- Categoría existente.
- Subcategoría existente.
- Pertenencia de la subcategoría a la categoría indicada.
- Identificadores de producto enteros positivos.
- Rechazo de propiedades inesperadas.
- UPC único.

Mantener el checksum como diagnóstico no bloqueante, según las decisiones anteriores.

No aceptar campos de auditoría enviados por el cliente.

No duplicar reglas de validación que puedan reutilizarse de manera sencilla desde HU-01.

Las normalizaciones específicas del CSV no deben convertirse automáticamente en reglas generales del CRUD.

## 6. Persistencia y concurrencia

Mantener PostgreSQL como autoridad final de las restricciones de integridad y unicidad.

Una comprobación previa de UPC puede mejorar la experiencia de usuario, pero no reemplaza la restricción UNIQUE.

Capturar específicamente las violaciones de unicidad correspondientes al UPC y devolver HTTP 409.

No convertir indiscriminadamente todas las excepciones de PostgreSQL en conflictos de UPC.

Permitir que un producto conserve su propio UPC durante una edición.

Evitar operaciones innecesarias de lectura y escritura que puedan generar inconsistencias bajo concurrencia.

Realizar las modificaciones mediante operaciones atómicas cuando corresponda.

No incorporar bloqueo optimista, versionado de entidades ni mecanismos adicionales de concurrencia sin una necesidad concreta.

## 7. Auditoría

Gestionar la auditoría exclusivamente desde NestJS.

Durante la creación:

- dateAdded y updatedDate deben generarse en el servidor.
- addedBy y modifiedBy deben identificar al usuario autenticado.

Durante la edición:

- Conservar dateAdded y addedBy.
- Actualizar updatedDate y modifiedBy.

Obtener la identidad desde el mecanismo de autenticación existente, sin confiar en valores enviados por el cliente.

Utilizar UTC con precisión de segundos, según el contrato acordado.

Preservar los valores históricos procedentes del CSV.

## 8. Eliminación

Implementar DELETE /products/:id.

Utilizar borrado físico del producto, preservando su registro de origen en import_rows.

No eliminar registros históricos de importación.

No incorporar soft delete ni un sistema completo de auditoría de bajas, puesto que no forman parte del alcance aprobado.

La eliminación de un producto inexistente debe devolver 404.

La repetición de la importación inicial no debe restaurar productos eliminados.

## 9. Contratos HTTP

Mantener:

- 200 para consultas y modificaciones exitosas.
- 201 para creación exitosa.
- 204 para eliminación exitosa, sin cuerpo.
- 400 para datos inválidos.
- 401 para sesiones inválidas o ausentes.
- 403 para permisos insuficientes.
- 404 para recursos inexistentes.
- 409 para UPC duplicado.
- 500 para errores inesperados, sin revelar detalles internos.

Reutilizar el mecanismo de errores y requestId implementado en HU-03.

Los errores de validación deben permitir al frontend identificar los campos afectados.

No exponer trazas, consultas SQL ni información sensible.

## 10. Pruebas automatizadas

Añadir pruebas unitarias e integración HTTP con PostgreSQL real para comprobar:

- Listado y detalle como admin y manager.
- Creación, modificación y eliminación como admin.
- Rechazo de las tres operaciones de escritura como manager.
- Acceso sin autenticación.
- Identificadores inválidos.
- Producto inexistente.
- Campos obligatorios.
- UPC inválido.
- Preservación del cero inicial.
- UPC duplicado en creación y edición.
- Edición conservando el UPC original.
- Dos creaciones concurrentes con el mismo UPC: solo una debe completarse.
- Categoría y subcategoría inexistentes.
- Clasificación incompatible.
- Conservación de la auditoría original en modificaciones.
- Rechazo de campos de auditoría proporcionados por el cliente.
- Preservación de la procedencia después de eliminar un producto.
- Reejecución del importador sin restaurar productos eliminados.
- Consultas de categorías y subcategorías.

Probar los endpoints reales de producción, no solamente controladores auxiliares.

Mantener pruebas aisladas y utilizar esquemas temporales para operaciones destructivas.

## 11. Validación general

Ejecutar:

- Todas las pruebas existentes.
- Nuevas pruebas unitarias.
- Pruebas de integración con PostgreSQL.
- Lint.
- Formato.
- Type checking.
- Builds de API y frontend.

Verificar que HU-01 y HU-03 continúan funcionando.

No declarar funcionalidades como verificadas sin haber ejecutado las comprobaciones correspondientes.

## 12. Documentación de IA

Registrar el prompt en:

ia/prompts/05-productos.md

Registrar el plan conciso y las evidencias en:

ia/planes/05-productos.md

Actualizar ia/decisiones.md con las aprobaciones y decisiones reales.

Identificar las nuevas decisiones pendientes de revisión humana.

Mantener la documentación concisa, sin horarios ni presupuestos detallados.

## 13. Restricciones

- No implementar todavía las pantallas del frontend.
- No implementar un CRUD de categorías, subcategorías o usuarios.
- No agregar infraestructura externa.
- No introducir arquitectura hexagonal estricta, CQRS ni repositorios genéricos innecesarios.
- No modificar el CSV original.
- No modificar migraciones ya existentes. Si se requiere un cambio de esquema justificado, crear una nueva migración.
- No realizar commits ni push automáticamente.

## 14. Cierre

Entregar un informe conciso con:

- Funcionalidades implementadas.
- Contratos definitivos de los endpoints.
- Decisiones relevantes.
- Pruebas ejecutadas y resultados.
- Problemas detectados.
- Resumen del diff.
- Decisiones pendientes de revisión.
- Commit recomendado en inglés.

Detenerse al completar el backend de HU-02 y HU-04 para permitir la revisión humana.