'use strict';

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
   Keeps tab counts accurate even after filters
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
   DOWNLOAD MENU — PDF
═══════════════════════════════════════════ */
function downloadMenu() {
  const sections = [];

  DOM.menuCats.forEach(cat => {
    const catName = cat.querySelector('.cat-name')?.textContent || '';
    const items   = [];
    cat.querySelectorAll('.menu-item').forEach(item => {
      const name  = item.querySelector('.item-name')?.textContent.trim()  || '';
      const price = item.querySelector('.item-price')?.textContent.trim() || '';
      if (name) items.push({ name, price });
    });
    if (items.length) sections.push({ catName, items });
  });

  const html =
'<!DOCTYPE html>' +
'<html lang="en"><head><meta charset="UTF-8">' +
'<title>Snack Station Menu</title>' +
'<style>' +
'*{margin:0;padding:0;box-sizing:border-box}' +
'body{font-family:"DM Sans",Arial,sans-serif;background:#fff;color:#111;padding:32px;max-width:800px;margin:0 auto}' +
'.header{text-align:center;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #f97316}' +
'.header h1{font-size:36px;font-weight:800;color:#f97316;letter-spacing:-1px}' +
'.header p{color:#666;font-size:14px;margin-top:6px}' +
'.header .timing{display:inline-block;margin-top:10px;padding:6px 18px;background:#f97316;color:white;border-radius:999px;font-size:13px;font-weight:600}' +
'.cat-section{margin-bottom:28px}' +
'.cat-title{font-size:18px;font-weight:700;color:#111;padding:8px 0;border-bottom:2px solid #f0f0f0;margin-bottom:12px;display:flex;align-items:center;gap:8px}' +
'.cat-title::before{content:"";width:4px;height:18px;background:#f97316;border-radius:2px;display:inline-block}' +
'.item-row{display:flex;justify-content:space-between;align-items:center;padding:7px 8px;border-radius:6px;font-size:13.5px}' +
'.item-row:nth-child(even){background:#f9f9f9}' +
'.item-dot{width:8px;height:8px;border:1.5px solid #22c55e;border-radius:2px;margin-right:8px;flex-shrink:0;display:inline-block}' +
'.item-name-col{display:flex;align-items:center}' +
'.item-price-col{font-weight:700;color:#f97316;flex-shrink:0}' +
'.footer{margin-top:36px;padding-top:16px;border-top:2px solid #f0f0f0;text-align:center;color:#888;font-size:12px;line-height:1.7}' +
'.veg-badge{display:inline-block;padding:3px 10px;background:#dcfce7;color:#16a34a;border-radius:999px;font-size:11px;font-weight:600;margin-top:8px}' +
'@media print{body{padding:20px}.cat-section{page-break-inside:avoid}}' +
'</style></head><body>' +
'<div class="header">' +
'<h1>🍔 SNACK STATION</h1>' +
'<p>KHANEKA THIKANA · Vejalpur, Ahmedabad</p>' +
'<div class="timing">⏰ Open 8:00 PM – 3:00 AM · Every Night</div>' +
'<div class="veg-badge">🌿 100% Pure Veg Menu</div>' +
'</div>' +
sections.map(function(s) {
  return '<div class="cat-section">' +
    '<div class="cat-title">' + _escHtml(s.catName) + '</div>' +
    s.items.map(function(it) {
      return '<div class="item-row">' +
        '<div class="item-name-col"><span class="item-dot"></span>' + _escHtml(it.name) + '</div>' +
        '<div class="item-price-col">' + _escHtml(it.price) + '</div>' +
        '</div>';
    }).join('') +
    '</div>';
}).join('') +
'<div class="footer">' +
'<strong>📞 8460891897 | 9081081033</strong><br>' +
'📍 Kalpesh Rang Upvan Society, Opp Abhishek Xerox, Vejalpur, Ahmedabad – 380051<br>' +
'📸 Instagram: @snack_station84<br><br>' +
'<em>All prices inclusive of taxes · Menu subject to change</em>' +
'</div></body></html>';

  const win = window.open('', '_blank');
  if (!win) { showToast('⚠️ Please allow popups to download menu'); return; }
  win.document.write(html);
  win.document.close();
  win.addEventListener('load', () => { setTimeout(() => win.print(), 400); });
  showToast('📥 Menu opening for download…');
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
  _buildItemCache();     /* build immediately — no scroll needed */
  _buildTabCounts();     /* dynamic tab counts */
  _initLazyImages();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}