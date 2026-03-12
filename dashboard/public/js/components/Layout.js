import { html } from 'htm/preact';
import { Sidebar } from './Sidebar.js';

export function Layout({ activePage, onNavigate, onLogout, children }) {
  return html`
    <div class="flex h-screen bg-background">
      <${Sidebar} activePage=${activePage} onNavigate=${onNavigate} onLogout=${onLogout} />
      <main class="flex-1 overflow-y-auto py-6 px-8">
        ${children}
      </main>
    </div>
  `;
}
