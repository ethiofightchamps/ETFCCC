// GET /api/admin-orders?status=pending
// Returns orders from Firestore for the admin review table.
// Protected by the admin session cookie — uses firebase-admin, which
// bypasses firestore.rules entirely, so this is the ONLY place orders
// should be read/written in bulk from the server side.

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
    console.error("admin-orders failed:", err);
    return res.status(500).json({ error: "Could not load orders." });
  }
};
