let watchlist = JSON.parse(localStorage.getItem('showhunt_wl') || '[]');
let currentGenre = '';
let searchTimeout = null;

const showsGrid = document.getElementById('showsGrid');
const sectionTitle = document.getElementById('sectionTitle');
const wlCount = document.getElementById('wlCount');
const watchlistToggle = document.getElementById('watchlistToggle');
const watchlistPanel = document.getElementById('watchlistPanel');
const panelOverlay = document.getElementById('panelOverlay');
const panelClose = document.getElementById('panelClose');
const watchlistBody = document.getElementById('watchlistBody');
const showModal = document.getElementById('showModal');
const modalBg = document.getElementById('modalBg');
const modalBox = document.getElementById('modalBox');
const searchInput = document.getElementById('searchInput');

function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent.trim();
}

function updateWlCount() {
  wlCount.textContent = watchlist.length;
}

function isInWatchlist(id) {
  return watchlist.some(s => s.id === id);
}

function toggleWatchlist(show) {
  const idx = watchlist.findIndex(s => s.id === show.id);
  if (idx === -1) {
    watchlist.push({ id: show.id, name: show.name, image: show.image, network: show.network });
  } else {
    watchlist.splice(idx, 1);
  }
  localStorage.setItem('showhunt_wl', JSON.stringify(watchlist));
  updateWlCount();
  renderWatchlist();
  document.querySelectorAll(`.wl-indicator[data-id="${show.id}"]`).forEach(el => {
    el.classList.toggle('visible', isInWatchlist(show.id));
  });
}

function renderWatchlist() {
  if (!watchlist.length) {
    watchlistBody.innerHTML = '<p class="wl-empty">Nothing in your watchlist yet. Find a show and add it.</p>';
    return;
  }
  watchlistBody.innerHTML = watchlist.map(s => {
    const img = s.image?.medium || '';
    return `<div class="wl-item" data-id="${s.id}">
      <div class="wl-thumb">${img ? `<img src="${img}" alt="${s.name}" />` : ''}</div>
      <div class="wl-info">
        <div class="wl-name">${s.name}</div>
        <div class="wl-network">${s.network?.name || s.network || ''}</div>
      </div>
      <button class="wl-remove" data-id="${s.id}" title="Remove">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`;
  }).join('');

  watchlistBody.querySelectorAll('.wl-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      watchlist = watchlist.filter(s => s.id !== id);
      localStorage.setItem('showhunt_wl', JSON.stringify(watchlist));
      updateWlCount();
      renderWatchlist();
      document.querySelectorAll(`.wl-indicator[data-id="${id}"]`).forEach(el => el.classList.remove('visible'));
    });
  });
}

function renderShows(shows) {
  if (!shows.length) {
    showsGrid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;padding:40px 0;font-size:.9rem">No shows found.</p>';
    return;
  }
  showsGrid.innerHTML = shows.map(s => {
    const show = s.show || s;
    const img = show.image?.medium;
    const rating = show.rating?.average;
    const status = show.status;
    const genres = (show.genres || []).slice(0, 3);
    const network = show.network?.name || show.webChannel?.name || '';
    const inWl = isInWatchlist(show.id);

    return `<div class="show-card" data-id="${show.id}">
      <div class="show-poster">
        ${img
          ? `<img src="${img}" alt="${show.name}" loading="lazy" />`
          : `<div class="poster-placeholder"><span class="poster-placeholder-text">${show.name}</span></div>`}
        ${status ? `<span class="show-status-badge ${status === 'Running' ? 'status-running' : 'status-ended'}">${status === 'Running' ? 'Airing' : 'Ended'}</span>` : ''}
        <div class="wl-indicator ${inWl ? 'visible' : ''}" data-id="${show.id}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
        </div>
        <div class="card-overlay">
          <div class="overlay-genres">${genres.map(g => `<span class="overlay-genre">${g}</span>`).join('')}</div>
        </div>
      </div>
      <div class="show-info">
        <div class="show-name">${show.name}</div>
        <div class="show-meta">
          <span>${network || (show.premiered || '').slice(0, 4) || ''}</span>
          ${rating ? `<span class="show-rating"><svg viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>${rating}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  showsGrid.querySelectorAll('.show-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id);
      const raw = shows.find(s => (s.show || s).id === id);
      openModal(raw?.show || raw);
    });
  });
}

async function fetchShows(url) {
  showsGrid.innerHTML = '<div class="show-skeleton"></div>'.repeat(8);
  try {
    const res = await fetch(url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    showsGrid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;padding:40px 0">Failed to load. Check your connection.</p>';
    return [];
  }
}

async function loadTrending() {
  sectionTitle.textContent = currentGenre ? currentGenre.charAt(0).toUpperCase() + currentGenre.slice(1) + ' Shows' : 'Trending Shows';
  const shows = await fetchShows('https://api.tvmaze.com/shows?page=0');
  let filtered = shows;
  if (currentGenre) {
    filtered = shows.filter(s => (s.genres || []).some(g => g.toLowerCase().includes(currentGenre)));
  }
  renderShows(filtered.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0)).slice(0, 60));
}

async function searchShows(q) {
  sectionTitle.textContent = `Results for "${q}"`;
  const shows = await fetchShows(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`);
  renderShows(shows);
}

function openModal(show) {
  if (!show) return;
  const img = show.image?.original || show.image?.medium;
  const inWl = isInWatchlist(show.id);
  const rating = show.rating?.average;
  const summary = stripHtml(show.summary);
  const network = show.network?.name || show.webChannel?.name || 'Unknown';
  const year = show.premiered?.slice(0, 4) || '';
  const genres = show.genres || [];
  const status = show.status;

  modalBox.innerHTML = `
    <div class="modal-inner">
      ${img
        ? `<div class="modal-poster"><img src="${img}" alt="${show.name}" /></div>`
        : `<div class="modal-ph">${show.name}</div>`}
      <div class="modal-details">
        <button class="modal-close-btn" id="mClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="modal-title">${show.name}</div>
        <div class="modal-subtitle">
          ${rating ? `<span class="modal-rating"><svg viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>${rating}/10</span>` : ''}
          ${year ? `<span class="modal-year">${year}</span>` : ''}
          <span class="modal-network">${network}</span>
          ${status ? `<span class="modal-status-badge ${status === 'Running' ? 'status-running' : 'status-ended'}">${status}</span>` : ''}
        </div>
        ${genres.length ? `<div class="modal-genres">${genres.map(g => `<span class="modal-genre-tag">${g}</span>`).join('')}</div>` : ''}
        ${summary ? `<p class="modal-summary">${summary.slice(0, 400)}${summary.length > 400 ? '...' : ''}</p>` : ''}
        <div class="modal-info-grid">
          ${show.runtime ? `<div class="info-item"><div class="info-label">Runtime</div><div class="info-val">${show.runtime} min</div></div>` : ''}
          ${show.language ? `<div class="info-item"><div class="info-label">Language</div><div class="info-val">${show.language}</div></div>` : ''}
          ${show.type ? `<div class="info-item"><div class="info-label">Type</div><div class="info-val">${show.type}</div></div>` : ''}
          ${show.ended ? `<div class="info-item"><div class="info-label">Ended</div><div class="info-val">${show.ended}</div></div>` : ''}
        </div>
        <div class="modal-actions">
          <button class="btn-wl ${inWl ? 'in-list' : ''}" id="modalWlBtn">${inWl ? 'In Watchlist' : '+ Watchlist'}</button>
          <a href="https://www.tvmaze.com/shows/${show.id}" target="_blank" rel="noopener" class="btn-more">More info</a>
        </div>
      </div>
    </div>`;

  document.getElementById('mClose').addEventListener('click', closeModal);
  document.getElementById('modalWlBtn').addEventListener('click', () => {
    const networkData = show.network || show.webChannel;
    toggleWatchlist({ id: show.id, name: show.name, image: show.image, network: networkData });
    const btn = document.getElementById('modalWlBtn');
    const inList = isInWatchlist(show.id);
    btn.textContent = inList ? 'In Watchlist' : '+ Watchlist';
    btn.classList.toggle('in-list', inList);
  });

  showModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  showModal.style.display = 'none';
  document.body.style.overflow = '';
}

modalBg.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

watchlistToggle.addEventListener('click', () => {
  watchlistPanel.style.display = 'flex';
  renderWatchlist();
  document.body.style.overflow = 'hidden';
});

function closePanel() {
  watchlistPanel.style.display = 'none';
  document.body.style.overflow = '';
}

panelOverlay.addEventListener('click', closePanel);
panelClose.addEventListener('click', closePanel);

document.querySelectorAll('.genre-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentGenre = btn.dataset.genre;
    searchInput.value = '';
    loadTrending();
  });
});

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  clearTimeout(searchTimeout);
  if (!q) { loadTrending(); return; }
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.genre-btn[data-genre=""]').classList.add('active');
  currentGenre = '';
  searchTimeout = setTimeout(() => searchShows(q), 500);
});

updateWlCount();
loadTrending();
