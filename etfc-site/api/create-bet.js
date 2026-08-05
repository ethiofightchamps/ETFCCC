// POST /api/create-bet
// { fightId, side: "A"|"B", stake, buyerName, phone, email, screenshotUrl }
//
// Same fix as create-order.js: the payment screenshot uploads CLIENT-SIDE
// straight to Firebase Storage (see betting.html) instead of being sent as
// base64 through this endpoint — base64 routinely exceeds Vercel's 4.5MB
// serverless function request-body limit, which was crashing this endpoint
// with a generic Vercel error page before any of this code even ran.
//
// Real odds are still read server-side from the `fights` collection at bet
// time — never trust a client-sent odds value, or someone could submit a
// fake higher number and inflate their own payout.
//
// NOTE / TODO: doesn't yet verify a Firebase Auth ID token — see create-order.js.

const admin = require("./_firebaseAdmin");

const db = admin.firestore();

function generateRefCode() {
  return "ETFC-BET-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fightId, side, stake, buyerName, phone, email, userId, screenshotUrl } = req.body || {};

  if (!fightId || !["A", "B"].includes(side)) {
    return res.status(400).json({ error: "A valid fightId and side (A or B) are required." });
  }
  const stakeNum = Number(stake);
  if (!Number.isFinite(stakeNum) || stakeNum <= 0) {
    return res.status(400).json({ error: "Enter a valid stake amount." });
  }
  if (!buyerName || !phone) {
    return res.status(400).json({ error: "Missing required buyer info." });
  }
  if (!screenshotUrl || typeof screenshotUrl !== "string") {
    return res.status(400).json({ error: "Payment screenshot is required." });
  }
  const allowedHosts = ["firebasestorage", "storage.googleapis.com", "cloudinary.com"];
  if (!allowedHosts.some(h => screenshotUrl.includes(h))) {
    return res.status(400).json({ error: "Invalid screenshot URL." });
  }

  try {
    // Reject if this exact screenshot was already used
    const dupSnap = await db.collection("bets")
      .where("screenshotUrl", "==", screenshotUrl)
      .limit(1)
      .get();
    if (!dupSnap.empty) {
      return res.status(400).json({ error: "This payment screenshot has already been used. Upload a new one." });
    }

    const configSnap = await db.collection("config").doc("site").get();
    if (!configSnap.exists || configSnap.data().bettingEnabled !== true) {
      return res.status(403).json({ error: "Betting is not open yet." });
    }

    const fightSnap = await db.collection("fights").doc(fightId).get();
    if (!fightSnap.exists) {
      return res.status(404).json({ error: "Fight not found." });
    }
    const fight = fightSnap.data();

    const odds = side === "A" ? Number(fight.oddsA) : Number(fight.oddsB);
    const fighterName = side === "A" ? fight.fighterA : fight.fighterB;
    if (!Number.isFinite(odds) || odds <= 1) {
      return res.status(500).json({ error: "This fight doesn't have valid odds set yet." });
    }

    const potentialPayout = Math.round(stakeNum * odds * 100) / 100;
    const refCode = generateRefCode();

    const betRef = await db.collection("bets").add({
      buyerName,
      phone,
      email: email || "",
      userId: userId || "",
      fightId,
      side,
      fighterName,
      odds,
      stake: stakeNum,
      potentialPayout,
      refCode,
      screenshotUrl,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true, betId: betRef.id, refCode, potentialPayout });
  } catch (err) {
    console.error("create-bet failed:", err);
    return res.status(500).json({ error: "Could not submit bet. Try again." });
  }
};
