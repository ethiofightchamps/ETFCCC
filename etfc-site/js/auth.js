// ── AUTH FLOW ────────────────────────────────────────────────────────────
// Two ways in:
//   1. Continue with Google  → Firebase GoogleAuthProvider popup
//   2. Continue with Email   → collect name + phone + email, then a 6-digit
//                              code is emailed for verification.
// No SMS/phone OTP anywhere. This file is a working SCAFFOLD — the actual
// Google/Firebase calls and the email-send call are stubbed with TODOs.

let pendingAction = null; // e.g. { type: 'buyTicket', seatIds: [...] } — set before opening modal
let pendingSignup = null; // { name, phone, email } — held between "send code" and "verify"

function openAuthModal(action) {
  pendingAction = action || null;
  document.getElementById("authModal").classList.add("open");
  showChoiceStep();
}

function closeAuthModal() {
  document.getElementById("authModal").classList.remove("open");
}

function showStep(id) {
  ["authStepChoice", "authStepManual", "authStepOtp"].forEach((s) => {
    document.getElementById(s).style.display = s === id ? "block" : "none";
  });
}

function showChoiceStep() {
  showStep("authStepChoice");
}

function showManualSignup() {
  showStep("authStepManual");
}

function backToChoice(e) {
  if (e) e.preventDefault();
  showChoiceStep();
}

// Call this from any "Buy Ticket" / "Place Bet" button instead of navigating
// directly — it checks auth state first and only prompts login if needed.
function requireAuth(action, onAuthed) {
  // TODO: replace with real check — e.g. `auth.currentUser`
  const isLoggedIn = !!localStorage.getItem("etfc_session");
  if (isLoggedIn) {
    onAuthed();
  } else {
    pendingAction = { action, onAuthed };
    openAuthModal();
  }
}

function completeSignIn(sessionData) {
  localStorage.setItem("etfc_session", JSON.stringify({ ...sessionData, ts: Date.now() }));
  closeAuthModal();
  if (pendingAction && pendingAction.onAuthed) pendingAction.onAuthed();
  pendingAction = null;
}

// ── Google sign-in ─────────────────────────────────────────────────────
async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    const { displayName, email, uid } = result.user;
    completeSignIn({ name: displayName, email, uid, method: "google" });
  } catch (err) {
    console.error("Google sign-in failed:", err);
    showToast("Google sign-in failed — please try again.", "error");
  }
}

// ── Manual signup → email OTP ─────────────────────────────────────────
async function sendEmailOtp(e) {
  if (e) e.preventDefault();

  const name = document.getElementById("nameInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();
  const email = document.getElementById("emailInput").value.trim();

  if (!name) return showToast("Enter your full name.", "error");
  if (!phone) return showToast("Enter your phone number.", "error");
  if (!email) return showToast("Enter your email address.", "error");

  pendingSignup = { name, phone, email };

  try {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not send verification code.");
  } catch (err) {
    console.error("sendEmailOtp failed:", err);
    showToast(err.message || "Could not send verification code. Try again.", "error");
    return;
  }

  showToast("Verification code sent — check your email.", "success");
  document.getElementById("otpEmailTarget").textContent = email;
  showStep("authStepOtp");
}

async function verifyEmailOtp() {
  const digits = [...document.querySelectorAll("#authStepOtp input")].map((i) => i.value).join("");
  if (digits.length !== 6) return showToast("Enter the full 6-digit code.", "error");
  if (!pendingSignup) return showToast("Session expired — please start over.", "error");

  try {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingSignup.email, code: digits }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Incorrect or expired code.");

    await auth.signInWithCustomToken(data.token);
    completeSignIn({ name: data.name, phone: data.phone, email: data.email, method: "email" });
    showToast(`Welcome, ${data.name.split(" ")[0]}!`, "success");
  } catch (err) {
    console.error("verifyEmailOtp failed:", err);
    showToast(err.message || "Incorrect or expired code.", "error");
    return;
  }

  pendingSignup = null;
}

// Auto-advance between OTP digit boxes
document.addEventListener("input", (e) => {
  if (e.target.matches("#authStepOtp input")) {
    const boxes = [...document.querySelectorAll("#authStepOtp input")];
    const idx = boxes.indexOf(e.target);
    if (e.target.value && idx < boxes.length - 1) boxes[idx + 1].focus();
  }
});
