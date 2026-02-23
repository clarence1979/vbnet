import { useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Code } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { FormComponent } from '../../types/component.types';
import { getAvailableEvents, getDefaultEvent } from '../../utils/eventDefinitions';

interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
}

function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <div className="flex items-center border-b border-[#E0E0E0]">
      <div className="w-[45%] px-2 py-1.5 text-[11px] text-[#1E1E1E] bg-[#F5F5F5] border-r border-[#E0E0E0] truncate">
        {label}
      </div>
      <div className="w-[55%] px-1 py-0.5">{children}</div>
    </div>
  );
}

function TextInput({
  value,
  onChange,
  type = 'text',
}: {
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-[11px] px-1 py-0.5 border border-transparent focus:border-[#0078D4] outline-none bg-transparent"
    />
  );
}

function CheckInput({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <select
      value={checked ? 'True' : 'False'}
      onChange={(e) => onChange(e.target.value === 'True')}
      className="w-full text-[11px] px-1 py-0.5 border border-transparent focus:border-[#0078D4] outline-none bg-transparent"
    >
      <option>True</option>
      <option>False</option>
    </select>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="color"
        value={value === 'transparent' ? '#F0F0F0' : value}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 border border-[#ADADAD] cursor-pointer p-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-[11px] px-1 py-0.5 border border-transparent focus:border-[#0078D4] outline-none bg-transparent"
      />
    </div>
  );
}

export default function PropertyPanel() {
  const components = useProjectStore((s) => s.components);
  const selectedIds = useProjectStore((s) => s.selectedIds);
  const updateComponent = useProjectStore((s) => s.updateComponent);
  const formSettings = useProjectStore((s) => s.formSettings);
  const setFormSettings = useProjectStore((s) => s.setFormSettings);
  const eventHandlers = useProjectStore((s) => s.eventHandlers);
  const setEventHandler = useProjectStore((s) => s.setEventHandler);
  const setCodeEditorTarget = useProjectStore((s) => s.setCodeEditorTarget);
  const setViewMode = useProjectStore((s) => s.setViewMode);

  const selected = useMemo(
    () => (selectedIds.length === 1 ? components.find((c) => c.id === selectedIds[0]) : null),
    [selectedIds, components]
  );

  const handleUpdate = useCallback(
    (key: keyof FormComponent, value: unknown) => {
      if (!selected) return;
      const updates: Partial<FormComponent> = {};

      const intKeys = ['left', 'top', 'width', 'height', 'tabIndex', 'maxLength', 'interval', 'value', 'maximum', 'minimum', 'selectedIndex', 'increment', 'decimalPlaces'];
      if (intKeys.includes(key)) {
        updates[key as keyof FormComponent] = parseInt(value as string, 10) as never;
      } else if (['enabled', 'visible', 'checked', 'multiline', 'readOnly'].includes(key)) {
        updates[key as keyof FormComponent] = value as never;
      } else {
        updates[key as keyof FormComponent] = value as never;
      }

      updateComponent(selected.id, updates);
    },
    [selected, updateComponent]
  );

  const handleFontUpdate = useCallback(
    (key: string, value: string | number | boolean) => {
      if (!selected) return;
      updateComponent(selected.id, {
        font: { ...selected.font, [key]: value },
      });
    },
    [selected, updateComponent]
  );

  const handleItemsUpdate = useCallback(
    (value: string) => {
      if (!selected) return;
      updateComponent(selected.id, {
        items: value.split('\n').filter((s) => s.trim()),
      });
    },
    [selected, updateComponent]
  );

  const [propsCollapsed, setPropsCollapsed] = useState(false);
  const [eventsCollapsed, setEventsCollapsed] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);

  const handleEventClick = useCallback((componentName: string, eventName: string) => {
    setEditingEvent(`${componentName}.${eventName}`);
    const handler = eventHandlers.find(h => h.componentName === componentName && h.eventName === eventName);
    if (!handler) {
      setEventHandler(componentName, eventName, `' Add your code here for ${componentName}.${eventName}`);
    }
    setCodeEditorTarget(`${componentName}:${eventName}`);
    setViewMode('code');
  }, [eventHandlers, setEventHandler, setCodeEditorTarget, setViewMode]);

  if (!selected) {
    const formEvents = getAvailableEvents('Form');

    return (
      <div className="bg-[#F5F5F5] flex flex-col overflow-hidden">
        <button
          onClick={() => setPropsCollapsed(!propsCollapsed)}
          className="px-2 py-1.5 bg-[#EEEEF2] border-b border-[#CCCEDB] flex items-center gap-1.5 hover:bg-[#E4E4E8] transition-colors shrink-0 w-full text-left"
        >
          {propsCollapsed ? <ChevronRight size={12} className="text-[#666]" /> : <ChevronDown size={12} className="text-[#666]" />}
          <span className="text-[11px] font-semibold text-[#1E1E1E] tracking-wide uppercase">Properties</span>
        </button>
        {!propsCollapsed && <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2 border-b border-[#E0E0E0]">
            <span className="text-[11px] text-[#555] font-medium">Form - {formSettings.name}</span>
          </div>
          <PropertyRow label="Name">
            <TextInput value={formSettings.name} onChange={(v) => setFormSettings({ name: v })} />
          </PropertyRow>
          <PropertyRow label="Text">
            <TextInput value={formSettings.text} onChange={(v) => setFormSettings({ text: v })} />
          </PropertyRow>
          <PropertyRow label="Width">
            <TextInput value={formSettings.width} onChange={(v) => setFormSettings({ width: parseInt(v, 10) || 800 })} type="number" />
          </PropertyRow>
          <PropertyRow label="Height">
            <TextInput value={formSettings.height} onChange={(v) => setFormSettings({ height: parseInt(v, 10) || 600 })} type="number" />
          </PropertyRow>
          <PropertyRow label="BackColor">
            <ColorInput value={formSettings.backColor} onChange={(v) => setFormSettings({ backColor: v })} />
          </PropertyRow>
          <PropertyRow label="GridSize">
            <TextInput value={formSettings.gridSize} onChange={(v) => setFormSettings({ gridSize: parseInt(v, 10) || 10 })} type="number" />
          </PropertyRow>
          <PropertyRow label="SnapToGrid">
            <CheckInput checked={formSettings.snapToGrid} onChange={(v) => setFormSettings({ snapToGrid: v })} />
          </PropertyRow>
          <PropertyRow label="ShowGrid">
            <CheckInput checked={formSettings.showGrid} onChange={(v) => setFormSettings({ showGrid: v })} />
          </PropertyRow>
        </div>}

        <button
          onClick={() => setEventsCollapsed(!eventsCollapsed)}
          className="px-2 py-1.5 bg-[#EEEEF2] border-b border-[#CCCEDB] flex items-center gap-1.5 hover:bg-[#E4E4E8] transition-colors shrink-0 w-full text-left"
        >
          {eventsCollapsed ? <ChevronRight size={12} className="text-[#666]" /> : <ChevronDown size={12} className="text-[#666]" />}
          <Code size={12} className="text-[#666]" />
          <span className="text-[11px] font-semibold text-[#1E1E1E] tracking-wide uppercase">Events</span>
        </button>
        {!eventsCollapsed && <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2 border-b border-[#E0E0E0]">
            <span className="text-[11px] text-[#555] font-medium">Form - {formSettings.name}</span>
          </div>
          {formEvents.map(event => {
            const hasHandler = eventHandlers.some(h => h.componentName === formSettings.name && h.eventName === event.name);
            return (
              <div key={event.name} className="flex items-center border-b border-[#E0E0E0]">
                <div className="w-[45%] px-2 py-1.5 text-[11px] text-[#1E1E1E] bg-[#F5F5F5] border-r border-[#E0E0E0] truncate">
                  {event.name}
                </div>
                <div className="w-[55%] px-1 py-0.5">
                  <button
                    onClick={() => handleEventClick(formSettings.name, event.name)}
                    className={`w-full text-left text-[11px] px-1 py-0.5 border border-transparent hover:border-[#0078D4] outline-none ${hasHandler ? 'text-[#0078D4] font-semibold' : 'text-[#999]'}`}
                    title={event.description}
                  >
                    {hasHandler ? formSettings.name + '_' + event.name : '(none)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>}
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F5] flex flex-col overflow-hidden">
      <button
        onClick={() => setPropsCollapsed(!propsCollapsed)}
        className="px-2 py-1.5 bg-[#EEEEF2] border-b border-[#CCCEDB] flex items-center gap-1.5 hover:bg-[#E4E4E8] transition-colors shrink-0 w-full text-left"
      >
        {propsCollapsed ? <ChevronRight size={12} className="text-[#666]" /> : <ChevronDown size={12} className="text-[#666]" />}
        <span className="text-[11px] font-semibold text-[#1E1E1E] tracking-wide uppercase">Properties</span>
      </button>
      {!propsCollapsed && <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 border-b border-[#E0E0E0]">
          <span className="text-[11px] text-[#555] font-medium">
            {selected.type} - {selected.name}
          </span>
        </div>

        <div className="px-2 py-1 bg-[#E8E8E8] border-b border-[#E0E0E0]">
          <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Appearance</span>
        </div>
        <PropertyRow label="Name">
          <TextInput value={selected.name} onChange={(v) => handleUpdate('name', v)} />
        </PropertyRow>
        <PropertyRow label="Text">
          <TextInput value={selected.text} onChange={(v) => handleUpdate('text', v)} />
        </PropertyRow>
        <PropertyRow label="BackColor">
          <ColorInput value={selected.backColor} onChange={(v) => handleUpdate('backColor', v)} />
        </PropertyRow>
        <PropertyRow label="ForeColor">
          <ColorInput value={selected.foreColor} onChange={(v) => handleUpdate('foreColor', v)} />
        </PropertyRow>

        <div className="px-2 py-1 bg-[#E8E8E8] border-b border-[#E0E0E0]">
          <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Layout</span>
        </div>
        <PropertyRow label="Left">
          <TextInput value={selected.left} onChange={(v) => handleUpdate('left', v)} type="number" />
        </PropertyRow>
        <PropertyRow label="Top">
          <TextInput value={selected.top} onChange={(v) => handleUpdate('top', v)} type="number" />
        </PropertyRow>
        <PropertyRow label="Width">
          <TextInput value={selected.width} onChange={(v) => handleUpdate('width', v)} type="number" />
        </PropertyRow>
        <PropertyRow label="Height">
          <TextInput value={selected.height} onChange={(v) => handleUpdate('height', v)} type="number" />
        </PropertyRow>
        <PropertyRow label="TabIndex">
          <TextInput value={selected.tabIndex} onChange={(v) => handleUpdate('tabIndex', v)} type="number" />
        </PropertyRow>

        <div className="px-2 py-1 bg-[#E8E8E8] border-b border-[#E0E0E0]">
          <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Font</span>
        </div>
        <PropertyRow label="Family">
          <select
            value={selected.font.family}
            onChange={(e) => handleFontUpdate('family', e.target.value)}
            className="w-full text-[11px] px-1 py-0.5 border border-transparent focus:border-[#0078D4] outline-none bg-transparent"
          >
            {['Segoe UI', 'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma', 'Consolas'].map(
              (f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              )
            )}
          </select>
        </PropertyRow>
        <PropertyRow label="Size">
          <TextInput value={selected.font.size} onChange={(v) => handleFontUpdate('size', parseFloat(v) || 9)} type="number" />
        </PropertyRow>
        <PropertyRow label="Bold">
          <CheckInput checked={selected.font.bold} onChange={(v) => handleFontUpdate('bold', v)} />
        </PropertyRow>
        <PropertyRow label="Italic">
          <CheckInput checked={selected.font.italic} onChange={(v) => handleFontUpdate('italic', v)} />
        </PropertyRow>

        <div className="px-2 py-1 bg-[#E8E8E8] border-b border-[#E0E0E0]">
          <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Behavior</span>
        </div>
        <PropertyRow label="Enabled">
          <CheckInput checked={selected.enabled} onChange={(v) => handleUpdate('enabled', v)} />
        </PropertyRow>
        <PropertyRow label="Visible">
          <CheckInput checked={selected.visible} onChange={(v) => handleUpdate('visible', v)} />
        </PropertyRow>

        {(selected.type === 'TextBox' || selected.type === 'MaskedTextBox' || selected.type === 'RichTextBox') && (
          <>
            <div className="px-2 py-1 bg-[#E8E8E8] border-b border-[#E0E0E0]">
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">{selected.type}</span>
            </div>
            {selected.type !== 'RichTextBox' && (
              <PropertyRow label="MaxLength">
                <TextInput value={selected.maxLength ?? 32767} onChange={(v) => handleUpdate('maxLength', v)} type="number" />
              </PropertyRow>
            )}
            {selected.type === 'TextBox' && (
              <PropertyRow label="PasswordChar">
                <TextInput value={selected.passwordChar ?? ''} onChange={(v) => handleUpdate('passwordChar', v)} />
              </PropertyRow>
            )}
            {selected.type === 'MaskedTextBox' && (
              <PropertyRow label="Mask">
                <TextInput value={selected.mask ?? ''} onChange={(v) => handleUpdate('mask', v)} />
              </PropertyRow>
            )}
            <PropertyRow label="Multiline">
              <CheckInput checked={selected.multiline ?? false} onChange={(v) => handleUpdate('multiline', v)} />
            </PropertyRow>
            <PropertyRow label="ReadOnly">
              <CheckInput checked={selected.readOnly ?? false} onChange={(v) => handleUpdate('readOnly', v)} />
            </PropertyRow>
          </>
        )}

        {(selected.type === 'CheckBox' || selected.type === 'RadioButton') && (
          <PropertyRow label="Checked">
            <CheckInput checked={selected.checked ?? false} onChange={(v) => handleUpdate('checked', v)} />
          </PropertyRow>
        )}

        {(selected.type === 'ComboBox' || selected.type === 'ListBox' || selected.type === 'CheckedListBox') && (
          <>
            <div className="px-2 py-1 bg-[#E8E8E8] border-b border-[#E0E0E0]">
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Items</span>
            </div>
            <div className="px-2 py-1">
              <textarea
                value={(selected.items ?? []).join('\n')}
                onChange={(e) => handleItemsUpdate(e.target.value)}
                className="w-full h-20 text-[11px] px-1 py-1 border border-[#ADADAD] outline-none focus:border-[#0078D4] resize-none"
                placeholder="One item per line"
              />
            </div>
            <PropertyRow label="SelectedIndex">
              <TextInput value={selected.selectedIndex ?? -1} onChange={(v) => handleUpdate('selectedIndex', v)} type="number" />
            </PropertyRow>
          </>
        )}

        {selected.type === 'NumericUpDown' && (
          <>
            <div className="px-2 py-1 bg-[#E8E8E8] border-b border-[#E0E0E0]">
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">NumericUpDown</span>
            </div>
            <PropertyRow label="Value">
              <TextInput value={selected.value ?? 0} onChange={(v) => handleUpdate('value', v)} type="number" />
            </PropertyRow>
            <PropertyRow label="Minimum">
              <TextInput value={selected.minimum ?? 0} onChange={(v) => handleUpdate('minimum', v)} type="number" />
            </PropertyRow>
            <PropertyRow label="Maximum">
              <TextInput value={selected.maximum ?? 100} onChange={(v) => handleUpdate('maximum', v)} type="number" />
            </PropertyRow>
            <PropertyRow label="Increment">
              <TextInput value={selected.increment ?? 1} onChange={(v) => handleUpdate('increment', v)} type="number" />
            </PropertyRow>
            <PropertyRow label="DecimalPlaces">
              <TextInput value={selected.decimalPlaces ?? 0} onChange={(v) => handleUpdate('decimalPlaces', v)} type="number" />
            </PropertyRow>
          </>
        )}

        {selected.type === 'LinkLabel' && (
          <PropertyRow label="LinkColor">
            <ColorInput value={selected.linkColor ?? '#0066CC'} onChange={(v) => handleUpdate('linkColor', v)} />
          </PropertyRow>
        )}

        {selected.type === 'PictureBox' && (
          <PropertyRow label="ImageUrl">
            <TextInput value={selected.imageUrl ?? ''} onChange={(v) => handleUpdate('imageUrl', v)} />
          </PropertyRow>
        )}

        {selected.type === 'WebBrowser' && (
          <PropertyRow label="Url">
            <TextInput value={selected.url ?? ''} onChange={(v) => handleUpdate('url', v)} />
          </PropertyRow>
        )}

        {selected.type === 'ProgressBar' && (
          <>
            <PropertyRow label="Value">
              <TextInput value={selected.value ?? 0} onChange={(v) => handleUpdate('value', v)} type="number" />
            </PropertyRow>
            <PropertyRow label="Minimum">
              <TextInput value={selected.minimum ?? 0} onChange={(v) => handleUpdate('minimum', v)} type="number" />
            </PropertyRow>
            <PropertyRow label="Maximum">
              <TextInput value={selected.maximum ?? 100} onChange={(v) => handleUpdate('maximum', v)} type="number" />
            </PropertyRow>
          </>
        )}

        {selected.type === 'Timer' && (
          <PropertyRow label="Interval">
            <TextInput value={selected.interval ?? 1000} onChange={(v) => handleUpdate('interval', v)} type="number" />
          </PropertyRow>
        )}

        {selected.type === 'ListView' && (
          <>
            <div className="px-2 py-1 bg-[#E8E8E8] border-b border-[#E0E0E0]">
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Columns</span>
            </div>
            <div className="px-2 py-1">
              <textarea
                value={(selected.columns ?? []).join('\n')}
                onChange={(e) => {
                  if (!selected) return;
                  updateComponent(selected.id, { columns: e.target.value.split('\n').filter((s) => s.trim()) });
                }}
                className="w-full h-16 text-[11px] px-1 py-1 border border-[#ADADAD] outline-none focus:border-[#0078D4] resize-none"
                placeholder="One column per line"
              />
            </div>
          </>
        )}

        {selected.type === 'TreeView' && (
          <>
            <div className="px-2 py-1 bg-[#E8E8E8] border-b border-[#E0E0E0]">
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Nodes</span>
            </div>
            <div className="px-2 py-1">
              <textarea
                value={(selected.nodes ?? []).join('\n')}
                onChange={(e) => {
                  if (!selected) return;
                  updateComponent(selected.id, { nodes: e.target.value.split('\n').filter((s) => s.trim()) });
                }}
                className="w-full h-16 text-[11px] px-1 py-1 border border-[#ADADAD] outline-none focus:border-[#0078D4] resize-none"
                placeholder="One node per line"
              />
            </div>
          </>
        )}

        {selected.type === 'TabControl' && (
          <>
            <div className="px-2 py-1 bg-[#E8E8E8] border-b border-[#E0E0E0]">
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Tabs</span>
            </div>
            <div className="px-2 py-1">
              <textarea
                value={(selected.tabs ?? []).join('\n')}
                onChange={(e) => {
                  if (!selected) return;
                  updateComponent(selected.id, { tabs: e.target.value.split('\n').filter((s) => s.trim()) });
                }}
                className="w-full h-16 text-[11px] px-1 py-1 border border-[#ADADAD] outline-none focus:border-[#0078D4] resize-none"
                placeholder="One tab per line"
              />
            </div>
            <PropertyRow label="SelectedIndex">
              <TextInput value={selected.selectedIndex ?? 0} onChange={(v) => handleUpdate('selectedIndex', v)} type="number" />
            </PropertyRow>
          </>
        )}

        {(selected.type === 'MenuStrip' || selected.type === 'ToolStrip' || selected.type === 'ContextMenuStrip') && (
          <>
            <div className="px-2 py-1 bg-[#E8E8E8] border-b border-[#E0E0E0]">
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Menu Items</span>
            </div>
            <div className="px-2 py-1">
              <textarea
                value={(selected.menuItems ?? []).join('\n')}
                onChange={(e) => {
                  if (!selected) return;
                  updateComponent(selected.id, { menuItems: e.target.value.split('\n').filter((s) => s.trim()) });
                }}
                className="w-full h-16 text-[11px] px-1 py-1 border border-[#ADADAD] outline-none focus:border-[#0078D4] resize-none"
                placeholder="One item per line"
              />
            </div>
          </>
        )}

        {selected.type === 'StatusStrip' && (
          <PropertyRow label="StatusText">
            <TextInput value={selected.statusText ?? 'Ready'} onChange={(v) => handleUpdate('statusText', v)} />
          </PropertyRow>
        )}

        {selected.type === 'SplitContainer' && (
          <PropertyRow label="Orientation">
            <select
              value={selected.orientation ?? 'Vertical'}
              onChange={(e) => handleUpdate('orientation', e.target.value)}
              className="w-full text-[11px] px-1 py-0.5 border border-transparent focus:border-[#0078D4] outline-none bg-transparent"
            >
              <option>Horizontal</option>
              <option>Vertical</option>
            </select>
          </PropertyRow>
        )}

        {selected.type === 'FlowLayoutPanel' && (
          <PropertyRow label="FlowDirection">
            <select
              value={selected.flowDirection ?? 'LeftToRight'}
              onChange={(e) => handleUpdate('flowDirection', e.target.value)}
              className="w-full text-[11px] px-1 py-0.5 border border-transparent focus:border-[#0078D4] outline-none bg-transparent"
            >
              <option>LeftToRight</option>
              <option>TopDown</option>
              <option>RightToLeft</option>
              <option>BottomUp</option>
            </select>
          </PropertyRow>
        )}

        {selected.type === 'Chart' && (
          <PropertyRow label="ChartType">
            <select
              value={selected.chartType ?? 'Bar'}
              onChange={(e) => handleUpdate('chartType', e.target.value)}
              className="w-full text-[11px] px-1 py-0.5 border border-transparent focus:border-[#0078D4] outline-none bg-transparent"
            >
              <option>Bar</option>
              <option>Line</option>
              <option>Pie</option>
              <option>Area</option>
            </select>
          </PropertyRow>
        )}

        {(['Panel', 'GroupBox', 'PictureBox', 'FlowLayoutPanel', 'TableLayoutPanel'].includes(selected.type)) && (
          <PropertyRow label="BorderStyle">
            <select
              value={selected.borderStyle ?? 'None'}
              onChange={(e) => handleUpdate('borderStyle', e.target.value)}
              className="w-full text-[11px] px-1 py-0.5 border border-transparent focus:border-[#0078D4] outline-none bg-transparent"
            >
              <option>None</option>
              <option>FixedSingle</option>
              <option>Fixed3D</option>
            </select>
          </PropertyRow>
        )}
      </div>}

      <button
        onClick={() => setEventsCollapsed(!eventsCollapsed)}
        className="px-2 py-1.5 bg-[#EEEEF2] border-b border-[#CCCEDB] flex items-center gap-1.5 hover:bg-[#E4E4E8] transition-colors shrink-0 w-full text-left"
      >
        {eventsCollapsed ? <ChevronRight size={12} className="text-[#666]" /> : <ChevronDown size={12} className="text-[#666]" />}
        <Code size={12} className="text-[#666]" />
        <span className="text-[11px] font-semibold text-[#1E1E1E] tracking-wide uppercase">Events</span>
      </button>
      {!eventsCollapsed && <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 border-b border-[#E0E0E0]">
          <span className="text-[11px] text-[#555] font-medium">
            {selected.type} - {selected.name}
          </span>
        </div>
        {getAvailableEvents(selected.type).map(event => {
          const hasHandler = eventHandlers.some(h => h.componentName === selected.name && h.eventName === event.name);
          const isDefaultEvent = event.name === getDefaultEvent(selected.type);
          return (
            <div key={event.name} className="flex items-center border-b border-[#E0E0E0]">
              <div className="w-[45%] px-2 py-1.5 text-[11px] text-[#1E1E1E] bg-[#F5F5F5] border-r border-[#E0E0E0] truncate">
                {event.name} {isDefaultEvent && <span className="text-[#0078D4]">★</span>}
              </div>
              <div className="w-[55%] px-1 py-0.5">
                <button
                  onClick={() => handleEventClick(selected.name, event.name)}
                  className={`w-full text-left text-[11px] px-1 py-0.5 border border-transparent hover:border-[#0078D4] outline-none ${hasHandler ? 'text-[#0078D4] font-semibold' : 'text-[#999]'}`}
                  title={event.description}
                >
                  {hasHandler ? selected.name + '_' + event.name : '(none)'}
                </button>
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
