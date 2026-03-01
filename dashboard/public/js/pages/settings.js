import { get, put } from '../api.js';
import { showStatus } from '../app.js';

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Settings</h1>
      <p>Configure bot behavior from the dashboard</p>
    </div>
    <div class="settings-grid">
      <!-- Presence -->
      <div class="card" id="presence-card">
        <div class="card-title">Presence</div>
        <div class="form-group">
          <label>Activity Text</label>
          <input type="text" id="pres-name" placeholder="Playing something...">
        </div>
        <div class="form-group">
          <label>Type</label>
          <select id="pres-type">
            <option value="playing">Playing</option>
            <option value="watching">Watching</option>
            <option value="listening">Listening</option>
            <option value="competing">Competing</option>
            <option value="streaming">Streaming</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="pres-status">
            <option value="online">Online</option>
            <option value="idle">Idle</option>
            <option value="dnd">Do Not Disturb</option>
            <option value="invisible">Invisible</option>
          </select>
        </div>
        <div class="form-group">
          <label>Streaming URL (required for Streaming type)</label>
          <input type="url" id="pres-url" placeholder="https://twitch.tv/...">
        </div>
        <button class="btn btn-primary" id="save-presence">Save Presence</button>
      </div>

      <!-- Auto-role -->
      <div class="card" id="autorole-card">
        <div class="card-title">Auto Role</div>
        <div class="form-group">
          <label>Guild</label>
          <select id="ar-guild"><option value="">Select a server...</option></select>
        </div>
        <div class="form-group">
          <label>Role to assign on join</label>
          <select id="ar-role"><option value="">Select a role...</option></select>
        </div>
        <button class="btn btn-primary" id="save-autorole">Save Auto-Role</button>
      </div>

      <!-- Welcome -->
      <div class="card" id="welcome-card">
        <div class="card-title">Welcome Message</div>
        <label class="toggle">
          <input type="checkbox" id="wc-enabled">
          <span class="toggle-track"></span>
          <span>Enable welcome messages</span>
        </label>
        <div class="form-group mt-16">
          <label>Guild</label>
          <select id="wc-guild"><option value="">Select a server...</option></select>
        </div>
        <div class="form-group">
          <label>Channel</label>
          <select id="wc-channel"><option value="">Select a channel...</option></select>
        </div>
        <div class="form-group">
          <label>Message Template</label>
          <textarea id="wc-message" rows="3" placeholder="Welcome {user} to {server}!"></textarea>
          <small class="text-muted">Placeholders: {user} {server} {memberCount}</small>
        </div>
        <button class="btn btn-primary" id="save-welcome">Save Welcome</button>
      </div>
    </div>
  `;

  loadSettings();
  bindEvents();
}

export function destroy() {}

async function loadSettings() {
  try {
    const [settings, guilds] = await Promise.all([get('/api/settings'), get('/api/guilds')]);

    // Presence
    document.getElementById('pres-name').value = settings.presence.name || '';
    document.getElementById('pres-type').value = settings.presence.type || 'playing';
    document.getElementById('pres-status').value = settings.presence.status || 'online';
    document.getElementById('pres-url').value = settings.presence.url || '';

    // Populate guild selectors
    const guildOptions = guilds.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    document.getElementById('ar-guild').innerHTML = '<option value="">Select a server...</option>' + guildOptions;
    document.getElementById('wc-guild').innerHTML = '<option value="">Select a server...</option>' + guildOptions;

    // Auto-role: try to find which guild has the current role
    if (settings.autoRoleId) {
      // We'll load roles for each guild until we find the matching role
      for (const g of guilds) {
        const roles = await get(`/api/guilds/${g.id}/roles`);
        const match = roles.find(r => r.id === settings.autoRoleId);
        if (match) {
          document.getElementById('ar-guild').value = g.id;
          await loadRolesForAutorole(g.id, settings.autoRoleId);
          break;
        }
      }
    }

    // Welcome
    document.getElementById('wc-enabled').checked = settings.welcome.enabled;
    document.getElementById('wc-message').value = settings.welcome.message || '';
    if (settings.welcome.guildId) {
      document.getElementById('wc-guild').value = settings.welcome.guildId;
      await loadChannelsForWelcome(settings.welcome.guildId, settings.welcome.channelId);
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

async function loadRolesForAutorole(guildId, selectedRoleId) {
  const roles = await get(`/api/guilds/${guildId}/roles`);
  const sel = document.getElementById('ar-role');
  sel.innerHTML = '<option value="">Select a role...</option>' +
    roles.map(r => `<option value="${r.id}" style="color:${r.color}">${r.name}</option>`).join('');
  if (selectedRoleId) sel.value = selectedRoleId;
}

async function loadChannelsForWelcome(guildId, selectedChannelId) {
  const data = await get(`/api/guilds/${guildId}/channels`);
  const sel = document.getElementById('wc-channel');
  sel.innerHTML = '<option value="">Select a channel...</option>' +
    data.channels.map(c => `<option value="${c.id}">#${c.name}</option>`).join('');
  if (selectedChannelId) sel.value = selectedChannelId;
}

function bindEvents() {
  // Presence save
  document.getElementById('save-presence').addEventListener('click', async () => {
    const card = document.getElementById('presence-card');
    try {
      await put('/api/settings/presence', {
        name: document.getElementById('pres-name').value,
        type: document.getElementById('pres-type').value,
        status: document.getElementById('pres-status').value,
        url: document.getElementById('pres-url').value || null,
      });
      showStatus(card, 'Presence updated successfully');
    } catch (err) {
      showStatus(card, err.message, 'error');
    }
  });

  // Auto-role guild change → load roles
  document.getElementById('ar-guild').addEventListener('change', (e) => {
    if (e.target.value) loadRolesForAutorole(e.target.value);
    else document.getElementById('ar-role').innerHTML = '<option value="">Select a role...</option>';
  });

  // Auto-role save
  document.getElementById('save-autorole').addEventListener('click', async () => {
    const card = document.getElementById('autorole-card');
    try {
      await put('/api/settings/autorole', {
        roleId: document.getElementById('ar-role').value || null,
      });
      showStatus(card, 'Auto-role updated successfully');
    } catch (err) {
      showStatus(card, err.message, 'error');
    }
  });

  // Welcome guild change → load channels
  document.getElementById('wc-guild').addEventListener('change', (e) => {
    if (e.target.value) loadChannelsForWelcome(e.target.value);
    else document.getElementById('wc-channel').innerHTML = '<option value="">Select a channel...</option>';
  });

  // Welcome save
  document.getElementById('save-welcome').addEventListener('click', async () => {
    const card = document.getElementById('welcome-card');
    try {
      await put('/api/settings/welcome', {
        enabled: document.getElementById('wc-enabled').checked,
        guildId: document.getElementById('wc-guild').value || null,
        channelId: document.getElementById('wc-channel').value || null,
        message: document.getElementById('wc-message').value,
      });
      showStatus(card, 'Welcome settings updated successfully');
    } catch (err) {
      showStatus(card, err.message, 'error');
    }
  });
}
