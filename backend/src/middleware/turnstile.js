const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET;

if (!TURNSTILE_SECRET) {
  console.warn("WARNING: TURNSTILE_SECRET not set. Turnstile verification will reject all requests.");
}

async function verifyTurnstile(req, res, next) {
  if (!TURNSTILE_SECRET) {
    return res.status(503).json({ error: "Security service not configured." });
  }

  const token = req.body.turnstileToken;

  if (!token) {
    return res.status(403).json({ error: "Security verification required. Please complete the captcha." });
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
        remoteip: req.ip,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(403).json({ error: "Security verification failed. Please try again." });
    }

    next();
  } catch (err) {
    console.error("Turnstile verification error:", err.message);
    return res.status(503).json({ error: "Security verification service unavailable. Please try again later." });
  }
}

module.exports = { verifyTurnstile };
