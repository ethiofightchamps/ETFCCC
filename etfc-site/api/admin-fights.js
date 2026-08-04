// GET /api/admin-fights
// Returns all fights, grouped/ordered, for the odds editor table.

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
    // No .orderBy() chain here on purpose — Firestore requires a manually
    // created composite index for ordering by two different fields, which
    // doesn't exist yet and would fail every request. Sorting in JS avoids
    // needing that index at all.
    const snap = await db.collection("fights").get();
    const fights = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.discipline > b.discipline ? 1 : a.discipline < b.discipline ? -1 : a.order - b.order));
    return res.status(200).json({ fights });
  } catch (err) {
    console.error("admin-fights failed:", err);
    return res.status(500).json({ error: "Could not load fights." });
  }
};
