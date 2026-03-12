import { html } from 'htm/preact';
import { useEffect } from 'preact/hooks';

/**
 * Inline status message component.
 * Success auto-hides after 4s, errors persist.
 */
export function StatusMessage({ message, type = 'success', onClear }) {
  useEffect(() => {
    if (message && type === 'success' && onClear) {
      const t = setTimeout(onClear, 4000);
      return () => clearTimeout(t);
    }
  }, [message, type, onClear]);

  if (!message) return null;

  const variant = type === 'success' ? 'success' : 'danger';

  return html`
    <sl-alert variant=${variant} open class="mt-2">
      <span>${message}</span>
    </sl-alert>
  `;
}
