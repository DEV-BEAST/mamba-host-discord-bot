import { html } from 'htm/preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { get, put } from '../api.js';
import { useShoelaceEvent } from '../hooks/useShoelace.js';
import { StatusMessage } from '../components/StatusMessage.js';

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
function escAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Presence Card ──
function PresenceCard({ botInfo }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('playing');
  const [status, setStatus] = useState('online');
  const [url, setUrl] = useState('');
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const nameRef = useRef(null);
  const typeRef = useRef(null);
  const statusRef = useRef(null);
  const urlRef = useRef(null);

  useShoelaceEvent(nameRef, 'sl-input', useCallback(e => setName(e.target.value), []));
  useShoelaceEvent(typeRef, 'sl-change', useCallback(e => setType(e.target.value), []));
  useShoelaceEvent(statusRef, 'sl-change', useCallback(e => setStatus(e.target.value), []));
  useShoelaceEvent(urlRef, 'sl-input', useCallback(e => setUrl(e.target.value), []));

  const load = useCallback((settings) => {
    setName(settings.presence.name || '');
    setType(settings.presence.type || 'playing');
    setStatus(settings.presence.status || 'online');
    setUrl(settings.presence.url || '');
    setLoaded(true);
  }, []);

  useEffect(() => { PresenceCard._load = load; }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await put('/api/settings/presence', { name, type, status, url: url || null });
      setMsg('Presence updated successfully');
      setMsgType('success');
    } catch (err) {
      setMsg(err.message);
      setMsgType('error');
    } finally {
      setSaving(false);
    }
  };

  const typeLabels = { playing: 'Playing', watching: 'Watching', listening: 'Listening to', competing: 'Competing in', streaming: 'Streaming' };
  const activityText = name ? (typeLabels[type] || 'Playing') + ' ' + esc(name) : '';
  const isStreaming = type === 'streaming' && name;

  return html`
    <div class="bg-card border-0 rounded-lg p-5 shadow-card">
      <div class="text-[14px] font-semibold text-text-secondary uppercase tracking-wide mb-4">Presence</div>

      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Activity Text</label>
        <sl-input ref=${nameRef} value=${name} placeholder="Playing something..." size="medium"></sl-input>
      </div>
      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Type</label>
        <sl-select ref=${typeRef} value=${type} size="medium" hoist>
          <sl-option value="playing">Playing</sl-option>
          <sl-option value="watching">Watching</sl-option>
          <sl-option value="listening">Listening</sl-option>
          <sl-option value="competing">Competing</sl-option>
          <sl-option value="streaming">Streaming</sl-option>
        </sl-select>
      </div>
      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Status</label>
        <sl-select ref=${statusRef} value=${status} size="medium" hoist>
          <sl-option value="online">Online</sl-option>
          <sl-option value="idle">Idle</sl-option>
          <sl-option value="dnd">Do Not Disturb</sl-option>
          <sl-option value="invisible">Invisible</sl-option>
        </sl-select>
      </div>
      <div class="mb-5">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Streaming URL (required for Streaming type)</label>
        <sl-input ref=${urlRef} value=${url} type="url" placeholder="https://twitch.tv/..." size="medium"></sl-input>
      </div>

      <sl-button variant="primary" size="medium" loading=${saving} onClick=${save}>Save Presence</sl-button>

      <${StatusMessage} message=${msg} type=${msgType} onClear=${() => setMsg(null)} />

      ${loaded && html`
        <div class="presence-preview">
          <div class="presence-member${isStreaming ? ' presence-streaming' : ''}">
            <div class="presence-avatar-wrap">
              <img class="presence-avatar" src=${botInfo.avatar} alt="" />
              <div class="presence-status-dot ${status}"></div>
            </div>
            <div class="presence-info">
              <div class="presence-name">${botInfo.displayName}</div>
              ${activityText && html`<div class="presence-activity" dangerouslySetInnerHTML=${{ __html: activityText }}></div>`}
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}

// ── Auto-Role Card ──
function AutoRoleCard({ guilds }) {
  const [guildId, setGuildId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [roles, setRoles] = useState([]);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const [saving, setSaving] = useState(false);

  const guildRef = useRef(null);
  const roleRef = useRef(null);

  useShoelaceEvent(guildRef, 'sl-change', useCallback(e => {
    setGuildId(e.target.value);
    setRoleId('');
  }, []));
  useShoelaceEvent(roleRef, 'sl-change', useCallback(e => setRoleId(e.target.value), []));

  useEffect(() => {
    if (!guildId) { setRoles([]); return; }
    get('/api/guilds/' + guildId + '/roles')
      .then(r => setRoles(r))
      .catch(() => setRoles([]));
  }, [guildId]);

  const load = useCallback(async (settings, guildList) => {
    if (settings.autoRoleId) {
      for (const g of guildList) {
        const r = await get('/api/guilds/' + g.id + '/roles');
        const match = r.find(role => role.id === settings.autoRoleId);
        if (match) {
          setGuildId(g.id);
          setRoles(r);
          setRoleId(settings.autoRoleId);
          break;
        }
      }
    }
  }, []);

  useEffect(() => { AutoRoleCard._load = load; }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await put('/api/settings/autorole', { roleId: roleId || null });
      setMsg('Auto-role updated successfully');
      setMsgType('success');
    } catch (err) {
      setMsg(err.message);
      setMsgType('error');
    } finally {
      setSaving(false);
    }
  };

  return html`
    <div class="bg-card border-0 rounded-lg p-5 shadow-card">
      <div class="text-[14px] font-semibold text-text-secondary uppercase tracking-wide mb-4">Auto Role</div>

      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Guild</label>
        <sl-select ref=${guildRef} value=${guildId} placeholder="Select a server..." size="medium" hoist>
          ${guilds.map(g => html`<sl-option value=${g.id}>${g.name}</sl-option>`)}
        </sl-select>
      </div>
      <div class="mb-5">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Role to assign on join</label>
        <sl-select ref=${roleRef} value=${roleId} placeholder="Select a role..." size="medium" hoist>
          ${roles.map(r => html`<sl-option value=${r.id}>${r.name}</sl-option>`)}
        </sl-select>
      </div>

      <sl-button variant="primary" size="medium" loading=${saving} onClick=${save}>Save Auto-Role</sl-button>
      <${StatusMessage} message=${msg} type=${msgType} onClear=${() => setMsg(null)} />
    </div>
  `;
}

// ── Welcome Card ──
function WelcomeCard({ guilds, botInfo }) {
  const [enabled, setEnabled] = useState(false);
  const [guildId, setGuildId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [channels, setChannels] = useState([]);
  const [message, setMessage] = useState('');
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const [saving, setSaving] = useState(false);

  const enabledRef = useRef(null);
  const guildRef = useRef(null);
  const channelRef = useRef(null);
  const messageRef = useRef(null);

  useShoelaceEvent(enabledRef, 'sl-change', useCallback(e => setEnabled(e.target.checked), []));
  useShoelaceEvent(guildRef, 'sl-change', useCallback(e => {
    setGuildId(e.target.value);
    setChannelId('');
  }, []));
  useShoelaceEvent(channelRef, 'sl-change', useCallback(e => setChannelId(e.target.value), []));
  useShoelaceEvent(messageRef, 'sl-input', useCallback(e => setMessage(e.target.value), []));

  useEffect(() => {
    if (!guildId) { setChannels([]); return; }
    get('/api/guilds/' + guildId + '/channels')
      .then(data => setChannels(data.channels || []))
      .catch(() => setChannels([]));
  }, [guildId]);

  const load = useCallback(async (settings) => {
    setEnabled(settings.welcome.enabled);
    setMessage(settings.welcome.message || '');
    if (settings.welcome.guildId) {
      setGuildId(settings.welcome.guildId);
      try {
        const data = await get('/api/guilds/' + settings.welcome.guildId + '/channels');
        setChannels(data.channels || []);
        if (settings.welcome.channelId) setChannelId(settings.welcome.channelId);
      } catch {}
    }
  }, []);

  useEffect(() => { WelcomeCard._load = load; }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await put('/api/settings/welcome', {
        enabled,
        guildId: guildId || null,
        channelId: channelId || null,
        message,
      });
      setMsg('Welcome settings updated successfully');
      setMsgType('success');
    } catch (err) {
      setMsg(err.message);
      setMsgType('error');
    } finally {
      setSaving(false);
    }
  };

  const template = message || 'Welcome {user} to {server}!';
  const rendered = template
    .replace(/{user}/g, '<span class="dc-msg-mention">@ExampleUser</span>')
    .replace(/{server}/g, 'My Server')
    .replace(/{memberCount}/g, '42');

  const now = new Date();
  const timeStr = 'Today at ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return html`
    <div class="bg-card border-0 rounded-lg p-5 shadow-card">
      <div class="text-[14px] font-semibold text-text-secondary uppercase tracking-wide mb-4">Welcome Message</div>

      <div class="mb-4">
        <sl-switch ref=${enabledRef} .checked=${enabled}>Enable welcome messages</sl-switch>
      </div>
      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Guild</label>
        <sl-select ref=${guildRef} value=${guildId} placeholder="Select a server..." size="medium" hoist>
          ${guilds.map(g => html`<sl-option value=${g.id}>${g.name}</sl-option>`)}
        </sl-select>
      </div>
      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Channel</label>
        <sl-select ref=${channelRef} value=${channelId} placeholder="Select a channel..." size="medium" hoist>
          ${channels.map(c => html`<sl-option value=${c.id}>#${c.name}</sl-option>`)}
        </sl-select>
      </div>
      <div class="mb-5">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Message Template</label>
        <sl-textarea ref=${messageRef} value=${message} rows="3" placeholder="Welcome {user} to {server}!" size="medium"></sl-textarea>
        <div class="text-muted-foreground text-[12px] mt-1">Placeholders: {user} {server} {memberCount}</div>
      </div>

      <sl-button variant="primary" size="medium" loading=${saving} onClick=${save}>Save Welcome</sl-button>
      <${StatusMessage} message=${msg} type=${msgType} onClear=${() => setMsg(null)} />

      <div class="welcome-preview">
        <div class="dc-message">
          <img class="dc-msg-avatar" src=${botInfo.avatar} alt="" />
          <div class="dc-msg-body">
            <div class="dc-msg-header">
              <span class="dc-msg-author">${botInfo.displayName}</span>
              <span class="dc-msg-bot-tag">BOT</span>
              <span class="dc-msg-time">${timeStr}</span>
            </div>
            <div class="dc-msg-content" dangerouslySetInnerHTML=${{ __html: rendered }}></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Settings Page (Orchestrator) ──
export default function Settings() {
  const [guilds, setGuilds] = useState([]);
  const [botInfo, setBotInfo] = useState({ username: 'Bot', displayName: 'Bot', avatar: '', discriminator: '0' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [settings, guildList] = await Promise.all([get('/api/settings'), get('/api/guilds')]);
        setGuilds(guildList);
        if (settings.bot) setBotInfo(settings.bot);

        if (PresenceCard._load) PresenceCard._load(settings);
        if (AutoRoleCard._load) AutoRoleCard._load(settings, guildList);
        if (WelcomeCard._load) WelcomeCard._load(settings);

        setLoaded(true);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    init();
  }, []);

  return html`
    <div class="mb-6">
      <h1 class="text-[22px] font-bold">Settings</h1>
      <p class="text-muted-foreground text-sm mt-0.5">Configure bot behavior from the dashboard</p>
    </div>

    ${!loaded && html`
      <div class="flex justify-center py-12">
        <sl-spinner style="font-size: 2rem;"></sl-spinner>
      </div>
    `}

    <div class="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-4">
      <${PresenceCard} botInfo=${botInfo} />
      <${AutoRoleCard} guilds=${guilds} />
      <${WelcomeCard} guilds=${guilds} botInfo=${botInfo} />
    </div>
  `;
}
