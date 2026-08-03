// ── COUNTDOWN TIMER ──────────────────────────────────────────────────────
// PLACEHOLDER date — replace with the real event date/time once confirmed.
const EVENT_DATE = new Date("2026-08-24T19:00:00+03:00").getTime();

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
    <div class="unit"><div class="num">${String(d).padStart(2, "0")}</div><div class="lbl">Days</div></div>
    <div class="unit"><div class="num">${String(h).padStart(2, "0")}</div><div class="lbl">Hrs</div></div>
    <div class="unit"><div class="num">${String(m).padStart(2, "0")}</div><div class="lbl">Min</div></div>
    <div class="unit"><div class="num">${String(s).padStart(2, "0")}</div><div class="lbl">Sec</div></div>
  `;
}
setInterval(tickCountdown, 1000);
document.addEventListener("DOMContentLoaded", tickCountdown);

// ── BUY TICKET / PLACE BET buttons anywhere on the site ──────────────────
// Usage: <button onclick="goToTickets()">Buy Ticket</button>
function goToTickets() {
  window.location.href = "tickets.html";
}
function goToBetting() {
  window.location.href = "betting.html";
}
