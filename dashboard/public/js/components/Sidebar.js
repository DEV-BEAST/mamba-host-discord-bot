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
    page: 'moderation',
    label: 'Moderation',
    icon: html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`,
  },
  {
    page: 'leaderboard',
    label: 'Leaderboard',
    icon: html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z"/></svg>`,
  },
  {
    page: 'custom-commands',
    label: 'Custom Commands',
    icon: html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`,
  },
  {
    page: 'reaction-roles',
    label: 'Reaction Roles',
    icon: html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`,
  },
  {
    page: 'scheduled-messages',
    label: 'Scheduled Messages',
    icon: html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
  },
  {
    page: 'server-stats',
    label: 'Server Stats',
    icon: html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>`,
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
