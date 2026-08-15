// ── ETFC Venue Seat Map ───────────────────────────────────────────────────
// Uses the official venue map image (seatmap.png) as the visual.
// Clickable overlay zones are positioned over each block using percentage
// coordinates so they scale with the image on all screen sizes.

const BLOCK_PRICES = {
  H:             { label:"Block H",        tier:"vip",           price:20000  },
  I:             { label:"Block I",        tier:"vip",           price:20000  },
  B:             { label:"Block B",        tier:"vip",           price:20000  },
  C:             { label:"Block C",        tier:"vip",           price:20000  },
  D:             { label:"Block D",        tier:"vip",           price:20000  },
  E:             { label:"Block E",        tier:"vip",           price:20000  },
  VVIP_RINGSIDE: { label:"VVIP Ringside",  tier:"vvip_ringside", price:100000 },
  VVIP_PREMIUM:  { label:"VVIP Premium",   tier:"vvip_premium",  price:50000  },
  VVIP_NORMAL:   { label:"VVIP Normal",    tier:"vvip_normal",   price:30000  },
  EARLY_BIRD:    { label:"Early Bird",     tier:"early_bird",    price:6000   },
};

// Clickable zone positions as % of image width/height [left, top, width, height]
// Tuned to match the venue-map.png layout
const ZONES = [
  { id:"VVIP_RINGSIDE", left:29, top:26,  w:22, h:8  },
  { id:"VVIP_PREMIUM",  left:29, top:35,  w:22, h:6  },
  { id:"VVIP_NORMAL",   left:29, top:42,  w:22, h:6  },
  { id:"H",             left:4,  top:3,   w:43, h:24 },
  { id:"I",             left:52, top:3,   w:43, h:24 },
  { id:"B",             left:3,  top:65,  w:16, h:32 },
  { id:"C",             left:22, top:65,  w:22, h:32 },
  { id:"D",             left:47, top:65,  w:22, h:32 },
  { id:"E",             left:73, top:65,  w:23, h:32 },
  { id:"EARLY_BIRD",    left:10, top:92,  w:80, h:6  },
];

const SOLD_SEATS = new Set(["VVIP_NORMAL-344", "VVIP_NORMAL-345"]);
let selectedSeats  = {};
let blockQty       = {}; // how many seats selected per block

async function loadSeatAvailability() {
  try {
    const snap = await db.collection("seatMap").get();
    snap.forEach(doc => {
      const s = doc.data().status;
      if (s === "sold" || s === "pending") SOLD_SEATS.add(doc.id);
    });
  } catch(e) { console.warn("seat availability:", e); }
}

const TIER_COLORS = {
  vip:           "rgba(30,120,200,0.35)",
  vvip_ringside: "rgba(176,141,62,0.45)",
  vvip_premium:  "rgba(179,20,28,0.45)",
  vvip_normal:   "rgba(130,80,200,0.45)",
  early_bird:    "rgba(46,139,87,0.40)",
};
const TIER_COLORS_SEL = {
  vip:           "rgba(76,175,80,0.6)",
  vvip_ringside: "rgba(76,175,80,0.6)",
  vvip_premium:  "rgba(76,175,80,0.6)",
  vvip_normal:   "rgba(76,175,80,0.6)",
  early_bird:    "rgba(76,175,80,0.6)",
};

function renderSeatMap() {
  const wrap = document.getElementById("arenaWrap");
  if (!wrap) return;

  wrap.innerHTML = `
    <div id="venueMapWrap" style="position:relative;width:100%;max-width:860px;margin:0 auto;user-select:none;">
      <img src="../seatmap.png" alt="Venue Seat Map"
        style="width:100%;display:block;border-radius:8px;"
        id="venueMapImg"/>
      <div id="venueZones" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></div>
    </div>`;

  // Wait for image to load so we have natural dimensions
  const img = document.getElementById("venueMapImg");
  const buildZones = () => {
    const zoneWrap = document.getElementById("venueZones");
    zoneWrap.innerHTML = ZONES.map(z => {
      const blk = BLOCK_PRICES[z.id];
      const qty = blockQty[z.id] || 0;
      const tier = blk.tier;
      const bg = qty > 0 ? TIER_COLORS_SEL[tier] : TIER_COLORS[tier];
      const border = qty > 0 ? "2px solid #4caf50" : "1.5px solid rgba(255,255,255,0.25)";
      return `<div
        class="venue-zone"
        data-id="${z.id}"
        style="
          position:absolute;
          left:${z.left}%;top:${z.top}%;
          width:${z.w}%;height:${z.h}%;
          background:${bg};
          border:${border};
          border-radius:4px;
          cursor:pointer;
          pointer-events:auto;
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          transition:background 0.15s;
          box-sizing:border-box;
        "
        onclick="clickZone('${z.id}')"
        title="${blk.label} — ${blk.price.toLocaleString()} ETB per seat"
      >
        ${qty > 0
          ? `<span style="background:rgba(0,0,0,0.75);color:#4caf50;font-weight:700;font-size:clamp(9px,1.5vw,13px);padding:2px 6px;border-radius:4px;">×${qty}</span>`
          : `<span style="background:rgba(0,0,0,0.55);color:#fff;font-size:clamp(7px,1.2vw,11px);padding:1px 5px;border-radius:3px;text-align:center;">${blk.label}</span>`}
      </div>`;
    }).join("");
  };

  if (img.complete) buildZones();
  else img.addEventListener("load", buildZones);
}

function clickZone(blockId) {
  const blk = BLOCK_PRICES[blockId];

  // Show a mini picker modal for this block
  const existing = blockQty[blockId] || 0;

  // Create/show picker
  let picker = document.getElementById("zonePicker");
  if (!picker) {
    picker = document.createElement("div");
    picker.id = "zonePicker";
    picker.style.cssText = `
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      background:var(--obsidian-2,#111);border:1px solid var(--border,#333);
      border-radius:14px;padding:24px;z-index:9999;min-width:260px;
      box-shadow:0 20px 60px rgba(0,0,0,0.8);text-align:center;`;
    document.body.appendChild(picker);
  }

  picker.innerHTML = `
    <div style="font-family:var(--font-display);font-size:18px;text-transform:uppercase;margin-bottom:4px;">${blk.label}</div>
    <div style="color:var(--gold-bright,#c8960a);font-size:14px;margin-bottom:16px;">${blk.price.toLocaleString()} ETB / seat</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px;">
      <button onclick="adjustZoneQty('${blockId}',-1)"
        style="width:36px;height:36px;border-radius:50%;background:var(--obsidian,#1a1a1a);border:1px solid var(--border,#333);color:#fff;font-size:20px;cursor:pointer;line-height:1;">−</button>
      <span id="zonePickerQty" style="font-size:28px;font-weight:700;min-width:32px;">${existing}</span>
      <button onclick="adjustZoneQty('${blockId}',1)"
        style="width:36px;height:36px;border-radius:50%;background:var(--obsidian,#1a1a1a);border:1px solid var(--border,#333);color:#fff;font-size:20px;cursor:pointer;line-height:1;">+</button>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;">
      <button onclick="confirmZone('${blockId}')"
        class="btn btn-primary" style="flex:1;">Confirm</button>
      <button onclick="closeZonePicker()"
        class="btn btn-outline" style="flex:1;">Cancel</button>
    </div>`;

  // Backdrop
  let bd = document.getElementById("zonePickerBd");
  if (!bd) {
    bd = document.createElement("div");
    bd.id = "zonePickerBd";
    bd.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;";
    bd.onclick = closeZonePicker;
    document.body.appendChild(bd);
  }
  bd.style.display = "block";
  picker.style.display = "block";
}

function adjustZoneQty(blockId, delta) {
  const cur = parseInt(document.getElementById("zonePickerQty").textContent) || 0;
  const next = Math.max(0, cur + delta);
  document.getElementById("zonePickerQty").textContent = next;
}

function confirmZone(blockId) {
  const qty = parseInt(document.getElementById("zonePickerQty").textContent) || 0;
  const blk = BLOCK_PRICES[blockId];

  // Clear previous selections for this block
  Object.keys(selectedSeats).forEach(k => {
    if (k.startsWith(blockId + "-")) delete selectedSeats[k];
  });

  // Add new selections
  for (let i = 0; i < qty; i++) {
    const id = `${blockId}-${i+1}`;
    selectedSeats[id] = {
      section: blockId,
      tier: blk.tier,
      price: blk.price,
      label: `${blk.label} Seat ${i+1}`,
    };
  }

  blockQty[blockId] = qty;
  if (qty === 0) {
    Object.keys(selectedSeats).filter(k => k.startsWith(blockId+"-")).forEach(k => delete selectedSeats[k]);
  }

  closeZonePicker();
  renderSeatMap();
  renderSelectionPanel();
}

function closeZonePicker() {
  const p = document.getElementById("zonePicker");
  const b = document.getElementById("zonePickerBd");
  if (p) p.style.display = "none";
  if (b) b.style.display = "none";
}

function renderSelectionPanel() {
  const panel = document.getElementById("selectionPanelBody");
  const totalEl = document.getElementById("selectionTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const countEl = document.getElementById("seatmapSelectedCount");
  const totalEl2 = document.getElementById("seatmapSelectedTotal");
  const contBtn = document.getElementById("seatmapContinueBtn");

  const entries = Object.entries(selectedSeats);
  const total = entries.reduce((s,[,v]) => s+v.price, 0);

  if (countEl) countEl.textContent = entries.length;
  if (totalEl2) totalEl2.textContent = total.toLocaleString() + " ETB";
  if (contBtn) contBtn.disabled = entries.length === 0;

  if (!panel) return;
  if (entries.length === 0) {
    panel.innerHTML = `<p class="text-dim" style="font-size:13px;">No seats selected yet. Tap a block on the map.</p>`;
    if (totalEl) totalEl.style.display = "none";
    if (checkoutBtn) checkoutBtn.setAttribute("disabled","true");
    return;
  }

  // Group by block for cleaner display
  const grouped = {};
  entries.forEach(([,s]) => {
    if (!grouped[s.section]) grouped[s.section] = { label: BLOCK_PRICES[s.section]?.label || s.section, price: s.price, count: 0 };
    grouped[s.section].count++;
  });

  panel.innerHTML = Object.values(grouped).map(g =>
    `<div class="selection-item">
      <span>${g.label} ×${g.count}</span>
      <span>${(g.price * g.count).toLocaleString()} ETB</span>
    </div>`
  ).join("");

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

function goToCheckout() { proceedToCheckout(); }

document.addEventListener("DOMContentLoaded", async () => {
  await loadSeatAvailability();
  renderSeatMap();
});
