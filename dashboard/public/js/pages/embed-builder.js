import { get, post } from '../api.js';
import { showStatus } from '../app.js';

const PRESET_COLORS = [
  '#FF6F00', '#5865F2', '#57F287', '#FEE75C', '#EB459E',
  '#ED4245', '#00AFF4', '#FFFFFF', '#2B2D31',
];

let fields = [];
let attachments = []; // { name, size, type, data (base64), previewUrl }
let lastFocusedInput = null; // track last focused text input/textarea for mention insertion
let mentionMembers = [];
let mentionRoles = [];
let mentionChannels = [];

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Embed Builder</h1>
      <p>Build and send rich embeds to any channel</p>
    </div>

    <div class="embed-layout">
      <!-- Editor -->
      <div class="embed-form">
        <div class="card">
          <div class="card-title">Channel</div>
          <div class="form-group">
            <label>Guild</label>
            <select id="eb-guild"><option value="">Select a server...</option></select>
          </div>
          <div class="form-group">
            <label>Channel</label>
            <select id="eb-channel"><option value="">Select a channel...</option></select>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Author</div>
          <div class="form-group"><label>Name</label><input type="text" id="eb-author-name" placeholder="Author name"></div>
          <div class="form-group"><label>Icon URL</label><input type="url" id="eb-author-icon" placeholder="https://..."></div>
          <div class="form-group"><label>URL</label><input type="url" id="eb-author-url" placeholder="https://..."></div>
        </div>

        <div class="card">
          <div class="card-title">Body</div>
          <div class="form-group"><label>Title</label><input type="text" id="eb-title" placeholder="Embed title"></div>
          <div class="form-group"><label>Title URL</label><input type="url" id="eb-url" placeholder="https://..."></div>
          <div class="form-group"><label>Description</label><textarea id="eb-description" rows="4" placeholder="Supports **bold**, *italic*, __underline__, ~~strikethrough~~, \`code\`, \`\`\`code blocks\`\`\`, > blockquotes, [links](url), and ||spoilers||"></textarea></div>
          <div class="form-group">
            <label>Color</label>
            <div class="color-row">
              <input type="color" id="eb-color" value="#FF6F00">
              ${PRESET_COLORS.map(c => `<div class="color-swatch" data-color="${c}" style="background:${c}"></div>`).join('')}
            </div>
          </div>
        </div>

        <div class="card" id="eb-mentions-card" style="display:none">
          <div class="card-title">Mentions <small class="text-muted">(click Insert to add at cursor)</small></div>
          <div class="mention-row">
            <label style="white-space:nowrap;margin-bottom:0;min-width:55px">@User</label>
            <input type="text" id="eb-member-search" placeholder="Search members..." class="mention-search" style="margin-bottom:0">
            <select id="eb-mention-user"><option value="">Select user...</option></select>
            <button class="btn btn-secondary btn-sm" id="eb-insert-user">Insert</button>
          </div>
          <div class="mention-row">
            <label style="white-space:nowrap;margin-bottom:0;min-width:55px">@Role</label>
            <select id="eb-mention-role"><option value="">Select role...</option></select>
            <button class="btn btn-secondary btn-sm" id="eb-insert-role">Insert</button>
          </div>
          <div class="mention-row">
            <label style="white-space:nowrap;margin-bottom:0;min-width:55px">#Channel</label>
            <select id="eb-mention-channel"><option value="">Select channel...</option></select>
            <button class="btn btn-secondary btn-sm" id="eb-insert-channel">Insert</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Fields <small class="text-muted">(max 25)</small></div>
          <div id="eb-fields-list"></div>
          <button class="btn btn-secondary btn-sm mt-8" id="eb-add-field">+ Add Field</button>
        </div>

        <div class="card">
          <div class="card-title">Images</div>
          <div class="form-group"><label>Thumbnail URL</label><input type="url" id="eb-thumbnail" placeholder="https://..."></div>
          <div class="form-group"><label>Image URL</label><input type="url" id="eb-image" placeholder="https://..."></div>
        </div>

        <div class="card">
          <div class="card-title">Files & Attachments</div>
          <div class="file-drop-zone" id="eb-drop-zone">
            Drop files here or click to browse
            <input type="file" id="eb-attach-input" multiple class="hidden">
          </div>
          <div class="file-list" id="eb-file-list"></div>
        </div>

        <div class="card">
          <div class="card-title">Footer</div>
          <div class="form-group"><label>Footer Text</label><input type="text" id="eb-footer-text" placeholder="Footer text"></div>
          <div class="form-group"><label>Footer Icon URL</label><input type="url" id="eb-footer-icon" placeholder="https://..."></div>
          <label class="toggle mt-8">
            <input type="checkbox" id="eb-timestamp">
            <span class="toggle-track"></span>
            <span>Include timestamp</span>
          </label>
        </div>

        <button class="btn btn-primary" id="eb-send" style="width:100%;padding:12px">Send Embed</button>
        <div id="eb-status"></div>

        <div class="card mt-16">
          <div class="card-title">Extract from Discord</div>
          <div class="form-group">
            <label>Message Link</label>
            <div class="field-row">
              <input type="url" id="eb-msg-link" placeholder="https://discord.com/channels/guild/channel/message">
              <button class="btn btn-secondary btn-sm" id="eb-extract-msg">Load</button>
            </div>
          </div>
          <div id="eb-extract-status"></div>
        </div>

        <div class="card mt-16">
          <div class="card-title">JSON Export / Import</div>
          <div class="flex-gap flex-wrap">
            <button class="btn btn-secondary btn-sm" id="eb-export-json">Export JSON</button>
            <button class="btn btn-secondary btn-sm" id="eb-import-json">Import JSON</button>
            <input type="file" id="eb-file-input" accept=".json" class="hidden">
          </div>
          <div id="eb-json-status"></div>
        </div>
      </div>

      <!-- Preview -->
      <div class="embed-preview-wrapper">
        <div class="card">
          <div class="card-title">Preview</div>
          <div class="discord-message-wrapper" id="eb-preview"></div>
        </div>
      </div>
    </div>
  `;

  fields = [];
  attachments = [];
  lastFocusedInput = null;
  mentionMembers = [];
  mentionRoles = [];
  mentionChannels = [];
  loadGuilds();
  bindEvents();
  updatePreview();
}

export function destroy() {}

// ── Data loading ──

async function loadGuilds() {
  try {
    const guilds = await get('/api/guilds');
    document.getElementById('eb-guild').innerHTML = '<option value="">Select a server...</option>' +
      guilds.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('');
  } catch (err) {
    console.error('Failed to load guilds:', err);
  }
}

async function loadChannels(guildId) {
  const sel = document.getElementById('eb-channel');
  if (!guildId) { sel.innerHTML = '<option value="">Select a channel...</option>'; return; }
  try {
    const data = await get(`/api/guilds/${guildId}/channels`);
    sel.innerHTML = '<option value="">Select a channel...</option>' +
      data.channels.map(c => `<option value="${c.id}">#${esc(c.name)}${c.category ? ` (${esc(c.category)})` : ''}</option>`).join('');
  } catch (err) {
    console.error('Failed to load channels:', err);
  }
}

async function loadMentionData(guildId) {
  const mentionsCard = document.getElementById('eb-mentions-card');
  if (!guildId) {
    mentionsCard.style.display = 'none';
    return;
  }
  mentionsCard.style.display = '';

  try {
    const [members, roles, channelData] = await Promise.all([
      get(`/api/guilds/${guildId}/members`),
      get(`/api/guilds/${guildId}/roles`),
      get(`/api/guilds/${guildId}/channels`),
    ]);

    mentionMembers = members;
    mentionRoles = roles;
    mentionChannels = channelData.channels;

    renderMemberOptions(members);

    document.getElementById('eb-mention-role').innerHTML = '<option value="">Select role...</option>' +
      roles.map(r => `<option value="${r.id}" style="color:${r.color !== '#000000' ? r.color : 'inherit'}">${esc(r.name)}</option>`).join('');

    document.getElementById('eb-mention-channel').innerHTML = '<option value="">Select channel...</option>' +
      mentionChannels.map(c => `<option value="${c.id}">#${esc(c.name)}${c.category ? ` (${esc(c.category)})` : ''}</option>`).join('');
  } catch (err) {
    console.error('Failed to load mention data:', err);
  }
}

function renderMemberOptions(members) {
  document.getElementById('eb-mention-user').innerHTML = '<option value="">Select user...</option>' +
    members.map(m => `<option value="${m.id}">${esc(m.displayName)} (${esc(m.username)})</option>`).join('');
}

async function searchMembers(query) {
  const guildId = val('eb-guild');
  if (!guildId) return;
  try {
    const members = await get(`/api/guilds/${guildId}/members?search=${encodeURIComponent(query)}`);
    mentionMembers = members;
    renderMemberOptions(members);
  } catch (err) {
    console.error('Failed to search members:', err);
  }
}

// ── Events ──

function bindEvents() {
  // Guild change → load channels + mention data
  document.getElementById('eb-guild').addEventListener('change', e => {
    const guildId = e.target.value;
    loadChannels(guildId);
    loadMentionData(guildId);
  });

  // Color swatches
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.getElementById('eb-color').value = sw.dataset.color;
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      updatePreview();
    });
  });

  // Add field
  document.getElementById('eb-add-field').addEventListener('click', () => {
    if (fields.length >= 25) return;
    fields.push({ name: '', value: '', inline: false });
    renderFields();
    updatePreview();
  });

  // Live preview
  const form = document.querySelector('.embed-form');
  form.addEventListener('input', updatePreview);
  form.addEventListener('change', updatePreview);

  // Track last focused text input/textarea for mention insertion
  form.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) {
      lastFocusedInput = e.target;
    }
  });

  // Send
  document.getElementById('eb-send').addEventListener('click', sendEmbed);

  // Export / Import
  document.getElementById('eb-export-json').addEventListener('click', exportJSON);
  document.getElementById('eb-import-json').addEventListener('click', () => document.getElementById('eb-file-input').click());
  document.getElementById('eb-file-input').addEventListener('change', handleFileImport);

  // Extract from Discord message link
  document.getElementById('eb-extract-msg').addEventListener('click', extractFromLink);

  // Mention insertion
  document.getElementById('eb-insert-user').addEventListener('click', () => {
    const id = val('eb-mention-user');
    if (id) insertAtCursor(`<@${id}>`);
  });
  document.getElementById('eb-insert-role').addEventListener('click', () => {
    const id = val('eb-mention-role');
    if (id) insertAtCursor(`<@&${id}>`);
  });
  document.getElementById('eb-insert-channel').addEventListener('click', () => {
    const id = val('eb-mention-channel');
    if (id) insertAtCursor(`<#${id}>`);
  });

  // Member search with debounce
  let searchTimeout;
  document.getElementById('eb-member-search').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length >= 1) {
      searchTimeout = setTimeout(() => searchMembers(query), 300);
    } else if (query === '') {
      // Reset to full list
      const guildId = val('eb-guild');
      if (guildId) searchMembers('');
    }
  });

  // File attachments
  const dropZone = document.getElementById('eb-drop-zone');
  const attachInput = document.getElementById('eb-attach-input');

  dropZone.addEventListener('click', () => attachInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleAttachFiles(e.dataTransfer.files);
  });
  attachInput.addEventListener('change', (e) => {
    handleAttachFiles(e.target.files);
    e.target.value = '';
  });
}

// ── Mention insertion ──

function insertAtCursor(text) {
  const el = lastFocusedInput || document.getElementById('eb-description');
  if (!el) return;

  const start = el.selectionStart;
  const end = el.selectionEnd;
  const before = el.value.substring(0, start);
  const after = el.value.substring(end);
  el.value = before + text + after;

  // Set cursor position after inserted text
  const newPos = start + text.length;
  el.setSelectionRange(newPos, newPos);
  el.focus();

  // Update preview
  updatePreview();
}

// ── File attachments ──

function handleAttachFiles(fileList) {
  const MAX_SIZE = 25 * 1024 * 1024; // 25MB Discord limit

  for (const file of fileList) {
    // Check total size
    const currentTotal = attachments.reduce((sum, a) => sum + a.size, 0);
    if (currentTotal + file.size > MAX_SIZE) {
      showStatus(document.getElementById('eb-status'), `File "${file.name}" skipped: total attachments would exceed 25MB`, 'error');
      continue;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      // ev.target.result is a data URL like "data:image/png;base64,..."
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(',')[1];
      const isImage = file.type.startsWith('image/');

      attachments.push({
        name: file.name,
        size: file.size,
        type: file.type,
        data: base64,
        previewUrl: isImage ? dataUrl : null,
      });

      renderAttachments();
    };
    reader.readAsDataURL(file);
  }
}

function renderAttachments() {
  const list = document.getElementById('eb-file-list');
  if (attachments.length === 0) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = attachments.map((att, i) => `
    <div class="file-item">
      ${att.previewUrl ? `<img src="${att.previewUrl}" alt="">` : ''}
      <div class="file-info">
        <div class="file-name">${esc(att.name)}</div>
        <div class="file-size">${formatSize(att.size)}</div>
      </div>
      <button class="btn btn-danger btn-sm" data-remove-attach="${i}">&times;</button>
    </div>
  `).join('');

  list.querySelectorAll('[data-remove-attach]').forEach(btn => {
    btn.addEventListener('click', () => {
      attachments.splice(parseInt(btn.dataset.removeAttach), 1);
      renderAttachments();
    });
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── Import / Export ──

function getEmbedData() {
  return {
    author: {
      name: val('eb-author-name'),
      iconURL: val('eb-author-icon'),
      url: val('eb-author-url'),
    },
    title: val('eb-title'),
    url: val('eb-url'),
    description: val('eb-description'),
    color: val('eb-color'),
    fields: fields.filter(f => f.name || f.value),
    thumbnail: val('eb-thumbnail'),
    image: val('eb-image'),
    footer: {
      text: val('eb-footer-text'),
      iconURL: val('eb-footer-icon'),
    },
    timestamp: document.getElementById('eb-timestamp')?.checked || false,
  };
}

function populateFromData(data) {
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v || '';
  };

  set('eb-author-name', data.author?.name);
  set('eb-author-icon', data.author?.iconURL || data.author?.icon_url);
  set('eb-author-url', data.author?.url);
  set('eb-title', data.title);
  set('eb-url', data.url);
  set('eb-description', data.description);

  // Color: input[type=color] requires #rrggbb format
  if (data.color != null) {
    let hex = typeof data.color === 'number'
      ? '#' + data.color.toString(16).padStart(6, '0')
      : String(data.color);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      set('eb-color', hex);
    }
  }

  set('eb-thumbnail', typeof data.thumbnail === 'object' ? data.thumbnail?.url : data.thumbnail);
  set('eb-image', typeof data.image === 'object' ? data.image?.url : data.image);
  set('eb-footer-text', data.footer?.text);
  set('eb-footer-icon', data.footer?.iconURL || data.footer?.icon_url);

  const ts = document.getElementById('eb-timestamp');
  if (ts) ts.checked = !!data.timestamp;

  // Rebuild fields array and re-render
  fields = (data.fields || []).map(f => ({
    name: f.name || '',
    value: f.value || '',
    inline: !!f.inline,
  }));
  renderFields();
  updatePreview();
}

function exportJSON() {
  const data = getEmbedData();
  const exportObj = {
    embed: {
      author: data.author.name ? data.author : undefined,
      title: data.title || undefined,
      url: data.url || undefined,
      description: data.description || undefined,
      color: data.color ? parseInt(data.color.replace('#', ''), 16) : undefined,
      fields: data.fields.length > 0 ? data.fields : undefined,
      thumbnail: data.thumbnail ? { url: data.thumbnail } : undefined,
      image: data.image ? { url: data.image } : undefined,
      footer: data.footer.text ? data.footer : undefined,
      timestamp: data.timestamp ? new Date().toISOString() : undefined,
    }
  };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `embed-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showStatus(document.getElementById('eb-json-status'), 'JSON file downloaded');
}

function handleFileImport(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;

  const statusEl = document.getElementById('eb-json-status');
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      let data = JSON.parse(ev.target.result);

      // Support Carl-bot format: { embed: { ... } } or { embeds: [{ ... }] }
      if (data.embed) data = data.embed;
      else if (data.embeds && data.embeds[0]) data = data.embeds[0];

      populateFromData(data);
      showStatus(statusEl, 'Embed imported from ' + file.name);
    } catch (err) {
      showStatus(statusEl, 'Invalid JSON: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

async function extractFromLink() {
  const linkInput = document.getElementById('eb-msg-link');
  const statusEl = document.getElementById('eb-extract-status');
  const url = linkInput.value.trim();

  if (!url) {
    showStatus(statusEl, 'Please paste a Discord message link', 'error');
    return;
  }

  // Parse: https://discord.com/channels/{guildId}/{channelId}/{messageId}
  const match = url.match(/channels\/(\d+)\/(\d+)\/(\d+)/);
  if (!match) {
    showStatus(statusEl, 'Invalid Discord message link format', 'error');
    return;
  }

  const [, guildId, channelId, messageId] = match;
  const btn = document.getElementById('eb-extract-msg');
  btn.disabled = true;

  try {
    const data = await get(`/api/embed/extract?guildId=${guildId}&channelId=${channelId}&messageId=${messageId}`);
    populateFromData(data);

    // Also select the guild/channel in the dropdowns
    const guildSelect = document.getElementById('eb-guild');
    if (guildSelect) {
      guildSelect.value = guildId;
      await loadChannels(guildId);
      await loadMentionData(guildId);
      const channelSelect = document.getElementById('eb-channel');
      if (channelSelect) channelSelect.value = channelId;
    }

    showStatus(statusEl, 'Embed extracted successfully');
  } catch (err) {
    showStatus(statusEl, err.message || 'Failed to extract embed', 'error');
  } finally {
    btn.disabled = false;
  }
}

// ── Field management ──

function renderFields() {
  const list = document.getElementById('eb-fields-list');
  list.innerHTML = fields.map((f, i) => `
    <div class="field-entry">
      <input type="text" placeholder="Field name" value="${escAttr(f.name)}" data-field="${i}" data-prop="name">
      <input type="text" placeholder="Field value" value="${escAttr(f.value)}" data-field="${i}" data-prop="value">
      <label><input type="checkbox" ${f.inline ? 'checked' : ''} data-field="${i}" data-prop="inline"> Inline</label>
      <button class="btn btn-danger btn-sm" data-remove="${i}">&times;</button>
    </div>
  `).join('');

  list.querySelectorAll('input[data-field]').forEach(inp => {
    const handler = () => {
      const idx = parseInt(inp.dataset.field);
      const prop = inp.dataset.prop;
      fields[idx][prop] = prop === 'inline' ? inp.checked : inp.value;
      updatePreview();
    };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', handler);
  });

  list.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      fields.splice(parseInt(btn.dataset.remove), 1);
      renderFields();
      updatePreview();
    });
  });
}

// ── Preview rendering (pixel-accurate Discord) ──

function updatePreview() {
  const data = getEmbedData();
  const preview = document.getElementById('eb-preview');
  if (!preview) return;

  const color = data.color || '#202225';
  const hasContent = data.author.name || data.title || data.description || data.fields.length ||
    data.thumbnail || data.image || data.footer.text || data.timestamp;

  if (!hasContent) {
    preview.innerHTML = '<p class="text-muted">Start typing to see a preview...</p>';
    return;
  }

  let html = '<article class="dc-embed" style="border-color:' + color + '">';
  html += '<div class="dc-embed-grid">';

  // Author
  if (data.author.name) {
    html += '<div class="dc-embed-author">';
    if (data.author.iconURL) html += '<img class="dc-embed-author-icon" src="' + escAttr(data.author.iconURL) + '" alt="">';
    if (data.author.url) {
      html += '<a class="dc-embed-author-name" href="' + escAttr(data.author.url) + '" target="_blank">' + esc(data.author.name) + '</a>';
    } else {
      html += '<span class="dc-embed-author-name">' + esc(data.author.name) + '</span>';
    }
    html += '</div>';
  }

  // Title
  if (data.title) {
    html += '<div class="dc-embed-title">';
    if (data.url) html += '<a href="' + escAttr(data.url) + '" target="_blank">' + esc(data.title) + '</a>';
    else html += esc(data.title);
    html += '</div>';
  }

  // Description
  if (data.description) {
    html += '<div class="dc-embed-description">' + renderMarkdown(data.description) + '</div>';
  }

  // Fields - use Discord's inline grouping algorithm
  if (data.fields.length > 0) {
    html += renderFieldsGrid(data.fields);
  }

  // Thumbnail (positioned by grid, rendered here for source order)
  if (data.thumbnail) {
    html += '<div class="dc-embed-thumbnail"><img src="' + escAttr(data.thumbnail) + '" alt=""></div>';
  }

  // Image
  if (data.image) {
    html += '<div class="dc-embed-image"><img src="' + escAttr(data.image) + '" alt=""></div>';
  }

  // Footer
  if (data.footer.text || data.timestamp) {
    html += '<div class="dc-embed-footer">';
    if (data.footer.iconURL) html += '<img class="dc-embed-footer-icon" src="' + escAttr(data.footer.iconURL) + '" alt="">';
    html += '<span class="dc-embed-footer-text">';
    const parts = [];
    if (data.footer.text) parts.push(esc(data.footer.text));
    if (data.timestamp) {
      const now = new Date();
      const timeStr = 'Today at ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      parts.push(timeStr);
    }
    html += parts.join(' <span class="dc-embed-footer-sep">\u2022</span> ');
    html += '</span></div>';
  }

  html += '</div></article>';
  preview.innerHTML = html;
}

/**
 * Discord's field layout algorithm:
 * - Non-inline fields take a full row
 * - Consecutive inline fields are grouped into rows of up to 3
 * - Each inline field in a row gets equal width (1/n of the row)
 */
function renderFieldsGrid(fieldList) {
  let html = '<div class="dc-embed-fields">';
  let i = 0;

  while (i < fieldList.length) {
    const f = fieldList[i];
    if (!f.inline) {
      // Full-width field
      html += '<div class="dc-embed-field dc-field-full">';
      html += '<div class="dc-embed-field-name">' + esc(f.name || '\u200b') + '</div>';
      html += '<div class="dc-embed-field-value">' + renderMarkdown(f.value || '\u200b') + '</div>';
      html += '</div>';
      i++;
    } else {
      // Collect consecutive inline fields (max 3 per row)
      const row = [];
      while (i < fieldList.length && fieldList[i].inline && row.length < 3) {
        row.push(fieldList[i]);
        i++;
      }
      const colClass = row.length === 1 ? 'dc-field-col-1' : row.length === 2 ? 'dc-field-col-2' : 'dc-field-col-3';
      html += '<div class="dc-embed-field-row">';
      for (const rf of row) {
        html += '<div class="dc-embed-field ' + colClass + '">';
        html += '<div class="dc-embed-field-name">' + esc(rf.name || '\u200b') + '</div>';
        html += '<div class="dc-embed-field-value">' + renderMarkdown(rf.value || '\u200b') + '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
  }

  html += '</div>';
  return html;
}

/**
 * Discord markdown renderer
 * Order matters: code blocks first (to protect content), then inline formatting
 */
function renderMarkdown(text) {
  // Escape HTML first
  let html = esc(text);

  // Multi-line code blocks: ```lang\ncode\n```
  html = html.replace(/```(?:\w*)\n([\s\S]*?)```/g,
    '<pre class="dc-codeblock"><code>$1</code></pre>');
  // Inline code blocks without language
  html = html.replace(/```([\s\S]*?)```/g,
    '<pre class="dc-codeblock"><code>$1</code></pre>');

  // Inline code (protect from further processing)
  const codeTokens = [];
  html = html.replace(/`([^`\n]+)`/g, (_, code) => {
    const token = '\x00CODE' + codeTokens.length + '\x00';
    codeTokens.push('<code class="dc-inline-code">' + code + '</code>');
    return token;
  });

  // Spoilers
  html = html.replace(/\|\|(.+?)\|\|/g, '<span class="dc-spoiler">$1</span>');

  // Masked links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="dc-link" target="_blank">$1</a>');

  // Bold italic: ***text***
  html = html.replace(/\*\*\*(.+?)\*\*\*/gs, '<strong><em>$1</em></strong>');
  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>');
  // Italic: *text*
  html = html.replace(/\*(.+?)\*/gs, '<em>$1</em>');
  // Underline bold italic: ___text___
  html = html.replace(/___(.+?)___/gs, '<u><strong><em>$1</em></strong></u>');
  // Underline bold: __**text**__
  html = html.replace(/__\*\*(.+?)\*\*__/gs, '<u><strong>$1</strong></u>');
  // Underline: __text__
  html = html.replace(/__(.+?)__/gs, '<u>$1</u>');
  // Strikethrough: ~~text~~
  html = html.replace(/~~(.+?)~~/gs, '<s>$1</s>');

  // Blockquotes: > text (at start of line)
  html = html.replace(/(^|\n)&gt; (.+)/g, '$1<div class="dc-blockquote">$2</div>');

  // Restore code tokens
  for (let i = 0; i < codeTokens.length; i++) {
    html = html.replace('\x00CODE' + i + '\x00', codeTokens[i]);
  }

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

// ── Send embed ──

async function sendEmbed() {
  const channelId = val('eb-channel');
  const statusEl = document.getElementById('eb-status');

  if (!channelId) {
    showStatus(statusEl, 'Please select a channel first', 'error');
    return;
  }

  const data = getEmbedData();
  const btn = document.getElementById('eb-send');
  btn.disabled = true;

  try {
    const payload = { channelId, ...data };

    // Include file attachments as base64
    if (attachments.length > 0) {
      payload.attachments = attachments.map(a => ({
        name: a.name,
        data: a.data,
      }));
    }

    await post('/api/embed/send', payload);
    showStatus(statusEl, 'Embed sent successfully!');
  } catch (err) {
    showStatus(statusEl, err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ── Helpers ──

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
