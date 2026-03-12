import { html } from 'htm/preact';
import { render } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { get, post } from './api.js';
import { LoginScreen } from './components/LoginScreen.js';
import { Layout } from './components/Layout.js';

// Lazy-loaded page components
const pageModules = {
  'overview': () => import('./pages/overview.js'),
  'embed-builder': () => import('./pages/embed-builder.js'),
  'settings': () => import('./pages/settings.js'),
  'leaderboard': () => import('./pages/leaderboard.js'),
};

function App() {
  const [authed, setAuthed] = useState(null); // null = checking, true/false
  const [activePage, setActivePage] = useState('overview');
  const [PageComponent, setPageComponent] = useState(null);

  // Check auth on mount
  useEffect(() => {
    get('/api/auth/status')
      .then(r => setAuthed(r.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  // Load page component when activePage changes
  const loadPage = useCallback(async (page) => {
    if (!pageModules[page]) page = 'overview';
    try {
      const mod = await pageModules[page]();
      setPageComponent(() => mod.default || mod.Page);
    } catch (err) {
      setPageComponent(() => () => html`
        <div class="bg-card rounded-lg p-5">
          <p class="text-destructive text-sm">Failed to load page: ${err.message}</p>
        </div>
      `);
    }
  }, []);

  useEffect(() => {
    if (authed) loadPage(activePage);
  }, [authed, activePage, loadPage]);

  // Hash-based routing
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '') || 'overview';
      setActivePage(hash);
    };
    window.addEventListener('hashchange', onHash);
    // Set initial hash
    const initial = window.location.hash.replace('#', '') || 'overview';
    setActivePage(initial);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((page) => {
    window.location.hash = page;
    setActivePage(page);
  }, []);

  const handleLogin = useCallback(() => {
    setAuthed(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await post('/api/auth/logout');
    setAuthed(false);
  }, []);

  // Loading state
  if (authed === null) {
    return html`
      <div class="flex items-center justify-center h-screen">
        <sl-spinner style="font-size: 2rem; --indicator-color: #FF6F00;"></sl-spinner>
      </div>
    `;
  }

  if (!authed) {
    return html`<${LoginScreen} onLogin=${handleLogin} />`;
  }

  return html`
    <${Layout}
      activePage=${activePage}
      onNavigate=${navigate}
      onLogout=${handleLogout}
    >
      ${PageComponent && html`<${PageComponent} />`}
    <//>
  `;
}

render(html`<${App} />`, document.getElementById('app'));
