import { html } from 'htm/preact';
import { useRef, useCallback } from 'preact/hooks';
import { useShoelaceEvent } from '../../hooks/useShoelace.js';

export function ChannelSection({ guilds, guildId, channelId, channels, onGuildChange, onChannelChange }) {
  const guildRef = useRef(null);
  const channelRef = useRef(null);

  useShoelaceEvent(guildRef, 'sl-change', useCallback(e => onGuildChange(e.target.value), [onGuildChange]));
  useShoelaceEvent(channelRef, 'sl-change', useCallback(e => onChannelChange(e.target.value), [onChannelChange]));

  return html`
    <div class="bg-card rounded-lg p-5 mb-4">
      <div class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Channel</div>
      <div class="mb-4">
        <label class="block mb-1 text-xs font-medium text-muted-foreground">Guild</label>
        <sl-select ref=${guildRef} value=${guildId} placeholder="Select a server..." size="small" hoist>
          ${guilds.map(g => html`<sl-option value=${g.id}>${g.name}</sl-option>`)}
        </sl-select>
      </div>
      <div>
        <label class="block mb-1 text-xs font-medium text-muted-foreground">Channel</label>
        <sl-select ref=${channelRef} value=${channelId} placeholder="Select a channel..." size="small" hoist>
          ${channels.map(c => html`
            <sl-option value=${c.id}>#${c.name}${c.category ? ' (' + c.category + ')' : ''}</sl-option>
          `)}
        </sl-select>
      </div>
    </div>
  `;
}
