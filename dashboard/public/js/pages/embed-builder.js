import { html } from 'htm/preact';
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { get, post } from '../api.js';
import { StatusMessage } from '../components/StatusMessage.js';
import { ChannelSection } from './embed/ChannelSection.js';
import { AuthorSection } from './embed/AuthorSection.js';
import { BodySection } from './embed/BodySection.js';
import { FieldsSection } from './embed/FieldsSection.js';
import { ImagesSection } from './embed/ImagesSection.js';
import { FilesSection } from './embed/FilesSection.js';
import { MentionPicker } from './embed/MentionPicker.js';
import { FooterSection } from './embed/FooterSection.js';
import { JsonSection } from './embed/JsonSection.js';
import { EmbedPreview } from './embed/EmbedPreview.js';

export default function EmbedBuilder() {
  // Guild/channel
  const [guilds, setGuilds] = useState([]);
  const [guildId, setGuildId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [channels, setChannels] = useState([]);

  // Embed data
  const [author, setAuthor] = useState({ name: '', iconURL: '', url: '' });
  const [title, setTitle] = useState('');
  const [titleUrl, setTitleUrl] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#FF6F00');
  const [fields, setFields] = useState([]);
  const [thumbnail, setThumbnail] = useState('');
  const [image, setImage] = useState('');
  const [footer, setFooter] = useState({ text: '', iconURL: '' });
  const [timestamp, setTimestamp] = useState(false);
  const [attachments, setAttachments] = useState([]);

  // Bot info
  const [botInfo, setBotInfo] = useState({ username: 'Bot', displayName: 'Bot', avatar: '', discriminator: '0' });

  // Status
  const [sendMsg, setSendMsg] = useState(null);
  const [sendMsgType, setSendMsgType] = useState('success');
  const [sending, setSending] = useState(false);

  // Track last focused text input for mention insertion
  const lastFocusedRef = useRef(null);

  // Load guilds + bot info on mount
  useEffect(() => {
    get('/api/guilds').then(g => setGuilds(g)).catch(() => {});
    get('/api/settings').then(s => {
      if (s.bot) setBotInfo(s.bot);
    }).catch(() => {});
  }, []);

  // Load channels when guild changes
  useEffect(() => {
    if (!guildId) { setChannels([]); return; }
    get('/api/guilds/' + guildId + '/channels')
      .then(d => setChannels(d.channels || []))
      .catch(() => setChannels([]));
  }, [guildId]);

  const onGuildChange = useCallback((id) => {
    setGuildId(id);
    setChannelId('');
  }, []);

  const onTextFocus = useCallback((e) => {
    // Track the actual DOM element for cursor insertion
    const target = e.target;
    // For Shoelace components, get the inner input/textarea
    if (target.shadowRoot) {
      const inner = target.shadowRoot.querySelector('input, textarea');
      if (inner) { lastFocusedRef.current = inner; return; }
    }
    lastFocusedRef.current = target;
  }, []);

  const insertAtCursor = useCallback((text) => {
    const el = lastFocusedRef.current;
    if (!el) {
      // Fallback: append to description
      setDescription(prev => prev + text);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const before = el.value.substring(0, start);
    const after = el.value.substring(end);
    el.value = before + text + after;
    const newPos = start + text.length;
    el.setSelectionRange(newPos, newPos);
    el.focus();

    // Trigger input event so Shoelace/Preact picks up the change
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, []);

  // Collect embed data for export/send
  const getEmbedData = useCallback(() => ({
    author,
    title,
    url: titleUrl,
    description,
    color,
    fields: fields.filter(f => f.name || f.value),
    thumbnail,
    image,
    footer,
    timestamp,
  }), [author, title, titleUrl, description, color, fields, thumbnail, image, footer, timestamp]);

  // Populate from imported/extracted data
  const populateFromData = useCallback((data) => {
    setAuthor({
      name: data.author?.name || '',
      iconURL: data.author?.iconURL || data.author?.icon_url || '',
      url: data.author?.url || '',
    });
    setTitle(data.title || '');
    setTitleUrl(data.url || '');
    setDescription(data.description || '');

    if (data.color != null) {
      let hex = typeof data.color === 'number'
        ? '#' + data.color.toString(16).padStart(6, '0')
        : String(data.color);
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) setColor(hex);
    }

    setThumbnail(typeof data.thumbnail === 'object' ? data.thumbnail?.url || '' : data.thumbnail || '');
    setImage(typeof data.image === 'object' ? data.image?.url || '' : data.image || '');
    setFooter({
      text: data.footer?.text || '',
      iconURL: data.footer?.iconURL || data.footer?.icon_url || '',
    });
    setTimestamp(!!data.timestamp);
    setFields((data.fields || []).map(f => ({
      name: f.name || '',
      value: f.value || '',
      inline: !!f.inline,
    })));
  }, []);

  // Handle extracted embed (also select guild/channel)
  const onExtracted = useCallback(async (extractedGuildId, extractedChannelId) => {
    setGuildId(extractedGuildId);
    try {
      const d = await get('/api/guilds/' + extractedGuildId + '/channels');
      setChannels(d.channels || []);
      setChannelId(extractedChannelId);
    } catch {}
  }, []);

  // Send embed
  const sendEmbed = async () => {
    if (!channelId) {
      setSendMsg('Please select a channel first');
      setSendMsgType('error');
      return;
    }

    setSending(true);
    try {
      const data = getEmbedData();
      const payload = { channelId, ...data };

      if (attachments.length > 0) {
        payload.attachments = attachments.map(a => ({ name: a.name, data: a.data }));
      }

      await post('/api/embed/send', payload);
      setSendMsg('Embed sent successfully!');
      setSendMsgType('success');
    } catch (err) {
      setSendMsg(err.message);
      setSendMsgType('error');
    } finally {
      setSending(false);
    }
  };

  const embedData = getEmbedData();

  return html`
    <div class="mb-6">
      <h1 class="text-[22px] font-bold">Embed Builder</h1>
      <p class="text-muted-foreground text-sm mt-0.5">Build and send rich embeds to any channel</p>
    </div>

    <div class="grid grid-cols-[1.5fr_1fr] gap-6 items-start max-[900px]:grid-cols-1">
      <!-- Editor -->
      <div>
        <${ChannelSection}
          guilds=${guilds} guildId=${guildId} channelId=${channelId}
          channels=${channels}
          onGuildChange=${onGuildChange} onChannelChange=${setChannelId}
        />
        <${AuthorSection} author=${author} onChange=${setAuthor} />
        <${BodySection}
          title=${title} titleUrl=${titleUrl} description=${description} color=${color}
          onTitleChange=${setTitle} onUrlChange=${setTitleUrl}
          onDescriptionChange=${setDescription} onColorChange=${setColor}
          onTextFocus=${onTextFocus}
        />
        <${MentionPicker}
          guildId=${guildId} channels=${channels}
          onInsert=${insertAtCursor}
        />
        <${FieldsSection}
          fields=${fields} onFieldsChange=${setFields}
          onTextFocus=${onTextFocus}
        />
        <${ImagesSection}
          thumbnail=${thumbnail} image=${image}
          onThumbnailChange=${setThumbnail} onImageChange=${setImage}
        />
        <${FilesSection}
          attachments=${attachments}
          onAttachmentsChange=${setAttachments}
          onError=${(msg) => { setSendMsg(msg); setSendMsgType('error'); }}
        />
        <${FooterSection}
          footer=${footer} timestamp=${timestamp}
          onFooterChange=${setFooter} onTimestampChange=${setTimestamp}
        />

        <sl-button
          variant="primary" size="medium" class="w-full mb-4"
          loading=${sending}
          onClick=${sendEmbed}
        >Send Embed</sl-button>

        <${StatusMessage} message=${sendMsg} type=${sendMsgType} onClear=${() => setSendMsg(null)} />

        <${JsonSection}
          getEmbedData=${getEmbedData}
          populateFromData=${populateFromData}
          onExtracted=${onExtracted}
        />
      </div>

      <!-- Preview -->
      <${EmbedPreview}
        embedData=${embedData}
        attachments=${attachments}
        botInfo=${botInfo}
      />
    </div>
  `;
}
