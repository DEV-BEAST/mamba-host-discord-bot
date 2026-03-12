import { html } from 'htm/preact';
import { useRef, useState } from 'preact/hooks';
import { get } from '../../api.js';
import { StatusMessage } from '../../components/StatusMessage.js';

export function JsonSection({ getEmbedData, populateFromData, onGuildSelect, onExtracted }) {
  const fileRef = useRef(null);
  const linkRef = useRef(null);
  const [jsonMsg, setJsonMsg] = useState(null);
  const [jsonMsgType, setJsonMsgType] = useState('success');
  const [extractMsg, setExtractMsg] = useState(null);
  const [extractMsgType, setExtractMsgType] = useState('success');
  const [extracting, setExtracting] = useState(false);

  const exportJSON = () => {
    const data = getEmbedData();
    const exportObj = {
      embed: {
        author: data.author.name ? data.author : undefined,
        title: data.title || undefined,
        url: data.url || undefined,
        description: data.description || undefined,
        color: data.color ? parseInt(data.color.replace('#', ''), 16) : undefined,
        fields: data.fields.length > 0 ? data.fields : undefined,
        thumbnail: data.thumbnail ? { url: data.thumbnail } : undefined,
        image: data.image ? { url: data.image } : undefined,
        footer: data.footer.text ? data.footer : undefined,
        timestamp: data.timestamp ? new Date().toISOString() : undefined,
      }
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'embed-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    setJsonMsg('JSON file downloaded');
    setJsonMsgType('success');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let data = JSON.parse(ev.target.result);
        if (data.embed) data = data.embed;
        else if (data.embeds && data.embeds[0]) data = data.embeds[0];
        populateFromData(data);
        setJsonMsg('Embed imported from ' + file.name);
        setJsonMsgType('success');
      } catch (err) {
        setJsonMsg('Invalid JSON: ' + err.message);
        setJsonMsgType('error');
      }
    };
    reader.readAsText(file);
  };

  const extractFromLink = async () => {
    const el = linkRef.current;
    const url = el ? el.value.trim() : '';

    if (!url) {
      setExtractMsg('Please paste a Discord message link');
      setExtractMsgType('error');
      return;
    }

    const match = url.match(/channels\/(\d+)\/(\d+)\/(\d+)/);
    if (!match) {
      setExtractMsg('Invalid Discord message link format');
      setExtractMsgType('error');
      return;
    }

    const [, guildId, channelId, messageId] = match;
    setExtracting(true);

    try {
      const data = await get('/api/embed/extract?guildId=' + guildId + '&channelId=' + channelId + '&messageId=' + messageId);
      populateFromData(data);
      if (onExtracted) onExtracted(guildId, channelId);
      setExtractMsg('Embed extracted successfully');
      setExtractMsgType('success');
    } catch (err) {
      setExtractMsg(err.message || 'Failed to extract embed');
      setExtractMsgType('error');
    } finally {
      setExtracting(false);
    }
  };

  return html`
    <div>
      <div class="bg-card rounded-lg p-5 mb-4 shadow-card">
        <div class="text-[14px] font-semibold text-text-secondary uppercase tracking-wide mb-4">Extract from Discord</div>
        <div class="mb-2">
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Message Link</label>
          <div class="flex gap-2">
            <sl-input ref=${linkRef} type="url" placeholder="https://discord.com/channels/guild/channel/message" size="medium" class="flex-1"></sl-input>
            <sl-button variant="default" size="medium" loading=${extracting} onClick=${extractFromLink}>Load</sl-button>
          </div>
        </div>
        <${StatusMessage} message=${extractMsg} type=${extractMsgType} onClear=${() => setExtractMsg(null)} />
      </div>

      <div class="bg-card rounded-lg p-5 mb-4 shadow-card">
        <div class="text-[14px] font-semibold text-text-secondary uppercase tracking-wide mb-4">JSON Export / Import</div>
        <div class="flex gap-2 flex-wrap">
          <sl-button variant="default" size="small" onClick=${exportJSON}>Export JSON</sl-button>
          <sl-button variant="default" size="small" onClick=${() => fileRef.current.click()}>Import JSON</sl-button>
          <input ref=${fileRef} type="file" accept=".json" class="hidden" onChange=${handleImport} />
        </div>
        <${StatusMessage} message=${jsonMsg} type=${jsonMsgType} onClear=${() => setJsonMsg(null)} />
      </div>
    </div>
  `;
}
