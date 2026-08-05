// GET  /api/admin-bets?status=pending          → list bets
// POST /api/admin-bets { betId, action }        → approve | reject | won | lost
//
// Merged from admin-bets.js + admin-bet-action.js — see admin-orders.js for
// why (Vercel Hobby plan's 12-function-per-deployment cap).

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();

const TRANSITIONS = {
  approve: { from: "pending", to: "confirmed" },
  reject: { from: "pending", to: "rejected" },
  won: { from: "confirmed", to: "won" },
  lost: { from: "confirmed", to: "lost" },
};

async function listBets(req, res) {
  const status = req.query.status || "pending";

  try {
    let query = db.collection("bets");
    if (status !== "all") {
      query = query.where("status", "==", status);
    }

    const snap = await query.get();
    const bets = snap.docs
      .sort((a, b) => (b.data().createdAt?.toMillis?.() || 0) - (a.data().createdAt?.toMillis?.() || 0))
      .map((doc) => {
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
    console.error("admin-bets GET failed:", err);
    return res.status(500).json({ error: "Could not load bets." });
  }
}

async function reviewBet(req, res) {
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
    console.error("admin-bets POST failed:", err);
    return res.status(500).json({ error: "Could not update bet." });
  }
}

module.exports = async (req, res) => {
  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  if (req.method === "GET") return listBets(req, res);
  if (req.method === "POST") return reviewBet(req, res);
  return res.status(405).json({ error: "Method not allowed" });
};
