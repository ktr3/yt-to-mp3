const { Router } = require("express");
const { query } = require("../db");
const { getVideoInfo, getPlaylistInfo } = require("../services/converter");
const { convertQueue } = require("../queues/convertQueue");
const { convertLimiter, infoLimiter } = require("../middleware/rateLimit");
const { verifyTurnstile } = require("../middleware/turnstile");
const path = require("path");
const fs = require("fs");

const router = Router();

// Sanitize error messages for client responses
function safeError(err) {
  const msg = err.message || "Internal server error";
  // Don't expose file paths or system details
  if (msg.includes("/") || msg.includes("\\") || msg.includes("ENOENT") || msg.includes("EACCES")) {
    return "An internal error occurred. Please try again.";
  }
  return msg;
}

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
const PLAYLIST_REGEX = /[?&]list=([\w-]+)/;

function cleanYoutubeUrl(url) {
  const match = url.match(/(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/);
  if (!match) return url;
  const videoId = match[4];
  if (url.includes("youtu.be/")) return `https://youtu.be/${videoId}`;
  if (url.includes("/shorts/")) return `https://www.youtube.com/shorts/${videoId}`;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function getPlaylistUrl(url) {
  const match = url.match(PLAYLIST_REGEX);
  if (!match) return null;
  const listId = match[1];
  // For Radio/Mix playlists (RD prefix), keep the original URL
  if (listId.startsWith("RD")) return url;
  return `https://www.youtube.com/playlist?list=${listId}`;
}

const VALID_FORMATS = ["mp3", "wav"];
const VALID_QUALITIES = ["128", "192", "256", "320"];
const MAX_DURATION = parseInt(process.env.MAX_DURATION_FREE, 10) || 1200;

// Get single video info
router.post("/info", infoLimiter, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !YOUTUBE_URL_REGEX.test(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const cleanUrl = cleanYoutubeUrl(url);
    const info = await getVideoInfo(cleanUrl);

    if (info.duration > MAX_DURATION) {
      return res.status(400).json({
        error: `Video too long. Maximum duration is ${MAX_DURATION / 60} minutes for free plan.`,
      });
    }

    res.json(info);
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// Get playlist info
router.post("/playlist-info", infoLimiter, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !YOUTUBE_URL_REGEX.test(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    // Try to extract playlist URL
    const playlistUrl = getPlaylistUrl(url) || url;
    const result = await getPlaylistInfo(playlistUrl);

    if (!result.videos || result.videos.length === 0) {
      return res.status(400).json({ error: "No available videos found in playlist" });
    }

    res.json({
      count: result.videos.length,
      videos: result.videos,
      unavailable: result.unavailable || [],
    });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// Start single video conversion
router.post("/convert", verifyTurnstile, convertLimiter, async (req, res) => {
  try {
    const { url, format = "mp3", quality = "192" } = req.body;

    if (!url || !YOUTUBE_URL_REGEX.test(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }
    if (!VALID_FORMATS.includes(format)) {
      return res.status(400).json({ error: "Invalid format. Use mp3 or wav." });
    }
    if (!VALID_QUALITIES.includes(quality)) {
      return res.status(400).json({ error: "Invalid quality." });
    }

    const cleanUrl = cleanYoutubeUrl(url);
    const info = await getVideoInfo(cleanUrl);

    if (info.duration > MAX_DURATION) {
      return res.status(400).json({
        error: `Video exceeds maximum duration of ${MAX_DURATION / 60} minutes.`,
      });
    }

    const result = await query(
      `INSERT INTO conversions (video_url, video_title, video_thumbnail, video_duration, format, quality, client_ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [cleanUrl, info.title, info.thumbnail, info.duration, format, quality, req.ip]
    );

    const conversionId = result.rows[0].id;

    await convertQueue.add("convert", {
      conversionId,
      url: cleanUrl,
      format,
      quality,
    });

    res.json({
      id: conversionId,
      status: "pending",
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
    });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// Start playlist batch conversion
router.post("/convert-playlist", verifyTurnstile, convertLimiter, async (req, res) => {
  try {
    const { url, format = "mp3", quality = "192", videoUrls } = req.body;

    if (!VALID_FORMATS.includes(format)) {
      return res.status(400).json({ error: "Invalid format." });
    }
    if (!VALID_QUALITIES.includes(quality)) {
      return res.status(400).json({ error: "Invalid quality." });
    }

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return res.status(400).json({ error: "No videos provided" });
    }

    if (videoUrls.length > 25) {
      return res.status(400).json({ error: "Maximum 25 videos per playlist conversion" });
    }

    const conversions = [];

    for (let i = 0; i < videoUrls.length; i++) {
      const videoUrl = videoUrls[i];
      const cleanUrl = typeof videoUrl === "string"
        ? (videoUrl.startsWith("http") ? videoUrl : `https://www.youtube.com/watch?v=${videoUrl}`)
        : `https://www.youtube.com/watch?v=${videoUrl}`;

      const result = await query(
        `INSERT INTO conversions (video_url, video_title, format, quality, client_ip)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [cleanUrl, null, format, quality, req.ip]
      );

      const conversionId = result.rows[0].id;

      // Stagger playlist jobs: 15s delay between each to avoid YouTube rate limiting
      await convertQueue.add("convert", {
        conversionId,
        url: cleanUrl,
        format,
        quality,
      }, { delay: i * 15000 });

      conversions.push({ id: conversionId, url: cleanUrl, status: "pending" });
    }

    res.json({
      count: conversions.length,
      conversions,
    });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// Check conversion status
router.get("/status/:id", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, video_title, video_thumbnail, video_duration, format, quality, status, file_size, error_message, created_at, completed_at FROM conversions WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Conversion not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// Check multiple conversion statuses
router.post("/status-batch", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No IDs provided" });
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const result = await query(
      `SELECT id, video_title, video_thumbnail, video_duration, format, quality, status, file_size, error_message, created_at, completed_at
       FROM conversions WHERE id IN (${placeholders})`,
      ids
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// Download converted file
router.get("/download/:id", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, video_title, format, status, file_path FROM conversions WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Conversion not found" });
    }

    const conversion = result.rows[0];

    if (conversion.status !== "completed") {
      return res.status(400).json({ error: "Conversion not ready yet" });
    }

    // Validate file path stays within downloads directory
    const resolvedPath = path.resolve(conversion.file_path);
    if (!resolvedPath.startsWith("/app/downloads")) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const safeName = (conversion.video_title || "audio")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .substring(0, 100);

    res.download(conversion.file_path, `${safeName}.${conversion.format}`);
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// Get conversion history
router.get("/history", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, video_title, video_thumbnail, video_duration, format, quality, status, file_size, created_at, completed_at
       FROM conversions
       WHERE client_ip = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.ip]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// Clear conversion history for this client
router.delete("/history", async (req, res) => {
  try {
    await query("DELETE FROM conversions WHERE client_ip = $1", [req.ip]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

module.exports = router;
