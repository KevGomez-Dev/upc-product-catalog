# Prueba Técnica – Catálogo de Productos UPC

Las instrucciones completas están en **`PruebaTecnica_Productos_UPC.pdf`**. Este README solo explica cómo levantar la base de datos.

## Contenido del paquete

| Archivo | Descripción |
|---|---|
| `PruebaTecnica_Productos_UPC.pdf` | Instrucciones, historias de usuario y criterios de evaluación |
| `data/productos.csv` | Datos para la carga inicial |
| `docker-compose.yml` | PostgreSQL 16 listo para usar |
| `.env.example` | Variables de entorno de referencia |

## Levantar PostgreSQL

```bash
cp .env.example .env
docker compose up -d
docker compose ps          # el servicio "db" debe aparecer como (healthy)
```

Probar la conexión:

```bash
docker exec -it prueba-upc-db psql -U prueba -d productos_upc -c "select 1"
```

Cadena de conexión: `postgresql://prueba:prueba123@localhost:5432/productos_upc`

Dentro del contenedor, el CSV está disponible en `/data/productos.csv` (solo lectura).

### Opcional: Adminer (cliente web)

```bash
docker compose --profile tools up -d
```

Abre http://localhost:8080. Usa el sistema PostgreSQL, el servidor `db`, el usuario `prueba`, la contraseña `prueba123` y la base `productos_upc`.

### Reiniciar desde cero

```bash
docker compose down -v     # elimina el contenedor y los datos
```

> Puedes copiar este `docker-compose.yml` a tu repositorio y extenderlo.
