// ── SEAT MAP (Circular Arena Layout with Section Tabs) ────────────────────
// Real ETFC venue layout — 1,500 seats in concentric rings around the ring:
//   Ringside  — 100 seats  — 40,000 ETB  (2 rings × 50 seats)
//   VIP       — 200 seats  — 9,000 ETB   (4 rings × 50 seats)
//   Middle    — 600 seats  — 2,000 ETB   (6 rings × 100 seats)
//   Last Rows — 600 seats  — 1,500 ETB   (6 rings × 100 seats)

const SEAT_CONFIG = [
  { section: "Ringside",  tier: "ringside", price: 40000, rings: 2, seatsPerRing: 50, radiusStart: 110, radiusStep: 35 },
  { section: "VIP",       tier: "vip",      price: 9000,  rings: 4, seatsPerRing: 50, radiusStart: 180, radiusStep: 35 },
  { section: "Middle",    tier: "ga",       price: 2000,  rings: 6, seatsPerRing: 100, radiusStart: 320, radiusStep: 32 },
  { section: "Last Rows", tier: "ga",       price: 1500,  rings: 6, seatsPerRing: 100, radiusStart: 512, radiusStep: 32 },
];

const SOLD_SEATS = new Set();
let selectedSeats = {};

function renderSeatMap(sectionFilter = "all") {
  const mount = document.getElementById("seatMapMount");
  if (!mount) return;

  const sectionsToRender = sectionFilter === "all"
    ? SEAT_CONFIG
    : SEAT_CONFIG.filter(s => s.section === sectionFilter);

  let html = `
    <div class="arena">
      <div class="ring-center">RING</div>
  `;

  sectionsToRender.forEach((sec) => {
    html += `<div class="seat-section" data-section="${sec.section}">`;
    if (sectionFilter === "all") {
      html += `<div class="seat-section-label">${sec.section} — ${sec.price.toLocaleString()} ETB</div>`;
    }
    html += `<div class="seat-rings">`;

    for (let r = 0; r < sec.rings; r++) {
      const radius = sec.radiusStart + r * sec.radiusStep;
      const rowLetter = String.fromCharCode(65 + r);
      const seatsPerRing = sec.seatsPerRing;
      const angleStep = 360 / seatsPerRing;
      const startAngle = -90;

      html += `<div class="seat-ring" style="--ring-radius: ${radius}px;">`;

      for (let s = 0; s < seatsPerRing; s++) {
        const angle = startAngle + s * angleStep;
        const seatId = `${sec.section}-${rowLetter}-${s + 1}`;
        const sold = SOLD_SEATS.has(seatId);

        const x = Math.cos(angle * Math.PI / 180) * radius;
        const y = Math.sin(angle * Math.PI / 180) * radius;

        const rotateDeg = angle + 90;

        html += `<div
          class="seat tier-${sec.tier} ${sold ? "sold" : ""}"
          data-seat-id="${seatId}"
          data-section="${sec.section}"
          data-tier="${sec.tier}"
          data-price="${sec.price}"
          data-label="${sec.section} ${rowLetter}${s + 1}"
          title="${sec.section} ${rowLetter}${s + 1} — ${sec.price.toLocaleString()} ETB"
          style="transform: translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rotateDeg.toFixed(1)}deg);"
          onclick="${sold ? "" : `toggleSeat(this)`}"
        ></div>`;
      }

      html += `</div>`;
    }

    html += `</div></div>`;
  });

  html += `</div>`;
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

document.addEventListener("DOMContentLoaded", () => renderSeatMap("all"));