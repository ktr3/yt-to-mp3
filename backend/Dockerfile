FROM node:20-alpine

# Install yt-dlp, ffmpeg and python3
RUN apk add --no-cache ffmpeg python3 py3-pip \
    && python3 -m pip install --break-system-packages yt-dlp

# Create downloads directory
RUN mkdir -p /app/downloads

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

EXPOSE 3001

CMD ["node", "src/index.js"]
