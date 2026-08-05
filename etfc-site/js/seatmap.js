// ── SEAT MAP ─────────────────────────────────────────────────────────────
// Real ETFC venue layout:
//   Ringside  — 100 seats  — 40,000 ETB  (2 rows × 50)
//   VIP       — 200 seats  — 9,000 ETB   (4 rows × 50)
//   Middle    — 600 seats  — 2,000 ETB   (6 rows × 100 → rendered as 2 blocks of 50)
//   Last Rows — 600 seats  — 1,500 ETB   (6 rows × 100 → rendered as 2 blocks of 50)
// Total: 1,500 seats

const SEAT_CONFIG = [
  { section: "Ringside",  tier: "ringside", price: 40000, rows: 2, seatsPerRow: 50 },
  { section: "VIP",       tier: "vip",      price: 9000,  rows: 4, seatsPerRow: 50 },
  { section: "Middle",    tier: "ga",       price: 2000,  rows: 6, seatsPerRow: 100 },
  { section: "Last Rows", tier: "ga",       price: 1500,  rows: 6, seatsPerRow: 100 },
];

const SOLD_SEATS = new Set();

let selectedSeats = {};

function renderSeatMap() {
  const mount = document.getElementById("seatMapMount");
  if (!mount) return;

  let html = `<div class="ring">RING</div>`;

  SEAT_CONFIG.forEach((sec) => {
    html += `<div class="seat-section">
      <div class="seat-section-label">${sec.section} — ${sec.price.toLocaleString()} ETB</div>`;
    for (let r = 0; r < sec.rows; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      html += `<div class="seat-row">`;
      for (let s = 1; s <= sec.seatsPerRow; s++) {
        const seatId = `${sec.section}-${rowLetter}-${s}`;
        const sold = SOLD_SEATS.has(seatId);
        html += `<div
          class="seat tier-${sec.tier} ${sold ? "sold" : ""}"
          data-seat-id="${seatId}"
          data-section="${sec.section}"
          data-tier="${sec.tier}"
          data-price="${sec.price}"
          data-label="${sec.section} ${rowLetter}${s}"
          title="${sec.section} ${rowLetter}${s} — ${sec.price.toLocaleString()} ETB"
          onclick="${sold ? "" : `toggleSeat(this)`}"
        ></div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
  });

  mount.innerHTML = html;
}

function toggleSeat(el) {
  const seatId = el.dataset.seatId;
  if (selectedSeats[seatId]) {
    delete selectedSeats[seatId];
    el.classList.remove("selected");
  } else {
    selectedSeats[seatId] = {
      section: el.dataset.section,
      tier: el.dataset.tier,
      price: Number(el.dataset.price),
      label: el.dataset.label,
    };
    el.classList.add("selected");
  }
  renderSelectionPanel();
}

function renderSelectionPanel() {
  const panel = document.getElementById("selectionPanelBody");
  const totalEl = document.getElementById("selectionTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (!panel) return;

  const entries = Object.entries(selectedSeats);
  if (entries.length === 0) {
    panel.innerHTML = `<p class="text-dim" style="font-size:13px;">No seats selected yet. Tap a seat on the map.</p>`;
    totalEl.style.display = "none";
    checkoutBtn.setAttribute("disabled", "true");
    return;
  }

  panel.innerHTML = entries.map(([id, s]) => `
    <div class="selection-item">
      <span>${s.label}</span>
      <span>${s.price.toLocaleString()} ETB</span>
    </div>
  `).join("");

  const total = entries.reduce((sum, [, s]) => sum + s.price, 0);
  totalEl.style.display = "flex";
  totalEl.innerHTML = `<span>Total</span><span>${total.toLocaleString()} ETB</span>`;
  checkoutBtn.removeAttribute("disabled");
}

function proceedToCheckout() {
  if (Object.keys(selectedSeats).length === 0) return;
  requireAuth("buyTicket", () => {
    const session = JSON.parse(localStorage.getItem("etfc_session") || "null");
    if (session) {
      const nameInput = document.getElementById("buyerNameInput");
      const phoneInput = document.getElementById("buyerPhoneInput");
      if (nameInput && !nameInput.value && session.name) nameInput.value = session.name;
      if (phoneInput && !phoneInput.value && session.phone) phoneInput.value = session.phone;
    }
    document.getElementById("seatStep").style.display = "none";
    document.getElementById("checkoutStep").style.display = "block";
  });
}

document.addEventListener("DOMContentLoaded", renderSeatMap);
