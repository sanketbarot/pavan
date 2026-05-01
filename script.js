'use strict';

/* ═══════════════════════════════════════════
   CACHE DOM ELEMENTS — query once, reuse
═══════════════════════════════════════════ */
const DOM = {
  navbar:       null,
  scrollTop:    null,
  mobileNav:    null,
  overlay:      null,
  hamburger:    null,
  menuSearch:   null,
  searchClear:  null,
  noResults:    null,
  searchTerm:   null,
  toast:        null,
  toastMsg:     null,
  heroSection:  null,
  navLinks:     [],
  menuTabs:     [],
  menuCats:     [],
  menuItems:    [],
  sections:     [],
};

/* Initialize DOM cache after page load */
function initDOM() {
  DOM.navbar      = document.getElementById('navbar');
  DOM.scrollTop   = document.getElementById('scrollTop');
  DOM.mobileNav   = document.getElementById('mobileNav');
  DOM.overlay     = document.getElementById('overlay');
  DOM.hamburger   = document.getElementById('hamburger');
  DOM.menuSearch  = document.getElementById('menuSearch');
  DOM.searchClear = document.getElementById('searchClear');
  DOM.noResults   = document.getElementById('noResults');
  DOM.searchTerm  = document.getElementById('searchTerm');
  DOM.toast       = document.getElementById('toast');
  DOM.toastMsg    = document.getElementById('toastMsg');
  DOM.heroSection = document.querySelector('.hero-section');

  DOM.navLinks  = Array.from(document.querySelectorAll('.nav-link'));
  DOM.menuTabs  = Array.from(document.querySelectorAll('.menu-tab'));
  DOM.menuCats  = Array.from(document.querySelectorAll('.menu-cat'));
  DOM.menuItems = Array.from(document.querySelectorAll('.menu-item'));
  DOM.sections  = Array.from(document.querySelectorAll('section[id]'));
}

/* ═══════════════════════════════════════════
   NAV ACTIVE
═══════════════════════════════════════════ */
function setNavActive(el) {
  DOM.navLinks.forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}

/* ═══════════════════════════════════════════
   MOBILE NAV
═══════════════════════════════════════════ */
function toggleMobileNav() {
  const open = DOM.mobileNav.classList.toggle('open');
  DOM.overlay.classList.toggle('open', open);
  DOM.hamburger.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function closeMobileNav() {
  DOM.mobileNav.classList.remove('open');
  DOM.overlay.classList.remove('open');
  DOM.hamburger.classList.remove('open');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════════
   MENU CATEGORY FILTER
═══════════════════════════════════════════ */
function showCat(cat, tabEl) {
  /* ── 1. Update tabs ── */
  DOM.menuTabs.forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');

  /* ── 2. Clear search ── */
  _clearSearchState();

  /* ── 3. Show/hide categories using RAF ── */
  const isAll = cat === 'all';

  requestAnimationFrame(() => {
    DOM.menuCats.forEach(c => {
      const show = isAll || c.dataset.cat === cat;
      c.classList.toggle('visible', show);
      c.style.display = '';

      /* Reset items inside */
      c.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('hl', 'dim');
        item.style.display   = '';
        item.style.animation = '';
      });
    });

    /* ── 4. Stagger animation — only visible items ── */
    let delay = 0;
    document.querySelectorAll('.menu-cat.visible .menu-item')
      .forEach(item => {
        item.style.animation = 'none';
        void item.offsetWidth;
        item.style.animation =
          `fu .30s ${delay.toFixed(3)}s cubic-bezier(.22,1,.36,1) both`;
        delay += 0.020;
      });
  });
}

/* ═══════════════════════════════════════════
   GO TO MENU
═══════════════════════════════════════════ */
const MENU_MAP = {
  'burger':       1,
  'sig-burger':   2,
  'fries':        3,
  'frankie':      4,
  'tikka':        5,
  'maggie':       6,
  'sandwich':     7,
  'sig-sandwich': 8
};

function goToMenu(cat) {
  const sec = document.getElementById('menu');
  if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const idx = MENU_MAP[cat];
  if (idx === undefined) return;

  setTimeout(() => {
    const tab = DOM.menuTabs[idx];
    if (tab) showCat(cat, tab);
  }, 600);
}

/* ═══════════════════════════════════════════
   SEARCH — OPTIMIZED
   Debounced + cached items
═══════════════════════════════════════════ */

/* Pre-cache item names once */
let _itemCache = null;

function _buildItemCache() {
  if (_itemCache) return;
  _itemCache = DOM.menuItems.map(item => ({
    el:   item,
    name: (item.querySelector('.item-name')?.textContent || '').toLowerCase(),
    cat:  item.closest('.menu-cat'),
  }));
}

/* Debounce timer */
let _searchTimer = null;

function filterMenu(rawQuery) {
  /* Show/hide clear button immediately */
  if (DOM.searchClear) {
    DOM.searchClear.style.display = rawQuery ? 'flex' : 'none';
  }

  /* Debounce — wait 180ms before processing */
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => _doSearch(rawQuery), 180);
}

function _doSearch(rawQuery) {
  const q = rawQuery.trim().toLowerCase();

  if (!q) {
    _clearSearchState();
    return;
  }

  /* Build cache first time */
  _buildItemCache();

  /* Mark "All" tab active */
  DOM.menuTabs.forEach((t, i) => t.classList.toggle('active', i === 0));

  /* Track hits per category */
  const catHits = new Map();
  DOM.menuCats.forEach(c => catHits.set(c, 0));

  /* Classify items — batch DOM writes in RAF */
  const matches    = [];
  const nonMatches = [];

  _itemCache.forEach(({ el, name, cat }) => {
    if (name.includes(q)) {
      matches.push(el);
      catHits.set(cat, (catHits.get(cat) || 0) + 1);
    } else {
      nonMatches.push(el);
    }
  });

  const totalHits = matches.length;

  /* Batch all DOM writes in one RAF frame */
  requestAnimationFrame(() => {
    /* Items */
    matches.forEach(el => {
      el.classList.add('hl');
      el.classList.remove('dim');
      el.style.display = '';
    });
    nonMatches.forEach(el => {
      el.classList.remove('hl');
      el.classList.add('dim');
      el.style.display = '';
    });

    /* Categories */
    DOM.menuCats.forEach(c => {
      const hits = catHits.get(c) || 0;
      if (hits > 0) {
        c.classList.add('visible');
        c.style.display = '';
      } else {
        c.classList.remove('visible');
        c.style.display = 'none';
      }
    });

    /* No results */
    if (DOM.noResults) {
      DOM.noResults.style.display = totalHits === 0 ? 'block' : 'none';
    }
    if (DOM.searchTerm && totalHits === 0) {
      DOM.searchTerm.textContent = rawQuery.trim();
    }
  });
}

/* ═══════════════════════════════════════════
   CLEAR SEARCH
═══════════════════════════════════════════ */
function clearSearch() {
  clearTimeout(_searchTimer);
  if (DOM.menuSearch) DOM.menuSearch.value = '';
  _clearSearchState();
}

function _clearSearchState() {
  if (DOM.searchClear) DOM.searchClear.style.display = 'none';
  if (DOM.noResults)   DOM.noResults.style.display   = 'none';

  requestAnimationFrame(() => {
    DOM.menuItems.forEach(item => {
      item.classList.remove('hl', 'dim');
      item.style.display = '';
    });

    DOM.menuCats.forEach(c => {
      c.classList.add('visible');
      c.style.display = '';
    });

    DOM.menuTabs.forEach((t, i) => {
      t.classList.toggle('active', i === 0);
    });
  });
}

/* ═══════════════════════════════════════════
   TOAST — lightweight
═══════════════════════════════════════════ */
let _toastTimer = null;

function showToast(msg, duration = 2400) {
  if (!DOM.toast || !DOM.toastMsg) return;
  DOM.toastMsg.textContent = msg;
  DOM.toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => DOM.toast.classList.remove('show'), duration);
}

/* ═══════════════════════════════════════════
   SCROLL — throttled with RAF
═══════════════════════════════════════════ */
let _scrollTicking = false;
let _lastScrollY   = 0;

window.addEventListener('scroll', () => {
  _lastScrollY = window.scrollY;
  if (_scrollTicking) return;

  requestAnimationFrame(() => {
    _onScroll(_lastScrollY);
    _scrollTicking = false;
  });

  _scrollTicking = true;
}, { passive: true });

function _onScroll(y) {
  /* Scroll-top button */
  if (DOM.scrollTop) {
    DOM.scrollTop.classList.toggle('visible', y > 400);
  }

  /* Active nav highlight */
  const heroH = DOM.heroSection ? DOM.heroSection.offsetHeight : 0;

  if (y < heroH - 100) {
    _highlightNav('#home');
    return;
  }

  for (const sec of DOM.sections) {
    const top    = sec.offsetTop - 120;
    const bottom = top + sec.offsetHeight;
    if (y >= top && y < bottom) {
      _highlightNav('#' + sec.id);
      break;
    }
  }
}

function _highlightNav(href) {
  DOM.navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === href);
  });
}

/* ═══════════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  const tag      = document.activeElement.tagName;
  const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';

  if (e.key === '/' && !isTyping) {
    e.preventDefault();
    const menuSec = document.getElementById('menu');
    if (DOM.menuSearch && menuSec) {
      menuSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        DOM.menuSearch.focus();
        showToast('🔍 Search menu items…');
      }, 420);
    }
  }

  if (e.key === 'Escape') {
    clearSearch();
    DOM.menuSearch?.blur();
    closeMobileNav();
  }
});

/* ═══════════════════════════════════════════
   INTERSECTION OBSERVER — fade-up animations
   Uses single shared observer
═══════════════════════════════════════════ */
const _io = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.opacity            = '1';
      el.style.animationPlayState = 'running';
      _io.unobserve(el);
    });
  },
  { threshold: 0.06, rootMargin: '0px 0px -20px 0px' }
);

function _initAnimations() {
  document.querySelectorAll(
    '.anim, .stat-card, .gallery-card, .info-card, .pop-item'
  ).forEach(el => {
    if (el.closest('.navbar') || el.closest('.mobile-nav')) return;
    el.style.opacity            = '0';
    el.style.animationPlayState = 'paused';
    _io.observe(el);
  });
}

/* ═══════════════════════════════════════════
   SMOOTH ANCHOR SCROLL
   Uses event delegation — 1 listener instead of many
═══════════════════════════════════════════ */
document.addEventListener('click', e => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;

  const href   = anchor.getAttribute('href');
  const target = document.querySelector(href);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  closeMobileNav();
});

/* ═══════════════════════════════════════════
   LAZY IMAGE LOADING — native + fallback
═══════════════════════════════════════════ */
function _initLazyImages() {
  /* Native lazy loading already set via loading="lazy" in HTML */
  /* Add error fallback for broken images */
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.addEventListener('error', () => {
      img.style.opacity = '0.3';
    }, { once: true });
  });
}

/* ═══════════════════════════════════════════
   INIT — run everything after DOM is ready
═══════════════════════════════════════════ */
function init() {
  initDOM();
  _initAnimations();
  _initLazyImages();
  _buildItemCache(); /* Pre-build search cache on load */
}

/* DOMContentLoaded — fastest safe entry point */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  /* Already loaded (script at bottom of body) */
  init();
}