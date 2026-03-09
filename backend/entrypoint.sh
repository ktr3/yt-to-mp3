#!/bin/sh
echo "Updating yt-dlp to latest version..."
wget -qO /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp 2>/dev/null && \
  chmod a+rx /usr/local/bin/yt-dlp && \
  echo "yt-dlp updated to $(yt-dlp --version)" || \
  echo "WARNING: Failed to update yt-dlp, using bundled version"

exec node src/index.js
