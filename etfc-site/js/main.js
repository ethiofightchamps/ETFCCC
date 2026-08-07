// ── COUNTDOWN TIMER ──────────────────────────────────────────────────────
// PLACEHOLDER date — replace with the real event date/time once confirmed.
const EVENT_DATE = new Date("2026-08-27T10:00:00+03:00").getTime();

function tickCountdown() {
  const el = document.getElementById("countdown");
  if (!el) return;
  const now = Date.now();
  const diff = Math.max(0, EVENT_DATE - now);

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  el.innerHTML = `
    <div class="unit"><div class="num">${String(d).padStart(
      2,
      "0"
    )}</div><div class="lbl">Days</div></div>
    <div class="unit"><div class="num">${String(h).padStart(
      2,
      "0"
    )}</div><div class="lbl">Hrs</div></div>
    <div class="unit"><div class="num">${String(m).padStart(
      2,
      "0"
    )}</div><div class="lbl">Min</div></div>
    <div class="unit"><div class="num">${String(s).padStart(
      2,
      "0"
    )}</div><div class="lbl">Sec</div></div>
  `;
}
setInterval(tickCountdown, 1000);
document.addEventListener("DOMContentLoaded", tickCountdown);

// ── LIGHT / DARK MODE ─────────────────────────────────────────────────────
// Applied immediately in each page's <head> (see theme-init inline script)
// to avoid a flash of the wrong theme; these two functions handle the
// toggle button + keeping it in sync after the nav renders.
function toggleTheme() {
  const isLight =
    document.documentElement.getAttribute("data-theme") === "light";
  const next = isLight ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("etfc_theme", next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  const isLight =
    document.documentElement.getAttribute("data-theme") === "light";
  btn.innerHTML = isLight ? "&#9728;" : "&#9789;"; // sun : moon
}

// ── TOAST NOTIFICATIONS ───────────────────────────────────────────────────
// Usage: showToast("Code sent!", "success") | showToast("Wrong code.", "error")
// Replaces plain browser alert() popups everywhere on the site.
function showToast(message, type = "info") {
  let host = document.getElementById("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    document.body.appendChild(host);
  }

  const icons = { success: "&#10003;", error: "&#33;", info: "&#8505;" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${
    icons[type] || icons.info
  }</span><span class="toast-msg">${message}</span>`;
  host.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

// ── BUY TICKET / PLACE BET buttons anywhere on the site ──────────────────
// Usage: <button onclick="goToTickets()">Buy Ticket</button>
function goToTickets() {
  window.location.href = "tickets.html";
}
function goToBetting() {
  window.location.href = "betting.html";
}

// ── TAP FEEDBACK ON BUTTONS ────────────────────────────────────────────
// :active in CSS doesn't always fire reliably on touch devices (especially
// on <a class="btn"> links), so give every .btn an immediate visual "press"
// via touch/mouse listeners on top of the CSS :active state.
(function () {
  function press(e) {
    const btn = e.target.closest(".btn");
    if (btn) btn.classList.add("btn-pressed");
  }
  function release() {
    document
      .querySelectorAll(".btn-pressed")
      .forEach((b) => b.classList.remove("btn-pressed"));
  }
  document.addEventListener("touchstart", press, { passive: true });
  document.addEventListener("touchend", release);
  document.addEventListener("touchcancel", release);
  document.addEventListener("mousedown", press);
  document.addEventListener("mouseup", release);
  document.addEventListener("mouseleave", release);
})();
