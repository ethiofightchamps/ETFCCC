// ── ETFC EMAIL OTP CLOUD FUNCTIONS ──────────────────────────────────────
// Two callable functions:
//   sendOtp(name, phone, email)   → generates a 6-digit code, stores it in
//                                    Firestore with an expiry, emails it via Resend.
//   verifyOtp(email, code)        → checks the code, creates/updates the
//                                    Firebase Auth user + Firestore profile,
//                                    returns a custom token for the client
//                                    to sign in with.
//
// Codes are never generated or checked on the client — only here, using the
// Admin SDK, which is the only thing allowed to touch the `otpCodes`
// collection (see firestore.rules — it's default-denied to clients).

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();
const db = admin.firestore();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000; // 30s between sends to the same email

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.sendOtp = onCall({ secrets: [RESEND_API_KEY] }, async (request) => {
  const { name, phone, email } = request.data || {};

  if (!name || !phone || !isValidEmail(email)) {
    throw new HttpsError("invalid-argument", "Name, phone, and a valid email are required.");
  }

  const docRef = db.collection("otpCodes").doc(email.toLowerCase());
  const existing = await docRef.get();

  if (existing.exists) {
    const data = existing.data();
    const sentAt = data.sentAt?.toMillis?.() ?? 0;
    if (Date.now() - sentAt < RESEND_COOLDOWN_MS) {
      throw new HttpsError("resource-exhausted", "Please wait before requesting another code.");
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

  const resend = new Resend(RESEND_API_KEY.value());
  try {
    await resend.emails.send({
      from: "ETFC <onboarding@resend.dev>", // TODO: replace with a verified sending domain in Resend
      to: email,
      subject: `${code} is your ETFC verification code`,
      html: `<p>Your ETFC verification code is:</p><h2 style="letter-spacing:4px;">${code}</h2><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    });
  } catch (err) {
    console.error("Resend send failed:", err);
    throw new HttpsError("internal", "Could not send verification email. Try again.");
  }

  return { ok: true };
});

exports.verifyOtp = onCall(async (request) => {
  const { email, code } = request.data || {};

  if (!isValidEmail(email) || !code) {
    throw new HttpsError("invalid-argument", "Email and code are required.");
  }

  const docRef = db.collection("otpCodes").doc(email.toLowerCase());
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new HttpsError("not-found", "No pending verification for this email. Request a new code.");
  }

  const data = snap.data();

  if (Date.now() > data.expiresAt.toMillis()) {
    await docRef.delete();
    throw new HttpsError("deadline-exceeded", "Code expired. Request a new one.");
  }

  if (data.attempts >= MAX_ATTEMPTS) {
    await docRef.delete();
    throw new HttpsError("resource-exhausted", "Too many attempts. Request a new code.");
  }

  if (code !== data.code) {
    await docRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
    throw new HttpsError("permission-denied", "Incorrect code.");
  }

  // Code correct — find or create the Firebase Auth user for this email.
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch (err) {
    userRecord = await admin.auth().createUser({
      email: email.toLowerCase(),
      displayName: data.name,
      emailVerified: true,
    });
  }

  // Keep the Firestore profile in sync.
  await db.collection("users").doc(userRecord.uid).set(
    {
      name: data.name,
      phone: data.phone,
      email: email.toLowerCase(),
      authMethod: "email",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await docRef.delete();

  const token = await admin.auth().createCustomToken(userRecord.uid);
  return { token, name: data.name, phone: data.phone, email: email.toLowerCase() };
});
