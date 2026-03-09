FROM node:20-slim

# Install yt-dlp, ffmpeg, and deno (JS runtime required by yt-dlp)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg python3 curl unzip wget ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && wget -qO /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh

# Create downloads directory
RUN mkdir -p /app/downloads

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
