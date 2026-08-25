// mod.js reads the current URL and displays a single mod page from data.json.
const appRoot = document.getElementById('app');
const currentPath = window.location.pathname.replace(/\/+$/, '');
const modIdOrSlug = currentPath.replace(/^\//, '');

const isHomepageRoute = currentPath === '' || currentPath === '/' || currentPath === '/index.html';
const isAdminPath = currentPath.startsWith('/admin');
const isApiPath = currentPath.startsWith('/api');
const shouldRenderDetail = Boolean(appRoot && !isHomepageRoute && !isAdminPath && !isApiPath);

if (shouldRenderDetail) {
  renderLoadingState();

  const runDetailRenderer = () => {
    loadAndRenderMod().catch(() => {
      renderError();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDetailRenderer, { once: true });
  } else {
    runDetailRenderer();
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLoadingState() {
  if (!appRoot) return;

  document.title = 'Loading… | JeikuArchiveMC';
  appRoot.innerHTML = `
    <div class="page-shell">
      <header class="site-header detail-header">
        <div class="header-top">
          <div class="brand">
            <span class="brand-icon" aria-hidden="true">⏳</span>
            <div>
              <h1>Loading mod details</h1>
              <p>Preparing the page for you now.</p>
            </div>
          </div>
        </div>
      </header>

      <main class="mod-detail-main">
        <section class="mod-detail-card mod-detail-card-large">
          <div class="mod-detail-panel">
            <div class="mod-detail-tag skeleton-block skeleton-pill"></div>
            <div class="mod-detail-content">
              <div class="spec-row">
                <span class="meta-chip skeleton-block skeleton-chip"></span>
                <span class="meta-chip skeleton-block skeleton-chip"></span>
              </div>

              <div class="skeleton-block skeleton-title"></div>
              <div class="skeleton-block skeleton-text"></div>
              <div class="skeleton-block skeleton-text short"></div>

              <div class="content-locker-card loading-card">
                <div class="skeleton-block skeleton-line"></div>
                <div class="skeleton-block skeleton-line short"></div>
                <div class="skeleton-block skeleton-line"></div>
              </div>

              <div class="detail-actions">
                <div class="skeleton-block skeleton-button"></div>
                <div class="skeleton-block skeleton-pill"></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <p>JeikuArchiveMC helps you discover mods and texture packs with a clean, fast experience.</p>
      </footer>
    </div>
  `;
}

async function loadAndRenderMod() {
  try {
    const response = await fetch('data.json');
    const mods = await response.json();
    const normalizedPath = modIdOrSlug.trim();
    const mod = mods.find(item => String(item.id) === normalizedPath || item.slug === normalizedPath);

    if (!mod) {
      renderNotFound();
      return;
    }

    renderModPage(mod);
  } catch (error) {
    renderError();
    console.error('Error loading mod:', error);
  }
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
  return 'Complete task';
}

function renderModPage(mod) {
  const tasks = Array.isArray(mod.contentLocker?.tasks) ? mod.contentLocker.tasks : [];
  const requiredCount = Number.isInteger(mod.contentLocker?.requiredCount)
    ? Math.min(Math.max(mod.contentLocker.requiredCount, 1), Math.max(tasks.length, 1))
    : tasks.length;
  const canDownload = tasks.length === 0 || requiredCount === 0;
  document.title = `${mod.name} | JeikuArchiveMC`;
  appRoot.innerHTML = `
    <div class="page-shell">
      <header class="site-header detail-header">
        <div class="header-top">
          <a href="/" class="button button-secondary">← All mods</a>
          <div class="brand">
            <span class="brand-icon" aria-hidden="true">🧩</span>
            <div>
              <h1>${escapeHtml(mod.name)}</h1>
              <p>Vault-verified ${escapeHtml(mod.category)} for Minecraft worlds.</p>
            </div>
          </div>
        </div>
      </header>

      <main class="mod-detail-main">
        <section class="mod-detail-card mod-detail-card-large">
          <div class="mod-detail-panel">
            <div class="mod-detail-tag">${escapeHtml(mod.category)}</div>
            <div class="mod-detail-content">
              <div class="spec-row">
                <span class="meta-chip">Version ${escapeHtml(mod.version)}</span>
                <span class="meta-chip">${escapeHtml(mod.game_edition || mod.platform || 'Unknown')}</span>
                <span class="meta-chip">${escapeHtml(mod.mcVersion || 'MC version unknown')}</span>
                <span class="meta-chip meta-chip-verified">Verified</span>
              </div>

              <h2>${escapeHtml(mod.label || mod.name)}</h2>
              <p class="detail-description">${escapeHtml(mod.description)}</p>

              ${tasks.length > 0 ? `
                <div class="content-locker-card">
                  <div class="content-locker-header">
                    <h3>To continue, please:</h3>
                    <p>Complete ${requiredCount} of the options below to unlock the download.</p>
                    <div class="content-locker-progress" id="contentLockerProgress">0 of ${requiredCount} required completed</div>
                  </div>
                  <div class="content-locker-steps" id="contentLockerSteps"></div>
                </div>
              ` : ''}

              <div class="detail-actions">
                <button type="button" class="button button-primary download-button" id="downloadButton" ${canDownload ? '' : 'disabled'}>
                  <svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  ${tasks.length > 0 ? 'Complete tasks to unlock download' : 'Download Now'}
                </button>
                <span class="status-pill">Safe & verified</span>
              </div>

            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <p>JeikuArchiveMC helps you discover mods and texture packs with a clean, fast experience.</p>
      </footer>
    </div>
  `;

  const downloadButton = document.getElementById('downloadButton');
  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      if (downloadButton.disabled || !mod.download) return;
      window.open(mod.download, '_blank', 'noopener,noreferrer');
    });
  }

  if (tasks.length > 0) {
    initLockerFlow(mod, tasks, requiredCount);
  }
}

function createConfettiBurst() {
  const colors = ['#6fffd0', '#52c7ff', '#6ec272', '#ffffff'];
  const burst = document.createElement('div');
  burst.className = 'confetti-burst';
  document.body.appendChild(burst);

  for (let i = 0; i < 28; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${Math.random() * 20 + 5}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 220}px`);
    piece.style.setProperty('--fall', `${Math.random() * 260 + 180}px`);
    piece.style.animationDelay = `${Math.random() * 0.08}s`;
    burst.appendChild(piece);
  }

  window.setTimeout(() => {
    burst.remove();
  }, 1400);
}

function initLockerFlow(mod, tasks, requiredCount) {
  const stepContainer = document.getElementById('contentLockerSteps');
  const downloadButton = document.getElementById('downloadButton');
  if (!stepContainer || !downloadButton) return;

  const completedTaskIndexes = new Set();

  function renderSteps() {
    stepContainer.innerHTML = tasks.map((task, index) => {
      const isCompleted = completedTaskIndexes.has(index);
      const statusClass = isCompleted ? 'locker-step-complete' : 'locker-step-active';
      const actionLabel = isCompleted ? 'Verified' : 'Complete';
      const buttonMarkup = `
        <button type="button" class="button button-secondary locker-action" data-task-index="${index}" ${isCompleted ? 'disabled' : ''}>
          ${isCompleted ? '✓ Verified' : escapeHtml(getTaskLabel(task.type))}
        </button>
      `;

      return `
        <div class="locker-step ${statusClass}">
          <div class="locker-step-header">
            <div class="locker-step-title-wrap">
              <div class="locker-step-badge">${index + 1}</div>
              <div>
                <h4>${escapeHtml(getTaskLabel(task.type))}</h4>
                <p>${isCompleted ? 'Completed and verified.' : 'Open the task and finish it to count toward the unlock requirement.'}</p>
              </div>
            </div>
            <span class="locker-status">${isCompleted ? '✓ Verified' : 'Available'}</span>
          </div>
          <div class="locker-progress-row">
            <span class="locker-progress-pill ${isCompleted ? 'locker-progress-pill-done' : 'locker-progress-pill-active'}">${isCompleted ? 'Done' : actionLabel}</span>
            <span class="locker-progress-line"></span>
          </div>
          ${buttonMarkup}
        </div>
      `;
    }).join('');

    stepContainer.querySelectorAll('[data-task-index]').forEach(button => {
      button.addEventListener('click', () => handleTaskClick(Number(button.dataset.taskIndex)));
    });

    const progressNotice = document.getElementById('contentLockerProgress');
    const completedCount = completedTaskIndexes.size;
    if (progressNotice) {
      progressNotice.textContent = `${completedCount} of ${requiredCount} required completed`;
    }

    const canUnlock = completedCount >= requiredCount;
    downloadButton.disabled = !canUnlock;
    downloadButton.innerHTML = `<svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>${canUnlock ? 'Download Now' : 'Complete tasks to unlock download'}`;

    if (canUnlock && tasks.length > 0) {
      createConfettiBurst();
    }
  }

  function handleTaskClick(taskIndex) {
    const task = tasks[taskIndex];
    if (!task || !task.url) return;

    const button = stepContainer.querySelector(`[data-task-index="${taskIndex}"]`);
    if (button) {
      button.disabled = true;
      button.textContent = 'Checking...';
    }

    window.open(task.url, '_blank', 'noopener,noreferrer');

    window.setTimeout(() => {
      completedTaskIndexes.add(taskIndex);
      renderSteps();
    }, 15000);
  }

  renderSteps();

  downloadButton.addEventListener('click', () => {
    if (completedTaskIndexes.size < requiredCount) return;
    if (!mod.download) return;
    window.open(mod.download, '_blank', 'noopener,noreferrer');
  });
}


function renderNotFound() {
  document.title = 'Mod Not Found | JeikuArchiveMC';
  appRoot.innerHTML = `
    <div class="page-shell">
      <header class="site-header">
        <div class="header-top">
          <a href="/" class="button button-secondary">← All mods</a>
          <div class="brand">
            <span class="brand-icon">⛏️</span>
            <div>
              <h1>Mod Not Found</h1>
              <p>Check the URL or return to the homepage.</p>
            </div>
          </div>
        </div>
      </header>
      <main class="mod-detail-main">
        <section class="mod-detail-card">
          <h2>Nothing matched that mod.</h2>
          <p class="detail-description">Try another link or return to the main vault page.</p>
        </section>
      </main>
      <footer class="site-footer">
        <p>JeikuArchiveMC provides fast browsing for Minecraft mods.</p>
      </footer>
    </div>
  `;
}

function renderError() {
  document.title = 'Error | JeikuArchiveMC';
  appRoot.innerHTML = `
    <div class="page-shell">
      <header class="site-header">
        <div class="header-top">
          <a href="/" class="button button-secondary">← All mods</a>
          <div class="brand">
            <span class="brand-icon">⛏️</span>
            <div>
              <h1>Unable to Load Mod</h1>
              <p>Please refresh or try again later.</p>
            </div>
          </div>
        </div>
      </header>
      <main class="mod-detail-main">
        <section class="mod-detail-card">
          <p class="detail-description">There was a problem loading the mod data.</p>
        </section>
      </main>
      <footer class="site-footer">
        <p>JeikuArchiveMC provides fast browsing for Minecraft mods.</p>
      </footer>
    </div>
  `;
}


