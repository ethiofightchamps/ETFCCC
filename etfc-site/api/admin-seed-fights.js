// POST /api/admin-seed-fights
// Idempotent: only inserts if the `fights` collection is currently empty.
// Run this ONCE (button on admin/odds.html) to load ETFC's real roster with
// starting placeholder odds. After that, edit odds from the admin panel —
// this endpoint won't overwrite existing fights.

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();

const SEED_FIGHTS = [
  { discipline: "mma", order: 1, mainEvent: true,  fighterA: "Sedo",        fighterB: "Jonny",     weightA: "Heavyweight", weightB: "Heavyweight", oddsA: 1.85, oddsB: 2.05, photoA: "images/fighter-a.jpg", photoB: "images/fighter-b.jpg" },
  { discipline: "mma", order: 2, mainEvent: false, fighterA: "Boyka",       fighterB: "Endris",    weightA: "Heavyweight", weightB: "Heavyweight", oddsA: 1.75, oddsB: 2.10 },
  { discipline: "mma", order: 3, mainEvent: false, fighterA: "Nikatehkina", fighterB: "Robel (Sky-Limit)", weightA: "75 KG", weightB: "75 KG", oddsA: 1.90, oddsB: 1.95 },
  { discipline: "mma", order: 4, mainEvent: false, fighterA: "Titan",       fighterB: "Coach Kal", weightA: "75 KG", weightB: "75 KG", oddsA: 2.20, oddsB: 1.65 },

  { discipline: "boxing", order: 1, mainEvent: false, fighterA: "Abrhamalem",   fighterB: "Tyson (Haymanot Desalegn)", weightA: "63.5 KG", weightB: "63.5 KG", oddsA: 1.80, oddsB: 2.00 },
  { discipline: "boxing", order: 2, mainEvent: false, fighterA: "Surafel Cheri", fighterB: "Desalegn", weightA: "54 KG", weightB: "54 KG", oddsA: 1.70, oddsB: 2.15 },
  { discipline: "boxing", order: 3, mainEvent: false, fighterA: "Esubalew",     fighterB: "Biniyam",   weightA: "Lightweight", weightB: "Lightweight", oddsA: 1.95, oddsB: 1.85 },
  { discipline: "boxing", order: 4, mainEvent: false, fighterA: "Abenezer",     fighterB: "Mesfin Biru", weightA: "71 KG", weightB: "71 KG", oddsA: 2.05, oddsB: 1.75 },

  { discipline: "muaythai", order: 1, mainEvent: false, fighterA: "Rebik Sani", fighterB: "Sky Okony", weightA: "67 KG", weightB: "67 KG", oddsA: 1.90, oddsB: 1.90 },
  { discipline: "muaythai", order: 2, mainEvent: false, fighterA: "Frezer",     fighterB: "Habtamu",   weightA: "63 KG", weightB: "63 KG", oddsA: 1.80, oddsB: 2.00 },
  { discipline: "muaythai", order: 3, mainEvent: false, fighterA: "Zahara",     fighterB: "Yabsira",   weightA: "54 KG", weightB: "54 KG", oddsA: 2.10, oddsB: 1.70 },
];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    const existing = await db.collection("fights").limit(1).get();
    if (!existing.empty) {
      return res.status(409).json({ error: "Fights already seeded — edit odds from the list instead." });
    }

    const batch = db.batch();
    SEED_FIGHTS.forEach((fight) => {
      const ref = db.collection("fights").doc();
      batch.set(ref, fight);
    });
    await batch.commit();

    return res.status(200).json({ ok: true, count: SEED_FIGHTS.length });
  } catch (err) {
    console.error("admin-seed-fights failed:", err);
    return res.status(500).json({ error: "Could not seed fights." });
  }
};
