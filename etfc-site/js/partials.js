// Shared nav and footer — injected on every page.
// Edit NAV_LINKS / footer text here once, it updates everywhere.
//
// Auth is on dedicated login.html / signup.html pages (not a popup). The
// nav shows Login/Sign Up links, or the signed-in user's name + Log Out.

function currentSession() {
  try {
    return JSON.parse(localStorage.getItem("etfc_session") || "null");
  } catch {
    return null;
  }
}

function renderNav(activePage) {
  const links = [
    { href: "fight-card.html", label: "Fight Card", key: "fight-card" },
    { href: "betting.html", label: "Betting", key: "betting" },
    { href: "tickets.html", label: "Tickets", key: "tickets" },
    { href: "merch.html", label: "Merch", key: "merch" },
    { href: "about.html", label: "About", key: "about" },
  ];
  const linksHtml = links.map(l =>
    `<a href="${l.href}" class="${activePage === l.key ? 'active' : ''}">${l.label}</a>`
  ).join("");

  const session = currentSession();
  const authHtml = session
    ? `<span class="nav-user" title="${session.email || ''}">${(session.name || 'Account').split(' ')[0]}</span>
       <a href="dashboard.html" class="nav-link-auth${activePage === 'dashboard' ? ' active' : ''}">My Tickets</a>
       <a href="#" class="btn btn-outline btn-sm" onclick="logOut(event)">Log Out</a>`
    : `<a href="login.html" class="nav-link-auth">Log In</a>
       <a href="signup.html" class="btn btn-outline btn-sm">Sign Up</a>`;

  // Mobile panel: include My Tickets under Tickets when logged in
  const mobileLinksHtml = links.map(l => {
    let html = `<a href="${l.href}" class="${activePage === l.key ? 'active' : ''}">${l.label}</a>`;
    if (l.key === 'tickets' && session) {
      html += `<a href="dashboard.html" class="nav-mobile-sublink${activePage === 'dashboard' ? ' active' : ''}">My Tickets</a>`;
    }
    return html;
  }).join("");

  return `
  <nav class="nav">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">ET<span>FC</span></a>
      <div class="nav-links">${linksHtml}</div>
      <div class="nav-actions">
        <div class="theme-toggle" onclick="toggleTheme()" title="Toggle light/dark mode" id="themeToggleBtn"></div>
        <div class="nav-actions-desktop">
          ${authHtml}
          <a href="tickets.html" class="nav-cta">Get Tickets</a>
        </div>
        <button class="nav-hamburger" onclick="toggleMobileNav()" aria-label="Menu" aria-expanded="false" id="navHamburgerBtn">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
    <div class="nav-mobile-panel" id="navMobilePanel">
      ${mobileLinksHtml}
      <div class="nav-mobile-divider"></div>
      ${authHtml.replace('class="nav-link-auth"', 'class="nav-link-auth nav-mobile-auth"').replace('class="btn btn-outline btn-sm"', 'class="btn btn-outline btn-sm nav-mobile-auth-btn"')}
    </div>
  </nav>`;
}

function toggleMobileNav() {
  const panel = document.getElementById("navMobilePanel");
  const btn = document.getElementById("navHamburgerBtn");
  const isOpen = panel.classList.toggle("open");
  btn.classList.toggle("open", isOpen);
  btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function renderSponsorsStrip() {
  const sponsors = [
    { name: "ETFC", img: "images/sponsors/etfc-logo.jpg" },
    { name: "M-Pesa", img: "images/sponsors/mpesa.jpg" },
    { name: "Gena TV", img: "images/sponsors/genatv.jpg" },
    { name: "Sweat Box", img: "images/sponsors/sweatbox.jpg" },
    { name: "Gofere", img: "images/sponsors/gofere.jpg" },
  ];
  const logosHtml = sponsors.map(s => `
    <div class="sponsor-logo" title="${s.name}">
      <img src="${s.img}" alt="${s.name}" loading="lazy">
    </div>
  `).join("");

  return `
  <div class="sponsors-strip">
    <div class="container">
      <div class="sponsors-label">Official Partners &amp; Sponsors</div>
      <div class="sponsors-row">${logosHtml}</div>
    </div>
  </div>`;
}

function renderFooter() {
  return `
  <footer>
    ${renderSponsorsStrip()}
    <div class="container foot-inner">
      <div class="nav-logo" style="font-size:20px;">ET<span>FC</span></div>
      <div class="foot-links">
        <a href="fight-card.html">Fight Card</a>
        <a href="betting.html">Betting</a>
        <a href="tickets.html">Tickets</a>
        <a href="merch.html">Merch</a>
        <a href="about.html">About</a>
      </div>
      <div class="copyright">&copy; 2026 ETFC — Addis Ababa, Ethiopia</div>
    </div>
  </footer>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const navMount = document.getElementById("nav-mount");
  const footerMount = document.getElementById("footer-mount");
  if (navMount) navMount.outerHTML = renderNav(navMount.dataset.active || "");
  if (footerMount) footerMount.outerHTML = renderFooter();
  if (typeof updateThemeIcon === "function") updateThemeIcon();
});
