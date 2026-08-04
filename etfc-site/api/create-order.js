// POST /api/create-order
// { buyerName, phone, email, seats: [...], totalAmount, screenshotBase64 }
//
// Uploads the payment screenshot, then claims the requested seats and writes
// the order in a SINGLE Firestore transaction. This is what prevents two
// buyers from both getting "pending" orders for the same seat — the
// transaction re-reads each seat's current status right before committing,
// and fails the whole request if any seat is no longer free.
//
// NOTE / TODO: doesn't yet verify a Firebase Auth ID token — see README.

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

    // Upload screenshot first — outside the transaction, since Storage
    // writes can't participate in a Firestore transaction anyway.
    const buffer = Buffer.from(screenshotBase64.split(",").pop(), "base64");
    const filePath = `payment-screenshots/${Date.now()}-${refCode}.jpg`;
    const file = bucket.file(filePath);
    await file.save(buffer, { metadata: { contentType: "image/jpeg" } });
    await file.makePublic();
    const screenshotUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    const orderRef = db.collection("orders").doc();

    await db.runTransaction(async (tx) => {
      // Re-read every requested seat's current status INSIDE the
      // transaction — this is what makes the check atomic. If two people
      // hit this endpoint for the same seat at the same time, only one
      // transaction wins; the other sees the seat already locked and fails.
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

      // All clear — lock every seat as "pending" against this order, and
      // write the order itself, in the same atomic commit.
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
