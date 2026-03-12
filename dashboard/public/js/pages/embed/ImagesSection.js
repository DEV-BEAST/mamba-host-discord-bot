import { html } from 'htm/preact';
import { useRef, useCallback } from 'preact/hooks';
import { useShoelaceEvent } from '../../hooks/useShoelace.js';

export function ImagesSection({ thumbnail, image, onThumbnailChange, onImageChange }) {
  const thumbRef = useRef(null);
  const imageRef = useRef(null);

  useShoelaceEvent(thumbRef, 'sl-input', useCallback(e => onThumbnailChange(e.target.value), [onThumbnailChange]));
  useShoelaceEvent(imageRef, 'sl-input', useCallback(e => onImageChange(e.target.value), [onImageChange]));

  return html`
    <div class="bg-card border border-border rounded-lg p-5 mb-4 shadow-card">
      <div class="text-[14px] font-semibold text-text-secondary uppercase tracking-wide mb-4">Images</div>
      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Thumbnail URL</label>
        <sl-input ref=${thumbRef} value=${thumbnail} type="url" placeholder="https://..." size="medium"></sl-input>
      </div>
      <div>
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Image URL</label>
        <sl-input ref=${imageRef} value=${image} type="url" placeholder="https://..." size="medium"></sl-input>
      </div>
    </div>
  `;
}
