const rateLimit = require("express-rate-limit");

// Rate limit for conversion endpoints (heavier operations)
const convertLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip,
  message: {
    error: "Too many requests. Please wait a few minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for info endpoints (lighter but still spawns yt-dlp)
const infoLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip,
  message: {
    error: "Too many requests. Please wait a moment.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip,
  message: {
    error: "Too many requests.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { convertLimiter, infoLimiter, apiLimiter };
