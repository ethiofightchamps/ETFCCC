// ── FIREBASE CONFIG (live) ─────────────────────────────────────────────────
// Project: etfc-75f9d

const firebaseConfig = {
  apiKey: "AIzaSyCjMcWO6xEioe1RKDjmu1XSDa5QJ_7hLVM",
  authDomain: "etfc-75f9d.firebaseapp.com",
  projectId: "etfc-75f9d",
  storageBucket: "etfc-75f9d.firebasestorage.app",
  messagingSenderId: "290377995434",
  appId: "1:290377995434:web:0851c53dcc872541e5ecd3",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Google sign-in: enable the "Google" provider under
// Firebase Console → Authentication → Sign-in method (if not done yet).
// auth.js calls `new firebase.auth.GoogleAuthProvider()` + `signInWithPopup`.

// ── EMAIL OTP ────────────────────────────────────────────────────────────
// Manual signup (name + phone + email) sends a 6-digit code to the user's
// email. Generate/verify that code server-side (a Firebase Cloud Function
// is recommended) and send it via Resend — never do this purely client-side.
// const RESEND_API_KEY = "REPLACE_ME"; // set as a Cloud Function env var, not here
