import type { FormComponent } from '../../types/component.types';

function fontStyle(comp: FormComponent): React.CSSProperties {
  return {
    fontFamily: comp.font.family,
    fontSize: `${comp.font.size}pt`,
    fontWeight: comp.font.bold ? 'bold' : 'normal',
    fontStyle: comp.font.italic ? 'italic' : 'normal',
    color: comp.foreColor,
  };
}

const NON_VISUAL_TYPES = ['Timer', 'NotifyIcon', 'ToolTip', 'ContextMenuStrip'];

export function isNonVisual(type: string) {
  return NON_VISUAL_TYPES.includes(type);
}

export function renderComponentContent(comp: FormComponent) {
  const fs = fontStyle(comp);

  switch (comp.type) {
    case 'Button':
      return (
        <div
          className="w-full h-full flex items-center justify-center border border-[#ADADAD] rounded-[2px] select-none"
          style={{ background: 'linear-gradient(180deg, #F0F0F0 0%, #E5E5E5 100%)', ...fs }}
        >
          {comp.text}
        </div>
      );

    case 'TextBox':
      return (
        <div
          className="w-full h-full border border-[#7A7A7A] bg-white px-1 flex items-center select-none"
          style={fs}
        >
          <span className="text-[#888]">{comp.text || comp.name}</span>
        </div>
      );

    case 'Label':
      return (
        <div className="w-full h-full flex items-center select-none" style={fs}>
          {comp.text}
        </div>
      );

    case 'LinkLabel':
      return (
        <div
          className="w-full h-full flex items-center select-none underline"
          style={{ ...fs, color: comp.linkColor || '#0066CC' }}
        >
          {comp.text}
        </div>
      );

    case 'CheckBox':
      return (
        <div className="w-full h-full flex items-center gap-1.5 select-none" style={fs}>
          <div className="w-3.5 h-3.5 border border-[#7A7A7A] bg-white flex items-center justify-center flex-shrink-0">
            {comp.checked && <span className="text-[10px] leading-none">&#10003;</span>}
          </div>
          <span>{comp.text}</span>
        </div>
      );

    case 'RadioButton':
      return (
        <div className="w-full h-full flex items-center gap-1.5 select-none" style={fs}>
          <div className="w-3.5 h-3.5 rounded-full border border-[#7A7A7A] bg-white flex items-center justify-center flex-shrink-0">
            {comp.checked && <div className="w-2 h-2 rounded-full bg-black" />}
          </div>
          <span>{comp.text}</span>
        </div>
      );

    case 'ComboBox':
      return (
        <div className="w-full h-full flex items-center border border-[#7A7A7A] bg-white select-none" style={fs}>
          <div className="flex-1 px-1 truncate text-[#888]">
            {comp.selectedIndex !== undefined && comp.selectedIndex >= 0 && comp.items
              ? comp.items[comp.selectedIndex]
              : ''}
          </div>
          <div className="w-5 h-full border-l border-[#7A7A7A] flex items-center justify-center bg-[#F0F0F0]">
            <span className="text-[8px]">&#9660;</span>
          </div>
        </div>
      );

    case 'ListBox':
      return (
        <div className="w-full h-full border border-[#7A7A7A] bg-white overflow-hidden select-none" style={fs}>
          {comp.items?.map((item, i) => (
            <div key={i} className="px-1 py-0.5 text-xs truncate hover:bg-[#316AC5] hover:text-white">
              {item}
            </div>
          ))}
        </div>
      );

    case 'CheckedListBox':
      return (
        <div className="w-full h-full border border-[#7A7A7A] bg-white overflow-hidden select-none" style={fs}>
          {comp.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-1 px-1 py-0.5 text-xs">
              <div className="w-3 h-3 border border-[#7A7A7A] bg-white flex items-center justify-center flex-shrink-0">
                {comp.checkedIndices?.includes(i) && <span className="text-[8px] leading-none">&#10003;</span>}
              </div>
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>
      );

    case 'NumericUpDown':
      return (
        <div className="w-full h-full flex items-center border border-[#7A7A7A] bg-white select-none" style={fs}>
          <div className="flex-1 px-1 text-xs">{comp.value ?? 0}</div>
          <div className="w-4 h-full border-l border-[#7A7A7A] flex flex-col">
            <div className="flex-1 flex items-center justify-center border-b border-[#DDD] bg-[#F0F0F0] text-[7px]">&#9650;</div>
            <div className="flex-1 flex items-center justify-center bg-[#F0F0F0] text-[7px]">&#9660;</div>
          </div>
        </div>
      );

    case 'DateTimePicker':
      return (
        <div className="w-full h-full flex items-center border border-[#7A7A7A] bg-white select-none" style={fs}>
          <div className="flex-1 px-1 text-xs truncate">{comp.text || new Date().toLocaleDateString()}</div>
          <div className="w-5 h-full border-l border-[#7A7A7A] flex items-center justify-center bg-[#F0F0F0]">
            <span className="text-[8px]">&#9660;</span>
          </div>
        </div>
      );

    case 'MaskedTextBox':
      return (
        <div
          className="w-full h-full border border-[#7A7A7A] bg-white px-1 flex items-center select-none"
          style={fs}
        >
          <span className="text-[#888]">{comp.text || comp.mask || comp.name}</span>
        </div>
      );

    case 'RichTextBox':
      return (
        <div
          className="w-full h-full border border-[#7A7A7A] bg-white px-1 py-0.5 select-none overflow-hidden"
          style={fs}
        >
          <span className="text-[#888]">{comp.text || comp.name}</span>
        </div>
      );

    case 'PictureBox':
      return (
        <div className="w-full h-full border border-[#7A7A7A] bg-[#E0E0E0] flex items-center justify-center select-none">
          {comp.imageUrl ? (
            <img src={comp.imageUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-xs text-[#888]">PictureBox</span>
          )}
        </div>
      );

    case 'ListView':
      return (
        <div className="w-full h-full border border-[#7A7A7A] bg-white overflow-hidden select-none" style={fs}>
          <div className="flex border-b border-[#DDD] bg-[#F5F5F5]">
            {(comp.columns || []).map((col, i) => (
              <div key={i} className="flex-1 px-1 py-0.5 text-[10px] font-medium text-[#333] border-r border-[#DDD] truncate">
                {col}
              </div>
            ))}
          </div>
          <div className="text-[10px] text-[#999] px-1 py-2">
            {comp.items?.length ? comp.items.map((item, i) => (
              <div key={i} className="px-1 py-0.5 truncate">{item}</div>
            )) : null}
          </div>
        </div>
      );

    case 'TreeView':
      return (
        <div className="w-full h-full border border-[#7A7A7A] bg-white overflow-hidden select-none" style={fs}>
          {(comp.nodes || []).map((node, i) => (
            <div key={i} className="flex items-center gap-1 px-1 py-0.5 text-xs">
              <span className="text-[8px] text-[#666]">&#9654;</span>
              <span className="truncate">{node}</span>
            </div>
          ))}
        </div>
      );

    case 'MonthCalendar':
      return <MonthCalendarDesign comp={comp} />;

    case 'WebBrowser':
      return (
        <div className="w-full h-full border border-[#7A7A7A] bg-white flex flex-col select-none">
          <div className="h-5 bg-[#F0F0F0] border-b border-[#DDD] flex items-center px-1 gap-1">
            <div className="flex gap-0.5">
              <span className="text-[8px] text-[#999]">&#9664;</span>
              <span className="text-[8px] text-[#999]">&#9654;</span>
            </div>
            <div className="flex-1 h-3 bg-white border border-[#CCC] rounded-sm px-1">
              <span className="text-[8px] text-[#999]">{comp.url || 'about:blank'}</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs text-[#999]">WebBrowser</span>
          </div>
        </div>
      );

    case 'TabControl':
      return (
        <div className="w-full h-full border border-[#7A7A7A] bg-[#F0F0F0] select-none" style={fs}>
          <div className="flex border-b border-[#ADADAD]">
            {(comp.tabs || []).map((tab, i) => (
              <div
                key={i}
                className={`px-3 py-1 text-[10px] border-r border-[#ADADAD] ${
                  i === (comp.selectedIndex ?? 0)
                    ? 'bg-white border-t-2 border-t-[#0078D4] -mb-px'
                    : 'bg-[#E5E5E5]'
                }`}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>
      );

    case 'SplitContainer':
      return (
        <div className="w-full h-full border border-[#7A7A7A] bg-[#F0F0F0] flex select-none">
          {comp.orientation === 'Horizontal' ? (
            <>
              <div className="flex-1 border-b-2 border-b-[#CCCCCC]" />
              <div className="flex-1" />
            </>
          ) : (
            <>
              <div className="flex-1 border-r-2 border-r-[#CCCCCC]" />
              <div className="flex-1" />
            </>
          )}
        </div>
      );

    case 'FlowLayoutPanel':
      return (
        <div
          className="w-full h-full select-none"
          style={{
            backgroundColor: comp.backColor === 'transparent' ? 'transparent' : comp.backColor,
            border: comp.borderStyle === 'FixedSingle' ? '1px solid #7A7A7A' : 'none',
          }}
        >
          <span className="text-[9px] text-[#AAA] px-1">FlowLayoutPanel</span>
        </div>
      );

    case 'TableLayoutPanel':
      return (
        <div className="w-full h-full border border-dashed border-[#ADADAD] select-none">
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
            <div className="border border-dashed border-[#CCC]" />
            <div className="border border-dashed border-[#CCC]" />
            <div className="border border-dashed border-[#CCC]" />
            <div className="border border-dashed border-[#CCC]" />
          </div>
        </div>
      );

    case 'Panel':
      return (
        <div
          className="w-full h-full select-none"
          style={{
            backgroundColor: comp.backColor === 'transparent' ? 'transparent' : comp.backColor,
            border: comp.borderStyle === 'FixedSingle' ? '1px solid #7A7A7A' : comp.borderStyle === 'Fixed3D' ? '2px inset #7A7A7A' : 'none',
          }}
        />
      );

    case 'GroupBox':
      return (
        <div className="w-full h-full select-none relative" style={fs}>
          <fieldset className="w-full h-full border border-[#ADADAD] rounded px-2 pt-0 pb-1">
            <legend className="text-xs px-1">{comp.text}</legend>
          </fieldset>
        </div>
      );

    case 'MenuStrip':
      return (
        <div className="w-full h-full bg-[#F0F0F0] border border-[#D0D0D0] flex items-center select-none" style={fs}>
          {(comp.menuItems || []).map((item, i) => (
            <div key={i} className="px-3 py-0.5 text-[11px] text-[#333] hover:bg-[#D8E6F2]">{item}</div>
          ))}
        </div>
      );

    case 'StatusStrip':
      return (
        <div
          className="w-full h-full flex items-center px-2 select-none"
          style={{ ...fs, backgroundColor: comp.backColor, color: comp.foreColor }}
        >
          <span className="text-[10px]">{comp.statusText || comp.text || 'Ready'}</span>
        </div>
      );

    case 'ToolStrip':
      return (
        <div className="w-full h-full bg-[#F0F0F0] border border-[#D0D0D0] flex items-center gap-0.5 px-1 select-none" style={fs}>
          <div className="w-1 h-3 flex flex-col gap-px mr-1">
            <div className="w-1 h-px bg-[#999]" />
            <div className="w-1 h-px bg-[#999]" />
            <div className="w-1 h-px bg-[#999]" />
            <div className="w-1 h-px bg-[#999]" />
          </div>
          {(comp.menuItems || []).map((item, i) => (
            <div key={i} className="px-2 py-0.5 text-[10px] text-[#333] border border-transparent hover:border-[#CCC] hover:bg-[#E5E5E5] rounded-sm">{item}</div>
          ))}
        </div>
      );

    case 'BindingNavigator':
      return (
        <div className="w-full h-full bg-[#F0F0F0] border border-[#D0D0D0] flex items-center gap-1 px-1 select-none" style={fs}>
          <span className="text-[10px] text-[#666]">|&#9664;</span>
          <span className="text-[10px] text-[#666]">&#9664;</span>
          <div className="w-8 h-3.5 border border-[#7A7A7A] bg-white text-center text-[9px] leading-[14px]">1</div>
          <span className="text-[9px] text-[#666]">of 0</span>
          <span className="text-[10px] text-[#666]">&#9654;</span>
          <span className="text-[10px] text-[#666]">&#9654;|</span>
          <span className="text-[10px] text-[#666]">+</span>
        </div>
      );

    case 'Chart':
      return (
        <div className="w-full h-full border border-[#7A7A7A] bg-white p-2 select-none flex flex-col">
          <div className="text-[10px] text-[#333] font-medium text-center mb-1">Chart</div>
          <div className="flex-1 flex items-end gap-1 px-2">
            <div className="flex-1 bg-[#4472C4] rounded-t-sm" style={{ height: '60%' }} />
            <div className="flex-1 bg-[#ED7D31] rounded-t-sm" style={{ height: '40%' }} />
            <div className="flex-1 bg-[#A5A5A5] rounded-t-sm" style={{ height: '80%' }} />
            <div className="flex-1 bg-[#FFC000] rounded-t-sm" style={{ height: '50%' }} />
          </div>
        </div>
      );

    case 'ProgressBar':
      return (
        <div className="w-full h-full border border-[#ADADAD] bg-[#E6E6E6] select-none">
          <div
            className="h-full bg-[#06B025]"
            style={{
              width: `${Math.min(100, Math.max(0, ((comp.value ?? 0) / (comp.maximum ?? 100)) * 100))}%`,
            }}
          />
        </div>
      );

    case 'Timer':
    case 'NotifyIcon':
    case 'ToolTip':
    case 'ContextMenuStrip':
      return (
        <div className="w-full h-full flex items-center justify-center border border-dashed border-[#ADADAD] bg-[#F8F8F8] select-none">
          <span className="text-[10px] text-[#888]">{comp.type}</span>
        </div>
      );

    case 'ToolStripContainer':
      return (
        <div className="w-full h-full border border-dashed border-[#ADADAD] bg-[#F8F8F8] select-none flex flex-col">
          <div className="h-4 bg-[#F0F0F0] border-b border-dashed border-[#CCC]" />
          <div className="flex-1" />
        </div>
      );

    default:
      return <div className="w-full h-full border border-[#ADADAD] bg-white select-none" />;
  }
}

function MonthCalendarDesign({ comp }: { comp: FormComponent }) {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const firstDay = new Date(year, now.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
  const today = now.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="w-full h-full border border-[#7A7A7A] bg-white select-none flex flex-col" style={{ fontSize: '9px', color: comp.foreColor }}>
      <div className="flex items-center justify-between px-2 py-1 bg-[#F5F5F5] border-b border-[#DDD]">
        <span className="text-[8px] text-[#666]">&#9664;</span>
        <span className="text-[9px] font-medium">{month} {year}</span>
        <span className="text-[8px] text-[#666]">&#9654;</span>
      </div>
      <div className="grid grid-cols-7 gap-0 px-1 py-0.5">
        {days.map((d) => (
          <div key={d} className="text-center text-[8px] font-medium text-[#666] py-0.5">{d}</div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={`text-center text-[8px] py-0.5 ${
              d === today ? 'bg-[#0078D4] text-white rounded-sm' : d ? 'text-[#333]' : ''
            }`}
          >
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  );
}
