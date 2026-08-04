// GET  /api/admin-toggle-betting            -> { bettingEnabled }
// POST /api/admin-toggle-betting { enabled } -> sets config/site.bettingEnabled
//
// This is the single flag that gates real betting everywhere: the bet
// buttons on betting.html, and the server-side check in create-bet.js.

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();
const configRef = db.collection("config").doc("site");

module.exports = async (req, res) => {
  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  if (req.method === "GET") {
    try {
      const snap = await configRef.get();
      return res.status(200).json({ bettingEnabled: snap.exists ? !!snap.data().bettingEnabled : false });
    } catch (err) {
      console.error("admin-toggle-betting GET failed:", err);
      return res.status(500).json({ error: "Could not load betting status." });
    }
  }

  if (req.method === "POST") {
    const { enabled } = req.body || {};
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "enabled (boolean) is required." });
    }
    try {
      await configRef.set({ bettingEnabled: enabled }, { merge: true });
      return res.status(200).json({ ok: true, bettingEnabled: enabled });
    } catch (err) {
      console.error("admin-toggle-betting POST failed:", err);
      return res.status(500).json({ error: "Could not update betting status." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
