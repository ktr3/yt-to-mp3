const express = require("express");
const cors = require("cors");
const convertRoutes = require("./routes/convert");
const { initDb } = require("./db");
const { startWorker } = require("./queues/convertQueue");
const { apiLimiter } = require("./middleware/rateLimit");

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (needed behind Traefik/Easypanel)
app.set("trust proxy", 1);

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
}));

// Security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.removeHeader("X-Powered-By");
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.text({ limit: "1mb", type: "text/plain" }));
app.use("/downloads", express.static("/app/downloads"));

// Global rate limit
app.use("/api", apiLimiter);

app.use("/api", convertRoutes);

app.get("/api/health", (_req, res) => {
  const fs = require("fs");
  const path = require("path");
  const cookiesExist = fs.existsSync("/app/downloads/cookies.txt");
  const oauthExist = fs.existsSync(path.join("/app/downloads/.oauth_cache", "token"));
  res.json({ status: "ok", cookies: cookiesExist, oauth: oauthExist });
});

// Upload cookies (protected by admin secret)
app.post("/api/admin/cookies", (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const fs = require("fs");
  try {
    fs.writeFileSync("/app/downloads/cookies.txt", req.body);
    res.json({ ok: true, size: req.body.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to write cookies" });
  }
});

// Start OAuth2 setup (protected by admin secret)
app.post("/api/admin/oauth2-setup", (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { execFile } = require("child_process");
  const fs = require("fs");
  const cacheDir = "/app/downloads/.oauth_cache";
  fs.mkdirSync(cacheDir, { recursive: true });

  // Run yt-dlp with oauth2 to trigger device code flow
  const proc = execFile("yt-dlp", [
    "--oauth2", "--cache-dir", cacheDir,
    "--dump-json", "--no-download", "--no-warnings", "--no-playlist",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  ], { timeout: 120000 }, (err, stdout, stderr) => {
    if (err) {
      console.error("OAuth2 setup error:", stderr);
      return; // Response already sent with device code
    }
    console.log("OAuth2 setup complete - token saved");
  });

  // Capture stderr to get the device code URL
  let stderrData = "";
  proc.stderr.on("data", (data) => {
    stderrData += data.toString();
    // Look for the verification URL
    const match = stderrData.match(/visit\s+(https:\/\/\S+)\s+.*?code\s+(\S+)/i)
      || stderrData.match(/(https:\/\/www\.google\.com\/device)\s+.*?(\S{4}-\S{4})/i);
    if (match && !res.headersSent) {
      res.json({ url: match[1], code: match[2], message: "Go to URL and enter the code" });
    }
  });

  // Timeout fallback
  setTimeout(() => {
    if (!res.headersSent) {
      res.json({ output: stderrData, message: "Check output for device code instructions" });
    }
  }, 15000);
});

async function main() {
  await initDb();
  startWorker();
  app.listen(PORT, () => {
    console.log(`Clip2Audio backend running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
