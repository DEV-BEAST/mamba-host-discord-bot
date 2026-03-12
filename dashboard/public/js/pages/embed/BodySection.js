import { html } from 'htm/preact';
import { useRef, useCallback } from 'preact/hooks';
import { useShoelaceEvent } from '../../hooks/useShoelace.js';

const PRESET_COLORS = [
  '#FF6F00', '#5865F2', '#57F287', '#FEE75C', '#EB459E',
  '#ED4245', '#00AFF4', '#FFFFFF', '#2B2D31',
];

export function BodySection({ title, titleUrl, description, color, onTitleChange, onUrlChange, onDescriptionChange, onColorChange, onTextFocus }) {
  const titleRef = useRef(null);
  const urlRef = useRef(null);
  const descRef = useRef(null);
  const colorRef = useRef(null);

  useShoelaceEvent(titleRef, 'sl-input', useCallback(e => onTitleChange(e.target.value), [onTitleChange]));
  useShoelaceEvent(urlRef, 'sl-input', useCallback(e => onUrlChange(e.target.value), [onUrlChange]));
  useShoelaceEvent(descRef, 'sl-input', useCallback(e => onDescriptionChange(e.target.value), [onDescriptionChange]));
  useShoelaceEvent(colorRef, 'sl-input', useCallback(e => onColorChange(e.target.value), [onColorChange]));

  return html`
    <div class="bg-card rounded-lg p-5 mb-4">
      <div class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Body</div>
      <div class="mb-4">
        <label class="block mb-1 text-xs font-medium text-muted-foreground">Title</label>
        <sl-input ref=${titleRef} value=${title} placeholder="Embed title" size="small"
          onFocus=${onTextFocus}></sl-input>
      </div>
      <div class="mb-4">
        <label class="block mb-1 text-xs font-medium text-muted-foreground">Title URL</label>
        <sl-input ref=${urlRef} value=${titleUrl} type="url" placeholder="https://..." size="small"></sl-input>
      </div>
      <div class="mb-4">
        <label class="block mb-1 text-xs font-medium text-muted-foreground">Description</label>
        <sl-textarea ref=${descRef} value=${description} rows="4"
          placeholder="Supports **bold**, *italic*, __underline__, ~~strikethrough~~, \`code\`, \`\`\`code blocks\`\`\`, > blockquotes, [links](url), and ||spoilers||"
          size="small"
          onFocus=${onTextFocus}></sl-textarea>
      </div>
      <div>
        <label class="block mb-1 text-xs font-medium text-muted-foreground">Color</label>
        <div class="flex items-center gap-3 flex-wrap">
          <sl-color-picker ref=${colorRef} value=${color} size="small" no-format-toggle format="hex"></sl-color-picker>
          ${PRESET_COLORS.map(c => html`
            <div
              class="w-6 h-6 rounded-full cursor-pointer border-2 transition-colors duration-150 hover:border-foreground
                ${color === c ? 'border-foreground' : 'border-transparent'}"
              style="background:${c}"
              onClick=${() => onColorChange(c)}
            ></div>
          `)}
        </div>
      </div>
    </div>
  `;
}
