import { html } from 'htm/preact';
import { useRef, useCallback } from 'preact/hooks';
import { useShoelaceEvent } from '../../hooks/useShoelace.js';

export function ChannelSection({ guilds, guildId, channelId, channels, onGuildChange, onChannelChange }) {
  const guildRef = useRef(null);
  const channelRef = useRef(null);

  useShoelaceEvent(guildRef, 'sl-change', useCallback(e => onGuildChange(e.target.value), [onGuildChange]));
  useShoelaceEvent(channelRef, 'sl-change', useCallback(e => onChannelChange(e.target.value), [onChannelChange]));

  return html`
    <div class="bg-card rounded-lg p-5 mb-4 shadow-card">
      <div class="text-[14px] font-semibold text-text-secondary uppercase tracking-wide mb-4">Channel</div>
      <div class="mb-4">
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Guild</label>
        <sl-select ref=${guildRef} value=${guildId} placeholder="Select a server..." size="medium" hoist>
          ${guilds.map(g => html`<sl-option value=${g.id}>${g.name}</sl-option>`)}
        </sl-select>
      </div>
      <div>
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Channel</label>
        <sl-select ref=${channelRef} value=${channelId} placeholder="Select a channel..." size="medium" hoist>
          ${channels.map(c => html`
            <sl-option value=${c.id}>#${c.name}${c.category ? ' (' + c.category + ')' : ''}</sl-option>
          `)}
        </sl-select>
      </div>
    </div>
  `;
}
