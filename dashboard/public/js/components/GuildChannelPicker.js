import { html } from 'htm/preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { get } from '../api.js';
import { useShoelaceEvent } from '../hooks/useShoelace.js';

/**
 * Reusable guild -> channel cascading select.
 * Props:
 *   guildId, channelId - current selections
 *   onGuildChange(id), onChannelChange(id) - callbacks
 *   guilds - array of { id, name }
 *   showChannel - whether to show channel picker (default true)
 */
export function GuildChannelPicker({ guildId, channelId, onGuildChange, onChannelChange, guilds = [], showChannel = true }) {
  const [channels, setChannels] = useState([]);
  const guildRef = useRef(null);
  const channelRef = useRef(null);

  useShoelaceEvent(guildRef, 'sl-change', useCallback((e) => {
    onGuildChange(e.target.value);
  }, [onGuildChange]));

  useShoelaceEvent(channelRef, 'sl-change', useCallback((e) => {
    onChannelChange(e.target.value);
  }, [onChannelChange]));

  useEffect(() => {
    if (!guildId || !showChannel) {
      setChannels([]);
      return;
    }
    get('/api/guilds/' + guildId + '/channels')
      .then(data => setChannels(data.channels || []))
      .catch(() => setChannels([]));
  }, [guildId, showChannel]);

  return html`
    <div class="space-y-4">
      <div>
        <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Guild</label>
        <sl-select ref=${guildRef} value=${guildId || ''} placeholder="Select a server..." size="medium" hoist>
          ${guilds.map(g => html`<sl-option value=${g.id}>${g.name}</sl-option>`)}
        </sl-select>
      </div>
      ${showChannel && html`
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Channel</label>
          <sl-select ref=${channelRef} value=${channelId || ''} placeholder="Select a channel..." size="medium" hoist>
            ${channels.map(c => html`
              <sl-option value=${c.id}>#${c.name}${c.category ? ' (' + c.category + ')' : ''}</sl-option>
            `)}
          </sl-select>
        </div>
      `}
    </div>
  `;
}
