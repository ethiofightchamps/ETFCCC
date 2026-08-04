// ── SEAT MAP ─────────────────────────────────────────────────────────────
// PLACEHOLDER layout — replace SEAT_CONFIG with ETFC's real venue chart
// (rows, sections, capacity per section) once they send it.

const SEAT_CONFIG = [
  { section: "Ringside", tier: "ringside", price: 3500, rows: 2, seatsPerRow: 12 },
  { section: "VIP", tier: "vip", price: 1800, rows: 4, seatsPerRow: 16 },
  { section: "General Admission", tier: "ga", price: 600, rows: 6, seatsPerRow: 20 },
];

// TODO: replace with a live read from Firestore `seatMap` collection,
// so sold/locked seats reflect real purchase state.
const SOLD_SEATS = new Set(["Ringside-A-3", "Ringside-A-4", "VIP-B-10", "GA-C-1"]);

let selectedSeats = {}; // { seatId: { section, tier, price, label } }

function renderSeatMap() {
  const mount = document.getElementById("seatMapMount");
  if (!mount) return;

  let html = `<div class="ring">RING</div>`;

  SEAT_CONFIG.forEach((sec) => {
    html += `<div class="seat-section">
      <div class="seat-section-label">${sec.section} — ${sec.price} ETB</div>`;
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
          title="${sec.section} ${rowLetter}${s} — ${sec.price} ETB"
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
    // TODO: before locking client-side, run a Firestore transaction that
    // checks the seat is still unsold and writes a short-lived "locked" flag
    // so two buyers can't select the same seat simultaneously.
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
    // TODO: write a pending order doc to Firestore `orders` collection with
    // the selected seatIds, then reveal the bank-transfer + upload step.
    document.getElementById("seatStep").style.display = "none";
    document.getElementById("checkoutStep").style.display = "block";
  });
}

document.addEventListener("DOMContentLoaded", renderSeatMap);
