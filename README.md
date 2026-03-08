# yt-to-mp3

> Conversor de YouTube a MP3/WAV con interfaz web. Dockerizado y listo para usar.

## Stack

| Servicio | TecnologÃ­a |
|----------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Express.js, BullMQ, yt-dlp |
| Base de datos | PostgreSQL 16 |
| Cola de tareas | Redis 7 |
| Contenedores | Docker Compose |

## Inicio rÃ¡pido

```bash
# 1. Clonar el repositorio
git clone https://github.com/ktr3/yt-to-mp3.git
cd yt-to-mp3

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Levantar todos los servicios
docker compose up -d
```

La app estarÃ¡ disponible en `http://localhost:3000`

## Arquitectura

```
yt-to-mp3/
â”œâ”€â”€ frontend/          # Next.js + Tailwind CSS
â”‚   â””â”€â”€ src/
â”œâ”€â”€ backend/           # Express.js API + BullMQ workers
â”‚   â””â”€â”€ src/
â”œâ”€â”€ db/
â”‚   â””â”€â”€ init.sql       # Schema inicial (PostgreSQL)
â””â”€â”€ docker-compose.yml # OrquestaciÃ³n de servicios
```

### Flujo de conversiÃ³n

```
Usuario â†’ Frontend (Next.js :3000)
                â†“
          Backend API (Express :3001)
                â†“
          Cola BullMQ (Redis)
                â†“
          Worker â†’ yt-dlp â†’ archivo MP3/WAV
                â†“
          PostgreSQL (registro de conversiones)
                â†“
          Usuario descarga el archivo
```

## Servicios Docker

| Contenedor | Puerto | DescripciÃ³n |
|-----------|--------|-------------|
| `clip2audio-frontend` | 3000 | Interfaz web |
| `clip2audio-backend` | 3001 | API REST + workers |
| `clip2audio-db` | 5432 | PostgreSQL |
| `clip2audio-redis` | 6379 | Redis (colas) |

## ConfiguraciÃ³n

Variables de entorno disponibles (`.env`):

| Variable | Default | DescripciÃ³n |
|----------|---------|-------------|
| `DB_USER` | `clip2audio` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `clip2audio_secret` | ContraseÃ±a de PostgreSQL |
| `REDIS_URL` | `redis://redis:6379` | URL de conexiÃ³n a Redis |
| `CORS_ORIGIN` | `http://localhost:3000` | Origen permitido para CORS |

## CaracterÃ­sticas

- ConversiÃ³n a **MP3** y **WAV**
- Calidad de audio configurable
- Cola de tareas con **BullMQ** para procesamiento asÃ­ncrono
- Rate limiting para evitar abuso
- LÃ­mite de duraciÃ³n y conversiones configurables
- Interfaz responsive con Tailwind CSS

## Licencia

MIT
