import { html } from 'htm/preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { get, post, del } from '../api.js';
import { useShoelaceEvent } from '../hooks/useShoelace.js';
import { StatusMessage } from '../components/StatusMessage.js';

export default function ReactionRoles() {
  const [guilds, setGuilds] = useState([]);
  const [guildId, setGuildId] = useState('');
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'success' });

  // Form state
  const [channelId, setChannelId] = useState('');
  const [messageId, setMessageId] = useState('');
  const [emoji, setEmoji] = useState('');
  const [roleId, setRoleId] = useState('');
  const [saving, setSaving] = useState(false);

  const guildRef = useRef(null);
  const channelRef = useRef(null);
  const roleRef = useRef(null);
  const messageIdRef = useRef(null);
  const emojiRef = useRef(null);
  const deleteConfirmRef = useRef(null);
  const [deleteId, setDeleteId] = useState(null);

  useShoelaceEvent(guildRef, 'sl-change', useCallback(e => {
    setGuildId(e.target.value);
    setChannelId('');
    setRoleId('');
  }, []));
  useShoelaceEvent(channelRef, 'sl-change', useCallback(e => setChannelId(e.target.value), []));
  useShoelaceEvent(roleRef, 'sl-change', useCallback(e => setRoleId(e.target.value), []));
  useShoelaceEvent(messageIdRef, 'sl-input', useCallback(e => setMessageId(e.target.value), []));
  useShoelaceEvent(emojiRef, 'sl-input', useCallback(e => setEmoji(e.target.value), []));

  useEffect(() => {
    get('/api/guilds')
      .then(g => { setGuilds(g); if (g.length > 0) setGuildId(g[0].id); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!guildId) return;
    get(`/api/guilds/${guildId}/channels`)
      .then(data => setChannels(data.channels || []))
      .catch(() => setChannels([]));
    get(`/api/guilds/${guildId}/roles`)
      .then(setRoles)
      .catch(() => setRoles([]));
    loadMappings();
  }, [guildId]);

  function loadMappings() {
    if (!guildId) return;
    setLoading(true);
    get(`/api/reaction-roles/${guildId}`)
      .then(setMappings)
      .catch(() => setMappings([]))
      .finally(() => setLoading(false));
  }

  async function handleCreate() {
    if (!channelId || !messageId.trim() || !emoji.trim() || !roleId) return;
    setSaving(true);
    try {
      await post(`/api/reaction-roles/${guildId}`, {
        channelId,
        messageId: messageId.trim(),
        emoji: emoji.trim(),
        roleId,
      });
      setStatus({ message: 'Reaction role mapping created! Bot has reacted to the message.', type: 'success' });
      setMessageId('');
      setEmoji('');
      if (messageIdRef.current) messageIdRef.current.value = '';
      if (emojiRef.current) emojiRef.current.value = '';
      loadMappings();
    } catch (err) {
      setStatus({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await del(`/api/reaction-roles/${deleteId}`);
      setStatus({ message: 'Mapping deleted', type: 'success' });
      deleteConfirmRef.current?.hide();
      setDeleteId(null);
      loadMappings();
    } catch (err) {
      setStatus({ message: err.message, type: 'error' });
    }
  }

  return html`
    <div class="mb-6">
      <h1 class="text-[22px] font-bold">Reaction Roles</h1>
      <p class="text-muted-foreground text-sm mt-0.5">Assign roles when users react to specific messages</p>
    </div>

    <${StatusMessage} message=${status.message} type=${status.type} onClear=${() => setStatus({ message: '', type: 'success' })} />

    <!-- Add Mapping -->
    <div class="bg-card rounded-lg p-5 shadow-card mb-5">
      <h2 class="text-[16px] font-semibold mb-4">Add Mapping</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Select Guild</label>
          <sl-select ref=${guildRef} value=${guildId} placeholder="Select a server..." size="medium" hoist>
            ${guilds.map(g => html`<sl-option value=${g.id}>${g.name}</sl-option>`)}
          </sl-select>
        </div>
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Channel</label>
          <sl-select ref=${channelRef} value=${channelId} placeholder="Select a channel..." size="medium" hoist>
            ${channels.map(c => html`<sl-option value=${c.id}>#${c.name}</sl-option>`)}
          </sl-select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Message ID</label>
          <sl-input ref=${messageIdRef} value=${messageId} placeholder="123456789012345678" size="medium"></sl-input>
        </div>
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Emoji</label>
          <sl-input ref=${emojiRef} value=${emoji} placeholder="e.g. ✅ or custom emoji ID" size="medium"></sl-input>
        </div>
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Role</label>
          <sl-select ref=${roleRef} value=${roleId} placeholder="Select a role..." size="medium" hoist>
            ${roles.map(r => html`<sl-option value=${r.id}>${r.name}</sl-option>`)}
          </sl-select>
        </div>
      </div>

      <sl-button variant="primary" size="medium" ?loading=${saving} ?disabled=${!guildId} onClick=${handleCreate}>
        Add Mapping
      </sl-button>
    </div>

    <!-- Active Mappings -->
    <div class="bg-card rounded-lg p-5 shadow-card">
      <h2 class="text-[16px] font-semibold mb-4">Active Mappings</h2>

      ${loading && html`
        <div class="flex justify-center py-6">
          <sl-spinner style="font-size: 1.5rem;"></sl-spinner>
        </div>
      `}

      ${!loading && mappings.length === 0 && html`
        <p class="text-muted-foreground text-sm py-4">No reaction role mappings yet. Add one above!</p>
      `}

      ${!loading && mappings.length > 0 && html`
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Channel</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Message ID</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Emoji</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Role</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              ${mappings.map(m => html`
                <tr class="hover:bg-muted transition-colors duration-100">
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">#${m.channelName}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm font-mono text-xs">${m.message_id}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm text-lg">${m.emoji}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-accent-dim text-accent">${m.roleName}</span>
                  </td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">
                    <sl-icon-button
                      name="trash"
                      label="Delete"
                      class="text-muted-foreground hover:text-destructive"
                      onClick=${() => { setDeleteId(m.id); setTimeout(() => deleteConfirmRef.current?.show(), 0); }}
                    ></sl-icon-button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <!-- Delete Confirmation -->
    <sl-dialog ref=${deleteConfirmRef} label="Delete Mapping">
      <p class="text-sm">Are you sure you want to delete this reaction role mapping? This cannot be undone.</p>
      <div class="mt-4 flex justify-end gap-2" slot="footer">
        <sl-button variant="default" onClick=${() => deleteConfirmRef.current?.hide()}>Cancel</sl-button>
        <sl-button variant="danger" onClick=${confirmDelete}>Delete</sl-button>
      </div>
    </sl-dialog>
  `;
}
