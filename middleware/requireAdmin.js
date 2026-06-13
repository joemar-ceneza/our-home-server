const crypto = require("crypto");

// Guards write routes (create/update/delete). The client must send the admin
// key in the "x-admin-key" header; it's compared to ADMIN_API_KEY from .env.
// Uses a constant-time compare so the check can't be timing-attacked.
function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;

  if (!expected) {
    console.error("ADMIN_API_KEY is not set — refusing all admin requests");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const provided = req.get("x-admin-key") || "";
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);

  const isValid =
    expectedBuf.length === providedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, providedBuf);

  if (!isValid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

module.exports = requireAdmin;
