import { html } from 'htm/preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { get, post, put, del } from '../api.js';
import { useShoelaceEvent } from '../hooks/useShoelace.js';
import { StatusMessage } from '../components/StatusMessage.js';

export default function ScheduledMessages() {
  const [guilds, setGuilds] = useState([]);
  const [guildId, setGuildId] = useState('');
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'success' });

  // Form state
  const [channelId, setChannelId] = useState('');
  const [msgType, setMsgType] = useState('text'); // text or embed
  const [content, setContent] = useState('');
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedDesc, setEmbedDesc] = useState('');
  const [embedColor, setEmbedColor] = useState('#FF6F00');
  const [sendAt, setSendAt] = useState('');
  const [recurrence, setRecurrence] = useState('once');
  const [saving, setSaving] = useState(false);

  const guildRef = useRef(null);
  const channelRef = useRef(null);
  const contentRef = useRef(null);
  const embedTitleRef = useRef(null);
  const embedDescRef = useRef(null);
  const embedColorRef = useRef(null);
  const recurrenceRef = useRef(null);
  const deleteConfirmRef = useRef(null);
  const [deleteId, setDeleteId] = useState(null);

  useShoelaceEvent(guildRef, 'sl-change', useCallback(e => {
    setGuildId(e.target.value);
    setChannelId('');
  }, []));
  useShoelaceEvent(channelRef, 'sl-change', useCallback(e => setChannelId(e.target.value), []));
  useShoelaceEvent(contentRef, 'sl-input', useCallback(e => setContent(e.target.value), []));
  useShoelaceEvent(embedTitleRef, 'sl-input', useCallback(e => setEmbedTitle(e.target.value), []));
  useShoelaceEvent(embedDescRef, 'sl-input', useCallback(e => setEmbedDesc(e.target.value), []));
  useShoelaceEvent(embedColorRef, 'sl-change', useCallback(e => setEmbedColor(e.target.value), []));
  useShoelaceEvent(recurrenceRef, 'sl-change', useCallback(e => setRecurrence(e.target.value), []));

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
    loadMessages();
  }, [guildId]);

  function loadMessages() {
    if (!guildId) return;
    setLoading(true);
    get(`/api/scheduled-messages/${guildId}`)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }

  async function handleCreate() {
    if (!channelId || !sendAt) return;
    setSaving(true);

    const body = { channelId, sendAt, recurrence };
    if (msgType === 'text') {
      if (!content.trim()) { setSaving(false); return; }
      body.content = content.trim();
    } else {
      if (!embedTitle.trim() && !embedDesc.trim()) { setSaving(false); return; }
      body.embedJson = JSON.stringify({
        title: embedTitle.trim() || undefined,
        description: embedDesc.trim() || undefined,
        color: parseInt(embedColor.replace('#', ''), 16),
      });
    }

    try {
      await post(`/api/scheduled-messages/${guildId}`, body);
      setStatus({ message: 'Scheduled message created', type: 'success' });
      setContent('');
      setEmbedTitle('');
      setEmbedDesc('');
      setSendAt('');
      if (contentRef.current) contentRef.current.value = '';
      if (embedTitleRef.current) embedTitleRef.current.value = '';
      if (embedDescRef.current) embedDescRef.current.value = '';
      loadMessages();
    } catch (err) {
      setStatus({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id, isActive) {
    try {
      await put(`/api/scheduled-messages/${id}/toggle`, { isActive });
      loadMessages();
    } catch (err) {
      setStatus({ message: err.message, type: 'error' });
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await del(`/api/scheduled-messages/${deleteId}`);
      setStatus({ message: 'Scheduled message deleted', type: 'success' });
      deleteConfirmRef.current?.hide();
      setDeleteId(null);
      loadMessages();
    } catch (err) {
      setStatus({ message: err.message, type: 'error' });
    }
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString();
  }

  return html`
    <div class="mb-6">
      <h1 class="text-[22px] font-bold">Scheduled Messages</h1>
      <p class="text-muted-foreground text-sm mt-0.5">Schedule messages to be sent at specific times</p>
    </div>

    <${StatusMessage} message=${status.message} type=${status.type} onClear=${() => setStatus({ message: '', type: 'success' })} />

    <!-- Create Scheduled Message -->
    <div class="bg-card rounded-lg p-5 shadow-card mb-5">
      <h2 class="text-[16px] font-semibold mb-4">Schedule a Message</h2>

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

      <!-- Message Type Toggle -->
      <div class="flex gap-2 mb-4">
        <sl-button size="small" variant=${msgType === 'text' ? 'primary' : 'default'} onClick=${() => setMsgType('text')}>Text</sl-button>
        <sl-button size="small" variant=${msgType === 'embed' ? 'primary' : 'default'} onClick=${() => setMsgType('embed')}>Embed</sl-button>
      </div>

      ${msgType === 'text' && html`
        <div class="mb-4">
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Message Content</label>
          <sl-textarea ref=${contentRef} value=${content} placeholder="Type your message..." rows="3" size="medium"></sl-textarea>
        </div>
      `}

      ${msgType === 'embed' && html`
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Embed Title</label>
            <sl-input ref=${embedTitleRef} value=${embedTitle} placeholder="Title..." size="medium"></sl-input>
          </div>
          <div>
            <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Embed Color</label>
            <sl-color-picker ref=${embedColorRef} value=${embedColor} format="hex" no-format-toggle size="medium"></sl-color-picker>
          </div>
        </div>
        <div class="mb-4">
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Embed Description</label>
          <sl-textarea ref=${embedDescRef} value=${embedDesc} placeholder="Description..." rows="3" size="medium"></sl-textarea>
        </div>
      `}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Send At</label>
          <input
            type="datetime-local"
            class="w-full h-[40px] px-3 bg-input border border-border rounded text-foreground text-sm focus:border-accent focus:outline-none"
            value=${sendAt}
            onInput=${(e) => setSendAt(e.target.value)}
          />
        </div>
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Recurrence</label>
          <sl-select ref=${recurrenceRef} value=${recurrence} size="medium" hoist>
            <sl-option value="once">Once</sl-option>
            <sl-option value="daily">Daily</sl-option>
            <sl-option value="weekly">Weekly</sl-option>
          </sl-select>
        </div>
      </div>

      <sl-button variant="primary" size="medium" ?loading=${saving} ?disabled=${!guildId || !channelId} onClick=${handleCreate}>
        Schedule Message
      </sl-button>
    </div>

    <!-- Scheduled Messages List -->
    <div class="bg-card rounded-lg p-5 shadow-card">
      <h2 class="text-[16px] font-semibold mb-4">Scheduled Messages</h2>

      ${loading && html`
        <div class="flex justify-center py-6">
          <sl-spinner style="font-size: 1.5rem;"></sl-spinner>
        </div>
      `}

      ${!loading && messages.length === 0 && html`
        <p class="text-muted-foreground text-sm py-4">No scheduled messages yet. Create one above!</p>
      `}

      ${!loading && messages.length > 0 && html`
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Channel</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Content</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Send At</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Recurrence</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Active</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              ${messages.map(m => html`
                <tr class="hover:bg-muted transition-colors duration-100">
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">#${m.channelName}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm max-w-[200px] truncate">
                    ${m.content || (m.embed_json ? '[Embed]' : '—')}
                  </td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm text-muted-foreground">${formatDate(m.send_at)}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      m.recurrence === 'once' ? 'bg-[#5865f2]/20 text-[#5865f2]' :
                      m.recurrence === 'daily' ? 'bg-[#23a559]/20 text-[#23a559]' :
                      'bg-[#e8860c]/20 text-[#e8860c]'
                    }">${m.recurrence}</span>
                  </td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">
                    <sl-switch
                      ?checked=${!!m.is_active}
                      onsl-change=${(e) => handleToggle(m.id, e.target.checked)}
                    ></sl-switch>
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
    <sl-dialog ref=${deleteConfirmRef} label="Delete Scheduled Message">
      <p class="text-sm">Are you sure you want to delete this scheduled message? This cannot be undone.</p>
      <div class="mt-4 flex justify-end gap-2" slot="footer">
        <sl-button variant="default" onClick=${() => deleteConfirmRef.current?.hide()}>Cancel</sl-button>
        <sl-button variant="danger" onClick=${confirmDelete}>Delete</sl-button>
      </div>
    </sl-dialog>
  `;
}
