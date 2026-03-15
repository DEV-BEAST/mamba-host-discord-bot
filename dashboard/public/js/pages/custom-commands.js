import { html } from 'htm/preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { get, post, del } from '../api.js';
import { useShoelaceEvent } from '../hooks/useShoelace.js';
import { StatusMessage } from '../components/StatusMessage.js';

export default function CustomCommands() {
  const [guilds, setGuilds] = useState([]);
  const [guildId, setGuildId] = useState('');
  const [commands, setCommands] = useState([]);
  const [prefix, setPrefix] = useState('!');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'success' });

  // Form state
  const [cmdName, setCmdName] = useState('');
  const [cmdResponse, setCmdResponse] = useState('');
  const [saving, setSaving] = useState(false);

  const guildRef = useRef(null);
  const nameRef = useRef(null);
  const responseRef = useRef(null);
  const deleteConfirmRef = useRef(null);
  const [deleteId, setDeleteId] = useState(null);

  useShoelaceEvent(guildRef, 'sl-change', useCallback(e => setGuildId(e.target.value), []));
  useShoelaceEvent(nameRef, 'sl-input', useCallback(e => setCmdName(e.target.value), []));
  useShoelaceEvent(responseRef, 'sl-input', useCallback(e => setCmdResponse(e.target.value), []));

  useEffect(() => {
    get('/api/guilds')
      .then(g => { setGuilds(g); if (g.length > 0) setGuildId(g[0].id); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);
    get(`/api/custom-commands/${guildId}`)
      .then(data => { setCommands(data.commands); setPrefix(data.prefix); })
      .catch(() => setCommands([]))
      .finally(() => setLoading(false));
  }, [guildId]);

  async function handleCreate() {
    if (!cmdName.trim() || !cmdResponse.trim()) return;
    setSaving(true);
    try {
      await post(`/api/custom-commands/${guildId}`, { name: cmdName.trim(), response: cmdResponse.trim() });
      setStatus({ message: 'Command created successfully', type: 'success' });
      setCmdName('');
      setCmdResponse('');
      if (nameRef.current) nameRef.current.value = '';
      if (responseRef.current) responseRef.current.value = '';
      const data = await get(`/api/custom-commands/${guildId}`);
      setCommands(data.commands);
    } catch (err) {
      setStatus({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await del(`/api/custom-commands/${deleteId}`);
      setStatus({ message: 'Command deleted', type: 'success' });
      deleteConfirmRef.current?.hide();
      setDeleteId(null);
      const data = await get(`/api/custom-commands/${guildId}`);
      setCommands(data.commands);
    } catch (err) {
      setStatus({ message: err.message, type: 'error' });
    }
  }

  return html`
    <div class="mb-6">
      <h1 class="text-[22px] font-bold">Custom Commands</h1>
      <p class="text-muted-foreground text-sm mt-0.5">Create text-based commands that respond when users type ${prefix}<command></p>
    </div>

    <${StatusMessage} message=${status.message} type=${status.type} onClear=${() => setStatus({ message: '', type: 'success' })} />

    <!-- Create Command -->
    <div class="bg-card rounded-lg p-5 shadow-card mb-5">
      <h2 class="text-[16px] font-semibold mb-4">Create Command</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Select Guild</label>
          <sl-select ref=${guildRef} value=${guildId} placeholder="Select a server..." size="medium" hoist>
            ${guilds.map(g => html`<sl-option value=${g.id}>${g.name}</sl-option>`)}
          </sl-select>
        </div>
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Command Name</label>
          <div class="flex items-center gap-1">
            <span class="text-accent font-mono text-lg font-bold">${prefix}</span>
            <sl-input ref=${nameRef} value=${cmdName} placeholder="hello" size="medium" class="flex-1"></sl-input>
          </div>
        </div>
      </div>

      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Response</label>
        <sl-textarea ref=${responseRef} value=${cmdResponse} placeholder="Hello {user}! Welcome to {server}!" rows="3" size="medium"></sl-textarea>
        <div class="text-muted-foreground text-[12px] mt-1">Placeholders: {user} {server} {channel} {memberCount}</div>
      </div>

      <sl-button variant="primary" size="medium" ?loading=${saving} ?disabled=${!guildId} onClick=${handleCreate}>
        Create Command
      </sl-button>
    </div>

    <!-- Commands List -->
    <div class="bg-card rounded-lg p-5 shadow-card">
      <h2 class="text-[16px] font-semibold mb-4">Commands</h2>

      ${loading && html`
        <div class="flex justify-center py-6">
          <sl-spinner style="font-size: 1.5rem;"></sl-spinner>
        </div>
      `}

      ${!loading && commands.length === 0 && html`
        <p class="text-muted-foreground text-sm py-4">No custom commands yet. Create one above!</p>
      `}

      ${!loading && commands.length > 0 && html`
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Command</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Response</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Created</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              ${commands.map(cmd => html`
                <tr class="hover:bg-muted transition-colors duration-100">
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm font-mono font-bold text-accent">${prefix}${cmd.name}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm max-w-[300px] truncate">${cmd.response}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm text-muted-foreground">${new Date(cmd.created_at).toLocaleDateString()}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">
                    <sl-icon-button
                      name="trash"
                      label="Delete"
                      class="text-muted-foreground hover:text-destructive"
                      onClick=${() => { setDeleteId(cmd.id); setTimeout(() => deleteConfirmRef.current?.show(), 0); }}
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
    <sl-dialog ref=${deleteConfirmRef} label="Delete Command">
      <p class="text-sm">Are you sure you want to delete this command? This cannot be undone.</p>
      <div class="mt-4 flex justify-end gap-2" slot="footer">
        <sl-button variant="default" onClick=${() => deleteConfirmRef.current?.hide()}>Cancel</sl-button>
        <sl-button variant="danger" onClick=${confirmDelete}>Delete</sl-button>
      </div>
    </sl-dialog>
  `;
}
