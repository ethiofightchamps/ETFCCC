// POST /api/admin-release-seat  { seatId }
//
// Manual override for mistakes — e.g. a fraudulent order got approved and
// needs undoing. Releasing ANY seat on an order revokes the WHOLE order
// (all its seats go back to "available"), since a partial release would
// leave a ticket that's only good for some of the seats it was sold for.

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const { seatId } = req.body || {};
  if (!seatId) {
    return res.status(400).json({ error: "seatId is required." });
  }

  const seatRef = db.collection("seatMap").doc(seatId);

  try {
    await db.runTransaction(async (tx) => {
      const seatSnap = await tx.get(seatRef);
      if (!seatSnap.exists || seatSnap.data().status === "available") {
        // Nothing to do — already free.
        tx.set(seatRef, { status: "available", orderId: admin.firestore.FieldValue.delete() }, { merge: true });
        return;
      }

      const { orderId } = seatSnap.data();

      if (orderId) {
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await tx.get(orderRef);

        if (orderSnap.exists) {
          const order = orderSnap.data();
          // Free every seat this order held, not just the one clicked —
          // a ticket revoked for one seat can't stay valid for the rest.
          const seatIds = order.seats || [seatId];
          for (const sid of seatIds) {
            const ref = db.collection("seatMap").doc(sid);
            tx.set(ref, { status: "available", orderId: admin.firestore.FieldValue.delete() }, { merge: true });
          }
          tx.update(orderRef, {
            status: "revoked",
            revokedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return;
        }
      }

      // No linked order found — just free this seat directly.
      tx.set(seatRef, { status: "available", orderId: admin.firestore.FieldValue.delete() }, { merge: true });
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("admin-release-seat failed:", err);
    return res.status(500).json({ error: "Could not release seat." });
  }
};
