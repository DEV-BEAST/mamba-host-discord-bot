import { html } from 'htm/preact';
import { render } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { get, post } from './api.js';
import { LoginScreen } from './components/LoginScreen.js';
import { Layout } from './components/Layout.js';

// Eager imports — no dynamic loading delay on navigation
import Overview from './pages/overview.js';
import EmbedBuilder from './pages/embed-builder.js';
import Settings from './pages/settings.js';
import Leaderboard from './pages/leaderboard.js';

const pages = {
  'overview': Overview,
  'embed-builder': EmbedBuilder,
  'settings': Settings,
  'leaderboard': Leaderboard,
};

function App() {
  const [authed, setAuthed] = useState(null); // null = checking, true/false
  const [activePage, setActivePage] = useState('overview');

  // Check auth on mount
  useEffect(() => {
    get('/api/auth/status')
      .then(r => setAuthed(r.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  // Hash-based routing
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '') || 'overview';
      setActivePage(hash);
    };
    window.addEventListener('hashchange', onHash);
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

  const PageComponent = pages[activePage] || Overview;

  return html`
    <${Layout}
      activePage=${activePage}
      onNavigate=${navigate}
      onLogout=${handleLogout}
    >
      <${PageComponent} />
    <//>
  `;
}

render(html`<${App} />`, document.getElementById('app'));
