// POST /api/admin-bet-action  { betId, action }
// action is one of:
//   "approve"  — payment screenshot checked out, pending -> confirmed (bet is now live)
//   "reject"   — payment didn't check out, pending -> rejected
//   "won"      — after the fight, confirmed -> won (payout owed = potentialPayout)
//   "lost"     — after the fight, confirmed -> lost (no payout owed)

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();

const TRANSITIONS = {
  approve: { from: "pending", to: "confirmed" },
  reject: { from: "pending", to: "rejected" },
  won: { from: "confirmed", to: "won" },
  lost: { from: "confirmed", to: "lost" },
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const { betId, action } = req.body || {};
  const transition = TRANSITIONS[action];

  if (!betId || !transition) {
    return res.status(400).json({ error: "betId and a valid action are required." });
  }

  const betRef = db.collection("bets").doc(betId);

  try {
    const betSnap = await betRef.get();
    if (!betSnap.exists) {
      return res.status(404).json({ error: "Bet not found." });
    }
    const bet = betSnap.data();

    if (bet.status !== transition.from) {
      return res.status(409).json({ error: `Bet is currently "${bet.status}" — can't apply that action.` });
    }

    await betRef.update({
      status: transition.to,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true, status: transition.to });
  } catch (err) {
    console.error("admin-bet-action failed:", err);
    return res.status(500).json({ error: "Could not update bet." });
  }
};
