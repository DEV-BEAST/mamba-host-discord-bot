import { html } from 'htm/preact';

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Discord markdown renderer
 */
function renderMarkdown(text) {
  let h = esc(text);

  // Multi-line code blocks
  h = h.replace(/```(?:\w*)\n([\s\S]*?)```/g, '<pre class="dc-codeblock"><code>$1</code></pre>');
  h = h.replace(/```([\s\S]*?)```/g, '<pre class="dc-codeblock"><code>$1</code></pre>');

  // Inline code (protect from further processing)
  const codeTokens = [];
  h = h.replace(/`([^`\n]+)`/g, (_, code) => {
    const token = '\x00CODE' + codeTokens.length + '\x00';
    codeTokens.push('<code class="dc-inline-code">' + code + '</code>');
    return token;
  });

  // Spoilers
  h = h.replace(/\|\|(.+?)\|\|/g, '<span class="dc-spoiler">$1</span>');
  // Masked links
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="dc-link" target="_blank">$1</a>');
  // Bold italic
  h = h.replace(/\*\*\*(.+?)\*\*\*/gs, '<strong><em>$1</em></strong>');
  // Bold
  h = h.replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>');
  // Italic
  h = h.replace(/\*(.+?)\*/gs, '<em>$1</em>');
  // Underline bold italic
  h = h.replace(/___(.+?)___/gs, '<u><strong><em>$1</em></strong></u>');
  // Underline bold
  h = h.replace(/__\*\*(.+?)\*\*__/gs, '<u><strong>$1</strong></u>');
  // Underline
  h = h.replace(/__(.+?)__/gs, '<u>$1</u>');
  // Strikethrough
  h = h.replace(/~~(.+?)~~/gs, '<s>$1</s>');
  // Blockquotes
  h = h.replace(/(^|\n)&gt; (.+)/g, '$1<div class="dc-blockquote">$2</div>');

  // Restore code tokens
  for (let i = 0; i < codeTokens.length; i++) {
    h = h.replace('\x00CODE' + i + '\x00', codeTokens[i]);
  }

  // Line breaks
  h = h.replace(/\n/g, '<br>');
  return h;
}

/**
 * Discord field grid layout algorithm
 */
function renderFieldsGrid(fieldList) {
  let h = '<div class="dc-embed-fields">';
  let i = 0;

  while (i < fieldList.length) {
    const f = fieldList[i];
    if (!f.inline) {
      h += '<div class="dc-embed-field dc-field-full">';
      h += '<div class="dc-embed-field-name">' + esc(f.name || '\u200b') + '</div>';
      h += '<div class="dc-embed-field-value">' + renderMarkdown(f.value || '\u200b') + '</div>';
      h += '</div>';
      i++;
    } else {
      const row = [];
      while (i < fieldList.length && fieldList[i].inline && row.length < 3) {
        row.push(fieldList[i]);
        i++;
      }
      const colClass = row.length === 1 ? 'dc-field-col-1' : row.length === 2 ? 'dc-field-col-2' : 'dc-field-col-3';
      h += '<div class="dc-embed-field-row">';
      for (const rf of row) {
        h += '<div class="dc-embed-field ' + colClass + '">';
        h += '<div class="dc-embed-field-name">' + esc(rf.name || '\u200b') + '</div>';
        h += '<div class="dc-embed-field-value">' + renderMarkdown(rf.value || '\u200b') + '</div>';
        h += '</div>';
      }
      h += '</div>';
    }
  }

  h += '</div>';
  return h;
}

export function EmbedPreview({ embedData, attachments, botInfo }) {
  const data = embedData;
  const color = data.color || '#202225';
  const hasEmbed = data.author.name || data.title || data.description || data.fields.length ||
    data.thumbnail || data.image || data.footer.text || data.timestamp;
  const hasAttachments = attachments.length > 0;

  if (!hasEmbed && !hasAttachments) {
    return html`
      <div class="bg-card rounded-lg p-5">
        <div class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Preview</div>
        <p class="text-muted-foreground text-sm">Start typing to see a preview...</p>
      </div>
    `;
  }

  const now = new Date();
  const timeStr = 'Today at ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  // Build HTML string for the preview (same approach as original)
  let previewHtml = '<div class="dc-message">';
  previewHtml += '<img class="dc-msg-avatar" src="' + escAttr(botInfo.avatar) + '" alt="">';
  previewHtml += '<div class="dc-msg-body">';
  previewHtml += '<div class="dc-msg-header">';
  previewHtml += '<span class="dc-msg-author">' + esc(botInfo.displayName) + '</span>';
  previewHtml += '<span class="dc-msg-bot-tag">BOT</span>';
  previewHtml += '<span class="dc-msg-time">' + timeStr + '</span>';
  previewHtml += '</div>';

  if (hasEmbed) {
    previewHtml += '<article class="dc-embed" style="border-color:' + color + '">';
    previewHtml += '<div class="dc-embed-grid">';

    if (data.author.name) {
      previewHtml += '<div class="dc-embed-author">';
      if (data.author.iconURL) previewHtml += '<img class="dc-embed-author-icon" src="' + escAttr(data.author.iconURL) + '" alt="">';
      if (data.author.url) {
        previewHtml += '<a class="dc-embed-author-name" href="' + escAttr(data.author.url) + '" target="_blank">' + esc(data.author.name) + '</a>';
      } else {
        previewHtml += '<span class="dc-embed-author-name">' + esc(data.author.name) + '</span>';
      }
      previewHtml += '</div>';
    }

    if (data.title) {
      previewHtml += '<div class="dc-embed-title">';
      if (data.url) previewHtml += '<a href="' + escAttr(data.url) + '" target="_blank">' + esc(data.title) + '</a>';
      else previewHtml += esc(data.title);
      previewHtml += '</div>';
    }

    if (data.description) {
      previewHtml += '<div class="dc-embed-description">' + renderMarkdown(data.description) + '</div>';
    }

    if (data.fields.length > 0) {
      previewHtml += renderFieldsGrid(data.fields);
    }

    if (data.thumbnail) {
      previewHtml += '<div class="dc-embed-thumbnail"><img src="' + escAttr(data.thumbnail) + '" alt=""></div>';
    }

    if (data.image) {
      previewHtml += '<div class="dc-embed-image"><img src="' + escAttr(data.image) + '" alt=""></div>';
    }

    if (data.footer.text || data.timestamp) {
      previewHtml += '<div class="dc-embed-footer">';
      if (data.footer.iconURL) previewHtml += '<img class="dc-embed-footer-icon" src="' + escAttr(data.footer.iconURL) + '" alt="">';
      previewHtml += '<span class="dc-embed-footer-text">';
      const parts = [];
      if (data.footer.text) parts.push(esc(data.footer.text));
      if (data.timestamp) parts.push(timeStr);
      previewHtml += parts.join(' <span class="dc-embed-footer-sep">\u2022</span> ');
      previewHtml += '</span></div>';
    }

    previewHtml += '</div></article>';
  }

  if (hasAttachments) {
    previewHtml += '<div class="dc-attachments">';
    for (const att of attachments) {
      if (att.previewUrl) {
        previewHtml += '<div class="dc-attachment-img"><img src="' + escAttr(att.previewUrl) + '" alt="' + escAttr(att.name) + '"></div>';
      } else {
        previewHtml += '<div class="dc-attachment-file">';
        previewHtml += '<svg viewBox="0 0 24 24" width="24" height="24" fill="#b5bac1"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>';
        previewHtml += '<div class="dc-attachment-info">';
        previewHtml += '<span class="dc-attachment-name">' + esc(att.name) + '</span>';
        previewHtml += '<span class="dc-attachment-size">' + formatSize(att.size) + '</span>';
        previewHtml += '</div></div>';
      }
    }
    previewHtml += '</div>';
  }

  previewHtml += '</div></div>';

  return html`
    <div class="embed-preview-wrapper">
      <div class="bg-card rounded-lg p-5">
        <div class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Preview</div>
        <div class="discord-message-wrapper" dangerouslySetInnerHTML=${{ __html: previewHtml }}></div>
      </div>
    </div>
  `;
}
