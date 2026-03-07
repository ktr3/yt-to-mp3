const rateLimit = require("express-rate-limit");

const convertLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.MAX_CONVERSIONS_FREE, 10) || 3,
  keyGenerator: (req) => req.ip,
  message: {
    error: "Daily conversion limit reached. Upgrade to Pro for more conversions.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { convertLimiter };
