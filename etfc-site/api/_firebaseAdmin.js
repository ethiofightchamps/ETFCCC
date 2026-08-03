// Shared Firebase Admin init — reused by /api/send-otp and /api/verify-otp.
// Reads the service account key from a Vercel environment variable so no
// secret file ever ends up in the repo.
//
// Set in Vercel: Project → Settings → Environment Variables
//   FIREBASE_SERVICE_ACCOUNT_KEY  = the full JSON key, minified to one line

const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
