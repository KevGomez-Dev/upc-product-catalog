# Fase 6 — Frontend, sesión e integración del catálogo

La fase 5 ha sido revisada junto con ChatGPT, incluyendo el código fuente de autenticación, productos, clasificación, DTO, guardias y pruebas.

Se autoriza continuar con la implementación del frontend y la integración de las historias obligatorias.

## 1. Revisión de la fase anterior

Se aprueba:

- Uso de operaciones atómicas y RETURNING.
- Tratamiento específico de la restricción de unicidad del UPC.
- Borrado físico conservando la procedencia.
- Autorización restrictiva por defecto.
- Cabecera X-UPC-Warning para comunicar un checksum incorrecto sin bloquear el guardado.
- Validación exacta de los códigos de clasificación.

Modificar la regla de auditoría que utiliza GREATEST para conservar fechas históricas posteriores al reloj actual.

La fecha de modificación debe representar la operación real. Si una fecha histórica futura impide registrar una modificación coherente, responder con un conflicto de negocio explícito, sin alterar la fila.

Mantener esta comprobación dentro de una operación atómica para evitar inconsistencias concurrentes.

Actualizar las pruebas afectadas y distinguir este conflicto del UPC duplicado.

Registrar las decisiones y justificaciones en ia/decisiones.md. Mantener esta corrección como un cambio separable del frontend.

## 2. Objetivo

Completar las funcionalidades web correspondientes a HU-02, HU-03 y HU-04.

Implementar también HU-E3 mediante selectores dependientes de categoría y subcategoría.

Consultar el PDF original, los contratos reales de la API, los planes y las decisiones aprobadas.

Priorizar una experiencia de usuario profesional, mantenible y funcional.

## 3. Arquitectura frontend

Mantener Next.js App Router, React, TypeScript estricto y Tailwind CSS.

Organizar el código por responsabilidades y funcionalidades, separando:

- Autenticación y sesión.
- Comunicación HTTP con NestJS.
- Tipos y contratos de API.
- Componentes reutilizables.
- Funcionalidades del catálogo.
- Validaciones de formularios.

No crear abstracciones genéricas innecesarias.

Mantener toda la lógica de negocio y autorización definitiva en NestJS.

No introducir Redux, Zustand ni otras herramientas de estado global salvo necesidad demostrable.

Evaluar React Hook Form y Zod si simplifican los formularios y la validación. Justificar cualquier dependencia incorporada.

## 4. Sesión y seguridad

Implementar un adaptador HTTP acotado mediante Route Handlers de Next.js.

El navegador debe comunicarse con Next.js mediante el mismo origen.

Next.js debe comunicarse con NestJS utilizando Authorization Bearer.

Requisitos:

- El login obtiene el JWT desde NestJS.
- Almacenar el JWT exclusivamente en una cookie HttpOnly.
- Configurar SameSite=Lax, Path apropiado y Secure cuando se utilice HTTPS.
- La duración de la cookie no debe superar la vigencia del JWT.
- No almacenar tokens en localStorage ni sessionStorage.
- No devolver el JWT al JavaScript del navegador.
- No exponer JWT_SECRET ni variables internas mediante NEXT_PUBLIC.
- Utilizar GET /auth/me para obtener el perfil autenticado.
- Proteger las rutas privadas.
- Mantener la sesión al recargar la página.
- Implementar logout mediante POST, eliminando la cookie.
- Manejar correctamente tokens expirados.
- Diferenciar una sesión inválida de permisos insuficientes.
- Evitar cachear respuestas autenticadas.
- Validar Origin frente al origen confiable configurado en todas las operaciones mutantes, incluido login y logout.
- No confiar en cabeceras de origen o host arbitrarias.
- No construir un proxy HTTP abierto.
- No aceptar destinos externos proporcionados por el cliente.
- Propagar únicamente las cabeceras necesarias.

Revisar el comportamiento del rate limiting detrás de Next.js.

No confiar ciegamente en X-Forwarded-For ni permitir que el cliente evada el límite.

Si se mantiene el límite compartido por IP para esta instalación local, documentar claramente su alcance y limitación. No introducir Redis ni infraestructura distribuida.

Manejar HTTP 429 con un mensaje comprensible.

## 5. Diseño visual

Construir un panel administrativo profesional, limpio y coherente.

Dirección visual:

- Interfaz en español.
- Fondo claro.
- Azul oscuro o grafito para navegación.
- Azul como color de acciones primarias.
- Tipografía legible.
- Espaciado consistente.
- Iconografía coherente.
- Jerarquía visual clara.
- Estados de error, éxito y advertencia diferenciados.
- Diseño responsive.

Incluir navegación sencilla, identificación del usuario autenticado, rol y opción de cerrar sesión.

No incorporar funcionalidades decorativas, gráficos innecesarios ni animaciones complejas.

Utilizar HTML semántico y garantizar accesibilidad mediante etiquetas, navegación por teclado, contraste y gestión del foco.

## 6. Pantalla de login

Implementar /login con:

- Usuario.
- Contraseña.
- Validaciones de campos.
- Opción de mostrar u ocultar contraseña.
- Estado de envío.
- Prevención de múltiples envíos simultáneos.
- Mensaje genérico para credenciales incorrectas.
- Manejo de errores de conexión y límite de intentos.
- Redirección al catálogo tras autenticación válida.

No precargar contraseñas automáticamente ni introducir accesos que omitan la autenticación real.

Las credenciales demo estarán documentadas en el README.

## 7. Listado de productos

Implementar /products con todas las columnas obligatorias:

- Descripción.
- UPC.
- Categoría.
- Subcategoría.
- Fecha de alta.
- Fecha de última modificación.

El listado debe obtener todos los productos según el contrato del backend.

Permitir acceso al detalle para ambos roles.

Admin debe disponer de las acciones de crear, editar y eliminar.

Manager únicamente debe disponer de acciones de lectura.

Incluir estados de carga, error, reintento y listado vacío.

Como mejoras de bajo coste, incorporar búsqueda local por descripción o UPC y filtros locales de clasificación.

Estas mejoras no deben modificar el contrato de listado completo ni introducir consultas innecesarias al backend.

Priorizar la legibilidad de la tabla, incluyendo el comportamiento en pantallas pequeñas.

## 8. Detalle del producto

Implementar /products/[id].

Mostrar todos los campos del contrato, incluyendo:

- Fecha de alta.
- Fecha de modificación.
- Autor del alta.
- Autor de la última modificación.

Mantener accesibles las fechas en UTC y conservar la precisión de segundos.

Gestionar productos inexistentes con un mensaje claro.

Permitir volver al listado.

Mostrar acciones de edición y eliminación únicamente para admin.

## 9. Creación y edición

Implementar:

- /products/new
- /products/[id]/edit

Reutilizar un formulario compartido cuando corresponda.

Campos:

- UPC.
- Descripción.
- Categoría.
- Subcategoría.

El UPC debe tratarse como texto con teclado numérico, preservando ceros iniciales.

Validar exactamente 12 dígitos ASCII.

Comprobar previamente la existencia del UPC mediante el listado completo, tal como solicita el enunciado.

Durante la edición, excluir el ID del producto actual de la comprobación de duplicados.

Mantener la API como autoridad definitiva.

Mapear HTTP 409 y fieldErrors a los campos correspondientes.

No enviar propiedades de auditoría.

Mostrar las confirmaciones de creación y edición únicamente después de recibir una respuesta exitosa de la API.

Actualizar el listado para evitar información obsoleta.

Interpretar X-UPC-Warning y mostrar una advertencia no bloqueante cuando corresponda.

El adaptador de Next debe preservar explícitamente esa cabecera o traducirla a un resultado tipado sin perder la advertencia.

## 10. Selectores dependientes — HU-E3

Obtener las categorías y subcategorías desde los endpoints existentes.

Al cambiar una categoría:

- Limpiar la subcategoría seleccionada.
- Solicitar las subcategorías correspondientes.
- Deshabilitar el selector mientras carga.
- Manejar errores.
- Evitar que respuestas asíncronas antiguas sobrescriban la selección actual.

En edición, cargar correctamente la clasificación existente sin limpiar accidentalmente el valor inicial.

Nunca permitir una pareja inválida.

No inferir relaciones por prefijos de códigos.

## 11. Eliminación

Implementar un diálogo de confirmación accesible.

Mostrar la descripción o UPC del producto que será eliminado.

Permitir cancelar.

Evitar múltiples solicitudes simultáneas.

No eliminar visualmente un producto antes de confirmar el éxito de la API.

Tras HTTP 204, actualizar el listado y mostrar una confirmación.

Manejar correctamente HTTP 404, 401, 403 y errores inesperados.

## 12. Permisos de frontend

El manager debe poder:

- Iniciar sesión.
- Consultar el listado.
- Consultar el detalle.
- Cerrar sesión.

El manager no debe visualizar opciones de escritura ni acceder directamente a las páginas de creación o edición.

Proteger también estas páginas mediante comprobaciones de sesión y rol.

Recordar que ocultar botones no constituye un mecanismo de autorización. NestJS mantiene la responsabilidad definitiva.

No duplicar las reglas de negocio del backend.

## 13. Manejo de errores

Reutilizar el contrato existente:

- statusCode
- code
- message
- requestId
- fieldErrors

Mostrar mensajes comprensibles y específicos para cada operación.

Evitar presentar objetos JSON, stack traces o detalles técnicos al usuario.

Manejar fallos de red, respuestas inesperadas, sesiones expiradas y conflictos de UPC.

No asumir que una respuesta exitosa siempre tiene cuerpo JSON, especialmente HTTP 204.

## 14. Validación funcional

Ejecutar la aplicación completa con PostgreSQL, NestJS y Next.js.

Verificar mediante un navegador real o automatización de navegador:

- Login con ambas cuentas demo.
- Persistencia de sesión al recargar.
- Listado de 106 productos iniciales.
- Detalle y auditoría.
- Creación válida.
- Validaciones de campos obligatorios.
- UPC inválido y UPC duplicado.
- Preservación de ceros iniciales.
- Advertencia de checksum.
- Selectores dependientes.
- Edición conservando el UPC.
- Cancelación y confirmación de borrado.
- Actualización del listado.
- Manager sin acciones de escritura.
- Acceso directo del manager a rutas de edición y creación.
- Logout.
- Manejo de sesión expirada.
- Rechazo de operaciones desde orígenes no autorizados.

Verificar que el token no sea accesible desde JavaScript.

Añadir pruebas automatizadas para las funcionalidades web críticas cuando sea proporcionado.

Ejecutar todas las pruebas existentes, lint, formato, tipos y builds.

No sustituir las pruebas de navegador por una revisión estática y declarar que el flujo fue verificado.

Si una comprobación no puede ejecutarse, indicarlo expresamente.

## 15. Documentación de IA

Registrar este prompt en:

ia/prompts/06-frontend.md

Registrar el plan y las evidencias de ejecución en:

ia/planes/06-frontend.md

Actualizar ia/decisiones.md con las decisiones aprobadas y las nuevas propuestas pendientes de revisión.

Mantener documentación concisa, sin horarios ni estimaciones detalladas.

No inventar intervenciones humanas ni resultados.

## 16. Restricciones

- No introducir funcionalidades de administración de usuarios.
- No crear CRUD de categorías ni subcategorías.
- No incorporar microservicios ni infraestructura adicional.
- No modificar los contratos existentes sin necesidad justificada.
- No modificar el CSV original.
- No realizar commits ni push automáticamente.
- No implementar todavía HU-E2, que se revisará en el siguiente bloque.

## 17. Cierre

Entregar un informe conciso con:

- Pantallas implementadas.
- Arquitectura del frontend.
- Dependencias añadidas.
- Decisiones técnicas.
- Flujos comprobados.
- Pruebas y resultados.
- Problemas pendientes.
- Evidencia visual de las pantallas principales, si es posible.
- Resumen del diff.
- Commits recomendados en inglés.

Detenerse cuando las historias obligatorias estén integradas y verificadas para ambos roles.