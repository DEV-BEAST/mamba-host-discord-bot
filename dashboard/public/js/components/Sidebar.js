import { html } from 'htm/preact';

const NAV_ITEMS = [
  {
    page: 'overview',
    label: 'Overview',
    icon: html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>`,
  },
  {
    page: 'embed-builder',
    label: 'Embed Builder',
    icon: html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>`,
  },
  {
    page: 'settings',
    label: 'Settings',
    icon: html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z"/></svg>`,
  },
  {
    page: 'leaderboard',
    label: 'Leaderboard',
    icon: html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z"/></svg>`,
  },
];

export function Sidebar({ activePage, onNavigate, onLogout }) {
  return html`
    <nav class="w-[220px] min-w-[220px] bg-muted flex flex-col py-4 shadow-sidebar border-r border-border/50">
      <div class="flex items-center gap-2.5 px-4 pb-4 font-brand text-xl font-bold tracking-wide text-foreground border-b border-border">
        <img src="https://www.mambahost.com/og/logo-trans.png" alt="" class="w-7 h-7 object-contain" />
        <span>Mamba Host</span>
      </div>
      <ul class="list-none flex-1 py-3 px-2 space-y-0.5">
        ${NAV_ITEMS.map(item => html`
          <li>
            <a
              href="#${item.page}"
              class="flex items-center gap-2.5 px-3 py-2 text-[14px] font-medium rounded-md transition-all duration-150 no-underline
                ${activePage === item.page
                  ? 'bg-accent-dim text-accent border-l-[3px] border-accent pl-[9px]'
                  : 'text-muted-foreground hover:bg-[#383a40] hover:text-foreground'}"
              onClick=${(e) => { e.preventDefault(); onNavigate(item.page); }}
            >
              ${item.icon}
              ${item.label}
            </a>
          </li>
        `)}
      </ul>
      <div class="px-3 pt-3 border-t border-border">
        <sl-button variant="default" size="small" class="w-full" onClick=${onLogout}>Logout</sl-button>
      </div>
    </nav>
  `;
}
