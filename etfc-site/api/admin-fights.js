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
    const snap = await db.collection("fights").orderBy("discipline").orderBy("order").get();
    const fights = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json({ fights });
  } catch (err) {
    console.error("admin-fights failed:", err);
    return res.status(500).json({ error: "Could not load fights." });
  }
};
