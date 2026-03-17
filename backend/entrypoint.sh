#!/bin/sh

echo "Updating yt-dlp to latest version..."
pip3 install --quiet --upgrade --break-system-packages yt-dlp yt-dlp-youtube-oauth2 2>/dev/null && \
  echo "yt-dlp updated to $(yt-dlp --version)" || \
  echo "WARNING: Failed to update yt-dlp, using bundled version"

exec node src/index.js
