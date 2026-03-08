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
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",");
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
app.use("/downloads", express.static("/app/downloads"));

// Global rate limit
app.use("/api", apiLimiter);

app.use("/api", convertRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
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
