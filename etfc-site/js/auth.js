// ── AUTH FLOW ────────────────────────────────────────────────────────────
// Login and sign up live on their own pages (login.html / signup.html).
//
// Login page: Google button, or an email box shown up front — type your
// email, hit Continue, then enter your password.
//
// Signup page: Google button, or an email box shown up front — type your
// email, hit Continue, then a wizard —
//   1. Full Name
//   2. Phone Number
//   3. Password + Confirm
//   4. 6-digit email verification code
// The password is only held in memory client-side (pendingSignup) and is
// sent to the server for the first time in the final /api/verify-otp call,
// once the code is confirmed — it's never written to Firestore.

let pendingSignup = null; // { name, phone, email, password } — held between steps

function showStep(id) {
  document.querySelectorAll(".auth-step").forEach((el) => {
    el.style.display = el.id === id ? "block" : "none";
  });
}

function showChoiceStep() {
  showStep("authStepChoice");
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

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

// ── Login page: email box up front, then password ──────────────────────
function continueLoginWithEmail(e) {
  if (e) e.preventDefault();
  const email = document.getElementById("loginEmailInput").value.trim();
  if (!isValidEmail(email)) return showToast("Enter a valid email address.", "error");

  document.getElementById("loginEmailDisplay").textContent = email;
  showStep("authStepLogin");
  document.getElementById("loginPasswordInput").focus();
}

async function loginWithEmail(e) {
  if (e) e.preventDefault();

  const email = document.getElementById("loginEmailInput").value.trim();
  const password = document.getElementById("loginPasswordInput").value;

  if (!isValidEmail(email)) return showToast("Enter a valid email address.", "error");
  if (!password) return showToast("Enter your password.", "error");

  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    const uid = result.user.uid;

    let name = result.user.displayName || email;
    let phone = "";
    try {
      const profile = await db.collection("users").doc(uid).get();
      if (profile.exists) {
        name = profile.data().name || name;
        phone = profile.data().phone || "";
      }
    } catch (profileErr) {
      console.warn("Could not load user profile:", profileErr);
    }

    completeSignIn({ name, phone, email, uid, method: "password" });
    showToast(`Welcome back, ${name.split(" ")[0]}!`, "success");
    redirectAfterAuth();
  } catch (err) {
    console.error("Email/password login failed:", err);
    let message = "Incorrect email or password.";
    if (err.code === "auth/user-not-found") message = "No account found with that email.";
    if (err.code === "auth/too-many-requests") message = "Too many attempts — try again later.";
    if (err.code === "auth/invalid-email") message = "That email address looks invalid.";
    showToast(message, "error");
  }
}

async function sendPasswordReset(e) {
  if (e) e.preventDefault();
  const email = document.getElementById("loginEmailInput").value.trim();
  if (!isValidEmail(email)) return showToast("Enter your email above first, then tap this.", "error");

  try {
    await auth.sendPasswordResetEmail(email);
    showToast("Password reset email sent — check your inbox.", "success");
  } catch (err) {
    console.error("Password reset failed:", err);
    showToast("Could not send reset email. Try again.", "error");
  }
}

// ── Signup page: email box up front, then name → phone → password → OTP ─
function continueSignupWithEmail(e) {
  if (e) e.preventDefault();
  const email = document.getElementById("emailInput").value.trim();
  if (!isValidEmail(email)) return showToast("Enter a valid email address.", "error");

  pendingSignup = { ...(pendingSignup || {}), email };
  showStep("authStepName");
  document.getElementById("nameInput").focus();
}

function goToPhoneStep(e) {
  if (e) e.preventDefault();
  const name = document.getElementById("nameInput").value.trim();

  if (!name) return showToast("Enter your full name.", "error");
  if (!pendingSignup) return showToast("Session expired — please start over.", "error");

  pendingSignup.name = name;
  showStep("authStepPhone");
}

function goToPasswordStep(e) {
  if (e) e.preventDefault();
  const phone = document.getElementById("phoneInput").value.trim();

  if (!phone) return showToast("Enter your phone number.", "error");
  if (!pendingSignup) return showToast("Session expired — please start over.", "error");

  pendingSignup.phone = phone;
  showStep("authStepPassword");
}

async function submitSignupPassword(e) {
  if (e) e.preventDefault();
  if (!pendingSignup) return showToast("Session expired — please start over.", "error");

  const password = document.getElementById("passwordInput").value;
  const confirm = document.getElementById("passwordConfirmInput").value;

  if (!password || password.length < 6) return showToast("Password must be at least 6 characters.", "error");
  if (password !== confirm) return showToast("Passwords don't match.", "error");

  pendingSignup.password = password;

  const { name, phone, email } = pendingSignup;

  try {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not send verification code.");
  } catch (err) {
    console.error("send-otp failed:", err);
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
      body: JSON.stringify({
        email: pendingSignup.email,
        code: digits,
        password: pendingSignup.password,
      }),
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
