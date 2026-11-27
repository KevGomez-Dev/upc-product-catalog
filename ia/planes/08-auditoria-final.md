# Fase 8 · Auditoría final

[Solicitud](../prompts/08-auditoria-final.md) · [Matriz de aceptación](../../docs/criterios-de-aceptacion.md) · [Decisiones](../decisiones.md)

1. Contrastar las 11 páginas del PDF con el código, las decisiones y las evidencias de las historias obligatorias y extras.
2. Revisar autenticación, adaptador web, persistencia, importación, pruebas, configuración, dependencias e historial. Corregir fallos acotados.
3. Reproducir instalación, carga, flujos web y Docker en una copia de trabajo limpia y un proyecto PostgreSQL aislado.
4. Registrar resultados, límites y capturas, con el historial y el envío bajo control del candidato.

## Hallazgos y alcance

| Severidad | Hallazgo e impacto | Resultado |
| --- | --- | --- |
| Media | El adaptador leía y serializaba cuerpos JSON completos antes del límite de Nest. Un cuerpo grande podía consumir memoria en Next. | Límite de 100 KiB durante la lectura, UTF-8 y JSON validados. Playwright comprobó 413 para exceso y 400 para JSON inválido. |
| Media | La plantilla publicaba PostgreSQL en todas las interfaces con credenciales demo. | `.env.example` publica en `127.0.0.1:5432`. Se verificó el binding con Compose. El Compose original conserva su fallback, así que el README exige configurar `.env` antes de iniciarlo. |
| Baja | `web.zip` estaba versionado y contenía archivos de build. También se encontró un `api.zip` histórico. | `web.zip` sale del árbol de entrega y los nombres quedan ignorados. Los ZIP permanecen en commits anteriores. El historial se conserva tal como fue autorizado. |
| Baja | La regla de obligatorios, el login válido y los permisos estaban ejercitados en integración. | Se añadió cobertura unitaria Jest directa para esos casos. La unicidad sigue respaldada por la restricción y las pruebas con PostgreSQL real. |
| Media | `npm audit` reporta 20 entradas moderadas, sin altas ni críticas. `npm audit --omit=dev` reporta 3 de esas entradas. | Se conservó el lockfile. Los cambios mayores sugeridos por npm quedan fuera de este ajuste acotado. Los avisos de producción permanecen documentados. |

Las tres entradas de producción son TypeORM y sus dependencias transitivas `glob` y `minimatch`. Las otras 17 pertenecen al desarrollo, principalmente al CLI de Nest y la cadena de Jest. El primer aviso afecta la cancelación de recorridos. El segundo afecta el costo de procesar patrones no confiables. En el código revisado, TypeORM usa patrones fijos de archivos de migración y una llamada síncrona sin señal de aborto. No se observó una ruta pública que controle esos patrones. Los procesos de compilación y pruebas trabajan con archivos del repositorio. Este análisis delimita la exposición observada y no elimina los avisos del lockfile. [Aviso de glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) · [Aviso de minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249).

Se revisaron 167 blobs de referencias y reflogs locales, incluidos los miembros de los ZIP históricos. La búsqueda por patrones no encontró coincidencias en claves privadas, JWT, tokens de proveedores, secretos JWT literales o credenciales PostgreSQL fuera de los ejemplos y fixtures. Los archivos privados de entorno y los artefactos generados quedan ignorados. La búsqueda se limita a los archivos y patrones revisados. Las capturas nuevas se verificaron visualmente y contienen la pantalla de login vacía, datos del CSV y cuentas demo visibles.

## Verificación final

La copia temporal se construyó con los archivos versionados y los cambios de la fase. Se excluyeron Git, `.env`, dependencias, builds y archivos temporales. Se ejecutó `npm ci` con caché vacía y Node 22.19.0. Se generó un secreto nuevo con el comando del README y se creó un proyecto Compose con volumen independiente.

| Prueba | Resultado |
| --- | --- |
| Instalación y configuración | `npm ci` instaló 883 paquetes. Compose confirmó PostgreSQL en loopback. |
| Migraciones y primera carga | Se aplicaron las dos migraciones. 120 filas originales, 106 productos, 1 duplicado, 13 pendientes, 5 categorías, 17 subcategorías y 2 usuarios demo. |
| Segunda carga | Mismo SHA-256, `reused: true`, cero escrituras en todas las entidades. |
| Compilación y pruebas | Lint, formato, tipos, builds de Nest y Next, 24 pruebas unitarias y 44 de integración pasaron. |
| Arranque y navegador | API y Next arrancaron con los comandos de producción del README. Pasaron 6 casos en Chrome contra PostgreSQL real, incluidos ambos roles, CRUD, sesión y el nuevo límite de JSON. Se generaron las cinco capturas del README. |
| Arranque de desarrollo | El comando `npm run dev` devolvió 200 en login y healthcheck usando la misma copia limpia. |
| Alternativa Docker | Se construyó la imagen desde esa copia, se ejecutaron las migraciones y la carga explícitas, y se verificó el estado healthy. La carga reutilizó el lote. Manager consultó los 106 productos. |
| Recuperación y conteo final | Con la API en Docker, PostgreSQL pasó de disponible a detenido y volvió a estar disponible. HTTP cambió 200 → 503 → 200 y Docker healthy → unhealthy → healthy con el mismo proceso de API. SQL confirmó 120/106/1/13/5/17/2 antes de retirar el entorno aislado. |

Los contenedores y la red de prueba se retiraron. El volumen aislado se conservó. El entorno verificado usa loopback y HTTP local. La visibilidad, el commit final y el envío requieren la decisión del candidato.
