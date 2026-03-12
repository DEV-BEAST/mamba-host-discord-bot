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
    <div class="bg-card border border-border rounded-lg p-5 mb-4 shadow-card">
      <div class="text-[14px] font-semibold text-text-secondary uppercase tracking-wide mb-4">Author</div>
      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Name</label>
        <sl-input ref=${nameRef} value=${author.name} placeholder="Author name" size="medium"></sl-input>
      </div>
      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Icon URL</label>
        <sl-input ref=${iconRef} value=${author.iconURL} type="url" placeholder="https://..." size="medium"></sl-input>
      </div>
      <div>
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">URL</label>
        <sl-input ref=${urlRef} value=${author.url} type="url" placeholder="https://..." size="medium"></sl-input>
      </div>
    </div>
  `;
}
