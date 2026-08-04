// GET /api/admin-seats
// Returns every seat that's currently "pending" or "sold", joined with the
// buyer info from its linked order, for the admin seat management page.

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    const [pendingSnap, soldSnap] = await Promise.all([
      db.collection("seatMap").where("status", "==", "pending").get(),
      db.collection("seatMap").where("status", "==", "sold").get(),
    ]);

    const seatDocs = [...pendingSnap.docs, ...soldSnap.docs];

    // Batch-fetch the linked orders so we can show buyer name/status per seat.
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
    console.error("admin-seats failed:", err);
    return res.status(500).json({ error: "Could not load seats." });
  }
};
