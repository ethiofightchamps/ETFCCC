// ── ETFC AMHARIC / ENGLISH TRANSLATIONS ──────────────────────────────────────
// Usage: add data-i18n="key" to any element. The text content will be swapped
// when the user toggles language. Persists in localStorage as "etfc_lang".

const TRANSLATIONS = {
  // ── NAV ──────────────────────────────────────────────────────────────────
  "nav.fight-card":   { en: "Fight Card",   am: "የትግል ዝርዝር" },
  "nav.betting":      { en: "Betting",       am: "ውርርድ" },
  "nav.tickets":      { en: "Tickets",       am: "ትኬቶች" },
  "nav.merch":        { en: "Merch",         am: "ምርቶች" },
  "nav.about":        { en: "About",         am: "ስለ እኛ" },
  "nav.login":        { en: "Log In",        am: "ግባ" },
  "nav.signup":       { en: "Sign Up",       am: "ተመዝገብ" },
  "nav.logout":       { en: "Log Out",       am: "ውጣ" },
  "nav.my-tickets":   { en: "My Tickets",    am: "የኔ ትኬቶች" },
  "nav.get-tickets":  { en: "Get Tickets",   am: "ትኬት ግዛ" },

  // ── INDEX / HERO ──────────────────────────────────────────────────────────
  "hero.eyebrow":     { en: "ETFC Fight Night · Heavyweight Bout", am: "ETFC የትግል ምሽት · ሄቪዌይት ድብድብ" },
  "hero.vs":          { en: "VS",            am: "VS" },
  "hero.sub":         { en: "Main Event · MMA", am: "ዋና ዝግጅት · MMA" },
  "hero.cta-tickets": { en: "Get Your Tickets", am: "ትኬቶችዎን ያግኙ" },
  "hero.cta-bet":     { en: "View Odds & Bet",  am: "ዕድሎችን ይመልከቱ እና ይወርዱ" },
  "hero.cta-card":    { en: "Full Fight Card",   am: "ሙሉ የትግል ዝርዝር" },

  // ── FIGHT CARD ────────────────────────────────────────────────────────────
  "fc.eyebrow":       { en: "Fight Night · Main Event",  am: "የትግል ምሽት · ዋና ዝግጅት" },
  "fc.title":         { en: "Fight Card",                am: "የትግል ዝርዝር" },
  "fc.bout":          { en: "Bout",                      am: "ድብድብ" },
  "fc.main-event":    { en: "Main Event",                am: "ዋና ዝግጅት" },
  "fc.co-main":       { en: "Co-Main Event",             am: "ሁለተኛ ዝግጅት" },
  "fc.prelim":        { en: "Preliminary",               am: "ቅድመ ዝግጅት" },
  "fc.vs":            { en: "VS",                        am: "VS" },

  // ── TICKETS ───────────────────────────────────────────────────────────────
  "tix.title":          { en: "Get Tickets",             am: "ትኬት ግዛ" },
  "tix.event-name":     { en: "ETFC Adwa Fight Night",   am: "ETFC አድዋ የትግል ምሽት" },
  "tix.event-meta":     { en: "August 27, 2026 · 6:00 PM · Adwa Memorial Museum", am: "ነሐሴ 27, 2026 · 6:00 ምሽት · አድዋ መታሰቢያ ሙዚየም" },
  "tix.vvip-ringside":  { en: "VVIP Ringside Tickets",   am: "VVIP ሪንግሳይድ ትኬቶች" },
  "tix.vvip-premium":   { en: "VVIP Premium Tickets",    am: "VVIP ፕሪሚየም ትኬቶች" },
  "tix.vvip-normal":    { en: "VVIP Normal Tickets",     am: "VVIP መደበኛ ትኬቶች" },
  "tix.vip":            { en: "VIP Tickets",             am: "VIP ትኬቶች" },
  "tix.early-bird":     { en: "Early Bird Tickets",      am: "አርሊ በርድ ትኬቶች" },
  "tix.includes-seat":  { en: "Includes seat selection", am: "የወንበር ምርጫ ያካትታል" },
  "tix.no-seatmap":     { en: "General admission · No seat map", am: "ጠቅላላ መግቢያ · ምንም የወንበር ካርታ የለም" },
  "tix.continue":       { en: "Continue",                am: "ቀጥል" },
  "tix.select-seat":    { en: "Select Your Seat",        am: "ወንበርዎን ይምረጡ" },
  "tix.checkout":       { en: "Checkout",                am: "ክፍያ" },
  "tix.payment-method": { en: "Payment Method",          am: "የክፍያ ዘዴ" },
  "tix.full-name":      { en: "Full Name",               am: "ሙሉ ስም" },
  "tix.phone":          { en: "Phone Number",            am: "ስልክ ቁጥር" },
  "tix.email-opt":      { en: "Email (optional — for order confirmation)", am: "ኢሜይል (አማራጭ — ለትዕዛዝ ማረጋገጫ)" },
  "tix.screenshot":     { en: "Payment Screenshot",      am: "የክፍያ ስክሪንሾት" },
  "tix.screenshot-tap": { en: "Tap to upload proof of payment", am: "የክፍያ ማስረጃ ለመጫን ይጫኑ" },
  "tix.screenshot-hint":{ en: "Max 5MB · JPG/PNG",       am: "ከ5MB ያልበለጠ · JPG/PNG" },
  "tix.complete":       { en: "Complete Purchase",        am: "ግዢውን አጠናቅቅ" },
  "tix.subtotal":       { en: "Subtotal",                am: "ንዑስ ድምር" },
  "tix.promo":          { en: "Add Promo Code",          am: "የፕሮሞ ኮድ ያክሉ" },
  "tix.total":          { en: "Estimated Total",         am: "የተቀመጠ ጠቅላላ" },
  "tix.tac":            { en: "Terms and Conditions accepted", am: "ውሎች እና ሁኔታዎች ተቀብለዋል" },
  "tix.order-submitted":{ en: "Order Submitted",         am: "ትዕዛዝ ተልኳል" },
  "tix.pending":        { en: "Pending Verification",    am: "ማረጋገጫ በመጠባበቅ ላይ" },
  "tix.pending-msg":    { en: "ETFC is reviewing your payment — usually within a few hours. Keep this page open to see your ticket the moment it's approved.", am: "ETFC ክፍያዎን እየፈተሸ ነው — ብዙውን ጊዜ ከጥቂት ሰዓታት ውስጥ። ትኬትዎ ሲፈቀድ ወዲያውኑ ለማየት ይህን ገጽ ክፍት ያቆዩ።" },
  "tix.buy-more":       { en: "+ Buy More Tickets",      am: "+ ተጨማሪ ትኬቶች ግዛ" },
  "tix.account-name":   { en: "Account Name",           am: "የሂሳብ ስም" },
  "tix.ref-code":       { en: "Reference Code",         am: "የማጣቀሻ ኮድ" },
  "tix.send-exact":     { en: "Send the exact amount to the number above and include the reference code in your transfer note.", am: "ትክክለኛውን መጠን ወደ ላይኛው ቁጥር ይላኩ እና የማጣቀሻ ኮዱን በዝውውር ማስታወሻዎ ውስጥ ያካትቱ።" },
  "tix.tickets-label":  { en: "Tickets",                am: "ትኬቶች" },
  "tix.back":           { en: "Back",                   am: "ተመለስ" },
  "tix.seats":          { en: "seats",                  am: "ወንበሮች" },
  "tix.ticket":         { en: "ticket",                 am: "ትኬት" },

  // ── BETTING ───────────────────────────────────────────────────────────────
  "bet.title":          { en: "Betting",                am: "ውርርድ" },
  "bet.place":          { en: "Place Your Bet",         am: "ውርርድዎን ያስቀምጡ" },
  "bet.stake":          { en: "Stake Amount (ETB)",     am: "የውርርድ መጠን (ብር)" },
  "bet.potential":      { en: "Potential Win",          am: "ሊኖር የሚችል ድል" },
  "bet.full-name":      { en: "Full Name",              am: "ሙሉ ስም" },
  "bet.phone":          { en: "Phone Number",           am: "ስልክ ቁጥር" },
  "bet.email-opt":      { en: "Email (optional)",       am: "ኢሜይል (አማራጭ)" },
  "bet.payment":        { en: "Payment Method",         am: "የክፍያ ዘዴ" },
  "bet.screenshot":     { en: "Upload Payment Screenshot", am: "የክፍያ ስክሪንሾት ይጫኑ" },
  "bet.submit":         { en: "Submit Bet",             am: "ውርርዱን አስገባ" },
  "bet.my-bets":        { en: "My Bets",               am: "የኔ ውርርዶች" },
  "bet.odds":           { en: "Odds",                   am: "ዕድሎች" },
  "bet.win":            { en: "Win",                    am: "አሸንፍ" },

  // ── MERCH ─────────────────────────────────────────────────────────────────
  "merch.title":        { en: "ETFC Merch",             am: "ETFC ምርቶች" },
  "merch.eyebrow":      { en: "Official ETFC Store",    am: "ይፋዊ ETFC መደብር" },
  "merch.sub":          { en: "Rep the fight. Limited drop live now.", am: "ትግሉን ወክሉ። ውስን ምርቶች አሁን ይገኛሉ።" },
  "merch.offer-banner": { en: "5-Day Launch Offer — Up to 50% Off — Ends Soon", am: "5-ቀን ማስጀመሪያ ቅናሽ — እስከ 50% ቅናሽ — በቅርቡ ያበቃል" },
  "merch.collection":   { en: "Fight Night 2026 Collection", am: "2026 የትግል ምሽት ስብስብ" },
  "merch.buy":          { en: "Buy",                    am: "ግዛ" },
  "merch.buy-now":      { en: "Buy Now",                am: "አሁን ግዛ" },
  "merch.cancel":       { en: "Cancel",                 am: "ሰርዝ" },
  "merch.color":        { en: "Color",                  am: "ቀለም" },
  "merch.size":         { en: "Size",                   am: "መጠን" },
  "merch.quantity":     { en: "Quantity",               am: "ብዛት" },
  "merch.total":        { en: "Total",                  am: "ጠቅላላ" },
  "merch.checkout":     { en: "Checkout",               am: "ክፍያ" },
  "merch.summary":      { en: "Order Summary",          am: "የትዕዛዝ ማጠቃለያ" },
  "merch.payment":      { en: "Payment Details",        am: "የክፍያ ዝርዝሮች" },
  "merch.your-details": { en: "Your Details",           am: "የእርስዎ ዝርዝሮች" },
  "merch.proof":        { en: "Proof of Payment",       am: "የክፍያ ማስረጃ" },
  "merch.upload":       { en: "Tap to upload payment screenshot", am: "የክፍያ ስክሪንሾት ለመጫን ይጫኑ" },
  "merch.full-name":    { en: "Full Name",              am: "ሙሉ ስም" },
  "merch.phone":        { en: "Phone Number",           am: "ስልክ ቁጥር" },
  "merch.email-opt":    { en: "Email (optional)",       am: "ኢሜይል (አማራጭ)" },
  "merch.submit":       { en: "Submit Order",           am: "ትዕዛዙን አስገባ" },
  "merch.submitted":    { en: "Order Submitted!",       am: "ትዕዛዝ ተልኳል!" },
  "merch.pending":      { en: "Pending Verification",   am: "ማረጋገጫ በመጠባበቅ ላይ" },
  "merch.done":         { en: "Done",                   am: "ተጠናቀቀ" },
  "merch.in-stock":     { en: "in stock",               am: "በክምችት" },
  "merch.account-name":{ en: "Account Name",           am: "የሂሳብ ስም" },
  "merch.number":       { en: "Number",                 am: "ቁጥር" },
  "merch.ref":          { en: "Reference Code",         am: "የማጣቀሻ ኮድ" },
  "merch.hint":         { en: "Select a payment method, send the exact amount, and include the reference code.", am: "የክፍያ ዘዴ ይምረጡ፣ ትክክለኛውን መጠን ይላኩ፣ እና የማጣቀሻ ኮዱን ያካትቱ።" },

  // ── LOGIN / SIGNUP ────────────────────────────────────────────────────────
  "auth.welcome":       { en: "Welcome Back",           am: "እንኳን ደህና መጡ" },
  "auth.create":        { en: "Create Account",         am: "መለያ ፍጠር" },
  "auth.login-sub":     { en: "Log in to buy tickets or place bets.", am: "ትኬቶች ለመግዛት ወይም ውርርድ ለማድረግ ይግቡ።" },
  "auth.signup-sub":    { en: "Sign up to buy tickets or place bets.", am: "ትኬቶች ለመግዛት ወይም ውርርድ ለማድረግ ይመዝገቡ።" },
  "auth.google":        { en: "Continue with Google",   am: "በGoogle ይቀጥሉ" },
  "auth.email":         { en: "Continue with Email",    am: "በኢሜይል ይቀጥሉ" },
  "auth.full-name":     { en: "Full Name",              am: "ሙሉ ስም" },
  "auth.phone":         { en: "Phone Number",           am: "ስልክ ቁጥር" },
  "auth.email-addr":    { en: "Email Address",          am: "ኢሜይል አድራሻ" },
  "auth.send-code":     { en: "Send Verification Code", am: "የማረጋገጫ ኮድ ላክ" },
  "auth.back":          { en: "← Back",                am: "← ተመለስ" },
  "auth.enter-code":    { en: "Enter Code",             am: "ኮዱን ያስገቡ" },
  "auth.verify":        { en: "Verify & Continue",      am: "አረጋግጥ እና ቀጥል" },
  "auth.verify-login":  { en: "Verify & Log In",        am: "አረጋግጥ እና ግባ" },
  "auth.resend":        { en: "Resend code",            am: "ኮዱን እንደገና ላክ" },
  "auth.have-account":  { en: "Already have an account?", am: "አስቀድሞ መለያ አለዎ?" },
  "auth.new-here":      { en: "New here?",              am: "አዲስ ነዎ?" },
  "auth.login-link":    { en: "Log In",                 am: "ግባ" },
  "auth.signup-link":   { en: "Create an Account",      am: "መለያ ፍጠር" },

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  "dash.title":         { en: "My Account",             am: "የኔ መለያ" },
  "dash.tickets":       { en: "Tickets",                am: "ትኬቶች" },
  "dash.merch":         { en: "Merch Orders",           am: "የምርት ትዕዛዞች" },
  "dash.no-tickets":    { en: "No ticket orders yet",   am: "እስካሁን ምንም ትኬት ትዕዛዝ የለም" },
  "dash.shop-merch":    { en: "Shop Merch",             am: "ምርቶች ግዙ" },
  "dash.refresh":       { en: "↻ Refresh",              am: "↻ አድስ" },
  "dash.confirmed":     { en: "Confirmed",              am: "ተረጋግጧል" },
  "dash.pending":       { en: "Pending",                am: "በመጠባበቅ ላይ" },
  "dash.rejected":      { en: "Rejected",               am: "ተቀባይነት አላገኘም" },
  "dash.download":      { en: "⬇ Download Ticket",      am: "⬇ ትኬት አውርድ" },

  // ── ABOUT ─────────────────────────────────────────────────────────────────
  "about.title":        { en: "About ETFC",             am: "ስለ ETFC" },
  "about.sub":          { en: "Ethiopian Total Fighting Championship", am: "የኢትዮጵያ ጠቅላላ ውጊያ ሻምፒዮናሺፕ" },

  // ── VERIFY ────────────────────────────────────────────────────────────────
  "verify.title":       { en: "Ticket Verification",    am: "ትኬት ማረጋገጫ" },
  "verify.valid":       { en: "Valid Ticket",           am: "ትክክለኛ ትኬት" },
  "verify.invalid":     { en: "Invalid Ticket",         am: "ልክ ያልሆነ ትኬት" },
  "verify.checking":    { en: "Verifying ticket…",      am: "ትኬት እያረጋገጠ ነው…" },

  // ── FOOTER ───────────────────────────────────────────────────────────────
  "footer.rights":      { en: "© 2026 ETFC — Addis Ababa, Ethiopia", am: "© 2026 ETFC — አዲስ አበባ፣ ኢትዮጵያ" },
  "footer.partners":    { en: "Official Partners & Sponsors", am: "ይፋዊ አጋሮች እና ስፖንሰሮች" },
};

// ── ENGINE ───────────────────────────────────────────────────────────────────
let currentLang = localStorage.getItem("etfc_lang") || "en";

function t(key) {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[currentLang] || entry["en"] || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const translation = t(key);
    // For inputs, translate placeholder; for others, translate textContent
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = translation;
    } else {
      el.textContent = translation;
    }
  });
  // Update html lang attribute
  document.documentElement.setAttribute("lang", currentLang === "am" ? "am" : "en");
  // Update toggle button label
  const btn = document.getElementById("langToggleBtn");
  if (btn) btn.textContent = currentLang === "am" ? "EN" : "አማ";
}

function toggleLang() {
  currentLang = currentLang === "en" ? "am" : "en";
  localStorage.setItem("etfc_lang", currentLang);
  applyTranslations();
}

// Run on load
document.addEventListener("DOMContentLoaded", () => {
  // Small delay so nav is rendered first
  setTimeout(applyTranslations, 50);
});

// Expose globally
window.t = t;
window.toggleLang = toggleLang;
window.applyTranslations = applyTranslations;

// ── DYNAMIC TEXT HELPER ───────────────────────────────────────────────────────
// Call this after JS dynamically sets text, or after modals open
// to re-apply translations to any new data-i18n elements in the DOM
function translateEl(el) {
  if (!el) return;
  el.querySelectorAll("[data-i18n]").forEach(child => {
    const key = child.getAttribute("data-i18n");
    const translation = t(key);
    if (child.tagName === "INPUT" || child.tagName === "TEXTAREA") {
      child.placeholder = translation;
    } else {
      child.textContent = translation;
    }
  });
}

// Also translate placeholder attributes using data-i18n-ph
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const translation = t(key);
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = translation;
    } else {
      el.textContent = translation;
    }
  });
  document.documentElement.setAttribute("lang", currentLang === "am" ? "am" : "en");
  const btn = document.getElementById("langToggleBtn");
  if (btn) btn.textContent = currentLang === "am" ? "EN" : "አማ";
}
