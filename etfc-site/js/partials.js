// Shared nav, footer, and auth modal — injected on every page.
// Edit NAV_LINKS / footer text here once, it updates everywhere.

function renderNav(activePage) {
  const links = [
    { href: "fight-card.html", label: "Fight Card", key: "fight-card" },
    { href: "betting.html", label: "Betting", key: "betting" },
    { href: "tickets.html", label: "Tickets", key: "tickets" },
    { href: "about.html", label: "About", key: "about" },
  ];
  const linksHtml = links.map(l =>
    `<a href="${l.href}" class="${activePage === l.key ? 'active' : ''}">${l.label}</a>`
  ).join("");

  return `
  <nav class="nav">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">ET<span>FC</span></a>
      <div class="nav-links">${linksHtml}</div>
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="nav-login" onclick="openAuthModal()" title="Login / Sign up">&#128100;</div>
        <a href="tickets.html" class="nav-cta">Get Tickets</a>
      </div>
    </div>
  </nav>`;
}

function renderFooter() {
  return `
  <footer>
    <div class="container foot-inner">
      <div class="nav-logo" style="font-size:20px;">ET<span>FC</span></div>
      <div class="foot-links">
        <a href="fight-card.html">Fight Card</a>
        <a href="betting.html">Betting</a>
        <a href="tickets.html">Tickets</a>
        <a href="about.html">About &amp; License</a>
      </div>
      <div class="copyright">&copy; 2026 ETFC — Addis Ababa, Ethiopia</div>
    </div>
  </footer>`;
}

// Auth modal — placeholder UI wired to js/auth.js handlers.
// Two entry paths: Google sign-in, or manual (name + phone + email) →
// verification code sent to email only. No phone/SMS OTP anywhere.
function renderAuthModal() {
  return `
  <div class="modal-overlay" id="authModal">
    <div class="modal">
      <span class="modal-close" onclick="closeAuthModal()">&times;</span>

      <div id="authStepChoice">
        <h3>Sign In</h3>
        <p class="sub">Sign in to buy tickets or place bets.</p>
        <button class="btn btn-outline btn-block" onclick="signInWithGoogle()">
          <span style="margin-right:8px;">&#128101;</span>Continue with Google
        </button>
        <div class="auth-divider"><span>or</span></div>
        <button class="btn btn-primary btn-block" onclick="showManualSignup()">Continue with Email</button>
      </div>

      <div id="authStepManual" style="display:none;">
        <h3>Your Details</h3>
        <p class="sub">We'll send a verification code to your email.</p>
        <div class="field">
          <label>Full Name</label>
          <input type="text" id="nameInput" placeholder="Full Name">
        </div>
        <div class="field">
          <label>Phone Number</label>
          <input type="tel" id="phoneInput" placeholder="09XX XXX XXX">
        </div>
        <div class="field">
          <label>Email Address</label>
          <input type="email" id="emailInput" placeholder="you@example.com">
        </div>
        <button class="btn btn-primary btn-block" onclick="sendEmailOtp()">Send Verification Code</button>
        <p class="text-dim" style="font-size:11px;margin-top:14px;text-align:center;">
          <a href="#" onclick="backToChoice(event)">&larr; Back</a>
        </p>
      </div>

      <div id="authStepOtp" style="display:none;">
        <h3>Enter Code</h3>
        <p class="sub">We sent a 6-digit code to <span id="otpEmailTarget"></span>.</p>
        <div class="otp-boxes">
          <input maxlength="1"><input maxlength="1"><input maxlength="1">
          <input maxlength="1"><input maxlength="1"><input maxlength="1">
        </div>
        <button class="btn btn-primary btn-block" onclick="verifyEmailOtp()">Verify</button>
        <p class="text-dim" style="font-size:11px;margin-top:14px;text-align:center;">
          <a href="#" onclick="sendEmailOtp(event)">Resend code</a>
        </p>
      </div>
    </div>
  </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const navMount = document.getElementById("nav-mount");
  const footerMount = document.getElementById("footer-mount");
  const modalMount = document.getElementById("modal-mount");
  if (navMount) navMount.outerHTML = renderNav(navMount.dataset.active || "");
  if (footerMount) footerMount.outerHTML = renderFooter();
  if (modalMount) modalMount.outerHTML = renderAuthModal();
});
