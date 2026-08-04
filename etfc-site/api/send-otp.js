// POST /api/send-otp  { name, phone, email }
// Generates a 6-digit code, stores it in Firestore with a 10-min expiry,
// emails it via Resend. Never sends/verifies the code client-side.

const admin = require("./_firebaseAdmin");
const { Resend } = require("resend");

const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30s between sends to the same email

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, phone, email } = req.body || {};

  if (!name || !phone || !isValidEmail(email)) {
    return res.status(400).json({ error: "Name, phone, and a valid email are required." });
  }

  const docRef = db.collection("otpCodes").doc(email.toLowerCase());

  try {
    const existing = await docRef.get();
    if (existing.exists) {
      const data = existing.data();
      const sentAt = data.sentAt?.toMillis?.() ?? 0;
      if (Date.now() - sentAt < RESEND_COOLDOWN_MS) {
        return res.status(429).json({ error: "Please wait before requesting another code." });
      }
    }

    const code = generateCode();
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + CODE_TTL_MS);

    await docRef.set({
      code,
      name,
      phone,
      email: email.toLowerCase(),
      sentAt: now,
      expiresAt,
      attempts: 0,
    });

    await resend.emails.send({
      from: "ETFC <noreply@ethiofightingchamps.com>",
      to: email,
      subject: `${code} is your ETFC verification code`,
      html: `<p>Your ETFC verification code is:</p><h2 style="letter-spacing:4px;">${code}</h2><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-otp failed:", err);
    return res.status(500).json({ error: "Could not send verification email. Try again." });
  }
};
