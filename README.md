# yt-to-mp3

> Conversor de YouTube a MP3/WAV con interfaz web. Dockerizado y listo para usar.

## Stack

| Servicio | Tecnologia |
|----------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Express.js, BullMQ, yt-dlp |
| Base de datos | PostgreSQL 16 |
| Cola de tareas | Redis 7 |
| Contenedores | Docker Compose |

## Inicio rapido

```bash
# 1. Clonar el repositorio
git clone https://github.com/ktr3/yt-to-mp3.git
cd yt-to-mp3

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Levantar todos los servicios
docker compose up -d
```

La app estara disponible en `http://localhost:3000`

## Arquitectura

```
yt-to-mp3/
|-- frontend/          # Next.js + Tailwind CSS
|   +-- src/
|-- backend/           # Express.js API + BullMQ workers
|   +-- src/
|-- db/
|   +-- init.sql       # Schema inicial (PostgreSQL)
+-- docker-compose.yml # Orquestacion de servicios
```

### Flujo de conversion

```
Usuario --> Frontend (Next.js :3000)
                |
          Backend API (Express :3001)
                |
          Cola BullMQ (Redis)
                |
          Worker --> yt-dlp --> archivo MP3/WAV
                |
          PostgreSQL (registro de conversiones)
                |
          Usuario descarga el archivo
```

## Servicios Docker

| Contenedor | Puerto | Descripcion |
|-----------|--------|-------------|
| `clip2audio-frontend` | 3000 | Interfaz web |
| `clip2audio-backend` | 3001 | API REST + workers |
| `clip2audio-db` | 5432 | PostgreSQL |
| `clip2audio-redis` | 6379 | Redis (colas) |

## Configuracion

Variables de entorno disponibles (`.env`):

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `DB_USER` | `clip2audio` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `clip2audio_secret` | Contrasena de PostgreSQL |
| `REDIS_URL` | `redis://redis:6379` | URL de conexion a Redis |
| `CORS_ORIGIN` | `http://localhost:3000` | Origen permitido para CORS |

## Caracteristicas

- Conversion a **MP3** y **WAV**
- Calidad de audio configurable
- Cola de tareas con **BullMQ** para procesamiento asincrono
- Rate limiting para evitar abuso
- Limite de duracion y conversiones configurables
- Interfaz responsive con Tailwind CSS

## Licencia

MIT
