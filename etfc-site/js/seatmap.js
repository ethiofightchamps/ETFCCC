// ── ETFC Venue Seat Map ───────────────────────────────────────────────────
// Layout matches the official VIP Tickets venue map:
//   Block H  (top-left)   — VIP      — 20,000 ETB
//   Block I  (top-right)  — VIP      — 20,000 ETB
//   Block B  (bot-left)   — VIP      — 20,000 ETB
//   Block C  (bot-centre) — VIP      — 20,000 ETB
//   Block D  (bot-right)  — VIP      — 20,000 ETB
//   Block E  (far-right)  — VIP      — 20,000 ETB
//   VVIP Ringside         — VVIP     — 100,000 ETB
//   VVIP Premium          — VVIP     — 50,000 ETB
//   VVIP Normal           — VVIP     — 30,000 ETB
//   Early Bird            — GA       — 6,000 ETB

const PRICE = {
  vvip_ringside: 100000,
  vvip_premium:  50000,
  vvip_normal:   30000,
  vip:           20000,
  early_bird:    6000,
};

// Each block: array of rows, each row is array of seat labels
const BLOCKS = {
  H: {
    label: "Block H", tier: "vip", price: PRICE.vip,
    rows: [
      ["A02","A02","A03","A04","A05","A06","A07","A08","A09","A10"],
      ["101","102","101","102","103","104","105","106","107","108"],
      ["201","202","201","202","203","204","205","206","207","208"],
      ["301","302","301","302","303","304","305","306","307","308"],
      ["301","304","303","304","401","402","403","404","405","406","407","408"],
      ["401","402","403","404","501","502","503","504","505","506","507","508"],
      ["501","502","503","504","601","602","603","604","605","606","607","608"],
      ["601","602","603","604","701","702","703","704","705","706","707","708"],
      ["701","702","703","704"],
    ]
  },
  I: {
    label: "Block I", tier: "vip", price: PRICE.vip,
    rows: [
      ["A11","A12","A13","A14","A15","A16","A17","A18"],
      ["109","110","111","112","113","114","115","116"],
      ["209","210","211","212","213","214","215","216"],
      ["309","310","311","312","313","314","315","316"],
      ["409","410","411","412","413","414","415","416"],
      ["509","510","511","512","513","514","515","516"],
      ["609","610","611","612","613","614","615","616"],
      ["709","710","711","712","713","714","715","716"],
    ]
  },
  B: {
    label: "Block B", tier: "vip", price: PRICE.vip,
    rows: [
      ["201","202","203"],["204","205","206"],["207","208","209"],
      ["210","211","212"],["213","214","215"],["216","217","218"],
      ["219","220","221"],["222","223","224"],["225","226","227"],
      ["228","229","230"],["231","232"],["234","236"],
    ]
  },
  C: {
    label: "Block C", tier: "vip", price: PRICE.vip,
    rows: [
      ["A01","A02","A03","A04"],
      ["101","102","103","104","105"],
      ["201","202","203","204","205","206"],
      ["301","302","303","304","305","306","307"],
      ["401","402","403","404","405","406","407","408"],
      ["501","502","503","504","505","506","507","508","509"],
      ["601","602","603","604","605","606","607","608","609","610"],
      ["701","702","703","704","705","706","707","708","709","710","711"],
    ]
  },
  D: {
    label: "Block D", tier: "vip", price: PRICE.vip,
    rows: [
      ["A05","A06","A07","A08"],
      ["106","107","108","109","110"],
      ["207","208","209","210","211","212"],
      ["308","309","310","311","312","314"],
      ["409","410","411","412","413","414","416"],
      ["510","511","512","513","515","516","516","517"],
      ["611","612","613","614","615","616","617","618","619"],
      ["712","713","714","715","716","717","718","719","720","721"],
    ]
  },
  E: {
    label: "Block E", tier: "vip", price: PRICE.vip,
    rows: [
      ["204","205","206"],["214","215","216"],["224","225","226"],
      ["234","235","236"],["244","245","246"],["254","255","256"],
      ["265","266"],["274","275"],["284","285"],["294"],["306"],
    ]
  },
};

const VVIP_SECTIONS = [
  { id:"vvip_ringside", label:"VVIP Ringside", tier:"vvip_ringside", price:PRICE.vvip_ringside, count:26 },
  { id:"vvip_premium",  label:"VVIP Premium",  tier:"vvip_premium",  price:PRICE.vvip_premium,  count:26 },
  { id:"vvip_normal",   label:"VVIP Normal",   tier:"vvip_normal",   price:PRICE.vvip_normal,   count:26 },
];
const EARLY_BIRD = { id:"early_bird", label:"Early Bird", tier:"early_bird", price:PRICE.early_bird, count:13 };

const SOLD_SEATS = new Set();
let selectedSeats = {};

async function loadSeatAvailability() {
  try {
    const snap = await db.collection("seatMap").get();
    snap.forEach(doc => {
      const s = doc.data().status;
      if (s === "sold" || s === "pending") SOLD_SEATS.add(doc.id);
    });
  } catch(e) { console.warn("seat availability:", e); }
}

// ── Render the full venue map as SVG ─────────────────────────────────────
function renderSeatMap() {
  const wrap = document.getElementById("arenaWrap");
  if (!wrap) return;

  // Colours
  const C = {
    vip:           "#1e78c8",
    vvip_ringside: "#b08d3e",
    vvip_premium:  "#b3141c",
    vvip_normal:   "#8250c8",
    early_bird:    "#2e8b57",
    selected:      "#4caf50",
    sold:          "#333",
    ring:          "#1a2a5e",
    walkway:       "#1a3a6e",
    entrance:      "#6b1a1a",
    parking:       "#111",
    bg:            "none",
    label:         "#fff",
    seatStroke:    "rgba(255,255,255,0.15)",
  };

  // Helper: render a block of rows at position (ox,oy), cell size cw×ch
  function blockSeats(blockKey, ox, oy, cw=16, ch=14, gap=2) {
    const blk = BLOCKS[blockKey];
    let out = "";
    blk.rows.forEach((row, ri) => {
      row.forEach((seat, ci) => {
        const id = `${blockKey}-${seat}-${ri}-${ci}`;
        const sold = SOLD_SEATS.has(id);
        const sel  = !!selectedSeats[id];
        const fill = sel ? C.selected : sold ? C.sold : C[blk.tier];
        const x = ox + ci*(cw+gap);
        const y = oy + ri*(ch+gap);
        out += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="2"
          fill="${fill}" stroke="${C.seatStroke}" stroke-width="0.5"
          class="venue-seat" data-id="${id}" data-block="${blockKey}"
          data-seat="${seat}" data-price="${blk.price}" data-tier="${blk.tier}"
          data-label="${blk.label} ${seat}"
          style="cursor:${sold?'default':'pointer'}"
          onclick="${sold?'':` toggleVenueSeat(this)`}">
          <title>${blk.label} · ${seat} · ${blk.price.toLocaleString()} ETB</title>
        </rect>`;
      });
    });
    return out;
  }

  // Helper: VVIP block (simple grid of count seats)
  function vvipBlock(sec, ox, oy, cols=13, cw=14, ch=12, gap=2) {
    let out = "";
    for(let i=0;i<sec.count;i++){
      const id = `${sec.id}-${i+1}`;
      const sold = SOLD_SEATS.has(id);
      const sel  = !!selectedSeats[id];
      const fill = sel ? C.selected : sold ? C.sold : C[sec.tier];
      const x = ox + (i%cols)*(cw+gap);
      const y = oy + Math.floor(i/cols)*(ch+gap);
      out += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="2"
        fill="${fill}" stroke="${C.seatStroke}" stroke-width="0.5"
        class="venue-seat" data-id="${id}" data-block="${sec.id}"
        data-seat="${i+1}" data-price="${sec.price}" data-tier="${sec.tier}"
        data-label="${sec.label} ${i+1}"
        style="cursor:${sold?'default':'pointer'}"
        onclick="${sold?'':` toggleVenueSeat(this)`}">
        <title>${sec.label} · Seat ${i+1} · ${sec.price.toLocaleString()} ETB</title>
      </rect>`;
    }
    return out;
  }

  const W=860, H=820;

  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;max-width:${W}px;display:block;font-family:sans-serif;">

    <!-- Background -->
    <rect width="${W}" height="${H}" fill="#0d0d0d" rx="8"/>

    <!-- ── TOP SECTION: Block H (left) + Block I (right) ── -->
    <text x="220" y="22" text-anchor="middle" font-size="11" fill="${C.label}" font-weight="bold" letter-spacing="2">BLOCK H</text>
    <text x="620" y="22" text-anchor="middle" font-size="11" fill="${C.label}" font-weight="bold" letter-spacing="2">BLOCK I</text>
    <text x="${W/2}" y="22" text-anchor="middle" font-size="9" fill="${C.walkway}" letter-spacing="3">VIP SEATS</text>

    ${blockSeats("H", 30, 28)}
    ${blockSeats("I", 430, 28)}

    <!-- Walkway top -->
    <rect x="30" y="175" width="800" height="14" rx="3" fill="${C.walkway}" opacity="0.6"/>
    <text x="${W/2}" y="185" text-anchor="middle" font-size="8" fill="#aac" letter-spacing="3">WALKWAY</text>

    <!-- ── MIDDLE SECTION ── -->
    <!-- VIP Parking (left-centre) -->
    <rect x="30" y="196" width="120" height="180" rx="4" fill="${C.parking}" stroke="#333" stroke-width="1"/>
    <rect x="155" y="196" width="30" height="180" rx="4" fill="${C.parking}" stroke="#333" stroke-width="1"/>
    <rect x="190" y="196" width="30" height="180" rx="4" fill="${C.parking}" stroke="#333" stroke-width="1"/>
    <rect x="225" y="196" width="30" height="180" rx="4" fill="${C.parking}" stroke="#333" stroke-width="1"/>
    <rect x="260" y="196" width="120" height="80" rx="4" fill="#1a1a1a" stroke="#444" stroke-width="1"/>
    <text x="320" y="230" text-anchor="middle" font-size="9" fill="#888" font-weight="bold">VIP PARKING</text>
    <text x="320" y="245" text-anchor="middle" font-size="9" fill="#666">PRIVATE</text>

    <!-- Entrance -->
    <rect x="30" y="380" width="250" height="50" rx="4" fill="${C.entrance}"/>
    <text x="155" y="410" text-anchor="middle" font-size="13" fill="#fff" font-weight="bold" letter-spacing="2">ENTRANCE</text>

    <!-- VVIP Ringside + Premium area label -->
    <rect x="260" y="280" width="120" height="150" rx="4" fill="#1a1a1a" stroke="#b08d3e" stroke-width="1"/>
    <text x="320" y="330" text-anchor="middle" font-size="8" fill="${C.vvip_ringside}" font-weight="bold">VVIP RING</text>
    <text x="320" y="343" text-anchor="middle" font-size="8" fill="${C.vvip_ringside}" font-weight="bold">SIDE &amp;</text>
    <text x="320" y="356" text-anchor="middle" font-size="8" fill="${C.vvip_ringside}" font-weight="bold">PREMIUM</text>

    <!-- VVIP seats around ring (top + bottom of ring) -->
    ${vvipBlock(VVIP_SECTIONS[0], 400, 200, 13, 14, 12, 2)}
    ${vvipBlock(VVIP_SECTIONS[1], 400, 230, 13, 14, 12, 2)}
    ${vvipBlock(VVIP_SECTIONS[2], 400, 260, 13, 14, 12, 2)}

    <!-- RING -->
    <rect x="395" y="195" width="410" height="310" rx="6" fill="#0a0f2a" stroke="#b08d3e" stroke-width="1" opacity="0.3"/>
    <rect x="430" y="215" width="340" height="270" rx="4" fill="${C.ring}" opacity="0.9"/>
    <rect x="445" y="228" width="310" height="244" rx="3" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <rect x="460" y="240" width="280" height="220" rx="2" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="600" y="360" text-anchor="middle" dominant-baseline="middle"
      font-family="Anton,sans-serif" font-size="32" fill="#fff" opacity="0.9"
      letter-spacing="6">RING</text>

    <!-- Walkways beside ring -->
    <rect x="388" y="195" width="8" height="310" rx="2" fill="${C.walkway}" opacity="0.5"/>
    <text x="384" y="355" text-anchor="middle" font-size="7" fill="#aac" letter-spacing="1"
      transform="rotate(-90,384,355)">WALKWAY</text>
    <rect x="776" y="195" width="8" height="310" rx="2" fill="${C.walkway}" opacity="0.5"/>
    <text x="780" y="355" text-anchor="middle" font-size="7" fill="#aac" letter-spacing="1"
      transform="rotate(90,780,355)">WALKWAY</text>

    <!-- ── BOTTOM SECTION walkway ── -->
    <rect x="30" y="510" width="360" height="12" rx="3" fill="${C.walkway}" opacity="0.6"/>
    <text x="210" y="519" text-anchor="middle" font-size="7" fill="#aac" letter-spacing="2">WALKWAY</text>
    <rect x="620" y="510" width="210" height="12" rx="3" fill="${C.walkway}" opacity="0.6"/>
    <text x="725" y="519" text-anchor="middle" font-size="7" fill="#aac" letter-spacing="2">WALKWAY</text>

    <!-- Block B (bottom-left) -->
    <text x="80" y="535" text-anchor="middle" font-size="10" fill="${C.label}" font-weight="bold" letter-spacing="1">BLOCK B</text>
    ${blockSeats("B", 30, 540, 16, 13, 2)}

    <!-- Block C (bottom-centre-left) -->
    <text x="270" y="535" text-anchor="middle" font-size="10" fill="${C.label}" font-weight="bold" letter-spacing="1">BLOCK C</text>
    ${blockSeats("C", 200, 540, 16, 13, 2)}

    <!-- Block D (bottom-centre-right) -->
    <text x="520" y="535" text-anchor="middle" font-size="10" fill="${C.label}" font-weight="bold" letter-spacing="1">BLOCK D</text>
    ${blockSeats("D", 420, 540, 16, 13, 2)}

    <!-- Block E (bottom-right) -->
    <text x="750" y="535" text-anchor="middle" font-size="10" fill="${C.label}" font-weight="bold" letter-spacing="1">BLOCK E</text>
    ${blockSeats("E", 700, 540, 16, 13, 2)}

    <!-- Early Bird -->
    <text x="${W/2}" y="770" text-anchor="middle" font-size="9" fill="${C.early_bird}" font-weight="bold" letter-spacing="1">EARLY BIRD GENERAL ADMISSION</text>
    ${vvipBlock(EARLY_BIRD, 330, 775, 13, 14, 12, 2)}

    <!-- Bottom label -->
    <text x="130" y="${H-8}" text-anchor="middle" font-size="8" fill="#666" letter-spacing="2">VIP SEATS</text>
    <text x="600" y="${H-8}" text-anchor="middle" font-size="8" fill="#666" letter-spacing="2">VIP SEATS</text>

    <!-- ── LEGEND ── -->
    <g transform="translate(${W-130}, 200)">
      <rect width="120" height="130" rx="6" fill="rgba(0,0,0,0.7)" stroke="#333" stroke-width="1"/>
      <circle cx="14" cy="20" r="5" fill="${C.vvip_ringside}"/>
      <text x="24" y="24" font-size="9" fill="#ccc">VVIP Ringside</text>
      <circle cx="14" cy="38" r="5" fill="${C.vvip_premium}"/>
      <text x="24" y="42" font-size="9" fill="#ccc">VVIP Premium</text>
      <circle cx="14" cy="56" r="5" fill="${C.vvip_normal}"/>
      <text x="24" y="60" font-size="9" fill="#ccc">VVIP Normal</text>
      <circle cx="14" cy="74" r="5" fill="${C.vip}"/>
      <text x="24" y="78" font-size="9" fill="#ccc">VIP</text>
      <circle cx="14" cy="92" r="5" fill="${C.early_bird}"/>
      <text x="24" y="96" font-size="9" fill="#ccc">Early Bird</text>
      <circle cx="14" cy="110" r="5" fill="${C.selected}"/>
      <text x="24" y="114" font-size="9" fill="#ccc">Selected</text>
      <circle cx="14" cy="128" r="5" fill="${C.sold}"/>
      <text x="24" y="132" font-size="9" fill="#ccc">Sold</text>
    </g>
  </svg>`;

  wrap.innerHTML = svg;

  // Attach click listeners (SVG onclick in string form for inline safety)
  wrap.querySelectorAll(".venue-seat").forEach(el => {
    el.addEventListener("click", () => toggleVenueSeat(el));
  });
}

function toggleVenueSeat(el) {
  const id     = el.dataset.id;
  const price  = Number(el.dataset.price);
  const tier   = el.dataset.tier;
  const label  = el.dataset.label;

  if (SOLD_SEATS.has(id)) return;

  if (selectedSeats[id]) {
    delete selectedSeats[id];
    el.setAttribute("fill", tierColor(tier));
  } else {
    selectedSeats[id] = { section: el.dataset.block, tier, price, label };
    el.setAttribute("fill", "#4caf50");
  }
  updateSelectedBar();
}

function tierColor(tier) {
  const map = {
    vvip_ringside:"#b08d3e", vvip_premium:"#b3141c",
    vvip_normal:"#8250c8", vip:"#1e78c8",
    early_bird:"#2e8b57",
  };
  return map[tier] || "#1e78c8";
}

function updateSelectedBar() {
  const entries = Object.entries(selectedSeats);
  const count = entries.length;
  const total = entries.reduce((s,[,v]) => s+v.price, 0);

  const countEl = document.getElementById("seatmapSelectedCount");
  const totalEl = document.getElementById("seatmapSelectedTotal");
  const btn     = document.getElementById("seatmapContinueBtn");

  if (countEl) countEl.textContent = count;
  if (totalEl) totalEl.textContent = total.toLocaleString() + " ETB";
  if (btn) btn.disabled = count === 0;

  // Also keep legacy panel in sync
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
    if (totalEl) totalEl.style.display = "none";
    if (checkoutBtn) checkoutBtn.setAttribute("disabled","true");
    return;
  }

  panel.innerHTML = entries.map(([,s]) =>
    `<div class="selection-item"><span>${s.label}</span><span>${s.price.toLocaleString()} ETB</span></div>`
  ).join("");

  const total = entries.reduce((sum,[,s]) => sum+s.price, 0);
  if (totalEl) { totalEl.style.display="flex"; totalEl.innerHTML=`<span>Total</span><span>${total.toLocaleString()} ETB</span>`; }
  if (checkoutBtn) checkoutBtn.removeAttribute("disabled");
}

function proceedToCheckout() {
  if (Object.keys(selectedSeats).length === 0) return;
  const session = JSON.parse(localStorage.getItem("etfc_session")||"null");
  if (session) {
    const n = document.getElementById("buyerNameInput");
    const p = document.getElementById("buyerPhoneInput");
    if (n && !n.value && session.name) n.value = session.name;
    if (p && !p.value && session.phone) p.value = session.phone;
  }
  document.getElementById("seatStep").style.display = "none";
  document.getElementById("checkoutStep").style.display = "block";
}

// goToCheckout used by seatmap modal Continue button
function goToCheckout() { proceedToCheckout(); }

document.addEventListener("DOMContentLoaded", async () => {
  await loadSeatAvailability();
  renderSeatMap();
});
