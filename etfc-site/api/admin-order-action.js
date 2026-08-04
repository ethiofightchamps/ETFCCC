// POST /api/admin-order-action  { orderId, action: "approve" | "reject" }
// Updates the order status. On approve: marks the order's seats as sold in
// seatMap (so they can't be double-booked) and stamps a ticketCode the
// dashboard can render as a QR code. On reject: leaves seats free.

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();

function generateTicketCode() {
  return "ETFC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const { orderId, action } = req.body || {};

  if (!orderId || !["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "orderId and a valid action are required." });
  }

  const orderRef = db.collection("orders").doc(orderId);

  try {
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return res.status(404).json({ error: "Order not found." });
    }
    const order = orderSnap.data();

    if (order.status !== "pending") {
      return res.status(409).json({ error: `Order is already ${order.status}.` });
    }

    if (action === "approve") {
      const ticketCode = generateTicketCode();

      await db.runTransaction(async (tx) => {
        // Mark each seat sold — prevents any other pending order for the
        // same seat from also being approved later.
        const seatIds = order.seats || [];
        for (const seatId of seatIds) {
          const seatRef = db.collection("seatMap").doc(seatId);
          tx.set(seatRef, { status: "sold", orderId }, { merge: true });
        }
        tx.update(orderRef, {
          status: "confirmed",
          ticketCode,
          reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return res.status(200).json({ ok: true, status: "confirmed", ticketCode });
    } else {
      // Reject: release every seat this order was holding, so they go
      // back to "available" instead of staying stuck as "pending" forever.
      await db.runTransaction(async (tx) => {
        const seatIds = order.seats || [];
        for (const seatId of seatIds) {
          const seatRef = db.collection("seatMap").doc(seatId);
          tx.set(seatRef, { status: "available", orderId: admin.firestore.FieldValue.delete() }, { merge: true });
        }
        tx.update(orderRef, {
          status: "rejected",
          reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return res.status(200).json({ ok: true, status: "rejected" });
    }
  } catch (err) {
    console.error("admin-order-action failed:", err);
    return res.status(500).json({ error: "Could not update order." });
  }
};
