// main.js handles homepage rendering, search, category filtering, and client-side mod routing.
const modGrid = document.getElementById('modGrid');
const searchInput = document.getElementById('searchInput');
const searchSummary = document.getElementById('searchSummary');
const categoryToggle = document.getElementById('categoryToggle');
const categoryMenu = document.getElementById('categoryMenu');
const categoryLabel = document.getElementById('categoryLabel');
const categoryDropdown = document.getElementById('categoryDropdown');
let allMods = [];
let loadedCount = 0;
let selectedCategory = 'All';
const ORDERED_CATEGORIES = ['Performance', 'Texture Pack', 'Utility', 'Gameplay', 'Optimization', 'Other'];
const SEARCH_PLACEHOLDER_PHRASES = [
  'Search name or ID...',
  'Search the name of the mods...',
  'Search the ID of the mods...'
];
let placeholderTypingTimer = null;
let placeholderAnimationTimer = null;
let placeholderPhraseIndex = 0;

const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html';

// Load mods from data.json and initialize UI only on the homepage.
if (isHomepage) {
  window.addEventListener('DOMContentLoaded', loadMods);
  window.addEventListener('hashchange', handleHashChange);
}

const PAGE_SIZE = 10;

// Get current collection from hash (e.g., #1 or #2), returns null if no collection specified
function getCurrentCollection() {
  const hash = window.location.hash.slice(1); // Remove #
  if (hash && !isNaN(hash)) {
    return parseInt(hash);
  }
  return null;
}

// Update collection display header
function updateCollectionHeader() {
  const collection = getCurrentCollection();
  const header = document.querySelector('.explore-header > div > p.eyebrow');
  if (header) {
    if (collection) {
      header.textContent = `Collection #${collection}`;
    } else {
      header.textContent = 'Browse collection';
    }
  }
}

// Handle hash change (collection switching)
function handleHashChange() {
  loadedCount = 0;
  modGrid.innerHTML = '';
  const sentinel = document.getElementById('lazySentinel');
  if (sentinel) sentinel.remove();
  updateCollectionHeader();
  renderNextPage();
  setupLazyLoadObserver();
}

async function loadMods() {
  try {
    const response = await fetch('data.json');
    allMods = await response.json();
    loadedCount = 0;
    initializeCategoryDropdown();
    updateCollectionHeader();
    renderNextPage();

    // Lazy-load paging via IntersectionObserver (no backend required)
    setupLazyLoadObserver();
  } catch (error) {
    modGrid.innerHTML = '<p class="error-message">Unable to load data.json. Please check your files.</p>';
    console.error('Error loading data.json:', error);
  }
}

function getFilteredMods() {
  const searchQuery = searchInput.value.trim().toLowerCase();
  const currentCollection = getCurrentCollection();
  const isNumericQuery = /^[0-9]+$/.test(searchQuery);
  
  const result = allMods.filter(mod => {
    // Filter by collection if specified
    if (currentCollection && mod.collection !== currentCollection) {
      return false;
    }

    if (selectedCategory !== 'All' && mod.category !== selectedCategory) {
      return false;
    }

    if (!searchQuery) {
      return true;
    }

    const nameMatch = (mod.name || '').toLowerCase().includes(searchQuery)
      || (mod.slug || '').toLowerCase().includes(searchQuery);

    const idMatch = isNumericQuery && String(mod.id).includes(searchQuery);

    return nameMatch || idMatch;
  });

  // Ensure newest items (highest `id`) appear first
  result.sort((a, b) => (b.id || 0) - (a.id || 0));
  return result;
}

function updateSearchSummary(filtered) {
  if (!searchSummary) return;
  const query = searchInput.value.trim();
  const count = filtered.length;
  const categorySuffix = selectedCategory !== 'All' ? ` in "${selectedCategory}"` : '';

  if (!query) {
    searchSummary.textContent = `Showing ${count} ${count === 1 ? 'mod' : 'mods'}${categorySuffix}.`;
    return;
  }

  searchSummary.textContent = `${count} ${count === 1 ? 'result' : 'results'} for "${query}"${categorySuffix}.`;
}

function renderNextPage() {
  const filtered = getFilteredMods();

  if (!filtered.length) {
    modGrid.innerHTML = '<p class="error-message">No mods found. Try another search or category.</p>';
    if (searchSummary) {
      const query = searchInput.value.trim();
      searchSummary.textContent = query ? `No results for "${query}".` : 'No mods found.';
    }
    return;
  }

  updateSearchSummary(filtered);

  const targetCount = Math.min(filtered.length, loadedCount + PAGE_SIZE);
  const itemsToRender = filtered.slice(loadedCount, targetCount);

  if (!itemsToRender.length) {
    return;
  }

  if (loadedCount === 0) {
    modGrid.innerHTML = itemsToRender.map(renderModCard).join('');
  } else {
    modGrid.insertAdjacentHTML('beforeend', itemsToRender.map(renderModCard).join(''));
  }

  loadedCount = targetCount;
  ensureSentinel();
}

function renderModCard(mod) {
  return `
    <article class="mod-card">
      <div class="mod-card-hero" aria-hidden="true">
        <span class="category-badge">${mod.category}</span>
        <span class="id-badge">ID ${mod.id}</span>
      </div>
      <div class="mod-card-body">
        <div class="mod-card-title">
          <h3>${mod.name}</h3>
        </div>
        <div class="mod-card-meta">
          <span class="meta-chip meta-chip-version">Version ${mod.version}</span>
          <span class="meta-chip meta-chip-verified">Verified</span>
        </div>
        <p class="mod-card-description">${mod.description}</p>
        <div class="button-group">
          <a href="/${mod.id}" class="button button-primary download-button">
            <svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Get Mod
          </a>
        </div>
      </div>
    </article>
  `;
}

function ensureSentinel() {
  if (document.getElementById('lazySentinel')) return;
  const sentinel = document.createElement('div');
  sentinel.id = 'lazySentinel';
  sentinel.className = 'lazy-sentinel';
  modGrid.insertAdjacentElement('afterend', sentinel);
}

function setupLazyLoadObserver() {
  ensureSentinel();
  const sentinel = document.getElementById('lazySentinel');
  const observer = new IntersectionObserver(entries => {
    const entry = entries[0];
    if (entry && entry.isIntersecting) {
      // If everything is loaded, stop observing.
      const filtered = getFilteredMods();
      if (loadedCount >= filtered.length) return;
      renderNextPage();
    }
  }, { rootMargin: '600px 0px' });

  observer.observe(sentinel);
}

// (renderModGrid and old card rendering removed; we use renderNextPage + renderModCard for lazy paging) ab

// Filter mods based on search text only
function stopPlaceholderAnimation() {
  clearTimeout(placeholderTypingTimer);
  clearTimeout(placeholderAnimationTimer);
}

function startPlaceholderAnimation() {
  if (!searchInput || searchInput.value.trim()) return;
  stopPlaceholderAnimation();

  const typePhrase = phrase => {
    let charIndex = 0;
    const typeNextChar = () => {
      if (!searchInput || searchInput.value.trim()) {
        searchInput.placeholder = 'Search name or ID...';
        return;
      }

      searchInput.placeholder = phrase.slice(0, charIndex);
      if (charIndex <= phrase.length) {
        charIndex += 1;
        placeholderTypingTimer = setTimeout(typeNextChar, 45);
      } else {
        placeholderAnimationTimer = setTimeout(() => {
          placeholderPhraseIndex = (placeholderPhraseIndex + 1) % SEARCH_PLACEHOLDER_PHRASES.length;
          typePhrase(SEARCH_PLACEHOLDER_PHRASES[placeholderPhraseIndex]);
        }, 1200);
      }
    };

    typeNextChar();
  };

  typePhrase(SEARCH_PLACEHOLDER_PHRASES[placeholderPhraseIndex]);
}

function filterMods() {
  loadedCount = 0;
  modGrid.dataset.renderState = 'first';
  modGrid.innerHTML = '';
  const sentinel = document.getElementById('lazySentinel');
  if (sentinel) sentinel.remove();
  renderNextPage();
  setupLazyLoadObserver();
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    filterMods();
    if (searchInput.value.trim()) {
      stopPlaceholderAnimation();
    } else {
      startPlaceholderAnimation();
    }
  });
  searchInput.addEventListener('focus', () => {
    if (!searchInput.value.trim()) {
      startPlaceholderAnimation();
    }
  });
  searchInput.addEventListener('blur', () => {
    if (!searchInput.value.trim()) {
      startPlaceholderAnimation();
    }
  });
  startPlaceholderAnimation();
}

if (categoryToggle) {
  categoryToggle.addEventListener('click', () => {
    const isExpanded = categoryToggle.getAttribute('aria-expanded') === 'true';
    categoryToggle.setAttribute('aria-expanded', String(!isExpanded));
    categoryMenu.classList.toggle('open', !isExpanded);
  });
}

function closeCategoryMenu() {
  if (!categoryToggle || !categoryMenu) return;
  categoryToggle.setAttribute('aria-expanded', 'false');
  categoryMenu.classList.remove('open');
}

function setCategory(category) {
  selectedCategory = category || 'All';
  if (categoryLabel) {
    categoryLabel.textContent = selectedCategory === 'All' ? 'All categories' : selectedCategory;
  }
  renderCategoryOptions();
  filterMods();
}

function attachDocumentClickHandler() {
  document.addEventListener('click', event => {
    if (!categoryDropdown || !categoryToggle || !categoryMenu) return;
    if (categoryDropdown.contains(event.target)) return;
    closeCategoryMenu();
  });
}

function getCategoriesFromData() {
  const categories = new Set();
  allMods.forEach(mod => {
    if (mod.category) categories.add(mod.category);
  });

  const ordered = ORDERED_CATEGORIES.filter(category => categories.has(category));
  categories.forEach(category => {
    if (!ordered.includes(category)) ordered.push(category);
  });

  return ordered;
}

function renderCategoryOptions() {
  if (!categoryMenu) return;
  const categories = getCategoriesFromData();
  categoryMenu.innerHTML = '';

  const addOption = (value, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dropdown-item' + (value === selectedCategory ? ' selected' : '');
    button.setAttribute('role', 'option');
    button.dataset.category = value;
    button.textContent = label;
    button.addEventListener('click', () => {
      setCategory(value);
      closeCategoryMenu();
    });
    categoryMenu.appendChild(button);
  };

  addOption('All', 'All categories');
  categories.forEach(category => addOption(category, category));
}

function initializeCategoryDropdown() {
  renderCategoryOptions();
  attachDocumentClickHandler();

  if (categoryToggle) {
    categoryToggle.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeCategoryMenu();
      }
    });
  }
}



