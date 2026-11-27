hazlo en modo implementacion,&#x20;

# Fase 2 — Revisión del plan e inicialización del proyecto

He revisado el informe técnico generado junto con ChatGPT. Apruebo el plan general con las siguientes decisiones y modificaciones.

## 1. Decisiones aprobadas

- Monolito modular con NestJS.
- Monorepo sencillo con directorios api/ y web/.
- Node.js 22 y npm workspaces.
- TypeScript en modo estricto.
- Next.js App Router y Tailwind CSS.
- TypeORM con migraciones explícitas.
- Desactivar synchronize de TypeORM.
- PostgreSQL utilizando el Docker Compose proporcionado.
- JWT HS256 con secreto exclusivo del backend y expiración configurable de una hora.
- Contraseñas almacenadas mediante Argon2id.
- Autenticación mediante POST y eliminación mediante DELETE.
- Autorización mediante guards y roles en NestJS.
- Cookie HttpOnly para la sesión web y adaptador acotado en Next.js.
- Auditoría gestionada por el backend.
- Respuestas de error controladas.
- UPC almacenado como texto con restricción de unicidad.

## 2. Decisiones sobre HU-01

Apruebo la estrategia de preservar las 120 filas originales y proyectar únicamente los productos válidos.



El resultado esperado, pendiente de verificación real, es:

- 106 productos.
- 1 duplicado exacto vinculado.
- 13 filas pendientes.
- 5 categorías.
- 17 subcategorías.

Apruebo las normalizaciones de espacios externos en UPC y clasificación en minúsculas cuando exista una correspondencia inequívoca.



El checksum incorrecto generará una advertencia, sin bloquear el registro.



Las validaciones adicionales de descripción no vacía y cronología deberán quedar explícitamente documentadas como decisiones técnicas.



Conservar los valores originales y registrar cualquier transformación.

## 3. Modificaciones al plan original

- Mantener import_batches e import_rows para trazabilidad e idempotencia.
- No implementar un sistema completo de reconciliación posterior de datos.
- No implementar interfaces administrativas de importación.
- No implementar microservicios, CQRS, DDD complejo ni arquitectura hexagonal estricta.
- No introducir dependencias sin una necesidad concreta.
- Incorporar pruebas automatizadas relevantes durante cada bloque de implementación.
- Mantener toda la lógica de negocio en NestJS.
- Conservar el Docker Compose original. Cualquier ajuste necesario debe justificarse y preservar su compatibilidad.
- Ajustar el presupuesto de trabajo al tiempo restante real, ya que el plazo comenzó antes de la fase de análisis.

## 4. Trazabilidad

Conserva el plan inicial sin sobrescribirlo.



Registra este prompt en:



ia/prompts/02-inicializacion.md



Registra las decisiones aprobadas, las modificaciones y sus justificaciones en:



ia/decisiones.md



Genera una versión revisada y concisa del plan en:



ia/planes/02-plan-revisado.md



Distingue las propuestas de Codex, las recomendaciones de ChatGPT y las decisiones aprobadas por el candidato.



No inventes evidencias ni intervenciones humanas.

## 5. Implementación autorizada para esta fase

Inicializa exclusivamente la base técnica del proyecto.

- Configurar npm workspaces.
- Inicializar NestJS en api/.
- Inicializar Next.js en web/.
- Configurar TypeScript, ESLint y Prettier donde corresponda.
- Configurar los puertos de API y frontend según el enunciado.
- Preparar la configuración de entorno y su validación.
- Preparar la conexión de TypeORM con PostgreSQL y la infraestructura de migraciones.
- Configurar scripts raíz para instalación, desarrollo, compilación y validación.
- Conservar los archivos originales del ejercicio.
- Verificar que el gitignore excluya secretos y artefactos generados.
- Eliminar contenido innecesario generado por los scaffolds.

## 6. Validaciones

Ejecuta las comprobaciones disponibles de:

- Instalación de dependencias.
- Compilación de API.
- Compilación de frontend.
- Lint.
- Type checking.
- Configuración de Docker Compose.
- Conexión a PostgreSQL si Docker está disponible.

Reporta cualquier fallo real y su causa.

## 7. Cierre de la fase

Entrega un resumen conciso que incluya:

- Archivos creados y modificados.
- Dependencias incorporadas y justificación.
- Decisiones relevantes.
- Comandos ejecutados y resultados.
- Problemas pendientes.
- Resumen del diff.
- Commit recomendado.

No implementes todavía las entidades de negocio, el importador CSV ni la autenticación.



No realices commits ni push automáticamente.



Detente al finalizar esta fase para permitir mi revisión.
