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
const bulkImportInput = document.getElementById('bulkImportInput');
const importJsonButton = document.getElementById('importJsonButton');
let mods = [];
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

function getTaskLabel(type) {
  if (type === 'follow_tiktok_user') return 'Follow TikTok User';
  if (type === 'like_tiktok_video') return 'Like TikTok Video';
  return '';
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

function buildContentLockerFromForm(existingMod = null) {
  const tasks = [];
  const taskConfigs = [
    { type: lockerTaskType1.value, url: lockerTaskUrl1.value.trim() },
    { type: lockerTaskType2.value, url: lockerTaskUrl2.value.trim() }
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

  if (tasks.length > 0) {
    return { tasks };
  }

  return existingMod && existingMod.contentLocker ? existingMod.contentLocker : { tasks: [] };
}

function populateLockerForm(mod) {
  const tasks = Array.isArray(mod?.contentLocker?.tasks) ? mod.contentLocker.tasks : [];
  const firstTask = tasks[0] || {};
  const secondTask = tasks[1] || {};
  lockerTaskType1.value = firstTask.type || '';
  lockerTaskUrl1.value = firstTask.url || '';
  lockerTaskType2.value = secondTask.type || '';
  lockerTaskUrl2.value = secondTask.url || '';
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

  return { tasks };
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
    const response = await fetch('/data.json');
    mods = await response.json();
    mods.sort((a, b) => b.id - a.id);
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


async function saveModsToGitHub(updatedMods) {
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
      body: JSON.stringify({ mods: updatedMods, password: currentPassword })
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
