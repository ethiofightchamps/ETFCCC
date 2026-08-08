// ── SEAT MAP (Circular Arena Layout with Section Tabs) ────────────────────
// Real ETFC venue layout — reduced capacity:
//   VVIP Ringside  — 26 seats  — 100,000 ETB  (2 rings × 13 seats)
//   VVIP Premium   — 26 seats  — 50,000 ETB   (2 rings × 13 seats)
//   VVIP Normal    — 26 seats  — 30,000 ETB   (2 rings × 13 seats)
//   VIP            — 52 seats  — 20,000 ETB   (4 rings × 13 seats)
//   Early Bird     — 13 seats  — 6,000 ETB    (1 ring × 13 seats)
//
// Ringside and VIP are small enough to pick an exact seat, so they get the
// clickable ring diagram below. Middle and Last Rows are general admission —
// 600 seats each is unusable as individual tap targets on any screen size,
// so those two always use a simple "how many seats" quantity stepper instead
// (same one the old mobile-only fallback used) and we auto-assign the best
// available seat behind the scenes.

// Radius values in SEAT_CONFIG were tuned assuming a ~1000px-wide arena (its
// CSS max-width). The arena is responsive (width:100%, aspect-ratio:1), so on
// a narrow phone it renders much smaller — without scaling, seats positioned
// with these raw pixel radii would sprawl far outside the tiny ring and pile
// up on whatever sits below it. --ring-scale corrects for that.
const REFERENCE_ARENA_WIDTH = 500;

function updateRingScale() {
  const arena = document.querySelector(".arena");
  if (!arena) return;
  const w = arena.clientWidth;
  const scale = Math.min(w / REFERENCE_ARENA_WIDTH, 2.2); // cap scale on huge screens
  arena.style.setProperty("--ring-scale", scale);
}

window.addEventListener("resize", () => {
  clearTimeout(window._ringScaleResizeTimer);
  window._ringScaleResizeTimer = setTimeout(updateRingScale, 100);
});

// Rendered as individual clickable seats in the ring diagram.
const SEAT_CONFIG = [
  {
    section: "VVIP Ringside",
    tier: "ringside",
    price: 100000,
    rings: 2,
    seatsPerRing: 13,
    radiusStart: 110,
    radiusStep: 28,
  },
  {
    section: "VVIP Premium",
    tier: "vip",
    price: 50000,
    rings: 2,
    seatsPerRing: 13,
    radiusStart: 175,
    radiusStep: 28,
  },
];

// General admission / stepper sections — quantity stepper only, no individual seat picking.
const GA_CONFIG = [
  {
    section: "VVIP Normal",
    tier: "vvip-normal",
    price: 30000,
    rings: 2,
    seatsPerRing: 13,
  },
  {
    section: "VIP",
    tier: "vip-std",
    price: 20000,
    rings: 4,
    seatsPerRing: 13,
  },
  {
    section: "Early Bird",
    tier: "ga",
    price: 6000,
    rings: 1,
    seatsPerRing: 13,
  },
];

const ALL_SECTIONS = [...SEAT_CONFIG, ...GA_CONFIG];

const SOLD_SEATS = new Set();
let selectedSeats = {};

// SOLD_SEATS used to just sit empty forever — nothing ever populated it from
// Firestore, so the map always showed every seat as available even after an
// admin approved an order and marked those seats "sold". Pull real status
// in before the first render.
async function loadSeatAvailability() {
  try {
    const snap = await db.collection("seatMap").get();
    snap.forEach((doc) => {
      const status = doc.data().status;
      if (status === "sold" || status === "pending") SOLD_SEATS.add(doc.id);
    });
  } catch (err) {
    console.warn("Could not load live seat availability:", err);
  }
}

function getSectionSeatIds(sec) {
  const ids = [];
  for (let r = 0; r < sec.rings; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    for (let s = 0; s < sec.seatsPerRing; s++) {
      ids.push(`${sec.section}-${rowLetter}-${s + 1}`);
    }
  }
  return ids;
}

function seatIdToEntry(seatId, sec) {
  const parts = seatId.split("-");
  const num = parts[parts.length - 1];
  const rowLetter = parts[parts.length - 2];
  return {
    section: sec.section,
    tier: sec.tier,
    price: sec.price,
    label: `${sec.section} ${rowLetter}${num}`,
  };
}

function renderSeatMap(sectionFilter = "all") {
  const mount = document.getElementById("seatMapMount");
  if (!mount) return;

  const sectionsToRender =
    sectionFilter === "all"
      ? SEAT_CONFIG
      : SEAT_CONFIG.filter((s) => s.section === sectionFilter);

  let html = `
    <div class="arena">
      <div class="ring-center">RING</div>
  `;

  sectionsToRender.forEach((sec) => {
    html += `<div class="seat-section" data-section="${sec.section}">`;
    if (sectionFilter !== "all") {
      html += `<div class="seat-section-label">${
        sec.section
      } — ${sec.price.toLocaleString()} ETB</div>`;
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

        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;

        const rotateDeg = angle + 90;

        html += `<div
          class="seat tier-${sec.tier} ${sold ? "sold" : ""}"
          data-seat-id="${seatId}"
          data-section="${sec.section}"
          data-tier="${sec.tier}"
          data-price="${sec.price}"
          data-label="${sec.section} ${rowLetter}${s + 1}"
          title="${sec.section} ${rowLetter}${
          s + 1
        } — ${sec.price.toLocaleString()} ETB"
          style="--tx: calc(${x.toFixed(
            1
          )}px * var(--ring-scale, 1)); --ty: calc(${y.toFixed(
          1
        )}px * var(--ring-scale, 1)); --rot: ${rotateDeg.toFixed(
          1
        )}deg; transform: translate(var(--tx), var(--ty)) rotate(var(--rot)); pointer-events: auto; width: calc(18px * var(--ring-scale, 1)); height: calc(18px * var(--ring-scale, 1));"
          onclick="${sold ? "" : `toggleSeat(this)`}"
        ></div>`;
      }

      html += `</div>`;
    }

    html += `</div></div>`;
  });

  html += `</div>`;
  mount.innerHTML = html;
  updateRingScale();
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

// ── General admission (Middle / Last Rows): quantity stepper only ────────
// 600 seats per section makes individual tap targets impractical on any
// screen size, so instead show one card per section with a quantity
// stepper — it auto-picks the next available seat(s) in that section
// behind the scenes, writing to the exact same selectedSeats object the
// Ringside/VIP click-map uses, so checkout/pricing/Firestore locking all
// work identically either way. ──────────────────────────────────────────
function idSafe(sectionName) {
  return sectionName.replace(/\s+/g, "");
}

function renderGaPicker() {
  const mount = document.getElementById("gaPickerMount");
  if (!mount) return;

  mount.innerHTML = GA_CONFIG.map((sec) => {
    const seatIds = getSectionSeatIds(sec);
    const selectedCount = seatIds.filter((id) => selectedSeats[id]).length;
    const availableCount = seatIds.filter(
      (id) => !SOLD_SEATS.has(id) && !selectedSeats[id]
    ).length;
    const key = idSafe(sec.section);

    return `
      <div class="tier-pick-card">
        <div class="tier-pick-info">
          <div class="tier-pick-name">${sec.section}</div>
          <div class="tier-pick-price">${sec.price.toLocaleString()} ETB / seat</div>
          <div class="tier-pick-avail" id="tierAvail-${key}">${availableCount} left</div>
        </div>
        <div class="tier-pick-stepper">
          <button type="button" onclick="adjustTierQty('${sec.section}', -1)" ${
      selectedCount === 0 ? "disabled" : ""
    } aria-label="Remove a ${sec.section} seat">&minus;</button>
          <span id="tierQty-${key}">${selectedCount}</span>
          <button type="button" onclick="adjustTierQty('${sec.section}', 1)" ${
      availableCount === 0 ? "disabled" : ""
    } aria-label="Add a ${sec.section} seat">+</button>
        </div>
      </div>`;
  }).join("");
}

function adjustTierQty(sectionName, delta) {
  const sec = GA_CONFIG.find((s) => s.section === sectionName);
  if (!sec) return;

  const seatIds = getSectionSeatIds(sec);

  if (delta > 0) {
    const nextId = seatIds.find(
      (id) => !SOLD_SEATS.has(id) && !selectedSeats[id]
    );
    if (!nextId) {
      if (typeof showToast === "function")
        showToast(`No more ${sectionName} seats available.`, "error");
      return;
    }
    selectedSeats[nextId] = seatIdToEntry(nextId, sec);
  } else {
    const currentIds = seatIds.filter((id) => selectedSeats[id]);
    const lastId = currentIds[currentIds.length - 1];
    if (lastId) delete selectedSeats[lastId];
  }

  renderGaPicker();
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

  panel.innerHTML = entries
    .map(
      ([id, s]) => `
    <div class="selection-item">
      <span>${s.label}</span>
      <span>${s.price.toLocaleString()} ETB</span>
    </div>
  `
    )
    .join("");

  const total = entries.reduce((sum, [, s]) => sum + s.price, 0);
  totalEl.style.display = "flex";
  totalEl.innerHTML = `<span>Total</span><span>${total.toLocaleString()} ETB</span>`;
  checkoutBtn.removeAttribute("disabled");
}

function proceedToCheckout() {
  if (Object.keys(selectedSeats).length === 0) return;
  const session = JSON.parse(localStorage.getItem("etfc_session") || "null");
  if (session) {
    const nameInput = document.getElementById("buyerNameInput");
    const phoneInput = document.getElementById("buyerPhoneInput");
    if (nameInput && !nameInput.value && session.name)
      nameInput.value = session.name;
    if (phoneInput && !phoneInput.value && session.phone)
      phoneInput.value = session.phone;
  }
  document.getElementById("seatStep").style.display = "none";
  document.getElementById("checkoutStep").style.display = "block";
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSeatAvailability();
  renderSeatMap("VVIP Ringside");
  const gaEl = document.getElementById("gaPickerMount");
  if (gaEl) gaEl.style.display = "none";
});
