// GET  /api/admin-orders?status=pending   → list orders
// POST /api/admin-orders { orderId, action: "approve" | "reject" } → review one
//
// Merged from what used to be admin-orders.js + admin-order-action.js —
// Vercel's Hobby plan caps a deployment at 12 serverless functions, and
// splitting every GET/POST pair into its own file pushed the project over
// that limit. One file per resource, branching on req.method, is
// functionally identical and costs one function slot instead of two.

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();

function generateTicketCode() {
  return "ETFC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function listOrders(req, res) {
  const status = req.query.status || "pending";

  try {
    let query = db.collection("orders").orderBy("createdAt", "desc");
    if (status !== "all") {
      query = query.where("status", "==", status);
    }

    const snap = await query.get();
    const orders = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        buyerName: d.buyerName || "Unknown",
        phone: d.phone || "",
        email: d.email || "",
        seats: d.seats || [],
        totalAmount: d.totalAmount || 0,
        refCode: d.refCode || "",
        screenshotUrl: d.screenshotUrl || "",
        status: d.status || "pending",
        createdAt: d.createdAt ? d.createdAt.toMillis() : null,
      };
    });

    return res.status(200).json({ orders });
  } catch (err) {
    console.error("admin-orders GET failed:", err);
    return res.status(500).json({ error: "Could not load orders." });
  }
}

async function reviewOrder(req, res) {
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
    console.error("admin-orders POST failed:", err);
    return res.status(500).json({ error: "Could not update order." });
  }
}

module.exports = async (req, res) => {
  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  if (req.method === "GET") return listOrders(req, res);
  if (req.method === "POST") return reviewOrder(req, res);
  return res.status(405).json({ error: "Method not allowed" });
};
