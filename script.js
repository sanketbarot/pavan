'use strict';

function setNavActive(el) {
  document.querySelectorAll('.nav-link')
    .forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}

function toggleMobileNav() {
  const nav = document.getElementById('mobileNav');
  const ov  = document.getElementById('overlay');
  const hb  = document.getElementById('hamburger');
  const open = nav.classList.toggle('open');
  ov.classList.toggle('open', open);
  hb.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.body.style.overflow = '';
}

function showCat(cat, tabEl) {
  document.querySelectorAll('.menu-tab')
    .forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  _clearSearchState();
  document.querySelectorAll('.menu-cat').forEach(c => {
    c.classList.toggle('visible', cat === 'all' || c.dataset.cat === cat);
  });
  document.querySelectorAll('.menu-cat.visible .menu-item')
    .forEach((item, i) => {
      item.style.animation = 'none';
      void item.offsetWidth;
      item.style.animation =
        `fu .32s ${i * 0.022}s cubic-bezier(.22,1,.36,1) both`;
    });
}

function goToMenu(cat) {
  const sec = document.getElementById('menu');
  if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const MAP = {
    burger:1, 'sig-burger':2, fries:3, frankie:4,
    tikka:5, maggie:6, sandwich:7, 'sig-sandwich':8
  };
  setTimeout(() => {
    const tabs = document.querySelectorAll('.menu-tab');
    const idx  = MAP[cat];
    if (idx !== undefined && tabs[idx]) showCat(cat, tabs[idx]);
  }, 640);
}

function filterMenu(q) {
  q = q.trim().toLowerCase();
  const cb = document.getElementById('searchClear');
  const nr = document.getElementById('noResults');
  const ts = document.getElementById('searchTerm');
  cb.style.display = q ? 'flex' : 'none';
  if (!q) { _clearSearchState(); return; }
  document.querySelectorAll('.menu-tab').forEach((t,i) =>
    t.classList.toggle('active', i === 0));
  let total = 0;
  document.querySelectorAll('.menu-cat').forEach(cat => {
    let hits = 0;
    cat.querySelectorAll('.menu-item').forEach(item => {
      const n = (item.querySelector('.item-name')?.textContent||'').toLowerCase();
      const hit = n.includes(q);
      item.classList.toggle('hl', hit);
      item.classList.toggle('dim', !hit);
      if (hit) hits++;
    });
    cat.classList.toggle('visible', hits > 0);
    total += hits;
  });
  if (nr) nr.style.display = total === 0 ? 'block' : 'none';
  if (ts && total === 0) ts.textContent = q;
}

function clearSearch() {
  const inp = document.getElementById('menuSearch');
  if (inp) inp.value = '';
  _clearSearchState();
}

function _clearSearchState() {
  const cb = document.getElementById('searchClear');
  const nr = document.getElementById('noResults');
  if (cb) cb.style.display = 'none';
  if (nr) nr.style.display = 'none';
  document.querySelectorAll('.menu-item').forEach(i =>
    i.classList.remove('hl','dim'));
  document.querySelectorAll('.menu-cat').forEach(c =>
    c.classList.add('visible'));
  document.querySelectorAll('.menu-tab').forEach((t,i) =>
    t.classList.toggle('active', i === 0));
}

let _tt = null;
function showToast(msg, ms = 2600) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toastMsg');
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), ms);
}

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  document.getElementById('scrollTop')
    ?.classList.toggle('visible', y > 420);
  const hH = document.querySelector('.hero-section')?.offsetHeight ?? 0;
  if (y < hH - 100) { _hn('#home'); }
  else {
    document.querySelectorAll('section[id]').forEach(s => {
      const t = s.offsetTop - 120, b = t + s.offsetHeight;
      if (y >= t && y < b) _hn('#' + s.id);
    });
  }
}, { passive: true });

function _hn(href) {
  document.querySelectorAll('.nav-link').forEach(a =>
    a.classList.toggle('active', a.getAttribute('href') === href));
}

document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
    e.preventDefault();
    const s = document.getElementById('menuSearch');
    const m = document.getElementById('menu');
    if (s && m) {
      m.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { s.focus(); showToast('🔍 Search menu items…'); }, 450);
    }
  }
  if (e.key === 'Escape') {
    clearSearch();
    document.getElementById('menuSearch')?.blur();
    closeMobileNav();
  }
});

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.animationPlayState = 'running';
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.07, rootMargin: '0px 0px -24px 0px' });

document.querySelectorAll(
  '.anim, .stat-card, .gallery-card, .info-card'
).forEach(el => {
  if (el.closest('.navbar') || el.closest('.mobile-nav')) return;
  el.style.opacity = '0';
  el.style.animationPlayState = 'paused';
  io.observe(el);
});

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) {
      e.preventDefault();
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileNav();
    }
  });
});