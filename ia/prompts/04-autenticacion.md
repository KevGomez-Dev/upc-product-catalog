# Fase 4 — Autenticación y autorización (HU-03)

La fase HU-01 ha sido revisada junto con ChatGPT, incluyendo el código fuente, las migraciones, las restricciones de PostgreSQL y las pruebas automatizadas.

Se autoriza continuar con la autenticación y autorización del backend.

## 1. Revisión de la fase anterior

Se aprueban las siguientes decisiones:

- Resolución de clasificaciones contradictorias mediante la convención de prefijos observada en el CSV, documentándola como heurística específica del conjunto de datos y no como regla universal de negocio.
- Preservación de productos existentes, ediciones y bajas ante nuevas importaciones con diferente SHA-256.
- Separación de responsabilidades del importador.
- Uso de restricciones de integridad en PostgreSQL.

Registrar estas decisiones y sus justificaciones en ia/decisiones.md.

Durante la revisión se identificó que algunas pruebas de integración comparten estado. No constituye un bloqueo para continuar, pero debe considerarse al desarrollar las nuevas pruebas.

## 2. Objetivo

Implementar la autenticación de NestJS utilizando los usuarios demo existentes y preparar los mecanismos de autorización reutilizables para los endpoints del catálogo.

Mantener la arquitectura modular y las decisiones técnicas aprobadas.

## 3. Autenticación

Implementar:

- AuthModule.
- AuthService.
- AuthController.
- DTO de login.
- POST /auth/login.
- GET /auth/me.

Utilizar la entidad User existente y Argon2id para verificar las contraseñas.

El login debe devolver HTTP 200 con accessToken cuando las credenciales sean válidas.

Para credenciales incorrectas, devolver HTTP 401 con un mensaje genérico que no permita distinguir usuarios inexistentes de contraseñas incorrectas.

Utilizar una verificación equivalente contra un hash ficticio cuando el usuario no exista, para reducir diferencias temporales.

Validar el payload y limitar razonablemente la longitud de los campos de entrada.

No modificar las contraseñas recibidas mediante trim ni normalizaciones.

No devolver passwordHash en respuestas, excepciones ni logs.

Incorporar un mecanismo sencillo de limitación de intentos de login, sin introducir infraestructura adicional como Redis.

## 4. JWT

Utilizar JWT HS256 mediante las herramientas oficiales de NestJS que resulten apropiadas.

Reutilizar la configuración de entorno existente.

El token debe incluir:

- sub: identificador del usuario.
- role: admin o manager.
- iat.
- exp.
- iss.
- aud.

El secreto debe pertenecer exclusivamente al backend.

Validar explícitamente el algoritmo permitido, expiración, emisor, audiencia y estructura de identidad y rol.

No aceptar secretos proporcionados por el cliente.

No registrar tokens en logs.

Mantener la duración configurable, con valor predeterminado de una hora.

No implementar refresh tokens, sesiones distribuidas ni revocación inmediata. Documentar las limitaciones de esta decisión.

## 5. Autorización

Implementar mecanismos reutilizables:

- JwtAuthGuard.
- RolesGuard.
- Decorador Roles.
- Decorador CurrentUser, si facilita el acceso tipado a la identidad autenticada.

Garantizar:

- HTTP 401 cuando falte el token o sea inválido.
- HTTP 403 cuando el usuario autenticado no tenga el permiso requerido.
- Admin puede consultar y realizar mutaciones.
- Manager puede consultar, pero no realizar mutaciones.

La autorización debe aplicarse en NestJS y no depender del frontend.

Evitar que un endpoint futuro quede desprotegido accidentalmente. Evaluar protección global con rutas públicas explícitas, justificando la decisión.

## 6. Configuración y errores

Configurar validaciones globales apropiadas mediante ValidationPipe y DTOs.

Rechazar propiedades inesperadas en las solicitudes.

Mantener mensajes de error funcionales y no exponer stack traces, consultas SQL ni información sensible.

No crear una infraestructura de errores excesivamente compleja.

Mantener el contrato de error acordado en la planificación.

## 7. Pruebas automatizadas

Incorporar pruebas Jest para:

- Login correcto como admin.
- Login correcto como manager.
- Contraseña incorrecta.
- Usuario inexistente.
- Payload inválido.
- Token ausente.
- Token inválido.
- Token expirado.
- Token firmado con otro secreto.
- Validación del algoritmo, emisor y audiencia.
- Acceso autorizado por rol.
- Acceso prohibido para manager.
- GET /auth/me.
- Exclusión de información sensible.
- Limitación de intentos de login.

Usar pruebas de integración HTTP con Supertest donde aporten valor.

Verificar el login con los usuarios demo cargados en PostgreSQL real.

Mantener las pruebas aisladas y evitar dependencias innecesarias entre casos.

No presentar rutas artificiales de pruebas como endpoints públicos de producción.

## 8. Validación

Ejecutar:

- Pruebas existentes de HU-01.
- Nuevas pruebas de autenticación.
- Pruebas de integración correspondientes.
- Lint.
- Formato.
- Type checking.
- Builds.

Registrar resultados reales y problemas detectados.

Comprobar que la implementación no afecte las migraciones ni el importador.

## 9. Documentación de IA

Registrar este prompt en:

ia/prompts/04-autenticacion.md

Registrar el plan conciso y las evidencias de ejecución en:

ia/planes/04-autenticacion.md

Actualizar ia/decisiones.md con las decisiones reales de esta fase.

Diferenciar las propuestas de Codex, las recomendaciones de ChatGPT y las aprobaciones del candidato.

No incluir horarios específicos ni estimaciones detalladas de tiempo.

No inventar intervenciones humanas ni resultados.

## 10. Restricciones

- No implementar todavía el CRUD de productos.
- No implementar todavía el frontend de autenticación.
- No implementar funcionalidades de administración de usuarios.
- No incorporar infraestructura externa innecesaria.
- No modificar el CSV ni las migraciones existentes sin una justificación imprescindible.
- No realizar commits ni push automáticamente.

## 11. Cierre

Entregar un informe conciso con implementación, dependencias, decisiones, pruebas, resultados, observaciones pendientes y commit recomendado en inglés.

Detenerse al finalizar la autenticación y los mecanismos de autorización del backend para permitir la revisión humana.