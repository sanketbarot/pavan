'use strict';

/* ═══════════════════════════════════════════
   CONFIG — Change PDF filename here
═══════════════════════════════════════════ */
const MENU_PDF_FILE = 'SnackStation-Menu.pdf';

/* ═══════════════════════════════════════════
   CACHE DOM ELEMENTS
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
  navBadge:     null,
  tabStrip:     null,
  navLinks:     [],
  menuTabs:     [],
  menuCats:     [],
  menuItems:    [],
  sections:     [],
};

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
  DOM.navBadge    = document.querySelector('.nav-badge');
  DOM.tabStrip    = document.getElementById('tabStrip');

  DOM.navLinks  = Array.from(document.querySelectorAll('.nav-link'));
  DOM.menuTabs  = Array.from(document.querySelectorAll('.menu-tab'));
  DOM.menuCats  = Array.from(document.querySelectorAll('.menu-cat'));
  DOM.menuItems = Array.from(document.querySelectorAll('.menu-item'));
  DOM.sections  = Array.from(document.querySelectorAll('section[id]'));
}

/* ═══════════════════════════════════════════
   PAGE LOADER
═══════════════════════════════════════════ */
function initPageLoader() {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;

  const hide = () => {
    loader.classList.add('loader-hide');
    setTimeout(() => {
      loader.remove();
      _recalcStickyTop();
    }, 600);
  };

  if (document.readyState === 'complete') {
    setTimeout(hide, 800);
  } else {
    window.addEventListener('load', () => setTimeout(hide, 800));
  }
}

/* ═══════════════════════════════════════════
   LIVE OPEN / CLOSED STATUS
   Open: 8:00 PM (20:00) → 3:00 AM (03:00)
═══════════════════════════════════════════ */
function isOpenNow() {
  const now  = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= 1200 || mins < 180;
}

function updateOpenStatus() {
  const open = isOpenNow();

  if (DOM.navBadge) {
    DOM.navBadge.innerHTML = open
      ? '<span class="live-dot"></span> Open Now'
      : '<span class="closed-dot"></span> Opens 8 PM';
    DOM.navBadge.className = open
      ? 'nav-badge nav-badge-open'
      : 'nav-badge nav-badge-closed';
  }

  const statusBar = document.getElementById('statusBar');
  if (statusBar) {
    statusBar.textContent = open
      ? '🟢 We are OPEN right now — Order away!'
      : '🔴 Currently CLOSED · Opens at 8:00 PM tonight';
    statusBar.className = open
      ? 'status-bar status-open'
      : 'status-bar status-closed';
  }

  const heroBadge = document.querySelector('.badge-inner span:last-child');
  if (heroBadge) {
    heroBadge.textContent = open
      ? 'Open · 8 PM to 3 AM · Vejalpur'
      : 'Closed · Opens at 8:00 PM';
  }
}

function initOpenStatus() {
  updateOpenStatus();
  setInterval(updateOpenStatus, 60000);
}

/* ═══════════════════════════════════════════
   STICKY MENU TABS
═══════════════════════════════════════════ */
let _tabStripTop    = 0;
let _tabStripSticky = false;
let _menuSection    = null;

function initStickyTabs() {
  _menuSection = document.getElementById('menu');
  if (!DOM.tabStrip || !_menuSection) return;
  setTimeout(_recalcStickyTop, 500);
  window.addEventListener('resize', _debounce(_recalcStickyTop, 200));
}

function _recalcStickyTop() {
  if (!DOM.tabStrip || !_menuSection) return;
  _tabStripTop = DOM.tabStrip.getBoundingClientRect().top + window.scrollY;
}

function updateStickyTabs(y) {
  if (!DOM.tabStrip || !_menuSection) return;
  const menuBottom  = _menuSection.offsetTop + _menuSection.offsetHeight;
  const shouldStick = y >= _tabStripTop - 86 && y < menuBottom - 100;
  if (shouldStick && !_tabStripSticky) {
    DOM.tabStrip.classList.add('tab-strip-sticky');
    _tabStripSticky = true;
  } else if (!shouldStick && _tabStripSticky) {
    DOM.tabStrip.classList.remove('tab-strip-sticky');
    _tabStripSticky = false;
  }
}

/* ═══════════════════════════════════════════
   DYNAMIC MENU ITEM COUNT IN TABS
═══════════════════════════════════════════ */
function _buildTabCounts() {
  const countMap = {};
  let total = 0;
  DOM.menuCats.forEach(cat => {
    const key   = cat.dataset.cat;
    const items = cat.querySelectorAll('.menu-item').length;
    countMap[key] = items;
    total += items;
  });

  DOM.menuTabs.forEach(tab => {
    const onclick = tab.getAttribute('onclick') || '';
    const m = onclick.match(/'([^']+)'/);
    if (!m) return;
    const cat = m[1];
    const cnt = cat === 'all' ? total : (countMap[cat] || 0);
    let badge = tab.querySelector('.tab-cnt');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'tab-cnt';
      tab.appendChild(badge);
    }
    badge.textContent = cnt > 99 ? '99+' : cnt;
  });
}

/* ═══════════════════════════════════════════
   FAVOURITES SYSTEM
═══════════════════════════════════════════ */
const FAV_KEY = 'snack_favourites';
let _favourites = new Set();

function loadFavourites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    _favourites = new Set(Array.isArray(saved) ? saved : []);
  } catch {
    _favourites = new Set();
  }
}

function saveFavourites() {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([..._favourites]));
  } catch { /* storage full or private mode */ }
}

function toggleFavourite(name, btn) {
  if (_favourites.has(name)) {
    _favourites.delete(name);
    btn.classList.remove('fav-active');
    btn.title     = 'Add to favourites';
    btn.innerHTML = '♡';
    showToast('💔 Removed from favourites');
  } else {
    _favourites.add(name);
    btn.classList.add('fav-active');
    btn.title     = 'Remove from favourites';
    btn.innerHTML = '♥';
    showToast('❤️ Added to favourites!');
  }
  saveFavourites();
  updateFavCount();
}

function updateFavCount() {
  const badge = document.getElementById('favCount');
  if (!badge) return;
  const count = _favourites.size;
  badge.textContent    = count;
  badge.style.display  = count > 0 ? 'flex' : 'none';
}

function injectFavButtons() {
  DOM.menuItems.forEach(item => {
    if (item.querySelector('.fav-btn')) return;
    const nameEl = item.querySelector('.item-name');
    const name   = nameEl ? nameEl.textContent.trim() : '';
    if (!name) return;

    const btn = document.createElement('button');
    btn.className = 'fav-btn';
    btn.title     = _favourites.has(name) ? 'Remove from favourites' : 'Add to favourites';
    btn.innerHTML = _favourites.has(name) ? '♥' : '♡';
    btn.setAttribute('aria-label', 'Favourite ' + name);
    if (_favourites.has(name)) btn.classList.add('fav-active');

    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavourite(name, btn);
    });

    const inner = item.querySelector('.item-inner');
    if (inner) inner.appendChild(btn);
  });
}

function showFavourites() {
  const panel = document.getElementById('favPanel');
  if (!panel) return;

  if (_favourites.size === 0) {
    showToast('❤️ No favourites yet — tap ♡ on any item!');
    return;
  }

  const list = document.getElementById('favList');
  if (!list) return;
  list.innerHTML = '';

  _favourites.forEach(name => {
    const matchEl = DOM.menuItems.find(item =>
      item.querySelector('.item-name')?.textContent.trim() === name
    );
    const price = matchEl?.querySelector('.item-price')?.textContent || '';

    const row = document.createElement('div');
    row.className = 'fav-row glass-card';
    row.innerHTML =
      '<div class="card-surface"></div>' +
      '<div class="card-inner fav-row-inner">' +
        '<span class="fav-veg-dot">🌿</span>' +
        '<span class="fav-item-name">' + _escHtml(name) + '</span>' +
        '<span class="fav-item-price">' + _escHtml(price) + '</span>' +
      '</div>';

    const removeBtn = document.createElement('button');
    removeBtn.className   = 'fav-remove-btn';
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', 'Remove ' + name + ' from favourites');
    removeBtn.addEventListener('click', () => removeFav(name, row));

    row.querySelector('.fav-row-inner').appendChild(removeBtn);
    list.appendChild(row);
  });

  panel.classList.add('fav-panel-open');
  document.body.style.overflow = 'hidden';
}

function removeFav(name, rowEl) {
  _favourites.delete(name);
  saveFavourites();
  updateFavCount();
  rowEl?.remove();

  DOM.menuItems.forEach(item => {
    if (item.querySelector('.item-name')?.textContent.trim() === name) {
      const btn = item.querySelector('.fav-btn');
      if (btn) {
        btn.classList.remove('fav-active');
        btn.innerHTML = '♡';
        btn.title = 'Add to favourites';
      }
    }
  });

  if (_favourites.size === 0) closeFavPanel();
  showToast('💔 Removed from favourites');
}

function closeFavPanel() {
  const panel = document.getElementById('favPanel');
  panel?.classList.remove('fav-panel-open');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════════
   PRICE FILTER
═══════════════════════════════════════════ */
let _activePriceFilter = 'all';

const PRICE_RANGES = {
  all:     [0, Infinity],
  budget:  [0, 99],
  mid:     [100, 149],
  premium: [150, Infinity],
};

function setPriceFilter(range, btnEl) {
  _activePriceFilter = range;

  document.querySelectorAll('.price-filter-btn').forEach(b =>
    b.classList.remove('price-filter-active')
  );
  if (btnEl) btnEl.classList.add('price-filter-active');

  const [min, max] = PRICE_RANGES[range] || PRICE_RANGES.all;

  requestAnimationFrame(() => {
    DOM.menuCats.forEach(cat => {
      let catVisible = 0;
      cat.querySelectorAll('.menu-item').forEach(item => {
        const priceText = item.querySelector('.item-price')?.textContent || '';
        const price     = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || 0;
        const show      = price >= min && price <= max;
        item.style.display = show ? '' : 'none';
        if (show) catVisible++;
      });
      cat.style.display = catVisible > 0 ? '' : 'none';
      cat.classList.toggle('visible', catVisible > 0);
    });
  });

  if (range !== 'all') {
    const labels = { budget: '₹69 – ₹99', mid: '₹100 – ₹149', premium: '₹150+' };
    showToast('💰 Showing: ' + (labels[range] || ''));
  }
}

function resetPriceFilter() {
  _activePriceFilter = 'all';
  DOM.menuItems.forEach(item => { item.style.display = ''; });
  DOM.menuCats.forEach(c => { c.style.display = ''; c.classList.add('visible'); });
  document.querySelectorAll('.price-filter-btn').forEach(b => {
    b.classList.toggle('price-filter-active', b.dataset.range === 'all');
  });
}

/* ═══════════════════════════════════════════
   DOWNLOAD MENU — Direct PDF File Download
   Downloads the existing SnackStation-Menu.pdf file
═══════════════════════════════════════════ */
function downloadMenu() {
  showToast('📥 Downloading menu PDF…');

  // GA event track
  try {
    if (typeof gtag === 'function') {
      gtag('event', 'download_menu', {
        event_category: 'engagement',
        event_label: 'Menu PDF Download'
      });
    }
  } catch (e) { /* silent */ }

  // Create temporary anchor element for download
  const link = document.createElement('a');
  link.href = MENU_PDF_FILE;
  link.download = 'SnackStation-Menu.pdf';
  link.target = '_blank';
  link.rel = 'noopener';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    showToast('✅ Menu PDF download started!');
  }, 600);
}

/* ═══════════════════════════════════════════
   MAPS POPUP
═══════════════════════════════════════════ */
function openMapsPopup() {
  const popup = document.getElementById('mapsPopup');
  if (!popup) return;
  popup.classList.add('maps-popup-open');
  document.body.style.overflow = 'hidden';
}

function closeMapsPopup() {
  const popup = document.getElementById('mapsPopup');
  popup?.classList.remove('maps-popup-open');
  document.body.style.overflow = '';
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
  DOM.menuTabs.forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');

  _clearSearchState();
  resetPriceFilter();

  requestAnimationFrame(() => {
    const isAll = cat === 'all';
    DOM.menuCats.forEach(c => {
      const show = isAll || c.dataset.cat === cat;
      c.classList.toggle('visible', show);
      c.style.display = '';
      c.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('hl', 'dim');
        item.style.display   = '';
        item.style.animation = '';
      });
    });

    /* Stagger-animate visible items */
    let delay = 0;
    document.querySelectorAll('.menu-cat.visible .menu-item').forEach(item => {
      item.style.animation = 'none';
      void item.offsetWidth;
      item.style.animation = 'fu .30s ' + delay.toFixed(3) + 's cubic-bezier(.22,1,.36,1) both';
      delay += 0.020;
    });
  });
}

/* ═══════════════════════════════════════════
   GO TO MENU
═══════════════════════════════════════════ */
const MENU_MAP = {
  'burger':1, 'sig-burger':2, 'fries':3, 'frankie':4,
  'tikka':5, 'maggie':6, 'sandwich':7, 'sig-sandwich':8
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
   SEARCH — debounced + cached
═══════════════════════════════════════════ */
let _itemCache   = null;
let _searchTimer = null;

function _buildItemCache() {
  _itemCache = DOM.menuItems.map(item => ({
    el:   item,
    name: (item.querySelector('.item-name')?.textContent || '').toLowerCase().trim(),
    cat:  item.closest('.menu-cat'),
  }));
}

function filterMenu(rawQuery) {
  if (DOM.searchClear) {
    DOM.searchClear.style.display = rawQuery ? 'flex' : 'none';
  }
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => _doSearch(rawQuery), 180);
}

function _doSearch(rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) { _clearSearchState(); return; }

  if (!_itemCache) _buildItemCache();
  resetPriceFilter();
  DOM.menuTabs.forEach((t, i) => t.classList.toggle('active', i === 0));

  const catHits   = new Map();
  const matches   = [];
  const nomatches = [];

  DOM.menuCats.forEach(c => catHits.set(c, 0));

  _itemCache.forEach(({ el, name, cat }) => {
    if (name.includes(q)) {
      matches.push(el);
      catHits.set(cat, (catHits.get(cat) || 0) + 1);
    } else {
      nomatches.push(el);
    }
  });

  const totalHits = matches.length;

  requestAnimationFrame(() => {
    matches.forEach(el => {
      el.classList.add('hl');
      el.classList.remove('dim');
      el.style.display = '';
    });
    nomatches.forEach(el => {
      el.classList.remove('hl');
      el.classList.add('dim');
      el.style.display = '';
    });
    DOM.menuCats.forEach(c => {
      const hits = catHits.get(c) || 0;
      if (hits > 0) { c.classList.add('visible');   c.style.display = ''; }
      else          { c.classList.remove('visible'); c.style.display = 'none'; }
    });
    if (DOM.noResults) {
      DOM.noResults.style.display = totalHits === 0 ? 'block' : 'none';
    }
    if (DOM.searchTerm && totalHits === 0) {
      DOM.searchTerm.textContent = rawQuery.trim();
    }
  });
}

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
    DOM.menuTabs.forEach((t, i) => t.classList.toggle('active', i === 0));
  });
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
let _toastTimer = null;

function showToast(msg, duration) {
  if (!DOM.toast || !DOM.toastMsg) return;
  duration = duration || 2400;
  DOM.toastMsg.textContent = msg;
  DOM.toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, duration);
}

/* ═══════════════════════════════════════════
   SCROLL — RAF throttled
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
  if (DOM.scrollTop) {
    DOM.scrollTop.classList.toggle('visible', y > 400);
  }
  updateStickyTabs(y);

  const heroH = DOM.heroSection ? DOM.heroSection.offsetHeight : 0;
  if (y < heroH - 100) { _highlightNav('#home'); return; }

  for (let i = 0; i < DOM.sections.length; i++) {
    const sec    = DOM.sections[i];
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
    if (DOM.menuSearch) DOM.menuSearch.blur();
    closeMobileNav();
    closeFavPanel();
    closeMapsPopup();
  }
});

/* ═══════════════════════════════════════════
   LAZY IMAGE ERROR FALLBACK
═══════════════════════════════════════════ */
function _initLazyImages() {
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.addEventListener('error', () => {
      img.style.opacity = '0.3';
    }, { once: true });
  });
}

/* ═══════════════════════════════════════════
   SMOOTH ANCHOR SCROLL — event delegation
═══════════════════════════════════════════ */
document.addEventListener('click', e => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;
  const target = document.querySelector(anchor.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  closeMobileNav();
});

/* ═══════════════════════════════════════════
   UTILITY HELPERS
═══════════════════════════════════════════ */
function _escHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function _debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
function init() {
  initDOM();
  initPageLoader();
  initOpenStatus();
  initStickyTabs();
  loadFavourites();
  injectFavButtons();
  updateFavCount();
  _buildItemCache();
  _buildTabCounts();
  _initLazyImages();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}