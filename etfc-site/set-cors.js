// One-time script to set CORS on the Firebase Storage bucket.
// Run locally: node set-cors.js
//
// Needs a service account key JSON file in the same folder, named
// service-account.json — see instructions for where to get one.

const { initializeApp, cert } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const serviceAccount = require("./service-account.json");

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "etfc-75f9d.firebasestorage.app",
});

const corsConfig = [
  {
    origin: ["*"],
    method: ["GET", "PUT", "POST", "HEAD"],
    maxAgeSeconds: 3600,
    responseHeader: ["Content-Type", "Authorization", "Content-Length", "x-goog-resumable"],
  },
];

async function run() {
  const bucket = getStorage().bucket();
  await bucket.setCorsConfiguration(corsConfig);
  console.log("✅ CORS applied successfully.");

  const [metadata] = await bucket.getMetadata();
  console.log("Current CORS config on bucket:", JSON.stringify(metadata.cors, null, 2));
}

run().catch((err) => {
  console.error("❌ Failed to set CORS:", err.message);
  process.exit(1);
});
