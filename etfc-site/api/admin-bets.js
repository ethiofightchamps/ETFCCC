// GET /api/admin-bets?status=pending
// Returns bets from Firestore for the admin review table. Mirrors
// admin-orders.js — status is one of pending | confirmed | won | lost | rejected | all.

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
    let query = db.collection("bets").orderBy("createdAt", "desc");
    if (status !== "all") {
      query = query.where("status", "==", status);
    }

    const snap = await query.get();
    const bets = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        buyerName: d.buyerName || "Unknown",
        phone: d.phone || "",
        email: d.email || "",
        fightId: d.fightId || "",
        fighterName: d.fighterName || "",
        side: d.side || "",
        odds: d.odds || 0,
        stake: d.stake || 0,
        potentialPayout: d.potentialPayout || 0,
        refCode: d.refCode || "",
        screenshotUrl: d.screenshotUrl || "",
        status: d.status || "pending",
        createdAt: d.createdAt ? d.createdAt.toMillis() : null,
      };
    });

    return res.status(200).json({ bets });
  } catch (err) {
    console.error("admin-bets failed:", err);
    return res.status(500).json({ error: "Could not load bets." });
  }
};
