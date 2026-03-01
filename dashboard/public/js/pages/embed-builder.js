import { get, post } from '../api.js';
import { showStatus } from '../app.js';

const PRESET_COLORS = [
  '#FF6F00', '#5865F2', '#57F287', '#FEE75C', '#EB459E',
  '#ED4245', '#00AFF4', '#FFFFFF', '#2B2D31',
];

let fields = [];

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
          <div class="form-group"><label>Description</label><textarea id="eb-description" rows="4" placeholder="Embed description... Supports **bold**, *italic*, __underline__, ~~strikethrough~~, \`code\`"></textarea></div>
          <div class="form-group">
            <label>Color</label>
            <div class="color-row">
              <input type="color" id="eb-color" value="#FF6F00">
              ${PRESET_COLORS.map(c => `<div class="color-swatch" data-color="${c}" style="background:${c}"></div>`).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Fields</div>
          <div id="eb-fields-list"></div>
          <button class="btn btn-secondary btn-sm mt-8" id="eb-add-field">+ Add Field</button>
        </div>

        <div class="card">
          <div class="card-title">Images</div>
          <div class="form-group"><label>Thumbnail URL</label><input type="url" id="eb-thumbnail" placeholder="https://..."></div>
          <div class="form-group"><label>Image URL</label><input type="url" id="eb-image" placeholder="https://..."></div>
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
      </div>

      <!-- Preview -->
      <div class="embed-preview-wrapper">
        <div class="card">
          <div class="card-title">Preview</div>
          <div id="eb-preview"></div>
        </div>
      </div>
    </div>
  `;

  fields = [];
  loadGuilds();
  bindEvents();
  updatePreview();
}

export function destroy() {}

async function loadGuilds() {
  try {
    const guilds = await get('/api/guilds');
    document.getElementById('eb-guild').innerHTML = '<option value="">Select a server...</option>' +
      guilds.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
  } catch (err) {
    console.error('Failed to load guilds:', err);
  }
}

async function loadChannels(guildId) {
  const sel = document.getElementById('eb-channel');
  if (!guildId) {
    sel.innerHTML = '<option value="">Select a channel...</option>';
    return;
  }
  try {
    const data = await get(`/api/guilds/${guildId}/channels`);
    sel.innerHTML = '<option value="">Select a channel...</option>' +
      data.channels.map(c => `<option value="${c.id}">#${c.name}${c.category ? ` (${c.category})` : ''}</option>`).join('');
  } catch (err) {
    console.error('Failed to load channels:', err);
  }
}

function bindEvents() {
  // Guild → load channels
  document.getElementById('eb-guild').addEventListener('change', e => loadChannels(e.target.value));

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
    fields.push({ name: '', value: '', inline: false });
    renderFields();
    updatePreview();
  });

  // Live preview on any input change
  const form = document.querySelector('.embed-form');
  form.addEventListener('input', updatePreview);
  form.addEventListener('change', updatePreview);

  // Send
  document.getElementById('eb-send').addEventListener('click', sendEmbed);
}

function renderFields() {
  const list = document.getElementById('eb-fields-list');
  list.innerHTML = fields.map((f, i) => `
    <div class="field-entry">
      <input type="text" placeholder="Field name" value="${escapeAttr(f.name)}" data-field="${i}" data-prop="name">
      <input type="text" placeholder="Field value" value="${escapeAttr(f.value)}" data-field="${i}" data-prop="value">
      <label><input type="checkbox" ${f.inline ? 'checked' : ''} data-field="${i}" data-prop="inline"> Inline</label>
      <button class="btn btn-danger btn-sm" data-remove="${i}">&times;</button>
    </div>
  `).join('');

  // Field input listeners
  list.querySelectorAll('input[data-field]').forEach(inp => {
    inp.addEventListener('input', () => {
      const idx = parseInt(inp.dataset.field);
      const prop = inp.dataset.prop;
      fields[idx][prop] = prop === 'inline' ? inp.checked : inp.value;
      updatePreview();
    });
    inp.addEventListener('change', () => {
      const idx = parseInt(inp.dataset.field);
      const prop = inp.dataset.prop;
      fields[idx][prop] = prop === 'inline' ? inp.checked : inp.value;
      updatePreview();
    });
  });

  // Remove field
  list.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      fields.splice(parseInt(btn.dataset.remove), 1);
      renderFields();
      updatePreview();
    });
  });
}

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

function updatePreview() {
  const data = getEmbedData();
  const preview = document.getElementById('eb-preview');
  if (!preview) return;

  const color = data.color || '#FF6F00';
  const hasContent = data.author.name || data.title || data.description || data.fields.length || data.thumbnail || data.image || data.footer.text;

  if (!hasContent) {
    preview.innerHTML = '<p class="text-muted">Start typing to see a preview...</p>';
    return;
  }

  let html = `<div class="embed-preview"><div class="color-bar" style="background:${color}"></div><div class="embed-body">`;

  // Content + thumbnail row
  html += '<div class="embed-content-row"><div class="embed-content">';

  // Author
  if (data.author.name) {
    html += '<div class="embed-author">';
    if (data.author.iconURL) html += `<img src="${escapeAttr(data.author.iconURL)}" alt="">`;
    if (data.author.url) html += `<a href="${escapeAttr(data.author.url)}" target="_blank">${escapeHtml(data.author.name)}</a>`;
    else html += escapeHtml(data.author.name);
    html += '</div>';
  }

  // Title
  if (data.title) {
    html += '<div class="embed-title">';
    if (data.url) html += `<a href="${escapeAttr(data.url)}" target="_blank">${escapeHtml(data.title)}</a>`;
    else html += escapeHtml(data.title);
    html += '</div>';
  }

  // Description
  if (data.description) {
    html += `<div class="embed-description">${renderMarkdown(data.description)}</div>`;
  }

  // Fields
  if (data.fields.length > 0) {
    html += '<div class="embed-fields">';
    for (const f of data.fields) {
      const cls = f.inline ? 'embed-field' : 'embed-field full-width';
      html += `<div class="${cls}"><div class="embed-field-name">${escapeHtml(f.name || '\u200b')}</div><div class="embed-field-value">${renderMarkdown(f.value || '\u200b')}</div></div>`;
    }
    html += '</div>';
  }

  html += '</div>'; // end embed-content

  // Thumbnail
  if (data.thumbnail) {
    html += `<img class="embed-thumbnail" src="${escapeAttr(data.thumbnail)}" alt="">`;
  }

  html += '</div>'; // end embed-content-row

  // Image
  if (data.image) {
    html += `<img class="embed-image" src="${escapeAttr(data.image)}" alt="">`;
  }

  // Footer
  if (data.footer.text || data.timestamp) {
    html += '<div class="embed-footer">';
    if (data.footer.iconURL) html += `<img src="${escapeAttr(data.footer.iconURL)}" alt="">`;
    const parts = [];
    if (data.footer.text) parts.push(escapeHtml(data.footer.text));
    if (data.timestamp) parts.push(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    html += parts.join(' • ');
    html += '</div>';
  }

  html += '</div></div>'; // end embed-body, embed-preview
  preview.innerHTML = html;
}

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
    await post('/api/embed/send', { channelId, ...data });
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

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Render Discord-lite markdown: bold, italic, underline, strikethrough, inline code
 */
function renderMarkdown(text) {
  let html = escapeHtml(text);
  // inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:#1e1f22;padding:1px 4px;border-radius:3px;font-size:13px">$1</code>');
  // bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // underline
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');
  // strikethrough
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
  return html;
}
