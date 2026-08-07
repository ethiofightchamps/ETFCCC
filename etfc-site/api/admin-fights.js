// GET  /api/admin-fights                                   → list all fights
// POST /api/admin-fights { action: "seed" }                 → one-time roster load
// POST /api/admin-fights { action: "updateOdds", fightId, oddsA, oddsB } → edit odds
//
// Merged from admin-fights.js + admin-seed-fights.js + admin-update-odds.js
// — see admin-orders.js for why (Vercel Hobby plan's 12-function cap).

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();

const SEED_FIGHTS = [
  { discipline: "mma", order: 1, mainEvent: true,  fighterA: "Sedo",          fighterB: "Jhonny",        weightA: "Middleweight", weightB: "Middleweight", oddsA: 1.85, oddsB: 2.05, photoA: "images/fighter-a.jpg", photoB: "images/fighter-b.jpg" },
  { discipline: "mma", order: 2, mainEvent: false, fighterA: "Elezar",        fighterB: "Kaleab",        weightA: "MMA", weightB: "MMA", oddsA: 1.80, oddsB: 2.00 },
  { discipline: "mma", order: 3, mainEvent: false, fighterA: "Edris",         fighterB: "Boika",         weightA: "94 KG", weightB: "93 KG", oddsA: 1.75, oddsB: 2.10, photoA: "images/fighters/edris.jpg", photoB: "images/fighters/boika.jpg" },
  { discipline: "mma", order: 4, mainEvent: false, fighterA: "Robel",         fighterB: "Nikatehilina",  weightA: "88 KG", weightB: "88 KG", oddsA: 1.90, oddsB: 1.95, photoA: "images/fighters/robel.jpg", photoB: "images/fighters/nikatehilina.jpg" },

  { discipline: "boxing", order: 1, mainEvent: false, fighterA: "Biniam",   fighterB: "Esubalew",  weightA: "Boxing", weightB: "Boxing", oddsA: 1.95, oddsB: 1.85 },
  { discipline: "boxing", order: 2, mainEvent: false, fighterA: "Haymanot", fighterB: "Abreham",   weightA: "Boxing", weightB: "Boxing", oddsA: 1.80, oddsB: 2.00 },
  { discipline: "boxing", order: 3, mainEvent: false, fighterA: "Desalegn", fighterB: "Surafel",   weightA: "Boxing", weightB: "Boxing", oddsA: 1.70, oddsB: 2.15 },

  { discipline: "muaythai", order: 1, mainEvent: false, fighterA: "Rebik",   fighterB: "Stephen",  weightA: "Muay Thai", weightB: "Muay Thai", oddsA: 1.90, oddsB: 1.90 },
  { discipline: "muaythai", order: 2, mainEvent: false, fighterA: "Habtamu", fighterB: "Frezer",   weightA: "Muay Thai", weightB: "Muay Thai", oddsA: 1.80, oddsB: 2.00 },
  { discipline: "muaythai", order: 3, mainEvent: false, fighterA: "Zahara",  fighterB: "Yabsira",  weightA: "Muay Thai", weightB: "Muay Thai", oddsA: 2.10, oddsB: 1.70 },
];

async function listFights(req, res) {
  try {
    const snap = await db.collection("fights").get();
    const fights = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.discipline > b.discipline ? 1 : a.discipline < b.discipline ? -1 : a.order - b.order));
    return res.status(200).json({ fights });
  } catch (err) {
    console.error("admin-fights GET failed:", err);
    return res.status(500).json({ error: "Could not load fights." });
  }
}

async function seedFights(req, res) {
  try {
    const existing = await db.collection("fights").limit(1).get();
    if (!existing.empty) {
      return res.status(409).json({ error: "Fights already seeded — edit odds from the list instead." });
    }
    const batch = db.batch();
    SEED_FIGHTS.forEach((fight) => batch.set(db.collection("fights").doc(), fight));
    await batch.commit();
    return res.status(200).json({ ok: true, count: SEED_FIGHTS.length });
  } catch (err) {
    console.error("admin-fights seed failed:", err);
    return res.status(500).json({ error: "Could not seed fights." });
  }
}

async function updateOdds(req, res) {
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
    console.error("admin-fights updateOdds failed:", err);
    return res.status(500).json({ error: "Could not update odds." });
  }
}

module.exports = async (req, res) => {
  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  if (req.method === "GET") return listFights(req, res);

  if (req.method === "POST") {
    const action = (req.body || {}).action;
    if (action === "seed") return seedFights(req, res);
    if (action === "updateOdds") return updateOdds(req, res);
    return res.status(400).json({ error: "Unknown or missing action." });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
