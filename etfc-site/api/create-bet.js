// POST /api/create-bet
// { fightId, side: "A"|"B", stake, buyerName, phone, email, screenshotBase64 }
//
// Same pattern as create-order.js: uploads the payment screenshot to
// Firebase Storage and writes a "pending" bet doc for the admin panel to
// review. Runs server-side so the odds used for the payout are always the
// REAL odds read from the `fights` collection at the moment of betting —
// never trust a client-sent odds value, or someone could submit a fake
// higher number and inflate their own payout.
//
// NOTE / TODO: like create-order.js, this doesn't yet verify a Firebase
// Auth ID token — it trusts the buyer info the client sends. Before real
// betting money is on the line, require `idToken` and verify it with
// admin.auth().verifyIdToken() before writing the bet.

const admin = require("./_firebaseAdmin");

const db = admin.firestore();
const bucket = admin.storage().bucket();

function generateRefCode() {
  return "ETFC-BET-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fightId, side, stake, buyerName, phone, email, screenshotBase64 } = req.body || {};

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
  if (!screenshotBase64) {
    return res.status(400).json({ error: "Payment screenshot is required." });
  }

  try {
    // Betting must be globally enabled — checked here too, not just in the UI.
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

    const buffer = Buffer.from(screenshotBase64.split(",").pop(), "base64");
    const filePath = `bet-screenshots/${Date.now()}-${refCode}.jpg`;
    const file = bucket.file(filePath);

    await file.save(buffer, { metadata: { contentType: "image/jpeg" } });
    await file.makePublic();
    const screenshotUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    const betRef = await db.collection("bets").add({
      buyerName,
      phone,
      email: email || "",
      fightId,
      side,
      fighterName,
      odds,
      stake: stakeNum,
      potentialPayout,
      refCode,
      screenshotUrl,
      status: "pending", // pending -> confirmed (payment verified, bet active) -> won / lost (after the fight)
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true, betId: betRef.id, refCode, potentialPayout });
  } catch (err) {
    console.error("create-bet failed:", err);
    return res.status(500).json({ error: "Could not submit bet. Try again." });
  }
};
