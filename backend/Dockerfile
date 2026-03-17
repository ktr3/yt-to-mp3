FROM node:20-slim

# Install system deps + yt-dlp via pip (pip install enables plugin support)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg python3 python3-pip curl unzip wget ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp yt-dlp-get-pot \
    && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh

# Install bgutil PO-token provider (generates fresh PO tokens for each request)
RUN npm install -g bgutil-ytdlp-pot-provider

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
