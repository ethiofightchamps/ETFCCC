const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function markSeatsTaken() {
  const seatIds = ["VVIP_NORMAL-344", "VVIP_NORMAL-345"];
  
  for (const seatId of seatIds) {
    const seatRef = db.collection("seatMap").doc(seatId);
    await seatRef.set({
      status: "sold",
      orderId: "manual-mark",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`Marked ${seatId} as sold`);
  }
  
  console.log("Done!");
  process.exit(0);
}

markSeatsTaken().catch(console.error);