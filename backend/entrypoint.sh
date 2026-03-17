#!/bin/sh

echo "Updating yt-dlp to latest version..."
pip3 install --quiet --upgrade --break-system-packages yt-dlp yt-dlp-get-pot 2>/dev/null && \
  echo "yt-dlp updated to $(yt-dlp --version)" || \
  echo "WARNING: Failed to update yt-dlp, using bundled version"

echo "Starting bgutil PO token server..."
BGUTIL_SERVER="$(npm root -g)/bgutil-ytdlp-pot-provider/build/bg_server.js"
node "$BGUTIL_SERVER" &
BGUTIL_PID=$!
sleep 2
if kill -0 $BGUTIL_PID 2>/dev/null; then
  echo "bgutil PO token server running (pid $BGUTIL_PID)"
else
  echo "WARNING: bgutil server failed to start — downloads will work without PO tokens"
fi

exec node src/index.js
