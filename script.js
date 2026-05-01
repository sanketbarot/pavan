'use strict';

/* ═══════════════════════════════════════════
   NAV ACTIVE
═══════════════════════════════════════════ */
function setNavActive(el) {
  document.querySelectorAll('.nav-link')
    .forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}

/* ═══════════════════════════════════════════
   MOBILE NAV
═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   MENU CATEGORY FILTER
═══════════════════════════════════════════ */
function showCat(cat, tabEl) {
  // Update tabs
  document.querySelectorAll('.menu-tab')
    .forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');

  // Clear any active search first
  _clearSearchState();

  // Show / hide categories
  document.querySelectorAll('.menu-cat').forEach(c => {
    const show = cat === 'all' || c.dataset.cat === cat;
    c.classList.toggle('visible', show);

    // Reset display so CSS controls visibility properly
    c.style.display = '';

    // Reset all items inside
    c.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('hl', 'dim');
      item.style.display = '';
    });
  });

  // Stagger animation on visible items
  let delay = 0;
  document.querySelectorAll('.menu-cat.visible .menu-item')
    .forEach(item => {
      item.style.animation = 'none';
      void item.offsetWidth; // reflow
      item.style.animation =
        `fu .32s ${delay}s cubic-bezier(.22,1,.36,1) both`;
      delay += 0.022;
    });
}

/* ═══════════════════════════════════════════
   GO TO MENU FROM GALLERY / FOOD PILLS
═══════════════════════════════════════════ */
function goToMenu(cat) {
  const sec = document.getElementById('menu');
  if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const MAP = {
    'burger':       1,
    'sig-burger':   2,
    'fries':        3,
    'frankie':      4,
    'tikka':        5,
    'maggie':       6,
    'sandwich':     7,
    'sig-sandwich': 8
  };

  setTimeout(() => {
    const tabs = document.querySelectorAll('.menu-tab');
    const idx  = MAP[cat];
    if (idx !== undefined && tabs[idx]) {
      showCat(cat, tabs[idx]);
    }
  }, 640);
}

/* ═══════════════════════════════════════════
   SEARCH — FIXED
═══════════════════════════════════════════ */
function filterMenu(rawQuery) {
  const q  = rawQuery.trim().toLowerCase();
  const cb = document.getElementById('searchClear');
  const nr = document.getElementById('noResults');
  const ts = document.getElementById('searchTerm');

  // Toggle clear button visibility
  if (cb) cb.style.display = q ? 'flex' : 'none';

  // If empty query, restore everything
  if (!q) {
    _clearSearchState();
    return;
  }

  // Mark "All" tab active while searching
  document.querySelectorAll('.menu-tab').forEach((t, i) => {
    t.classList.toggle('active', i === 0);
  });

  let totalHits = 0;

  document.querySelectorAll('.menu-cat').forEach(cat => {
    let catHits = 0;
    const items = cat.querySelectorAll('.menu-item');

    items.forEach(item => {
      // item-name lives inside:  .menu-item > .card-inner > .item-inner > .item-left > .item-name
      const nameEl = item.querySelector('.item-name');
      const name   = (nameEl ? nameEl.textContent : '').toLowerCase();
      const match  = name.includes(q);

      // Highlight matching / dim non-matching
      item.classList.toggle('hl',  match);
      item.classList.toggle('dim', !match);

      // Keep item in DOM flow (display handled by class)
      item.style.display = '';

      if (match) catHits++;
    });

    // Show category only if it has at least one matching item
    if (catHits > 0) {
      cat.classList.add('visible');
      cat.style.display = '';
    } else {
      cat.classList.remove('visible');
      cat.style.display = 'none';
    }

    totalHits += catHits;
  });

  // No results block
  if (nr) {
    nr.style.display = totalHits === 0 ? 'block' : 'none';
  }
  if (ts && totalHits === 0) {
    ts.textContent = rawQuery.trim();
  }
}

/* ═══════════════════════════════════════════
   CLEAR SEARCH
═══════════════════════════════════════════ */
function clearSearch() {
  const inp = document.getElementById('menuSearch');
  if (inp) inp.value = '';
  _clearSearchState();
}

/* ── Internal: reset all search-related state ── */
function _clearSearchState() {
  // Hide clear button
  const cb = document.getElementById('searchClear');
  if (cb) cb.style.display = 'none';

  // Hide no-results block
  const nr = document.getElementById('noResults');
  if (nr) nr.style.display = 'none';

  // Remove highlight / dim from all items & restore display
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('hl', 'dim');
    item.style.display = '';
  });

  // Show all categories & remove forced inline display
  document.querySelectorAll('.menu-cat').forEach(c => {
    c.classList.add('visible');
    c.style.display = '';
  });

  // Re-activate "All" tab
  document.querySelectorAll('.menu-tab').forEach((t, i) => {
    t.classList.toggle('active', i === 0);
  });
}

/* ═══════════════════════════════════════════
   TOAST NOTIFICATION
═══════════════════════════════════════════ */
let _toastTimer = null;

function showToast(msg, duration = 2600) {
  const toast   = document.getElementById('toast');
  const msgEl   = document.getElementById('toastMsg');
  if (!toast || !msgEl) return;

  msgEl.textContent = msg;
  toast.classList.add('show');

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/* ═══════════════════════════════════════════
   SCROLL EVENTS
═══════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  const y = window.scrollY;

  // Scroll-to-top button visibility
  const scrollBtn = document.getElementById('scrollTop');
  if (scrollBtn) {
    scrollBtn.classList.toggle('visible', y > 420);
  }

  // Active nav link highlight based on scroll position
  const heroSection = document.querySelector('.hero-section');
  const heroHeight  = heroSection ? heroSection.offsetHeight : 0;

  if (y < heroHeight - 100) {
    _highlightNav('#home');
  } else {
    document.querySelectorAll('section[id]').forEach(sec => {
      const top    = sec.offsetTop - 120;
      const bottom = top + sec.offsetHeight;
      if (y >= top && y < bottom) {
        _highlightNav('#' + sec.id);
      }
    });
  }
}, { passive: true });

/* ── Helper: highlight nav link by href ── */
function _highlightNav(href) {
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === href);
  });
}

/* ═══════════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  const activeTag = document.activeElement.tagName;
  const isTyping  = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

  // Press "/" to focus search bar
  if (e.key === '/' && !isTyping) {
    e.preventDefault();
    const searchInput = document.getElementById('menuSearch');
    const menuSection = document.getElementById('menu');

    if (searchInput && menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        searchInput.focus();
        showToast('🔍 Search menu items…');
      }, 450);
    }
  }

  // Press "Escape" to clear search / close mobile nav
  if (e.key === 'Escape') {
    clearSearch();
    const searchInput = document.getElementById('menuSearch');
    if (searchInput) searchInput.blur();
    closeMobileNav();
  }
});

/* ═══════════════════════════════════════════
   INTERSECTION OBSERVER — Fade-up animations
═══════════════════════════════════════════ */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity            = '1';
        entry.target.style.animationPlayState = 'running';
        io.unobserve(entry.target);
      }
    });
  },
  {
    threshold:   0.07,
    rootMargin: '0px 0px -24px 0px'
  }
);

// Observe these elements for scroll-in animations
document.querySelectorAll(
  '.anim, .stat-card, .gallery-card, .info-card, .pop-item'
).forEach(el => {
  // Skip elements inside navbar or mobile nav
  if (el.closest('.navbar') || el.closest('.mobile-nav')) return;

  el.style.opacity            = '0';
  el.style.animationPlayState = 'paused';
  io.observe(el);
});

/* ═══════════════════════════════════════════
   SMOOTH ANCHOR SCROLL
═══════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const href   = anchor.getAttribute('href');
    const target = document.querySelector(href);

    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileNav();
    }
  });
});