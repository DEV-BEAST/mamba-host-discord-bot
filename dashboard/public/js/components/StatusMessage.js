import { html } from 'htm/preact';
import { useEffect } from 'preact/hooks';

/**
 * Inline status message — matches the subtle style of the original.
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

  const isSuccess = type === 'success';

  return html`
    <div class="mt-2 py-2 px-3 rounded-sm text-[13px] ${
      isSuccess
        ? 'bg-[rgba(35,165,89,0.12)] text-success'
        : 'bg-[rgba(242,63,67,0.12)] text-destructive'
    }">
      ${message}
    </div>
  `;
}
