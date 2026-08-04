// POST /api/admin-update-odds  { fightId, oddsA, oddsB }
// Updates only the odds fields on a fight — keeps this endpoint narrow and
// safe rather than allowing arbitrary field writes from the admin UI.

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

  const { fightId, oddsA, oddsB } = req.body || {};
  const numA = Number(oddsA);
  const numB = Number(oddsB);

  if (!fightId || !Number.isFinite(numA) || !Number.isFinite(numB) || numA <= 1 || numB <= 1) {
    return res.status(400).json({ error: "fightId and two valid odds values (> 1.0) are required." });
  }

  try {
    await db.collection("fights").doc(fightId).update({
      oddsA: numA,
      oddsB: numB,
      oddsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("admin-update-odds failed:", err);
    return res.status(500).json({ error: "Could not update odds." });
  }
};
