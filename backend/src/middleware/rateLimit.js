const rateLimit = require("express-rate-limit");

const convertLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyGenerator: (req) => req.ip,
  message: {
    error: "Too many requests. Please wait a few minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { convertLimiter };
