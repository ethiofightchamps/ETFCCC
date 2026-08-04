// ── AUTH FLOW ────────────────────────────────────────────────────────────
// Login and sign up now live on their own pages (login.html / signup.html)
// instead of a popup. Two ways in on each page:
//   1. Continue with Google  → Firebase GoogleAuthProvider popup
//   2. Continue with Email   → collect name + phone + email, then a 6-digit
//                              code is emailed for verification.
// The email-OTP send/verify logic below is UNCHANGED from the working
// version — only the modal-open/close plumbing around it was replaced with
// page navigation.

let pendingSignup = null; // { name, phone, email } — held between "send code" and "verify"

function showStep(id) {
  ["authStepChoice", "authStepManual", "authStepOtp"].forEach((s) => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? "block" : "none";
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

// Call this from any "Buy Ticket" / "Place Bet" button. If already signed
// in, runs onAuthed() immediately. Otherwise remembers what page/action was
// in progress and sends the user to login.html; they're bounced back after.
function requireAuth(actionKey, onAuthed) {
  const isLoggedIn = !!localStorage.getItem("etfc_session");
  if (isLoggedIn) {
    onAuthed();
    return;
  }
  sessionStorage.setItem("etfc_pending_action", actionKey);
  sessionStorage.setItem("etfc_return_to", window.location.pathname + window.location.search);
  window.location.href = "login.html";
}

// Call on page load if that page has a requireAuth() action, so it resumes
// automatically after a login.html → back redirect.
function consumePendingAction(actionKey, onAuthed) {
  const pending = sessionStorage.getItem("etfc_pending_action");
  if (pending === actionKey && !!localStorage.getItem("etfc_session")) {
    sessionStorage.removeItem("etfc_pending_action");
    sessionStorage.removeItem("etfc_return_to");
    onAuthed();
  }
}

// After a successful sign-in, go back to wherever the user was trying to
// go, or the homepage.
function redirectAfterAuth() {
  const returnTo = sessionStorage.getItem("etfc_return_to");
  sessionStorage.removeItem("etfc_return_to");
  window.location.href = returnTo || "index.html";
}

function completeSignIn(sessionData) {
  localStorage.setItem("etfc_session", JSON.stringify({ ...sessionData, ts: Date.now() }));
}

function logOut(e) {
  if (e) e.preventDefault();
  localStorage.removeItem("etfc_session");
  if (typeof auth !== "undefined" && auth.currentUser) auth.signOut();
  window.location.href = "index.html";
}

// ── Google sign-in ─────────────────────────────────────────────────────
async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    const { displayName, email, uid } = result.user;
    completeSignIn({ name: displayName, email, uid, method: "google" });
    redirectAfterAuth();
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
  redirectAfterAuth();
}

// Auto-advance between OTP digit boxes
document.addEventListener("input", (e) => {
  if (e.target.matches("#authStepOtp input")) {
    const boxes = [...document.querySelectorAll("#authStepOtp input")];
    const idx = boxes.indexOf(e.target);
    if (e.target.value && idx < boxes.length - 1) boxes[idx + 1].focus();
  }
});
