import { html } from 'htm/preact';
import { useRef, useState, useCallback } from 'preact/hooks';

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function FilesSection({ attachments, onAttachmentsChange, onError }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback((fileList) => {
    const MAX_SIZE = 25 * 1024 * 1024;
    const newAttachments = [...attachments];

    for (const file of fileList) {
      const currentTotal = newAttachments.reduce((sum, a) => sum + a.size, 0);
      if (currentTotal + file.size > MAX_SIZE) {
        onError('File "' + file.name + '" skipped: total attachments would exceed 25MB');
        continue;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const base64 = dataUrl.split(',')[1];
        const isImage = file.type.startsWith('image/');

        onAttachmentsChange(prev => [...prev, {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
          previewUrl: isImage ? dataUrl : null,
        }]);
      };
      reader.readAsDataURL(file);
    }
  }, [attachments, onAttachmentsChange, onError]);

  const removeFile = useCallback((index) => {
    onAttachmentsChange(prev => prev.filter((_, i) => i !== index));
  }, [onAttachmentsChange]);

  return html`
    <div class="bg-card border border-border rounded-lg p-5 mb-4 shadow-card">
      <div class="text-[14px] font-semibold text-text-secondary uppercase tracking-wide mb-4">Files & Attachments</div>
      <div
        class="border-2 border-dashed rounded-sm p-5 text-center text-muted-foreground text-[13px] cursor-pointer transition-all duration-150
          ${dragOver ? 'border-accent bg-accent-dim' : 'border-border hover:border-accent hover:bg-accent-dim'}"
        onClick=${() => inputRef.current.click()}
        onDragOver=${(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave=${() => setDragOver(false)}
        onDrop=${(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        Drop files here or click to browse
        <input ref=${inputRef} type="file" multiple class="hidden"
          onChange=${(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
      </div>

      ${attachments.length > 0 && html`
        <div class="mt-2 space-y-1">
          ${attachments.map((att, i) => html`
            <div class="flex items-center gap-2 p-2 bg-muted border border-border/50 rounded-sm text-[13px]">
              ${att.previewUrl && html`<img src=${att.previewUrl} alt="" class="w-10 h-10 object-cover rounded-sm" />`}
              <div class="flex-1 min-w-0">
                <div class="text-foreground truncate">${att.name}</div>
                <div class="text-muted-foreground text-[11px]">${formatSize(att.size)}</div>
              </div>
              <sl-button variant="danger" size="small" onClick=${() => removeFile(i)}>
                <span>\u00D7</span>
              </sl-button>
            </div>
          `)}
        </div>
      `}
    </div>
  `;
}
