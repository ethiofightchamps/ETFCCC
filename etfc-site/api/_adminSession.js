// Lightweight admin session using a signed, expiring cookie — no session
// database needed. The cookie is an HMAC of "expiry" using ADMIN_SESSION_SECRET,
// so it can't be forged without knowing the secret.
//
// Set in Vercel env vars:
//   ADMIN_PASSWORD         → the password ETFC's organizer logs in with
//   ADMIN_SESSION_SECRET    → any long random string, used to sign the cookie

const crypto = require("crypto");

const COOKIE_NAME = "etfc_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function sign(value) {
  return crypto
    .createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
    .update(value)
    .digest("hex");
}

function createSessionCookie() {
  const expiry = Date.now() + SESSION_TTL_MS;
  const payload = `${expiry}`;
  const sig = sign(payload);
  const token = `${payload}.${sig}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header.split(";").filter(Boolean).map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
}

function isValidAdminSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return false;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (sign(payload) !== sig) return false; // tampered or wrong secret
  if (Date.now() > Number(payload)) return false; // expired

  return true;
}

module.exports = { createSessionCookie, clearSessionCookie, isValidAdminSession, COOKIE_NAME };
