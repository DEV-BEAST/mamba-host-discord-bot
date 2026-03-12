import { useEffect } from 'preact/hooks';

/**
 * Bind a Shoelace custom event (sl-change, sl-input, etc.) to a ref'd element.
 * Preact's synthetic events don't handle custom element events, so we use
 * addEventListener directly.
 */
export function useShoelaceEvent(ref, event, handler) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener(event, handler);
    return () => el.removeEventListener(event, handler);
  }, [ref, event, handler]);
}

/**
 * Get the value from a Shoelace input/select/textarea event.
 */
export function slValue(e) {
  return e.target.value;
}
