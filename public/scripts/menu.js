// Mobile nav toggle. Kept as a static same-origin file (rather than an inline
// <script>) so a strict Content-Security-Policy of `script-src 'self'` allows
// it without needing 'unsafe-inline' or a per-build hash. Referenced from
// Header.astro via <script is:inline src="/scripts/menu.js" defer>.
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuBtn?.addEventListener('click', () => {
  mobileMenu?.classList.toggle('hidden');
});
