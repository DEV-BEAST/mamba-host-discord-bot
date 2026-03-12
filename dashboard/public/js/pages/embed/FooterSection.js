import { html } from 'htm/preact';
import { useRef, useCallback } from 'preact/hooks';
import { useShoelaceEvent } from '../../hooks/useShoelace.js';

export function FooterSection({ footer, timestamp, onFooterChange, onTimestampChange }) {
  const textRef = useRef(null);
  const iconRef = useRef(null);
  const tsRef = useRef(null);

  useShoelaceEvent(textRef, 'sl-input', useCallback(e => onFooterChange({ ...footer, text: e.target.value }), [footer, onFooterChange]));
  useShoelaceEvent(iconRef, 'sl-input', useCallback(e => onFooterChange({ ...footer, iconURL: e.target.value }), [footer, onFooterChange]));
  useShoelaceEvent(tsRef, 'sl-change', useCallback(e => onTimestampChange(e.target.checked), [onTimestampChange]));

  return html`
    <div class="bg-card border border-accent/20 rounded-lg p-5 mb-4 shadow-card">
      <div class="text-[14px] font-semibold text-text-secondary uppercase tracking-wide mb-4">Footer</div>
      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Footer Text</label>
        <sl-input ref=${textRef} value=${footer.text} placeholder="Footer text" size="medium"></sl-input>
      </div>
      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Footer Icon URL</label>
        <sl-input ref=${iconRef} value=${footer.iconURL} type="url" placeholder="https://..." size="medium"></sl-input>
      </div>
      <sl-switch ref=${tsRef} .checked=${timestamp}>Include timestamp</sl-switch>
    </div>
  `;
}
