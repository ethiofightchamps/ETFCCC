// POST /api/verify-otp  { email, code }
// Checks the code against Firestore. On success, creates/updates the
// Firebase Auth user and Firestore profile, then returns a custom token
// the client uses with signInWithCustomToken.

const admin = require("./_firebaseAdmin");

const db = admin.firestore();
const MAX_ATTEMPTS = 5;

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, code } = req.body || {};

  if (!isValidEmail(email) || !code) {
    return res.status(400).json({ error: "Email and code are required." });
  }

  const docRef = db.collection("otpCodes").doc(email.toLowerCase());

  try {
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "No pending verification for this email. Request a new code." });
    }

    const data = snap.data();

    if (Date.now() > data.expiresAt.toMillis()) {
      await docRef.delete();
      return res.status(410).json({ error: "Code expired. Request a new one." });
    }

    if (data.attempts >= MAX_ATTEMPTS) {
      await docRef.delete();
      return res.status(429).json({ error: "Too many attempts. Request a new code." });
    }

    if (code !== data.code) {
      await docRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
      return res.status(403).json({ error: "Incorrect code." });
    }

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
    return res.status(200).json({ token, name: data.name, phone: data.phone, email: email.toLowerCase() });
  } catch (err) {
    console.error("verify-otp failed:", err);
    return res.status(500).json({ error: "Something went wrong verifying your code." });
  }
};
