/* =============================================
   SNACK STATION — script.js
   ============================================= */

'use strict';

// ---- Nav active link ----
function setNavActive(el) {
  document.querySelectorAll('.nav-links a')
    .forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}

// ---- Mobile nav ----
function toggleMobileNav() {
  document.getElementById('mobileNav').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}

function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

// ---- Menu category filter ----
function showCat(cat, tabEl) {
  // Tabs
  document.querySelectorAll('.menu-tab')
    .forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');

  // Categories
  document.querySelectorAll('.menu-cat').forEach(c => {
    if (cat === 'all' || c.dataset.cat === cat) {
      c.classList.add('visible');
    } else {
      c.classList.remove('visible');
    }
  });

  // Stagger item animation
  document.querySelectorAll('.menu-cat.visible .menu-item')
    .forEach((item, i) => {
      item.style.animation = 'none';
      void item.offsetWidth; // reflow
      item.style.animation =
        `fu 0.35s ${i * 0.025}s cubic-bezier(0.22,1,0.36,1) both`;
    });
}

// ---- Scroll events ----
window.addEventListener('scroll', () => {
  const y = window.scrollY;

  // Scroll-top button
  document
    .getElementById('scrollTop')
    .classList.toggle('visible', y > 400);

  // Navbar scrolled class
  document
    .getElementById('navbar')
    .classList.toggle('scrolled', y > 50);

  // Active nav link on scroll
  const heroH = document.querySelector('.hero-section')?.offsetHeight || 0;
  if (y < heroH - 80) {
    setLinkActive('#home');
  } else {
    document.querySelectorAll('section[id]').forEach(sec => {
      const top    = sec.offsetTop - 110;
      const bottom = top + sec.offsetHeight;
      if (y >= top && y < bottom) setLinkActive('#' + sec.id);
    });
  }
});

function setLinkActive(href) {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === href);
  });
}

// ---- Intersection Observer — scroll animations ----
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
);

document.querySelectorAll('.anim, .info-card, .glass-card').forEach(el => {
  if (!el.classList.contains('navbar') && !el.closest('.navbar')) {
    el.style.opacity = '0';
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  }
});

// ---- Smooth anchor scroll ----
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});