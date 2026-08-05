// POST /api/verify-otp  { email, code, password }
// Checks the code against Firestore. On success, creates the Firebase Auth
// user with the given password (or sets the password on an existing
// account, e.g. one previously created via Google sign-in) and the
// Firestore profile, then returns a custom token the client uses with
// signInWithCustomToken. The password never touches Firestore — it's only
// ever passed through this one request, straight to the Admin SDK.

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

  const { email, code, password } = req.body || {};

  if (!isValidEmail(email) || !code) {
    return res.status(400).json({ error: "Email and code are required." });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
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
      // Account already exists (e.g. created earlier via Google sign-in) —
      // set/refresh the password so it can also be used to log in directly.
      userRecord = await admin.auth().updateUser(userRecord.uid, {
        password,
        displayName: data.name,
        emailVerified: true,
      });
    } catch (err) {
      userRecord = await admin.auth().createUser({
        email: email.toLowerCase(),
        password,
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
    return res.status(200).json({ token, uid: userRecord.uid, name: data.name, phone: data.phone, email: email.toLowerCase() });
  } catch (err) {
    console.error("verify-otp failed:", err);
    return res.status(500).json({ error: "Something went wrong verifying your code." });
  }
};
