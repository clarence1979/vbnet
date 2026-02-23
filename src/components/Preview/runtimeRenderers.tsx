import type { FormComponent } from '../../types/component.types';

export function renderRuntimeComponent(
  comp: FormComponent,
  runtimeProps: Record<string, unknown>,
  onEvent: (name: string, event: string) => void
) {
  const text = String(runtimeProps.text ?? comp.text ?? '');
  const enabled = runtimeProps.enabled !== undefined ? Boolean(runtimeProps.enabled) : comp.enabled;
  const visible = runtimeProps.visible !== undefined ? Boolean(runtimeProps.visible) : comp.visible;
  const checked = runtimeProps.checked !== undefined ? Boolean(runtimeProps.checked) : comp.checked;
  const backColor = String(runtimeProps.backColor ?? comp.backColor);
  const foreColor = String(runtimeProps.foreColor ?? comp.foreColor);
  const value = runtimeProps.value !== undefined ? Number(runtimeProps.value) : (comp.value ?? 0);
  const items = (runtimeProps.items as string[]) ?? comp.items ?? [];
  const selectedIndex = runtimeProps.selectedIndex !== undefined
    ? Number(runtimeProps.selectedIndex)
    : (comp.selectedIndex ?? -1);

  const nonVisualTypes = ['Timer', 'NotifyIcon', 'ToolTip', 'ContextMenuStrip'];
  if (!visible && !nonVisualTypes.includes(comp.type)) return null;

  const fontStyle: React.CSSProperties = {
    fontFamily: comp.font.family,
    fontSize: `${comp.font.size}pt`,
    fontWeight: comp.font.bold ? 'bold' : 'normal',
    fontStyle: comp.font.italic ? 'italic' : 'normal',
    color: foreColor,
  };

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: comp.left,
    top: comp.top,
    width: comp.width,
    height: comp.height,
    zIndex: comp.zIndex,
  };

  switch (comp.type) {
    case 'Button':
      return (
        <button
          key={comp.id}
          style={{
            ...baseStyle,
            ...fontStyle,
            background: 'linear-gradient(180deg, #F0F0F0 0%, #E5E5E5 100%)',
            border: '1px solid #ADADAD',
            borderRadius: 2,
            cursor: enabled ? 'pointer' : 'default',
            opacity: enabled ? 1 : 0.5,
          }}
          disabled={!enabled}
          onClick={() => onEvent(comp.name, 'Click')}
          onMouseEnter={() => onEvent(comp.name, 'MouseEnter')}
          onMouseLeave={() => onEvent(comp.name, 'MouseLeave')}
        >
          {text}
        </button>
      );

    case 'TextBox':
    case 'MaskedTextBox':
      return comp.multiline ? (
        <textarea
          key={comp.id}
          style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: backColor === 'transparent' ? '#FFFFFF' : backColor, padding: '2px 4px', resize: 'none' }}
          value={text}
          disabled={!enabled}
          readOnly={comp.readOnly}
          maxLength={comp.maxLength}
          onChange={(e) => { onEvent(comp.name, `__set_text:${e.target.value}`); onEvent(comp.name, 'TextChanged'); }}
          onKeyDown={() => onEvent(comp.name, 'KeyDown')}
        />
      ) : (
        <input
          key={comp.id}
          type={comp.passwordChar ? 'password' : 'text'}
          style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: backColor === 'transparent' ? '#FFFFFF' : backColor, padding: '2px 4px' }}
          value={text}
          disabled={!enabled}
          readOnly={comp.readOnly}
          maxLength={comp.maxLength}
          onChange={(e) => { onEvent(comp.name, `__set_text:${e.target.value}`); onEvent(comp.name, 'TextChanged'); }}
          onKeyDown={() => onEvent(comp.name, 'KeyDown')}
        />
      );

    case 'RichTextBox':
      return (
        <textarea
          key={comp.id}
          style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: backColor === 'transparent' ? '#FFFFFF' : backColor, padding: '2px 4px', resize: 'none' }}
          value={text}
          disabled={!enabled}
          readOnly={comp.readOnly}
          onChange={(e) => { onEvent(comp.name, `__set_text:${e.target.value}`); onEvent(comp.name, 'TextChanged'); }}
        />
      );

    case 'Label':
      return (
        <div key={comp.id} style={{ ...baseStyle, ...fontStyle, display: 'flex', alignItems: 'center', backgroundColor: backColor === 'transparent' ? 'transparent' : backColor }}>
          {text}
        </div>
      );

    case 'LinkLabel':
      return (
        <div
          key={comp.id}
          style={{ ...baseStyle, ...fontStyle, display: 'flex', alignItems: 'center', color: comp.linkColor || '#0066CC', textDecoration: 'underline', cursor: 'pointer' }}
          onClick={() => onEvent(comp.name, 'LinkClicked')}
        >
          {text}
        </div>
      );

    case 'CheckBox':
      return (
        <label key={comp.id} style={{ ...baseStyle, ...fontStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: enabled ? 'pointer' : 'default' }}>
          <input type="checkbox" checked={checked ?? false} disabled={!enabled} onChange={() => { onEvent(comp.name, `__set_checked:${!checked}`); onEvent(comp.name, 'CheckedChanged'); }} />
          {text}
        </label>
      );

    case 'RadioButton':
      return (
        <label key={comp.id} style={{ ...baseStyle, ...fontStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: enabled ? 'pointer' : 'default' }}>
          <input type="radio" checked={checked ?? false} disabled={!enabled} onChange={() => { onEvent(comp.name, `__set_checked:${!checked}`); onEvent(comp.name, 'CheckedChanged'); }} />
          {text}
        </label>
      );

    case 'ComboBox':
      return (
        <select
          key={comp.id}
          style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: backColor === 'transparent' ? '#FFFFFF' : backColor }}
          value={selectedIndex >= 0 ? selectedIndex : ''}
          disabled={!enabled}
          onChange={(e) => { const idx = parseInt(e.target.value, 10); onEvent(comp.name, `__set_selectedIndex:${idx}`); onEvent(comp.name, 'SelectedIndexChanged'); }}
        >
          <option value="" disabled></option>
          {items.map((item, i) => <option key={i} value={i}>{item}</option>)}
        </select>
      );

    case 'ListBox':
      return (
        <select
          key={comp.id}
          multiple
          style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: backColor === 'transparent' ? '#FFFFFF' : backColor }}
          value={selectedIndex >= 0 ? [String(selectedIndex)] : []}
          disabled={!enabled}
          onChange={(e) => { const idx = e.target.selectedIndex; onEvent(comp.name, `__set_selectedIndex:${idx}`); onEvent(comp.name, 'SelectedIndexChanged'); }}
        >
          {items.map((item, i) => <option key={i} value={String(i)}>{item}</option>)}
        </select>
      );

    case 'CheckedListBox':
      return (
        <div key={comp.id} style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: '#FFFFFF', overflowY: 'auto' }}>
          {items.map((item, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '1px 4px', fontSize: `${comp.font.size}pt`, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked={comp.checkedIndices?.includes(i)} />
              {item}
            </label>
          ))}
        </div>
      );

    case 'NumericUpDown':
      return (
        <input
          key={comp.id}
          type="number"
          style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: '#FFFFFF', padding: '2px 4px' }}
          value={value}
          min={comp.minimum ?? 0}
          max={comp.maximum ?? 100}
          step={comp.increment ?? 1}
          disabled={!enabled}
          onChange={(e) => { onEvent(comp.name, `__set_value:${e.target.value}`); onEvent(comp.name, 'ValueChanged'); }}
        />
      );

    case 'DateTimePicker':
      return (
        <input
          key={comp.id}
          type="date"
          style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: '#FFFFFF', padding: '2px 4px' }}
          disabled={!enabled}
          onChange={(e) => { onEvent(comp.name, `__set_text:${e.target.value}`); onEvent(comp.name, 'ValueChanged'); }}
        />
      );

    case 'MonthCalendar':
      return (
        <input
          key={comp.id}
          type="date"
          style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: '#FFFFFF', padding: '4px' }}
          disabled={!enabled}
          onChange={(e) => { onEvent(comp.name, `__set_text:${e.target.value}`); onEvent(comp.name, 'DateChanged'); }}
        />
      );

    case 'PictureBox': {
      const imgUrl = String(runtimeProps.imageUrl ?? comp.imageUrl ?? '');
      return (
        <div key={comp.id} style={{ ...baseStyle, border: '1px solid #7A7A7A', backgroundColor: backColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} onClick={() => onEvent(comp.name, 'Click')}>
          {imgUrl ? <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 11, color: '#888' }}>PictureBox</span>}
        </div>
      );
    }

    case 'ListView':
      return (
        <div key={comp.id} style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: '#FFFFFF', overflow: 'auto' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #DDD', background: '#F5F5F5' }}>
            {(comp.columns || []).map((col, i) => (
              <div key={i} style={{ flex: 1, padding: '2px 4px', fontSize: '10px', fontWeight: 500, borderRight: '1px solid #DDD' }}>{col}</div>
            ))}
          </div>
        </div>
      );

    case 'TreeView':
      return (
        <div key={comp.id} style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: '#FFFFFF', overflow: 'auto' }}>
          {(comp.nodes || []).map((node, i) => (
            <div key={i} style={{ padding: '2px 8px', fontSize: `${comp.font.size}pt`, cursor: 'pointer' }} onClick={() => onEvent(comp.name, 'AfterSelect')}>
              {'\u25B6'} {node}
            </div>
          ))}
        </div>
      );

    case 'WebBrowser':
      return (
        <div key={comp.id} style={{ ...baseStyle, border: '1px solid #7A7A7A', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#999', fontSize: 12 }}>WebBrowser</span>
        </div>
      );

    case 'TabControl': {
      const tabs = comp.tabs || [];
      const selIdx = selectedIndex >= 0 ? selectedIndex : 0;
      return (
        <div key={comp.id} style={{ ...baseStyle, ...fontStyle, border: '1px solid #7A7A7A', backgroundColor: '#F0F0F0' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #ADADAD' }}>
            {tabs.map((tab, i) => (
              <div
                key={i}
                style={{ padding: '4px 12px', fontSize: '10px', borderRight: '1px solid #ADADAD', background: i === selIdx ? '#FFFFFF' : '#E5E5E5', cursor: 'pointer', borderTop: i === selIdx ? '2px solid #0078D4' : 'none' }}
                onClick={() => { onEvent(comp.name, `__set_selectedIndex:${i}`); onEvent(comp.name, 'SelectedIndexChanged'); }}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'Panel':
      return <div key={comp.id} style={{ ...baseStyle, backgroundColor: backColor === 'transparent' ? 'transparent' : backColor, border: comp.borderStyle === 'FixedSingle' ? '1px solid #7A7A7A' : 'none' }} />;

    case 'GroupBox':
      return (
        <fieldset key={comp.id} style={{ ...baseStyle, ...fontStyle, border: '1px solid #ADADAD', borderRadius: 4, padding: '4px 8px' }}>
          <legend style={{ fontSize: `${comp.font.size}pt`, padding: '0 4px' }}>{text}</legend>
        </fieldset>
      );

    case 'SplitContainer':
      return (
        <div key={comp.id} style={{ ...baseStyle, border: '1px solid #7A7A7A', backgroundColor: '#F0F0F0', display: 'flex', flexDirection: comp.orientation === 'Horizontal' ? 'column' : 'row' }}>
          <div style={{ flex: 1 }} />
          <div style={{ [comp.orientation === 'Horizontal' ? 'height' : 'width']: 4, background: '#CCCCCC', cursor: comp.orientation === 'Horizontal' ? 'row-resize' : 'col-resize' }} />
          <div style={{ flex: 1 }} />
        </div>
      );

    case 'FlowLayoutPanel':
      return <div key={comp.id} style={{ ...baseStyle, backgroundColor: backColor === 'transparent' ? 'transparent' : backColor, border: comp.borderStyle === 'FixedSingle' ? '1px solid #7A7A7A' : 'none' }} />;

    case 'TableLayoutPanel':
      return <div key={comp.id} style={{ ...baseStyle, border: '1px dashed #ADADAD' }} />;

    case 'ToolStripContainer':
      return <div key={comp.id} style={{ ...baseStyle, border: '1px dashed #ADADAD', backgroundColor: '#F8F8F8' }} />;

    case 'MenuStrip':
      return (
        <div key={comp.id} style={{ ...baseStyle, ...fontStyle, backgroundColor: '#F0F0F0', border: '1px solid #D0D0D0', display: 'flex', alignItems: 'center' }}>
          {(comp.menuItems || []).map((item, i) => (
            <div key={i} style={{ padding: '2px 12px', fontSize: '11px', cursor: 'pointer' }} onClick={() => onEvent(comp.name, 'ItemClicked')}>{item}</div>
          ))}
        </div>
      );

    case 'ToolStrip':
      return (
        <div key={comp.id} style={{ ...baseStyle, ...fontStyle, backgroundColor: '#F0F0F0', border: '1px solid #D0D0D0', display: 'flex', alignItems: 'center', gap: 2, padding: '0 4px' }}>
          {(comp.menuItems || []).map((item, i) => (
            <div key={i} style={{ padding: '2px 8px', fontSize: '10px', border: '1px solid transparent', borderRadius: 2, cursor: 'pointer' }} onClick={() => onEvent(comp.name, 'ItemClicked')}>{item}</div>
          ))}
        </div>
      );

    case 'StatusStrip':
      return (
        <div key={comp.id} style={{ ...baseStyle, ...fontStyle, backgroundColor: comp.backColor, color: comp.foreColor, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ fontSize: '10px' }}>{String(runtimeProps.statusText ?? comp.statusText ?? 'Ready')}</span>
        </div>
      );

    case 'BindingNavigator':
      return (
        <div key={comp.id} style={{ ...baseStyle, backgroundColor: '#F0F0F0', border: '1px solid #D0D0D0', display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px', fontSize: '10px' }}>
          <span style={{ cursor: 'pointer' }}>|&#9664;</span>
          <span style={{ cursor: 'pointer' }}>&#9664;</span>
          <input type="text" value="1" readOnly style={{ width: 32, height: 14, border: '1px solid #7A7A7A', textAlign: 'center', fontSize: '9px' }} />
          <span>of 0</span>
          <span style={{ cursor: 'pointer' }}>&#9654;</span>
          <span style={{ cursor: 'pointer' }}>&#9654;|</span>
        </div>
      );

    case 'Chart':
      return (
        <div key={comp.id} style={{ ...baseStyle, border: '1px solid #7A7A7A', backgroundColor: '#FFFFFF', padding: 8, display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', fontSize: 10, marginBottom: 4, fontWeight: 500 }}>Chart</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 8px' }}>
            <div style={{ flex: 1, height: '60%', background: '#4472C4', borderRadius: '2px 2px 0 0' }} />
            <div style={{ flex: 1, height: '40%', background: '#ED7D31', borderRadius: '2px 2px 0 0' }} />
            <div style={{ flex: 1, height: '80%', background: '#A5A5A5', borderRadius: '2px 2px 0 0' }} />
            <div style={{ flex: 1, height: '50%', background: '#FFC000', borderRadius: '2px 2px 0 0' }} />
          </div>
        </div>
      );

    case 'ProgressBar':
      return (
        <div key={comp.id} style={{ ...baseStyle, border: '1px solid #ADADAD', backgroundColor: '#E6E6E6', overflow: 'hidden' }}>
          <div style={{ height: '100%', backgroundColor: '#06B025', width: `${Math.min(100, Math.max(0, (value / (comp.maximum ?? 100)) * 100))}%`, transition: 'width 200ms' }} />
        </div>
      );

    case 'Timer':
    case 'NotifyIcon':
    case 'ToolTip':
    case 'ContextMenuStrip':
      return null;

    default:
      return null;
  }
}
