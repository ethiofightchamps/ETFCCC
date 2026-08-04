// POST /api/create-order
// { buyerName, phone, email, seats: [...], totalAmount, refCode, screenshotBase64 }
//
// Uploads the payment screenshot to Firebase Storage and writes a "pending"
// order doc for the admin panel to review. Runs server-side (not the client
// SDK) so the write always goes through validated fields, consistent with
// how OTP codes are handled — never trust the client with money-adjacent writes.
//
// NOTE / TODO: this endpoint doesn't yet verify a Firebase Auth ID token —
// it trusts whatever buyer info the client sends. Before real ticket sales
// go live, require an `idToken` from the signed-in user (returned by
// verify-otp → signInWithCustomToken → getIdToken()) and verify it with
// admin.auth().verifyIdToken() before writing the order.

const admin = require("./_firebaseAdmin");

const db = admin.firestore();
const bucket = admin.storage().bucket();

function generateRefCode() {
  return "ETFC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { buyerName, phone, email, seats, totalAmount, screenshotBase64 } = req.body || {};

  if (!buyerName || !phone || !Array.isArray(seats) || seats.length === 0 || !totalAmount) {
    return res.status(400).json({ error: "Missing required order fields." });
  }
  if (!screenshotBase64) {
    return res.status(400).json({ error: "Payment screenshot is required." });
  }

  try {
    const refCode = generateRefCode();
    const buffer = Buffer.from(screenshotBase64.split(",").pop(), "base64");
    const filePath = `payment-screenshots/${Date.now()}-${refCode}.jpg`;
    const file = bucket.file(filePath);

    await file.save(buffer, { metadata: { contentType: "image/jpeg" } });
    await file.makePublic(); // simplest for admin viewing; swap for signed URLs if stricter privacy is needed
    const screenshotUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    const orderRef = await db.collection("orders").add({
      buyerName,
      phone,
      email: email || "",
      seats,
      totalAmount,
      refCode,
      screenshotUrl,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true, orderId: orderRef.id, refCode });
  } catch (err) {
    console.error("create-order failed:", err);
    return res.status(500).json({ error: "Could not submit order. Try again." });
  }
};
