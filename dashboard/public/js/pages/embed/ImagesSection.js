import { html } from 'htm/preact';
import { useRef, useCallback } from 'preact/hooks';
import { useShoelaceEvent } from '../../hooks/useShoelace.js';

export function ImagesSection({ thumbnail, image, onThumbnailChange, onImageChange }) {
  const thumbRef = useRef(null);
  const imageRef = useRef(null);

  useShoelaceEvent(thumbRef, 'sl-input', useCallback(e => onThumbnailChange(e.target.value), [onThumbnailChange]));
  useShoelaceEvent(imageRef, 'sl-input', useCallback(e => onImageChange(e.target.value), [onImageChange]));

  return html`
    <div class="bg-card rounded-lg p-5 mb-4">
      <div class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Images</div>
      <div class="mb-4">
        <label class="block mb-1 text-xs font-medium text-muted-foreground">Thumbnail URL</label>
        <sl-input ref=${thumbRef} value=${thumbnail} type="url" placeholder="https://..." size="small"></sl-input>
      </div>
      <div>
        <label class="block mb-1 text-xs font-medium text-muted-foreground">Image URL</label>
        <sl-input ref=${imageRef} value=${image} type="url" placeholder="https://..." size="small"></sl-input>
      </div>
    </div>
  `;
}
