// POST /api/create-order
// { buyerName, phone, email, seats: [...], totalAmount, screenshotUrl }
//
// The payment screenshot is uploaded CLIENT-SIDE straight to Firebase
// Storage (see tickets.html) — not sent through this endpoint as base64.
// That's the fix for the "Unexpected token 'A'... is not valid JSON" crash:
// Vercel serverless functions cap request bodies at 4.5MB, and a
// base64-encoded phone screenshot routinely exceeds that, so Vercel was
// rejecting the request with its own generic HTML error page before this
// code ever ran. Uploading directly to Storage from the browser sidesteps
// that limit entirely — this endpoint now only ever receives a short URL
// string plus normal form fields, which is tiny.
//
// Also claims the requested seats inside a Firestore transaction, so two
// buyers can't both get "pending" orders for the same seat.
//
// NOTE / TODO: doesn't yet verify a Firebase Auth ID token — it trusts the
// buyer info the client sends. Before real money is on the line, require an
// `idToken` and verify it with admin.auth().verifyIdToken().

const admin = require("./_firebaseAdmin");

const db = admin.firestore();

function generateRefCode() {
  return "ETFC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { buyerName, phone, email, seats, totalAmount, screenshotUrl } = req.body || {};

  if (!buyerName || !phone || !Array.isArray(seats) || seats.length === 0 || !totalAmount) {
    return res.status(400).json({ error: "Missing required order fields." });
  }
  if (!screenshotUrl || typeof screenshotUrl !== "string") {
    return res.status(400).json({ error: "Payment screenshot is required." });
  }
  // Sanity check it's actually a Firebase Storage URL, not something arbitrary.
  if (!screenshotUrl.includes("firebasestorage") && !screenshotUrl.includes("storage.googleapis.com")) {
    return res.status(400).json({ error: "Invalid screenshot URL." });
  }

  try {
    const refCode = generateRefCode();
    const orderRef = db.collection("orders").doc();

    await db.runTransaction(async (tx) => {
      const seatRefs = seats.map((seatId) => db.collection("seatMap").doc(seatId));
      const seatSnaps = await Promise.all(seatRefs.map((ref) => tx.get(ref)));

      const unavailable = [];
      seatSnaps.forEach((snap, i) => {
        const status = snap.exists ? snap.data().status : "available";
        if (status === "pending" || status === "sold") {
          unavailable.push(seats[i]);
        }
      });

      if (unavailable.length > 0) {
        throw Object.assign(
          new Error(`These seats are no longer available: ${unavailable.join(", ")}. Please pick different seats.`),
          { code: "SEATS_TAKEN" }
        );
      }

      seatRefs.forEach((ref) => {
        tx.set(ref, { status: "pending", orderId: orderRef.id }, { merge: true });
      });

      tx.set(orderRef, {
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
    });

    return res.status(200).json({ ok: true, orderId: orderRef.id, refCode });
  } catch (err) {
    if (err.code === "SEATS_TAKEN") {
      return res.status(409).json({ error: err.message });
    }
    console.error("create-order failed:", err);
    return res.status(500).json({ error: "Could not submit order. Try again." });
  }
};
