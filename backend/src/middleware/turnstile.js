const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || "0x4AAAAAACn_WyhK90P-PM3dCZU5Jhl66yw";

async function verifyTurnstile(req, res, next) {
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
    // Allow request on verification service failure to avoid blocking users
    next();
  }
}

module.exports = { verifyTurnstile };
