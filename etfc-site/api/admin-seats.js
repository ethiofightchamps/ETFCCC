// GET  /api/admin-seats           → list every pending/sold seat + buyer info
// POST /api/admin-seats { seatId } → release a seat (revokes its whole order)
//
// Merged from admin-seats.js + admin-release-seat.js — see admin-orders.js
// for why (Vercel Hobby plan's 12-function-per-deployment cap).

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();

async function listSeats(req, res) {
  try {
    const [pendingSnap, soldSnap] = await Promise.all([
      db.collection("seatMap").where("status", "==", "pending").get(),
      db.collection("seatMap").where("status", "==", "sold").get(),
    ]);

    const seatDocs = [...pendingSnap.docs, ...soldSnap.docs];

    const orderIds = [...new Set(seatDocs.map((d) => d.data().orderId).filter(Boolean))];
    const orderSnaps = await Promise.all(orderIds.map((id) => db.collection("orders").doc(id).get()));
    const ordersById = Object.fromEntries(
      orderSnaps.filter((s) => s.exists).map((s) => [s.id, s.data()])
    );

    const seats = seatDocs.map((doc) => {
      const d = doc.data();
      const order = ordersById[d.orderId] || null;
      return {
        seatId: doc.id,
        status: d.status,
        orderId: d.orderId || null,
        buyerName: order?.buyerName || "—",
        phone: order?.phone || "",
        orderStatus: order?.status || "—",
      };
    });

    return res.status(200).json({ seats });
  } catch (err) {
    console.error("admin-seats GET failed:", err);
    return res.status(500).json({ error: "Could not load seats." });
  }
}

async function releaseSeat(req, res) {
  const { seatId } = req.body || {};
  if (!seatId) {
    return res.status(400).json({ error: "seatId is required." });
  }

  const seatRef = db.collection("seatMap").doc(seatId);

  try {
    await db.runTransaction(async (tx) => {
      const seatSnap = await tx.get(seatRef);
      if (!seatSnap.exists || seatSnap.data().status === "available") {
        tx.set(seatRef, { status: "available", orderId: admin.firestore.FieldValue.delete() }, { merge: true });
        return;
      }

      const { orderId } = seatSnap.data();

      if (orderId) {
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await tx.get(orderRef);

        if (orderSnap.exists) {
          const order = orderSnap.data();
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

      tx.set(seatRef, { status: "available", orderId: admin.firestore.FieldValue.delete() }, { merge: true });
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("admin-seats POST failed:", err);
    return res.status(500).json({ error: "Could not release seat." });
  }
}

module.exports = async (req, res) => {
  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  if (req.method === "GET") return listSeats(req, res);
  if (req.method === "POST") return releaseSeat(req, res);
  return res.status(405).json({ error: "Method not allowed" });
};
