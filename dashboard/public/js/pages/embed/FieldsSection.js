import { html } from 'htm/preact';
import { useRef, useCallback } from 'preact/hooks';
import { useShoelaceEvent } from '../../hooks/useShoelace.js';

function FieldEntry({ field, index, onUpdate, onRemove, onTextFocus }) {
  const nameRef = useRef(null);
  const valueRef = useRef(null);
  const inlineRef = useRef(null);

  useShoelaceEvent(nameRef, 'sl-input', useCallback(e => onUpdate(index, 'name', e.target.value), [index, onUpdate]));
  useShoelaceEvent(valueRef, 'sl-input', useCallback(e => onUpdate(index, 'value', e.target.value), [index, onUpdate]));
  useShoelaceEvent(inlineRef, 'sl-change', useCallback(e => onUpdate(index, 'inline', e.target.checked), [index, onUpdate]));

  return html`
    <div class="flex gap-2 items-center mb-2 bg-muted p-2 rounded-sm">
      <sl-input ref=${nameRef} value=${field.name} placeholder="Field name" size="small" class="flex-1"
        onFocus=${onTextFocus}></sl-input>
      <sl-input ref=${valueRef} value=${field.value} placeholder="Field value" size="small" class="flex-1"
        onFocus=${onTextFocus}></sl-input>
      <sl-switch ref=${inlineRef} .checked=${field.inline} size="small">Inline</sl-switch>
      <sl-button variant="danger" size="small" onClick=${() => onRemove(index)}>
        <span>\u00D7</span>
      </sl-button>
    </div>
  `;
}

export function FieldsSection({ fields, onFieldsChange, onTextFocus }) {
  const addField = () => {
    if (fields.length >= 25) return;
    onFieldsChange([...fields, { name: '', value: '', inline: false }]);
  };

  const updateField = useCallback((index, prop, value) => {
    const updated = fields.map((f, i) => i === index ? { ...f, [prop]: value } : f);
    onFieldsChange(updated);
  }, [fields, onFieldsChange]);

  const removeField = useCallback((index) => {
    onFieldsChange(fields.filter((_, i) => i !== index));
  }, [fields, onFieldsChange]);

  return html`
    <div class="bg-card rounded-lg p-5 mb-4">
      <div class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Fields <small class="text-muted-foreground font-normal normal-case">(max 25)</small>
      </div>
      ${fields.map((f, i) => html`
        <${FieldEntry}
          key=${i}
          field=${f}
          index=${i}
          onUpdate=${updateField}
          onRemove=${removeField}
          onTextFocus=${onTextFocus}
        />
      `)}
      <sl-button variant="default" size="small" onClick=${addField} class="mt-2">+ Add Field</sl-button>
    </div>
  `;
}
