import { html } from 'htm/preact';
import { useState, useRef, useCallback, useEffect } from 'preact/hooks';
import { get } from '../../api.js';
import { useShoelaceEvent } from '../../hooks/useShoelace.js';

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

export function MentionPicker({ guildId, channels, onInsert }) {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');

  const searchRef = useRef(null);
  const userRef = useRef(null);
  const roleRef = useRef(null);
  const channelRef = useRef(null);

  useShoelaceEvent(userRef, 'sl-change', useCallback(e => setSelectedUser(e.target.value), []));
  useShoelaceEvent(roleRef, 'sl-change', useCallback(e => setSelectedRole(e.target.value), []));
  useShoelaceEvent(channelRef, 'sl-change', useCallback(e => setSelectedChannel(e.target.value), []));

  // Load mention data when guild changes
  useEffect(() => {
    if (!guildId) return;
    Promise.all([
      get('/api/guilds/' + guildId + '/members'),
      get('/api/guilds/' + guildId + '/roles'),
    ]).then(([m, r]) => {
      setMembers(m);
      setRoles(r);
    }).catch(() => {});
  }, [guildId]);

  // Member search with debounce
  let searchTimeout = useRef(null);
  useShoelaceEvent(searchRef, 'sl-input', useCallback((e) => {
    clearTimeout(searchTimeout.current);
    const query = e.target.value.trim();
    if (query.length >= 1) {
      searchTimeout.current = setTimeout(async () => {
        try {
          const m = await get('/api/guilds/' + guildId + '/members?search=' + encodeURIComponent(query));
          setMembers(m);
        } catch {}
      }, 300);
    } else if (query === '') {
      get('/api/guilds/' + guildId + '/members').then(m => setMembers(m)).catch(() => {});
    }
  }, [guildId]));

  if (!guildId) return null;

  return html`
    <div class="bg-card border border-accent/20 rounded-lg p-5 mb-4 shadow-card">
      <div class="text-[14px] font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Mentions <small class="text-muted-foreground font-normal normal-case">(click Insert to add at cursor)</small>
      </div>
      <div class="flex gap-2 items-center mb-2.5">
        <label class="text-[13px] font-medium text-text-secondary whitespace-nowrap min-w-[55px]">@User</label>
        <sl-input ref=${searchRef} placeholder="Search members..." size="medium" class="flex-1"></sl-input>
        <sl-select ref=${userRef} value=${selectedUser} placeholder="Select user..." size="medium" hoist class="flex-1">
          ${members.map(m => html`<sl-option value=${m.id}>${m.displayName} (${m.username})</sl-option>`)}
        </sl-select>
        <sl-button variant="default" size="small" onClick=${() => { if (selectedUser) onInsert('<@' + selectedUser + '>'); }}>Insert</sl-button>
      </div>
      <div class="flex gap-2 items-center mb-2.5">
        <label class="text-[13px] font-medium text-text-secondary whitespace-nowrap min-w-[55px]">@Role</label>
        <sl-select ref=${roleRef} value=${selectedRole} placeholder="Select role..." size="medium" hoist class="flex-1">
          ${roles.map(r => html`<sl-option value=${r.id}>${r.name}</sl-option>`)}
        </sl-select>
        <sl-button variant="default" size="small" onClick=${() => { if (selectedRole) onInsert('<@&' + selectedRole + '>'); }}>Insert</sl-button>
      </div>
      <div class="flex gap-2 items-center">
        <label class="text-[13px] font-medium text-text-secondary whitespace-nowrap min-w-[55px]">#Channel</label>
        <sl-select ref=${channelRef} value=${selectedChannel} placeholder="Select channel..." size="medium" hoist class="flex-1">
          ${channels.map(c => html`<sl-option value=${c.id}>#${c.name}${c.category ? ' (' + c.category + ')' : ''}</sl-option>`)}
        </sl-select>
        <sl-button variant="default" size="small" onClick=${() => { if (selectedChannel) onInsert('<#' + selectedChannel + '>'); }}>Insert</sl-button>
      </div>
    </div>
  `;
}
