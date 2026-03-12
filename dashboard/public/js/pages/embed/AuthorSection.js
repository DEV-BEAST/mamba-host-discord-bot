import { html } from 'htm/preact';
import { useRef, useCallback } from 'preact/hooks';
import { useShoelaceEvent } from '../../hooks/useShoelace.js';

export function AuthorSection({ author, onChange }) {
  const nameRef = useRef(null);
  const iconRef = useRef(null);
  const urlRef = useRef(null);

  const update = useCallback((field) => (e) => {
    onChange({ ...author, [field]: e.target.value });
  }, [author, onChange]);

  useShoelaceEvent(nameRef, 'sl-input', useCallback(e => onChange({ ...author, name: e.target.value }), [author, onChange]));
  useShoelaceEvent(iconRef, 'sl-input', useCallback(e => onChange({ ...author, iconURL: e.target.value }), [author, onChange]));
  useShoelaceEvent(urlRef, 'sl-input', useCallback(e => onChange({ ...author, url: e.target.value }), [author, onChange]));

  return html`
    <div class="bg-card rounded-lg p-5 mb-4">
      <div class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Author</div>
      <div class="mb-4">
        <label class="block mb-1 text-xs font-medium text-muted-foreground">Name</label>
        <sl-input ref=${nameRef} value=${author.name} placeholder="Author name" size="small"></sl-input>
      </div>
      <div class="mb-4">
        <label class="block mb-1 text-xs font-medium text-muted-foreground">Icon URL</label>
        <sl-input ref=${iconRef} value=${author.iconURL} type="url" placeholder="https://..." size="small"></sl-input>
      </div>
      <div>
        <label class="block mb-1 text-xs font-medium text-muted-foreground">URL</label>
        <sl-input ref=${urlRef} value=${author.url} type="url" placeholder="https://..." size="small"></sl-input>
      </div>
    </div>
  `;
}
