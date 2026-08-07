// POST /api/create-bet
// { legs: [{ fightId, side, odds, fighterName }], stake, buyerName, phone, email, userId, screenshotUrl }
// 
// Accumulator bets: multiple legs, odds multiply, 15% withholding tax on gross payout.
// Server re-reads ALL odds from Firestore at bet time — never trusts client-sent odds.
// Validates minStake from config/site.

const admin = require("./_firebaseAdmin");

const db = admin.firestore();
const TAX_RATE = 0.15;

function generateRefCode() {
  return "ETFC-BET-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { legs, stake, buyerName, phone, paymentMethod, email, userId, screenshotUrl } = req.body || {};

  if (!Array.isArray(legs) || legs.length === 0) {
    return res.status(400).json({ error: "At least one leg is required." });
  }
  if (legs.length > 20) {
    return res.status(400).json({ error: "Too many legs (max 20)." });
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
    // Only block if a non-rejected bet already used this screenshot
    const dupSnap = await db.collection("bets")
      .where("screenshotUrl", "==", screenshotUrl)
      .limit(5)
      .get();
    const activeDup = dupSnap.docs.find(d => d.data().status !== "rejected");
    if (activeDup) {
      return res.status(400).json({ error: "This payment screenshot has already been used. Upload a new one." });
    }

    // Load config for minStake and bettingEnabled
    const configSnap = await db.collection("config").doc("site").get();
    const config = configSnap.exists ? configSnap.data() : {};
    if (config.bettingEnabled !== true) {
      return res.status(403).json({ error: "Betting is not open yet." });
    }
    const minStake = Number(config.minStake) || 1;
    if (stakeNum < minStake) {
      return res.status(400).json({ error: `Minimum stake is ${minStake} ETB.` });
    }

    // Re-read ALL odds server-side from Firestore for each leg
    let combinedOdds = 1;
    const validatedLegs = [];

    for (const leg of legs) {
      const { fightId, side, fighterName: clientFighterName } = leg;
      if (!fightId || !["A", "B"].includes(side)) {
        return res.status(400).json({ error: "Each leg must have fightId and side (A or B)." });
      }

      const fightSnap = await db.collection("fights").doc(fightId).get();
      if (!fightSnap.exists) {
        return res.status(404).json({ error: `Fight ${fightId} not found.` });
      }
      const fight = fightSnap.data();

      const odds = side === "A" ? Number(fight.oddsA) : Number(fight.oddsB);
      const fighterName = side === "A" ? fight.fighterA : fight.fighterB;

      if (!Number.isFinite(odds) || odds <= 1) {
        return res.status(500).json({ error: `Fight ${fightId} doesn't have valid odds set yet.` });
      }

      combinedOdds *= odds;
      validatedLegs.push({ fightId, side, odds, fighterName });
    }

    const grossPayout = Math.round(stakeNum * combinedOdds * 100) / 100;
    const taxAmount = Math.round(grossPayout * TAX_RATE * 100) / 100;
    const netPayout = Math.round((grossPayout - taxAmount) * 100) / 100;
    const refCode = generateRefCode();

    const betRef = await db.collection("bets").add({
      buyerName,
      phone,
      paymentMethod: paymentMethod || "mpesa",
      email: email || "",
      userId: userId || "",
      legs: validatedLegs,
      stake: stakeNum,
      combinedOdds: Math.round(combinedOdds * 100) / 100,
      grossPayout,
      taxAmount,
      netPayout,
      refCode,
      screenshotUrl,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true, betId: betRef.id, refCode, grossPayout, taxAmount, netPayout });
  } catch (err) {
    console.error("create-bet failed:", err);
    return res.status(500).json({ error: "Could not submit bet. Try again." });
  }
};