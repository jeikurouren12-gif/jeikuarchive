/*
  admin.js manages the admin panel.
  It verifies the password via a Pages function, then loads and saves mods through the API.
*/
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const loginMessage = document.getElementById('loginMessage');
const adminLoginSection = document.getElementById('adminLoginSection');
const adminContent = document.getElementById('adminContent');
const logoutButton = document.getElementById('logoutButton');
const modForm = document.getElementById('modForm');
const adminModList = document.getElementById('adminModList');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminStatus = document.getElementById('adminStatus');
const refreshButton = document.getElementById('refreshButton');
const cancelEditButton = document.getElementById('cancelEditButton');
const deleteSelectedButton = document.getElementById('deleteSelectedButton');
const applyLockerButton = document.getElementById('applyLockerButton');
const selectAllButton = document.getElementById('selectAllButton');
const selectedCountLabel = document.getElementById('selectedCount');
const adminFormPrevButton = document.getElementById('adminFormPrevButton');
const adminFormNextButton = document.getElementById('adminFormNextButton');
const saveModButton = document.getElementById('saveModButton');
const adminFormPageLabel = document.getElementById('adminFormPageLabel');
const adminFormPages = Array.from(document.querySelectorAll('.admin-form-page'));

const editModId = document.getElementById('editModId');
const modIdInput = document.getElementById('modIdInput');
const nameInput = document.getElementById('nameInput');
const labelInput = document.getElementById('labelInput');
const versionInput = document.getElementById('versionInput');
const gameEditionInput = document.getElementById('gameEditionInput');
const mcVersionInput = document.getElementById('mcVersionInput');
const categoryInput = document.getElementById('categoryInput');
const collectionInput = document.getElementById('collectionInput');
const descriptionInput = document.getElementById('descriptionInput');
const downloadInput = document.getElementById('downloadInput');
const lockerTaskType1 = document.getElementById('lockerTaskType1');
const lockerTaskUrl1 = document.getElementById('lockerTaskUrl1');
const lockerTaskType2 = document.getElementById('lockerTaskType2');
const lockerTaskUrl2 = document.getElementById('lockerTaskUrl2');
const lockerTaskType3 = document.getElementById('lockerTaskType3');
const lockerTaskUrl3 = document.getElementById('lockerTaskUrl3');
const lockerRequiredCount = document.getElementById('lockerRequiredCount');
const lockerDelayMs = document.getElementById('lockerDelayMs');
const bulkImportInput = document.getElementById('bulkImportInput');
const importJsonButton = document.getElementById('importJsonButton');
const newCategoryInput = document.getElementById('newCategoryInput');
const addCategoryButton = document.getElementById('addCategoryButton');
const categoryList = document.getElementById('categoryList');
const categoryManager = document.querySelector('.category-manager');
let mods = [];
let categories = [];
let currentPassword = null;
let filteredMods = [];
const selectedModIds = new Set();

function persistAdminSession(password) {
  localStorage.setItem('jeikuarchive-admin-password', password);
}

function clearAdminSession() {
  localStorage.removeItem('jeikuarchive-admin-password');
}

function restoreAdminSession() {
  const savedPassword = localStorage.getItem('jeikuarchive-admin-password');
  return savedPassword || null;
}

function showLogin(message = 'Enter your admin password to continue.') {
  adminLoginSection.classList.remove('admin-hidden');
  adminContent.classList.add('admin-hidden');
  loginMessage.textContent = message;
}

function showAdmin() {
  adminLoginSection.classList.add('admin-hidden');
  adminContent.classList.remove('admin-hidden');
  adminStatus.textContent = 'Authenticated. Loading mods...';
}

let currentAdminPage = 1;

function updateAdminFormPage() {
  if (!adminFormPages.length) return;

  adminFormPages.forEach((page, index) => {
    const isActive = index === currentAdminPage - 1;
    page.classList.toggle('admin-form-page-hidden', !isActive);
    page.setAttribute('aria-hidden', String(!isActive));
  });

  if (adminFormPageLabel) {
    adminFormPageLabel.textContent = `Page ${currentAdminPage} of ${adminFormPages.length}`;
  }

  if (adminFormPrevButton) {
    adminFormPrevButton.hidden = currentAdminPage === 1;
  }

  if (adminFormNextButton) {
    adminFormNextButton.hidden = currentAdminPage === adminFormPages.length;
  }

  if (saveModButton) {
    saveModButton.hidden = currentAdminPage !== adminFormPages.length;
  }
}

function goToAdminPage(pageNumber) {
  currentAdminPage = Math.min(Math.max(pageNumber, 1), adminFormPages.length);
  updateAdminFormPage();
}

function resetForm() {
  editModId.value = '';
  modIdInput.value = '';
  modForm.reset();
  currentAdminPage = 1;
  updateAdminFormPage();
  adminStatus.textContent = 'Ready to add a new mod.';
}

function getDefaultTaskUrl(type) {
  const taskUrls = {
    follow_instagram_account: 'https://www.instagram.com/jeikuarchivemc/',
    like_instagram_post: 'https://www.instagram.com/jeikuarchivemc/',
    like_instagram_reel: 'https://www.instagram.com/jeikuarchivemc/',
    follow_facebook_page: 'https://www.facebook.com/profile.php?id=61585338801289',
    like_facebook_post: 'https://www.facebook.com/profile.php?id=61585338801289',
    follow_tiktok_account: 'https://www.tiktok.com/@jeikuarchive',
    like_tiktok_video: 'https://www.tiktok.com/@jeikuarchive',
    follow_youtube_channel: 'https://www.youtube.com/@jeikuarchive',
    subscribe_youtube_channel: 'https://www.youtube.com/@jeikuarchive',
    like_youtube_video: 'https://www.youtube.com/@jeikuarchive',
    watch_youtube_video: 'https://www.youtube.com/@jeikuarchive',
    watch_tiktok_video: 'https://www.tiktok.com/@jeikuarchive',
    watch_instagram_reel: 'https://www.instagram.com/jeikuarchivemc/',
    watch_facebook_video: 'https://www.facebook.com/profile.php?id=61585338801289',
    visit_instagram_profile: 'https://www.instagram.com/jeikuarchivemc/',
    visit_facebook_page: 'https://www.facebook.com/profile.php?id=61585338801289',
    visit_tiktok_profile: 'https://www.tiktok.com/@jeikuarchive',
    visit_youtube_channel: 'https://www.youtube.com/@jeikuarchive',
    share_instagram_post: 'https://www.instagram.com/jeikuarchivemc/',
    share_facebook_post: 'https://www.facebook.com/profile.php?id=61585338801289',
    share_tiktok_video: 'https://www.tiktok.com/@jeikuarchive',
    share_youtube_video: 'https://www.youtube.com/@jeikuarchive',
    comment_on_instagram_post: 'https://www.instagram.com/jeikuarchivemc/',
    comment_on_facebook_post: 'https://www.facebook.com/profile.php?id=61585338801289',
    comment_on_tiktok_video: 'https://www.tiktok.com/@jeikuarchive',
    comment_on_youtube_video: 'https://www.youtube.com/@jeikuarchive',
    follow_tiktok_user: 'https://www.tiktok.com/@jeikuarchive',
    join_discord: 'https://www.instagram.com/jeikuarchivemc/',
    join_telegram: 'https://www.instagram.com/jeikuarchivemc/',
    visit_website: 'https://www.instagram.com/jeikuarchivemc/',
    follow_instagram: 'https://www.instagram.com/jeikuarchivemc/'
  };

  return taskUrls[type] || '';
}

function getTaskLabel(type) {
  if (type === 'follow_instagram_account') return 'Follow Instagram account';
  if (type === 'like_instagram_post') return 'Like Instagram post';
  if (type === 'like_instagram_reel') return 'Like Instagram Reel';
  if (type === 'follow_facebook_page') return 'Follow Facebook page';
  if (type === 'like_facebook_post') return 'Like Facebook post';
  if (type === 'follow_tiktok_account') return 'Follow TikTok account';
  if (type === 'like_tiktok_video') return 'Like TikTok video';
  if (type === 'follow_youtube_channel') return 'Follow YouTube channel';
  if (type === 'subscribe_youtube_channel') return 'Subscribe to YouTube channel';
  if (type === 'like_youtube_video') return 'Like YouTube video';
  if (type === 'watch_youtube_video') return 'Watch YouTube video';
  if (type === 'watch_tiktok_video') return 'Watch TikTok video';
  if (type === 'watch_instagram_reel') return 'Watch Instagram Reel';
  if (type === 'watch_facebook_video') return 'Watch Facebook video';
  if (type === 'visit_instagram_profile') return 'Visit Instagram profile';
  if (type === 'visit_facebook_page') return 'Visit Facebook page';
  if (type === 'visit_tiktok_profile') return 'Visit TikTok profile';
  if (type === 'visit_youtube_channel') return 'Visit YouTube channel';
  if (type === 'share_instagram_post') return 'Share Instagram post';
  if (type === 'share_facebook_post') return 'Share Facebook post';
  if (type === 'share_tiktok_video') return 'Share TikTok video';
  if (type === 'share_youtube_video') return 'Share YouTube video';
  if (type === 'comment_on_instagram_post') return 'Comment on Instagram post';
  if (type === 'comment_on_facebook_post') return 'Comment on Facebook post';
  if (type === 'comment_on_tiktok_video') return 'Comment on TikTok video';
  if (type === 'comment_on_youtube_video') return 'Comment on YouTube video';
  if (type === 'follow_tiktok_user') return 'Follow TikTok User';
  if (type === 'join_discord') return 'Join Discord';
  if (type === 'join_telegram') return 'Join Telegram';
  if (type === 'visit_website') return 'Visit Website';
  if (type === 'follow_instagram') return 'Follow on Instagram';
  return '';
}

function bindTaskUrlAutofill(taskTypeField, taskUrlField) {
  if (!taskTypeField || !taskUrlField) return;

  const applyDefaultUrl = () => {
    const type = taskTypeField.value;
    if (!type) {
      return;
    }
    const preset = getDefaultTaskUrl(type);
    if (preset && !taskUrlField.value.trim()) {
      taskUrlField.value = preset;
    }
  };

  taskTypeField.addEventListener('change', applyDefaultUrl);
  taskTypeField.addEventListener('input', applyDefaultUrl);
}

function updateSelectionCount() {
  const count = selectedModIds.size;
  selectedCountLabel.textContent = `${count} selected`;
  deleteSelectedButton.disabled = count === 0;
  applyLockerButton.disabled = count === 0;
  updateSelectAllButton();
}

function updateSelectAllButton() {
  if (!selectAllButton) return;
  const filteredCount = filteredMods.length;
  if (filteredCount === 0) {
    selectAllButton.textContent = 'Select all';
    selectAllButton.disabled = true;
    return;
  }

  const selectedFilteredCount = filteredMods.filter(mod => selectedModIds.has(mod.id)).length;
  selectAllButton.textContent = selectedFilteredCount === filteredCount ? 'Clear selection' : `Select all (${filteredCount})`;
  selectAllButton.disabled = false;
}

function toggleSelectAll() {
  const filteredIds = getFilteredMods().map(mod => mod.id);
  if (filteredIds.length === 0) {
    return;
  }

  const allSelected = filteredIds.every(id => selectedModIds.has(id));
  if (allSelected) {
    filteredIds.forEach(id => selectedModIds.delete(id));
  } else {
    filteredIds.forEach(id => selectedModIds.add(id));
  }

  renderAdminList();
}

function applyLockerTasksToSelected() {
  if (selectedModIds.size === 0) {
    adminStatus.textContent = 'Select one or more mods before applying tasks.';
    return;
  }

  const locker = buildContentLockerFromForm();
  const updatedMods = mods.map(mod => {
    if (!selectedModIds.has(mod.id)) return mod;
    return { ...mod, contentLocker: locker };
  });

  saveModsToGitHub(updatedMods);
  adminStatus.textContent = `Applied locker tasks to ${selectedModIds.size} selected mod${selectedModIds.size > 1 ? 's' : ''}.`;
}

function deleteSelectedMods() {
  if (selectedModIds.size === 0) {
    adminStatus.textContent = 'Select one or more mods before deleting.';
    return;
  }

  const selectedMods = mods.filter(mod => selectedModIds.has(mod.id));
  const previewNames = selectedMods.slice(0, 3).map(mod => mod.name).join(', ');
  const suffix = selectedMods.length > 3 ? `, and ${selectedMods.length - 3} more` : '';
  const confirmed = confirmAction(`Delete ${selectedMods.length} selected mod${selectedMods.length > 1 ? 's' : ''} (${previewNames}${suffix})? This action cannot be undone.`);
  if (!confirmed) {
    adminStatus.textContent = 'Bulk delete cancelled.';
    return;
  }

  const updatedMods = mods.filter(mod => !selectedModIds.has(mod.id));
  selectedModIds.clear();
  saveModsToGitHub(updatedMods);
  adminStatus.textContent = `Deleted ${selectedMods.length} selected mod${selectedMods.length > 1 ? 's' : ''}.`;
}

function parseDelayStringToMs(value, fallback = 15000) {
  if (value === null || value === undefined) return fallback;

  const text = String(value).trim();
  if (!text) return fallback;

  const timeMatch = text.match(/^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/i);
  if (timeMatch) {
    let hours = Number.parseInt(timeMatch[1], 10);
    const minutes = Number.parseInt(timeMatch[2] || '0', 10);
    const meridiem = (timeMatch[3] || '').toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    const now = new Date();
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);

    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    return Math.max(target.getTime() - now.getTime(), 1000);
  }

  const unitMatch = text.match(/^\s*(\d+(?:\.\d+)?)\s*(ms|s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours)?\s*$/i);
  if (unitMatch) {
    const amount = Number.parseFloat(unitMatch[1]);
    const unit = (unitMatch[2] || 'ms').toLowerCase();

    if (unit.startsWith('ms')) return Math.max(amount, 1000);
    if (unit.startsWith('s')) return Math.max(amount * 1000, 1000);
    if (unit.startsWith('m')) return Math.max(amount * 60 * 1000, 1000);
    if (unit.startsWith('h')) return Math.max(amount * 60 * 60 * 1000, 1000);
  }

  const numeric = Number.parseInt(text, 10);
  if (Number.isFinite(numeric)) return Math.max(numeric, 1000);

  return fallback;
}

function getLockerDelayValue(rawValue, fallback = 15000) {
  return parseDelayStringToMs(rawValue, fallback);
}

function buildContentLockerFromForm(existingMod = null) {
  const tasks = [];
  const taskConfigs = [
    { type: lockerTaskType1.value, url: lockerTaskUrl1.value.trim() },
    { type: lockerTaskType2.value, url: lockerTaskUrl2.value.trim() },
    { type: lockerTaskType3.value, url: lockerTaskUrl3.value.trim() }
  ];

  taskConfigs.forEach(({ type, url }) => {
    if (!type) return;
    if (!url) return;
    tasks.push({
      type,
      label: getTaskLabel(type),
      url
    });
  });

  const selectedRequiredCount = Number.parseInt(lockerRequiredCount?.value || '1', 10);
  const requiredCount = tasks.length > 0 ? Math.min(Math.max(selectedRequiredCount || 1, 1), tasks.length) : 0;
  const delay = getLockerDelayValue(lockerDelayMs?.value, existingMod?.contentLocker?.delay || 15000);

  if (tasks.length > 0) {
    return { tasks, requiredCount, delay };
  }

  return existingMod && existingMod.contentLocker ? existingMod.contentLocker : { tasks: [], requiredCount: 0, delay: 15000 };
}

function populateLockerForm(mod) {
  const tasks = Array.isArray(mod?.contentLocker?.tasks) ? mod.contentLocker.tasks : [];
  const firstTask = tasks[0] || {};
  const secondTask = tasks[1] || {};
  const thirdTask = tasks[2] || {};
  const requiredCount = Number.isInteger(mod?.contentLocker?.requiredCount) ? mod.contentLocker.requiredCount : Math.min(tasks.length || 1, 1);
  const delay = Number.isFinite(mod?.contentLocker?.delay) ? mod.contentLocker.delay : 15000;

  lockerTaskType1.value = firstTask.type || '';
  lockerTaskUrl1.value = firstTask.url || '';
  lockerTaskType2.value = secondTask.type || '';
  lockerTaskUrl2.value = secondTask.url || '';
  lockerTaskType3.value = thirdTask.type || '';
  lockerTaskUrl3.value = thirdTask.url || '';
  lockerRequiredCount.value = String(Math.min(Math.max(requiredCount, 1), Math.max(tasks.length, 1)));
  lockerDelayMs.value = String(Math.max(delay, 1000));
}

function createSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getNextId() {
  const maxId = mods.reduce((max, mod) => Math.max(max, mod.id), 0);
  return maxId + 1;
}

function getHighestCollection() {
  const maxCollection = mods.reduce((max, mod) => Math.max(max, mod.collection || 1), 1);
  return maxCollection;
}

function normalizeImportedContentLocker(rawLocker) {
  const rawTasks = Array.isArray(rawLocker?.tasks) ? rawLocker.tasks : [];
  const tasks = rawTasks
    .filter(Boolean)
    .map(task => ({
      type: typeof task.type === 'string' ? task.type : '',
      label: typeof task.label === 'string' && task.label.trim() ? task.label.trim() : getTaskLabel(task.type),
      url: typeof task.url === 'string' ? task.url.trim() : ''
    }))
    .filter(task => task.type && task.url);

  const rawRequiredCount = Number.parseInt(rawLocker?.requiredCount, 10);
  const requiredCount = tasks.length > 0
    ? Math.min(Math.max(Number.isFinite(rawRequiredCount) ? rawRequiredCount : tasks.length, 1), tasks.length)
    : 0;

  const rawDelay = Number.parseInt(rawLocker?.delay, 10);
  const delay = Number.isFinite(rawDelay) ? Math.max(rawDelay, 1000) : 15000;

  return { tasks, requiredCount, delay };
}

function buildImportedModObject(rawMod, index) {
  const baseId = getNextId() + index;
  const fallbackName = `Imported Mod ${baseId}`;
  const name = typeof rawMod?.name === 'string' && rawMod.name.trim() ? rawMod.name.trim() : fallbackName;
  const slug = typeof rawMod?.slug === 'string' && rawMod.slug.trim()
    ? rawMod.slug.trim()
    : createSlug(name);

  const requestedCollection = Number(rawMod?.collection);
  const collection = Number.isInteger(requestedCollection) && requestedCollection > 0
    ? requestedCollection
    : getHighestCollection();

  const label = typeof rawMod?.label === 'string' && rawMod.label.trim() ? rawMod.label.trim() : name;
  const gameEdition = typeof rawMod?.game_edition === 'string' && rawMod.game_edition.trim()
    ? rawMod.game_edition.trim()
    : (typeof rawMod?.platform === 'string' && rawMod.platform.trim() ? rawMod.platform.trim() : 'Unknown');
  const mcVersion = typeof rawMod?.mcVersion === 'string' && rawMod.mcVersion.trim() ? rawMod.mcVersion.trim() : '';

  return {
    id: baseId,
    slug,
    label,
    name,
    version: typeof rawMod?.version === 'string' ? rawMod.version.trim() : '',
    game_edition: gameEdition,
    mcVersion,
    category: typeof rawMod?.category === 'string' && rawMod.category.trim() ? rawMod.category.trim() : 'Other',
    description: typeof rawMod?.description === 'string' ? rawMod.description.trim() : '',
    download: typeof rawMod?.download === 'string' ? rawMod.download.trim() : '',
    collection,
    contentLocker: normalizeImportedContentLocker(rawMod?.contentLocker)
  };
}

function importModsFromJson(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('Paste a JSON array before importing.');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new Error('The JSON is invalid. Please check the formatting and try again.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Please paste a JSON array of mods.');
  }

  return parsed.map((rawMod, index) => buildImportedModObject(rawMod, index));
}

function buildModObject() {
  const enteredId = modIdInput.value.trim();
  const id = enteredId ? Number(enteredId) : (editModId.value ? Number(editModId.value) : getNextId());
  const name = nameInput.value.trim();
  const existingMod = mods.find(mod => mod.id === id) || null;
  const label = (labelInput.value || '').trim() || name;
  const gameEdition = (gameEditionInput.value || 'Unknown').trim() || 'Unknown';
  const mcVersion = (mcVersionInput.value || '').trim();

  return {
    id,
    slug: createSlug(name),
    label,
    name,
    version: versionInput.value.trim(),
    game_edition: gameEdition,
    mcVersion,
    category: categoryInput.value,
    description: descriptionInput.value.trim(),
    download: downloadInput.value.trim(),
    collection: Number(collectionInput.value),
    contentLocker: buildContentLockerFromForm(existingMod)
  };
}

function getCategoriesFromMods() {
  return mods.map(mod => mod.category).filter(Boolean);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatCategoryLabel(category) {
  return category.replace(' / ', ': ');
}

function renderCategoryInput() {
  const selectedValue = categoryInput.value;
  categoryInput.innerHTML = categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(formatCategoryLabel(category))}</option>`).join('');
  if (categories.includes(selectedValue)) {
    categoryInput.value = selectedValue;
  }
}

function renderCategoryList() {
  if (!categoryList) return;
  const groups = new Map();
  categories.forEach(category => {
    const separatorIndex = category.indexOf(' / ');
    const group = separatorIndex === -1 ? 'Other categories' : category.slice(0, separatorIndex);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(category);
  });

  categoryList.innerHTML = [...groups.entries()].map(([group, groupCategories]) => `
    <details class="category-group">
      <summary>${escapeHtml(group)} <span>${groupCategories.length}</span></summary>
      <div class="category-group-items">
        ${groupCategories.map(category => {
          const inUse = getCategoriesFromMods().includes(category);
          const deleteTitle = inUse ? 'This category is used by a mod' : 'Delete category';
          return `<div class="category-list-item">
            <span>${escapeHtml(formatCategoryLabel(category))}</span>
            <button class="category-delete-button" type="button" aria-label="Delete ${escapeHtml(category)}" title="${deleteTitle}" data-category="${escapeHtml(category)}" ${inUse ? 'disabled' : ''}>×</button>
          </div>`;
        }).join('')}
      </div>
    </details>
  `).join('');

  categoryList.querySelectorAll('.category-group').forEach(group => {
    group.addEventListener('toggle', () => {
      if (!group.open) return;
      categoryList.querySelectorAll('.category-group[open]').forEach(otherGroup => {
        if (otherGroup !== group) otherGroup.open = false;
      });
    });
  });
}

async function saveCategories() {
  await saveModsToGitHub(mods, categories);
}

async function addCategory() {
  const category = newCategoryInput.value.trim();
  if (!category) return;
  if (categories.some(existing => existing.toLowerCase() === category.toLowerCase())) {
    adminStatus.textContent = 'That category already exists.';
    return;
  }

  categories.push(category);
  newCategoryInput.value = '';
  renderCategoryInput();
  renderCategoryList();
  await saveCategories();
}

async function verifyPassword(password) {
  try {
    const response = await fetch('/api/verify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const responseText = await response.text();
    let result = null;
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Password verify parse error:', responseText);
      return { success: false, rateLimited: false };
    }

    if (response.status === 429) {
      return {
        success: false,
        rateLimited: true,
        retryAfter: result.retryAfter || 0
      };
    }

    return {
      success: response.ok && result.success === true,
      rateLimited: false
    };
  } catch (error) {
    console.error('Password verification failed:', error);
    return { success: false, rateLimited: false };
  }
}

async function fetchMods() {
  if (!currentPassword) {
    showLogin();
    return;
  }

  try {
    const [modsResponse, categoriesResponse] = await Promise.all([
      fetch('/data.json'),
      fetch('/categories.json')
    ]);
    mods = await modsResponse.json();
    categories = categoriesResponse.ok ? await categoriesResponse.json() : [];
    categories = [...new Set([...categories.filter(category => typeof category === 'string' && category.trim()), ...getCategoriesFromMods()])];
    mods.sort((a, b) => b.id - a.id);
    renderCategoryInput();
    renderCategoryList();
    renderAdminList();
    adminStatus.textContent = 'Mods loaded successfully.';
  } catch (error) {
    adminStatus.textContent = 'Unable to load data.json. Make sure the file exists.';
    console.error('Error fetching data.json:', error);
  }
}

function getFilteredMods() {
  const query = (adminSearchInput?.value || '').trim().toLowerCase();
  return mods
    .filter(mod => {
      if (!query) return true;
      return `${mod.name} ${mod.version} ${mod.category} ${mod.description}`.toLowerCase().includes(query);
    })
    .sort((a, b) => b.id - a.id);
}

function renderAdminList() {
  filteredMods = getFilteredMods();
  if (filteredMods.length === 0) {
    adminModList.innerHTML = '<p class="admin-empty">No mods found.</p>';
    updateSelectionCount();
    return;
  }

  adminModList.innerHTML = filteredMods.map(renderAdminItem).join('');
  updateSelectionCount();
}

function renderAdminItem(mod) {
  const lockerTasks = Array.isArray(mod.contentLocker?.tasks) ? mod.contentLocker.tasks : [];

  return `
    <div class="admin-mod-item" tabindex="0">
      <div class="admin-mod-row">
        <div class="admin-mod-select-wrap">
          <label class="admin-mod-select-label" aria-label="Select mod ${mod.name}">
            <input type="checkbox" class="admin-mod-select" data-id="${mod.id}" ${selectedModIds.has(mod.id) ? 'checked' : ''}>
          </label>
        </div>
        <div class="admin-mod-main">
          <h3>${mod.label || mod.name}</h3>
          <p>ID: ${mod.id}</p>
          <p>${mod.version} • ${mod.category} • ${mod.game_edition || mod.platform || 'Unknown'}</p>
        </div>
        <div class="admin-mod-actions">
          <button class="button button-secondary" type="button" data-action="edit" data-id="${mod.id}">Edit</button>
          <button class="button button-secondary" type="button" data-action="copy-link" data-id="${mod.id}">Copy Link</button>
          <button class="button button-danger" type="button" data-action="delete" data-id="${mod.id}">Delete</button>
        </div>
      </div>

      <div class="admin-mod-meta">
        <div class="admin-mod-meta-summary">More details</div>
        <div class="admin-mod-meta-panel">
          <p>${mod.description}</p>
          <div class="admin-meta-pills">
            <span class="label-pill">Slug: ${mod.slug}</span>
            <span class="label-pill">Game Edition: ${mod.game_edition || mod.platform || 'Unknown'}</span>
            <span class="label-pill">MC Version: ${mod.mcVersion || 'Unknown'}</span>
            <span class="label-pill">Collection: #${mod.collection || 1}</span>
            ${lockerTasks.length > 0 ? `<span class="label-pill">Locker: ${lockerTasks.length} task${lockerTasks.length > 1 ? 's' : ''}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}


async function saveModsToGitHub(updatedMods, updatedCategories = categories) {
  if (!currentPassword) {
    adminStatus.textContent = 'You must log in before saving changes.';
    return;
  }

  adminStatus.textContent = 'Saving changes to GitHub...';
  try {
    const response = await fetch('/api/update-mods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mods: updatedMods, categories: updatedCategories, password: currentPassword })
    });

    const responseText = await response.text();
    console.log('update-mods response', response.status, responseText);

    let result = {};
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid response from update API: ${responseText}`);
      }
    }

    if (!response.ok) {
      throw new Error(result.error || `GitHub API update failed (${response.status}): ${responseText}`);
    }

    adminStatus.textContent = 'Saved successfully. Refreshing list...';
    mods = updatedMods;
    categories = updatedCategories;
    renderCategoryInput();
    renderCategoryList();
    renderAdminList();
    resetForm();
  } catch (error) {
    adminStatus.textContent = `Save failed: ${error.message}`;
    console.error('Error saving mods:', error);
  }
}

function confirmAction(message) {
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return window.confirm(message);
  }
  return true;
}

function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    return;
  }

  navigator.clipboard.writeText(text).catch(error => {
    console.error('Clipboard copy failed:', error);
  });
}

function getModPublicUrl(mod) {
  const host = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? window.location.origin
    : 'https://jeikuarchive.com';
  return `${host}/${mod.id}`;
}

function updateModsList(updatedMods) {
  saveModsToGitHub(updatedMods);
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const password = passwordInput.value.trim();
  if (!password) {
    loginMessage.textContent = 'Please enter the admin password.';
    return;
  }

  loginMessage.textContent = 'Checking password...';
  const verification = await verifyPassword(password);
  if (verification.rateLimited) {
    const retrySeconds = verification.retryAfter ? ` Please wait ${verification.retryAfter} seconds.` : ' Please wait a few minutes.';
    loginMessage.textContent = `Too many attempts.${retrySeconds}`;
    return;
  }

  if (!verification.success) {
    loginMessage.textContent = 'Invalid password. Please try again.';
    return;
  }

  currentPassword = password;
  persistAdminSession(password);
  loginMessage.textContent = '';
  showAdmin();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  await fetchMods();
});

modForm.addEventListener('keydown', event => {
  const isEnter = event.key === 'Enter';
  const isTextArea = event.target && event.target.closest && event.target.closest('textarea');
  if (!isEnter || event.shiftKey || isTextArea) {
    return;
  }

  if (currentAdminPage < adminFormPages.length) {
    event.preventDefault();
    goToAdminPage(currentAdminPage + 1);
  }
});

// Handle add / edit mod form submission without reloading the page
modForm.addEventListener('submit', async event => {
  event.preventDefault();

  if (currentAdminPage < adminFormPages.length) {
    goToAdminPage(currentAdminPage + 1);
    return;
  }

  const modObj = buildModObject();
  const targetName = modObj.name || 'this mod';
  const confirmed = confirmAction(`Save changes for "${targetName}"? This will update the catalog.`);
  if (!confirmed) {
    adminStatus.textContent = 'Save cancelled.';
    return;
  }

  let updatedMods = [];
  if (editModId.value) {
    const existingMod = mods.find(mod => mod.id === modObj.id);
    if (existingMod) {
      updatedMods = mods.map(m => (m.id === modObj.id ? modObj : m));
    } else {
      updatedMods = mods.concat([modObj]);
    }
  } else {
    updatedMods = mods.concat([modObj]);
  }

  updateModsList(updatedMods);
});

importJsonButton.addEventListener('click', async () => {
  try {
    const importedMods = importModsFromJson(bulkImportInput.value);
    const updatedMods = mods.concat(importedMods);
    await saveModsToGitHub(updatedMods);
    bulkImportInput.value = '';
  } catch (error) {
    adminStatus.textContent = `Import failed: ${error.message}`;
  }
});

adminModList.addEventListener('click', event => {
  const actionButton = event.target.closest('button');
  if (!actionButton) return;

  const action = actionButton.dataset.action;
  const modId = Number(actionButton.dataset.id);
  const selectedMod = mods.find(mod => mod.id === modId);
  if (!selectedMod) return;

  if (action === 'edit') {
    const confirmed = confirmAction(`Edit "${selectedMod.name}"?`);
    if (!confirmed) {
      adminStatus.textContent = 'Edit cancelled.';
      return;
    }

    editModId.value = selectedMod.id;
    modIdInput.value = selectedMod.id;
    nameInput.value = selectedMod.name;
    labelInput.value = selectedMod.label || selectedMod.name;
    versionInput.value = selectedMod.version;
    gameEditionInput.value = selectedMod.game_edition || selectedMod.platform || 'Unknown';
    mcVersionInput.value = selectedMod.mcVersion || '';
    categoryInput.value = selectedMod.category;
    collectionInput.value = selectedMod.collection || 1;
    descriptionInput.value = selectedMod.description;
    downloadInput.value = selectedMod.download;
    populateLockerForm(selectedMod);
    adminStatus.textContent = 'Editing existing mod. Save to update.';
  }

  if (action === 'copy-link') {
    const publicUrl = getModPublicUrl(selectedMod);
    copyTextToClipboard(publicUrl);
    adminStatus.textContent = `Copied link to clipboard: ${publicUrl}`;
  }

  if (action === 'delete') {
    const confirmed = confirmAction(`Delete "${selectedMod.name}" (ID ${modId})? This action cannot be undone.`);
    if (!confirmed) {
      adminStatus.textContent = 'Delete cancelled.';
      return;
    }

    const updatedMods = mods.filter(mod => mod.id !== modId);
    saveModsToGitHub(updatedMods);
  }
});

adminModList.addEventListener('change', event => {
  const checkbox = event.target.closest('input.admin-mod-select');
  if (!checkbox) return;
  const modId = Number(checkbox.dataset.id);
  if (checkbox.checked) {
    selectedModIds.add(modId);
  } else {
    selectedModIds.delete(modId);
  }
  updateSelectionCount();
});

addCategoryButton.addEventListener('click', addCategory);
newCategoryInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addCategory();
  }
});
categoryList.addEventListener('click', async event => {
  const button = event.target.closest('button[data-category]');
  if (!button) return;

  const category = button.dataset.category;
  if (getCategoriesFromMods().includes(category)) return;
  categories = categories.filter(existing => existing !== category);
  renderCategoryInput();
  renderCategoryList();
  await saveCategories();
});

categoryManager.addEventListener('mouseenter', () => {
  categoryManager.open = true;
});
categoryManager.addEventListener('mouseleave', () => {
  if (!categoryManager.matches(':focus-within')) {
    categoryManager.open = false;
  }
});

selectAllButton.addEventListener('click', toggleSelectAll);
deleteSelectedButton.addEventListener('click', deleteSelectedMods);
applyLockerButton.addEventListener('click', applyLockerTasksToSelected);
adminFormPrevButton.addEventListener('click', () => goToAdminPage(currentAdminPage - 1));
adminFormNextButton.addEventListener('click', () => goToAdminPage(currentAdminPage + 1));

refreshButton.addEventListener('click', fetchMods);
cancelEditButton.addEventListener('click', resetForm);
logoutButton.addEventListener('click', () => {
  currentPassword = null;
  clearAdminSession();
  passwordInput.value = '';
  showLogin('Logged out. Enter password to continue.');
});

bindTaskUrlAutofill(lockerTaskType1, lockerTaskUrl1);
bindTaskUrlAutofill(lockerTaskType2, lockerTaskUrl2);
bindTaskUrlAutofill(lockerTaskType3, lockerTaskUrl3);

window.addEventListener('DOMContentLoaded', async () => {
  const savedPassword = restoreAdminSession();
  if (savedPassword) {
    passwordInput.value = savedPassword;
    const verification = await verifyPassword(savedPassword);
    if (verification.success) {
      currentPassword = savedPassword;
      showAdmin();
      await fetchMods();
      return;
    }
    clearAdminSession();
  }
  showLogin();
});

if (adminSearchInput) {
  adminSearchInput.addEventListener('input', renderAdminList);
}
