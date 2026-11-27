# Fase 7 — Healthcheck y mejoras finales de experiencia de usuario

La fase 6 ha sido revisada junto con ChatGPT, incluyendo las capturas, el código fuente del frontend, la gestión de sesiones, los formularios y las pruebas de navegador.

Se autoriza continuar con HU-E2 y mejoras menores de experiencia de usuario.

## 1. Decisiones aprobadas

- Adaptador HTTP del mismo origen mediante Next.js.
- Cookie HttpOnly y expiración coordinada con el JWT.
- Margen de dos segundos en la expiración de la cookie para evitar superar la vigencia del JWT.
- Formularios con estado local y controles nativos.
- Lucide para iconografía.
- Playwright para pruebas de navegador.
- Búsqueda y filtros locales sobre el catálogo completo.
- Mantener el rate limiting compartido por instancia de Next.js como limitación documentada del entorno local.

No incorporar Redis ni confiar en cabeceras de IP no verificadas.

Registrar estas decisiones en ia/decisiones.md.

## 2. HU-E2 — Healthcheck

Consultar nuevamente los criterios originales de HU-E2.

Implementar GET /health en NestJS.

El endpoint debe:

- Ser público mediante el decorador existente.
- Comprobar la disponibilidad de la API.
- Comprobar la conexión real con PostgreSQL.
- Aplicar un timeout razonable a la comprobación.
- Devolver HTTP 200 cuando los componentes estén disponibles.
- Devolver HTTP 503 cuando PostgreSQL no esté disponible.
- Proporcionar una respuesta JSON clara y consistente.
- No exponer credenciales, cadenas de conexión, consultas SQL, stack traces ni detalles internos.

Evaluar @nestjs/terminus frente a una implementación sencilla utilizando las dependencias existentes.

Elegir la alternativa proporcional al alcance y justificar la decisión.

## 3. Docker

El Docker Compose original contiene PostgreSQL y Adminer.

Para completar HU-E2:

- Crear un Dockerfile reproducible para la API.
- Incorporar un servicio de API mediante un archivo Compose complementario, conservando el archivo original.
- Configurar el healthcheck del servicio utilizando GET /health.
- Utilizar una imagen compatible con Node.js 22.
- Aprovechar el lockfile existente.
- Evitar incorporar secretos en la imagen.
- Ejecutar el proceso con un usuario no privilegiado cuando sea viable.
- Permitir configurar la interfaz de escucha de NestJS para ejecutarlo dentro de Docker, conservando el valor local seguro por defecto.
- Utilizar la red interna de Compose para conectar con PostgreSQL.
- No habilitar synchronize.
- Mantener explícita la ejecución de migraciones y la carga inicial.
- Documentar los comandos necesarios para reproducir la ejecución.

No es necesario contenerizar Next.js para completar este extra.

Conservar también la posibilidad de ejecutar API y frontend localmente, como hasta ahora.

## 4. Mejoras menores de frontend

Mantener el diseño visual actual. La revisión considera que la interfaz ya tiene una presentación profesional y coherente.

Aplicar únicamente mejoras justificadas:

- Incorporar texto de ayuda en el campo UPC, indicando que debe contener exactamente 12 dígitos y puede comenzar con cero.
- Evaluar paginación local de 20 productos por página, manteniendo la carga completa desde el backend, la búsqueda y los filtros sobre todos los productos.
- Si se implementa paginación, mantener accesible la totalidad del catálogo, reiniciar la página al cambiar filtros y ajustar las pruebas afectadas.
- Evaluar una presentación móvil más cómoda, mediante tarjetas compactas o mejoras de la tabla existente. Mantener accesibles todos los datos obligatorios.
- Comprobar que las acciones del administrador continúen siendo accesibles mediante teclado y dispositivos móviles.

Las mejoras visuales son secundarias. No realizar un rediseño completo ni introducir nuevas bibliotecas de componentes.

## 5. Pruebas y validación

Verificar:

- Healthcheck exitoso con PostgreSQL disponible.
- HTTP 503 cuando PostgreSQL no está disponible.
- Recuperación del estado saludable cuando PostgreSQL vuelve a estar disponible.
- Acceso a /health sin token.
- Ausencia de información sensible en las respuestas.
- Construcción de la imagen Docker.
- Arranque del servicio API en Compose.
- Estado healthy real del contenedor.
- Conservación de las funcionalidades existentes.

Realizar las pruebas destructivas sobre una instancia aislada.

Ejecutar nuevamente:

- Pruebas unitarias.
- Pruebas de integración.
- Pruebas Playwright.
- Lint.
- Formato.
- Type checking.
- Builds.

Si una mejora de frontend altera una prueba, actualizarla sin reducir su cobertura.

## 6. Documentación de IA

Registrar el prompt en:

ia/prompts/07-healthcheck.md

Registrar el plan conciso y las evidencias en:

ia/planes/07-healthcheck.md

Actualizar ia/decisiones.md.

Conservar los prompts y planes anteriores.

No inventar decisiones humanas, resultados ni evidencias.

## 7. Restricciones

- No modificar el CSV original.
- No reestructurar la arquitectura existente.
- No introducir funcionalidades ajenas al catálogo.
- No incorporar sistemas de observabilidad externos.
- No implementar nuevas historias de usuario no solicitadas.
- No realizar commits ni push automáticamente.

## 8. Cierre

Entregar un informe conciso con:

- Implementación de HU-E2.
- Configuración Docker.
- Mejoras de frontend efectivamente realizadas.
- Decisiones y dependencias nuevas.
- Resultados reales de las pruebas.
- Problemas pendientes.
- Resumen del diff.
- Commits recomendados en inglés.

Mantener separables los cambios de infraestructura y las mejoras de frontend.

Detenerse al finalizar para permitir la revisión humana y la auditoría definitiva.