// ── SEAT MAP ─────────────────────────────────────────────────────────────
// PLACEHOLDER layout — replace SEAT_CONFIG with ETFC's real venue chart
// (rows, sections, capacity per section) once they send it.
//
// Seat STATUS (pending/sold/available) is read LIVE from Firestore's
// `seatMap` collection via a real-time listener (onSnapshot) — this is what
// makes the grid grey out instantly for every visitor the moment someone
// else locks or buys a seat, without anyone needing to refresh the page.
// The actual locking logic lives server-side in api/create-order.js — this
// file only ever displays state, it never decides who "wins" a seat.

const SEAT_CONFIG = [
  { section: "Ringside", tier: "ringside", price: 3500, rows: 2, seatsPerRow: 12 },
  { section: "VIP", tier: "vip", price: 1800, rows: 4, seatsPerRow: 16 },
  { section: "General Admission", tier: "ga", price: 600, rows: 6, seatsPerRow: 20 },
];

let selectedSeats = {}; // { seatId: { section, tier, price, label } }
let liveSeatStatus = {}; // { seatId: "pending" | "sold" }  — populated by the listener below
let seatListenerUnsubscribe = null;

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
        const liveStatus = liveSeatStatus[seatId]; // undefined = available
        const taken = liveStatus === "pending" || liveStatus === "sold";
        const isSelected = !!selectedSeats[seatId];

        html += `<div
          class="seat tier-${sec.tier} ${taken ? "sold" : ""} ${isSelected ? "selected" : ""}"
          data-seat-id="${seatId}"
          data-section="${sec.section}"
          data-tier="${sec.tier}"
          data-price="${sec.price}"
          data-label="${sec.section} ${rowLetter}${s}"
          title="${sec.section} ${rowLetter}${s} — ${sec.price} ETB${taken ? " (taken)" : ""}"
          onclick="${taken ? "" : `toggleSeat(this)`}"
        ></div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
  });

  mount.innerHTML = html;
}

// Real-time listener — fires immediately with current state, then again
// every time any seat's status changes anywhere (another buyer checking
// out, admin approving/rejecting/releasing). Re-renders the map each time.
function startSeatListener() {
  if (typeof db === "undefined") {
    console.error("Firestore `db` not available — check firebase-config.js load order.");
    return;
  }
  if (seatListenerUnsubscribe) return; // already listening

  seatListenerUnsubscribe = db.collection("seatMap").onSnapshot(
    (snapshot) => {
      const next = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === "pending" || data.status === "sold") {
          next[doc.id] = data.status;
        }
      });
      liveSeatStatus = next;

      // If a seat the user had selected just got taken by someone else
      // (race condition), drop it from their selection automatically.
      Object.keys(selectedSeats).forEach((seatId) => {
        if (liveSeatStatus[seatId]) delete selectedSeats[seatId];
      });

      renderSeatMap();
      renderSelectionPanel();
    },
    (err) => {
      console.error("Seat map live listener failed:", err);
    }
  );
}

function toggleSeat(el) {
  const seatId = el.dataset.seatId;

  if (liveSeatStatus[seatId]) return; // safety net — taken seats aren't clickable anyway

  if (selectedSeats[seatId]) {
    delete selectedSeats[seatId];
  } else {
    selectedSeats[seatId] = {
      section: el.dataset.section,
      tier: el.dataset.tier,
      price: Number(el.dataset.price),
      label: el.dataset.label,
    };
  }
  renderSeatMap();
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
    document.getElementById("seatStep").style.display = "none";
    document.getElementById("checkoutStep").style.display = "block";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderSeatMap(); // instant paint with "all available" so the grid isn't blank
  startSeatListener(); // then swap in live status as soon as Firestore responds
});
