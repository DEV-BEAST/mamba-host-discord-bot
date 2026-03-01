import { post, get } from './api.js';

// Page modules (lazy loaded)
const pages = {
  'overview': () => import('./pages/overview.js'),
  'embed-builder': () => import('./pages/embed-builder.js'),
  'settings': () => import('./pages/settings.js'),
  'leaderboard': () => import('./pages/leaderboard.js'),
};

const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const pageContent = document.getElementById('page-content');

let currentPage = null;

// ── Auth ──

async function checkAuth() {
  try {
    const { authenticated } = await get('/api/auth/status');
    if (authenticated) {
      showDashboard();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

function showLogin() {
  loginScreen.style.display = '';
  dashboard.style.display = 'none';
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display = '';
  navigateFromHash();
}

// Login form
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';

  try {
    await post('/api/auth/login', { password: pw });
    showDashboard();
  } catch (err) {
    errEl.textContent = err.message || 'Invalid password';
    errEl.style.display = '';
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await post('/api/auth/logout');
  showLogin();
  document.getElementById('login-password').value = '';
});

// ── SPA Router ──

function navigateFromHash() {
  const hash = window.location.hash.replace('#', '') || 'overview';
  navigateTo(hash);
}

async function navigateTo(page) {
  if (!pages[page]) page = 'overview';

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Teardown previous page
  if (currentPage && currentPage.destroy) {
    currentPage.destroy();
  }

  // Load and render page
  try {
    const mod = await pages[page]();
    pageContent.innerHTML = '';
    currentPage = mod;
    mod.render(pageContent);
  } catch (err) {
    pageContent.innerHTML = `<div class="card"><p class="status-msg error">Failed to load page: ${err.message}</p></div>`;
  }
}

// Nav link clicks
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    window.location.hash = page;
    navigateTo(page);
  });
});

window.addEventListener('hashchange', navigateFromHash);

// ── Helpers exported for pages ──

export function showStatus(container, message, type = 'success') {
  let el = container.querySelector('.status-msg');
  if (!el) {
    el = document.createElement('div');
    el.className = 'status-msg';
    container.appendChild(el);
  }
  el.className = `status-msg ${type}`;
  el.textContent = message;
  el.style.display = '';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// ── Init ──
checkAuth();
