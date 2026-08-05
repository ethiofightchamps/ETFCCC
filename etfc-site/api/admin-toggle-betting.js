// GET  /api/admin-toggle-betting            -> { bettingEnabled, minStake }
// POST /api/admin-toggle-betting { enabled } -> sets config/site.bettingEnabled
// POST /api/admin-toggle-betting { minStake } -> sets config/site.minStake
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
      const data = snap.exists ? snap.data() : {};
      return res.status(200).json({ 
        bettingEnabled: !!data.bettingEnabled, 
        minStake: Number(data.minStake) || 1 
      });
    } catch (err) {
      console.error("admin-toggle-betting GET failed:", err);
      return res.status(500).json({ error: "Could not load betting status." });
    }
  }

  if (req.method === "POST") {
    const { enabled, minStake } = req.body || {};

    // Handle bettingEnabled toggle
    if (typeof enabled === "boolean") {
      try {
        await configRef.set({ bettingEnabled: enabled }, { merge: true });
        return res.status(200).json({ ok: true, bettingEnabled: enabled });
      } catch (err) {
        console.error("admin-toggle-betting POST failed:", err);
        return res.status(500).json({ error: "Could not update betting status." });
      }
    }

    // Handle minStake update
    if (typeof minStake === "number" && minStake >= 1) {
      try {
        await configRef.set({ minStake }, { merge: true });
        return res.status(200).json({ ok: true, minStake });
      } catch (err) {
        console.error("admin-toggle-betting minStake POST failed:", err);
        return res.status(500).json({ error: "Could not update min stake." });
      }
    }

    return res.status(400).json({ error: "Provide either enabled (boolean) or minStake (number >= 1)." });
  }

  return res.status(405).json({ error: "Method not allowed" });
};