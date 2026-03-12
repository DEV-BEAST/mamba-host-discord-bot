import { html } from 'htm/preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { get } from '../api.js';
import { useShoelaceEvent } from '../hooks/useShoelace.js';

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

export default function Leaderboard() {
  const [guilds, setGuilds] = useState([]);
  const [guildId, setGuildId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const guildRef = useRef(null);

  useShoelaceEvent(guildRef, 'sl-change', useCallback((e) => {
    setGuildId(e.target.value);
  }, []));

  useEffect(() => {
    get('/api/guilds')
      .then(g => {
        setGuilds(g);
        if (g.length > 0) setGuildId(g[0].id);
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!guildId) { setData(null); return; }
    setLoading(true);
    setError(null);
    get('/api/leaderboard/' + guildId)
      .then(d => { setData(d.leaderboard); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [guildId]);

  const medals = { 1: '\u{1F947}', 2: '\u{1F948}', 3: '\u{1F949}' };

  return html`
    <div class="mb-6">
      <h1 class="text-[22px] font-bold">Leaderboard</h1>
      <p class="text-muted-foreground text-sm mt-0.5">XP rankings by server</p>
    </div>

    <div class="bg-card border-0 rounded-lg p-5 shadow-card">
      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Select Guild</label>
        <sl-select ref=${guildRef} value=${guildId} placeholder="Select a server..." size="medium" hoist>
          ${guilds.map(g => html`<sl-option value=${g.id}>${g.name}</sl-option>`)}
        </sl-select>
      </div>

      ${loading && html`
        <div class="flex justify-center py-8">
          <sl-spinner style="font-size: 1.5rem;"></sl-spinner>
        </div>
      `}

      ${error && html`
        <div class="py-2 px-3 rounded-sm text-sm bg-[rgba(242,63,67,0.12)] text-destructive">
          ${error}
        </div>
      `}

      ${data && data.length === 0 && html`
        <p class="text-muted-foreground text-sm py-4">No XP data yet. Users earn XP by sending messages.</p>
      `}

      ${data && data.length > 0 && html`
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Rank</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">User</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Level</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">XP</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Messages</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(u => html`
                <tr class="hover:bg-muted transition-colors duration-100">
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm font-bold w-[50px]">
                    ${medals[u.rank] ? html`<span class="text-lg">${medals[u.rank]}</span>` : u.rank}
                  </td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">
                    <div class="flex items-center gap-2.5">
                      ${u.avatar
                        ? html`<img class="w-7 h-7 rounded-full" src=${u.avatar} alt="" />`
                        : html`<div class="w-7 h-7 rounded-full bg-[#404249]"></div>`
                      }
                      <span dangerouslySetInnerHTML=${{ __html: esc(u.displayName) }}></span>
                    </div>
                  </td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">${u.level}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm text-accent font-semibold">${u.xp.toLocaleString()}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">${u.messages.toLocaleString()}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}
