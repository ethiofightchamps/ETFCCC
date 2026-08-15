const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { seatIds = ["VVIP_NORMAL-344", "VVIP_NORMAL-345"] } = req.body;

  try {
    const batch = db.batch();
    
    for (const seatId of seatIds) {
      const seatRef = db.collection("seatMap").doc(seatId);
      batch.set(seatRef, {
        status: "sold",
        orderId: "manual-mark",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await batch.commit();
    
    return res.status(200).json({ 
      success: true, 
      marked: seatIds 
    });
  } catch (err) {
    console.error("Mark seats failed:", err);
    return res.status(500).json({ error: "Could not mark seats" });
  }
};