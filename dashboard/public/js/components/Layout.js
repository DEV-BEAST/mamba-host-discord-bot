import { html } from 'htm/preact';
import { Sidebar } from './Sidebar.js';

export function Layout({ activePage, onNavigate, onLogout, children }) {
  return html`
    <div class="flex h-screen">
      <${Sidebar} activePage=${activePage} onNavigate=${onNavigate} onLogout=${onLogout} />
      <main class="flex-1 overflow-y-auto p-6 px-8">
        ${children}
      </main>
    </div>
  `;
}
