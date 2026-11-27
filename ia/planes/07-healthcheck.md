# Fase 7 · Healthcheck y ajustes de catálogo

[Prompt y alcance](../prompts/07-healthcheck.md) · [Decisiones](../decisiones.md)

1. Exponer `GET /health` como ruta pública. Consultar PostgreSQL con un plazo total de 1,5 segundos y devolver solo estados de API y base de datos.
2. Construir la imagen de API con Node.js 22 y `npm ci`. Ampliar Compose en un archivo independiente y verificar el healthcheck real con una caída controlada de PostgreSQL.
3. Aclarar el campo UPC, paginar localmente el catálogo y ofrecer tarjetas en móvil. Verificar campos visibles y acciones de admin con teclado y móvil.
4. Repetir las pruebas unitarias, de integración y de navegador. Usar una instancia aislada para la caída de PostgreSQL y las escrituras de prueba.

Los comandos del [README](../../README.md) permiten construir y ejecutar la API del contenedor. El CSV se monta en solo lectura. La API usa el host `db` en la red de Compose y ejecuta con el usuario `node`. Terminus aportaría una dependencia adicional para una sola consulta que cubre `pg`. Solo se incorporaron sus tipos en desarrollo.

## Evidencia de cierre

| Comprobación | Resultado |
| --- | --- |
| Construcción y arranque | La configuración combinada pasó `docker compose config --quiet`. Se construyó la imagen Debian con Node 22 y el lockfile. Se ejecutaron migraciones y carga con comandos explícitos sobre PostgreSQL aislado. La API corrió con UID 1000. La configuración de la imagen no contiene `JWT_SECRET` ni `DATABASE_URL`. |
| Caída y recuperación | Sin token, `GET /health` devolvió 200 con PostgreSQL disponible, 503 al detenerlo y 200 tras volver a iniciarlo. La API Docker pasó de `healthy` a `unhealthy` y volvió a `healthy` con el mismo PID. Los cuerpos JSON contenían solo los tres campos públicos previstos. |
| Regresiones | Pasaron lint, formato, tipos, ambos builds, 21 pruebas unitarias y 44 de integración contra PostgreSQL real. El caso unitario de conexión colgada confirmó el plazo y el cierre del cliente. |
| Chrome | Pasaron 5 pruebas con la API contenida en Docker. Se recorrieron las 6 páginas de 106 productos, se comprobó el regreso a la primera al filtrar, la ayuda UPC y las tarjetas de 390 px. El flujo de admin recorrió Editar y Eliminar con Tab y abrió y canceló el diálogo mediante teclado y en móvil. |
| Alcance | Se conservaron el CSV, las migraciones y el Compose original. Las capturas nuevas quedaron localmente en `tmp/capturas-fase-7/`. |

El primer script de verificación de Docker se detuvo antes de cambiar servicios por usar una variable reservada de zsh. Se repitió con Node. Chrome detectó que el selector de filtros incluía los textos de las opciones en su etiqueta implícita. Se corrigió con etiquetas explícitas y la suite pasó completa.
