const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const DOWNLOADS_DIR = "/app/downloads";
const COOKIES_MASTER = "/app/downloads/cookies.txt";
const COOKIES_COPY = "/app/downloads/.cookies_work.txt";
const OAUTH_CACHE_DIR = "/app/downloads/.oauth_cache";

function getAuthArgs() {
  // Prefer OAuth2 (auto-refreshing tokens) over cookies
  if (fs.existsSync(path.join(OAUTH_CACHE_DIR, "token"))) {
    return ["--oauth2", "--cache-dir", OAUTH_CACHE_DIR];
  }
  // Use a disposable copy of cookies so yt-dlp doesn't corrupt the master file
  if (fs.existsSync(COOKIES_MASTER)) {
    try {
      fs.copyFileSync(COOKIES_MASTER, COOKIES_COPY);
      return ["--cookies", COOKIES_COPY];
    } catch {}
  }
  return [];
}

function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    execFile(
      "yt-dlp",
      [...getAuthArgs(), "--dump-json", "--no-download", "--no-warnings", "--no-playlist", url],
      { timeout: 30000 },
      (err, stdout) => {
        if (err) return reject(new Error("Failed to fetch video info"));
        try {
          const info = JSON.parse(stdout);
          resolve({
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            uploader: info.uploader,
          });
        } catch {
          reject(new Error("Failed to parse video info"));
        }
      }
    );
  });
}

function getPlaylistInfo(url, maxItems = 50) {
  return new Promise((resolve, reject) => {
    execFile(
      "yt-dlp",
      [
        ...getAuthArgs(),
        "--flat-playlist", "--dump-json", "--no-warnings", "--yes-playlist",
        "--playlist-end", String(maxItems),
        url,
      ],
      { timeout: 120000, maxBuffer: 20 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          console.error("Playlist fetch error:", err.message, stderr);
          return reject(new Error("Failed to fetch playlist info"));
        }
        try {
          const lines = stdout.trim().split("\n").filter(Boolean);
          const unavailable = [];
          const videos = [];

          for (const line of lines) {
            const info = JSON.parse(line);
            const title = info.title || "";

            // Filter out deleted, private, and unavailable videos
            if (
              title === "[Deleted video]" ||
              title === "[Private video]" ||
              title === "[Unavailable]" ||
              info.availability === "unavailable" ||
              info.availability === "private"
            ) {
              unavailable.push(title || `Video ${info.id}`);
              continue;
            }

            videos.push({
              id: info.id,
              title: info.title,
              url: info.url || info.webpage_url || `https://www.youtube.com/watch?v=${info.id}`,
              duration: info.duration,
              thumbnail: info.thumbnails?.length
                ? info.thumbnails[info.thumbnails.length - 1].url
                : null,
            });
          }

          resolve({ videos, unavailable });
        } catch (parseErr) {
          console.error("Playlist parse error:", parseErr.message);
          reject(new Error("Failed to parse playlist info"));
        }
      }
    );
  });
}

function downloadAudio(url, conversionId, format, quality) {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(DOWNLOADS_DIR, `${conversionId}.%(ext)s`);
    const outputFile = path.join(DOWNLOADS_DIR, `${conversionId}.${format}`);

    const args = [
      ...getAuthArgs(),
      "-x",
      "--audio-format", format,
      "--audio-quality", "0",
      "--no-playlist",
      "--no-warnings",
      "-o", outputTemplate,
      url,
    ];

    execFile("yt-dlp", args, { timeout: 300000 }, (err) => {
      if (err) return reject(new Error(`Download failed: ${err.message}`));

      if (!fs.existsSync(outputFile)) {
        return reject(new Error("Output file not found after conversion"));
      }

      const stats = fs.statSync(outputFile);
      resolve({
        filePath: outputFile,
        fileSize: stats.size,
      });
    });
  });
}

module.exports = { getVideoInfo, getPlaylistInfo, downloadAudio };
