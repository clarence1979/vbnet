import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Code,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  Type,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Check,
  ChevronRight,
  List,
  Columns3,
  FolderTree,
  Layers,
  Image,
  Link,
  Hash,
  Clock,
  Palette,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { FormComponent } from '../../types/component.types';

interface Props {
  x: number;
  y: number;
  componentId: string;
  onClose: () => void;
}

type SubPanel = 'editText' | 'editItems' | 'editColumns' | 'editNodes' | 'editTabs' | 'editMenuItems' | 'editValue' | 'editImageUrl' | 'editUrl' | 'editInterval' | 'editLinkColor' | null;

function getTypeSpecificActions(comp: FormComponent): { label: string; icon: React.ReactNode; panel: SubPanel }[] {
  const actions: { label: string; icon: React.ReactNode; panel: SubPanel }[] = [];

  const hasText = !['Timer', 'PictureBox', 'WebBrowser', 'ProgressBar', 'Chart', 'SplitContainer', 'FlowLayoutPanel', 'TableLayoutPanel'].includes(comp.type);
  if (hasText) {
    actions.push({ label: 'Edit Text', icon: <Type size={13} />, panel: 'editText' });
  }

  if (['ComboBox', 'ListBox', 'CheckedListBox'].includes(comp.type)) {
    actions.push({ label: 'Edit Items...', icon: <List size={13} />, panel: 'editItems' });
  }
  if (comp.type === 'ListView') {
    actions.push({ label: 'Edit Columns...', icon: <Columns3 size={13} />, panel: 'editColumns' });
  }
  if (comp.type === 'TreeView') {
    actions.push({ label: 'Edit Nodes...', icon: <FolderTree size={13} />, panel: 'editNodes' });
  }
  if (comp.type === 'TabControl') {
    actions.push({ label: 'Edit Tabs...', icon: <Layers size={13} />, panel: 'editTabs' });
  }
  if (['MenuStrip', 'ToolStrip', 'ContextMenuStrip'].includes(comp.type)) {
    actions.push({ label: 'Edit Menu Items...', icon: <List size={13} />, panel: 'editMenuItems' });
  }
  if (comp.type === 'PictureBox') {
    actions.push({ label: 'Set Image URL...', icon: <Image size={13} />, panel: 'editImageUrl' });
  }
  if (comp.type === 'WebBrowser') {
    actions.push({ label: 'Set URL...', icon: <Link size={13} />, panel: 'editUrl' });
  }
  if (['ProgressBar', 'NumericUpDown'].includes(comp.type)) {
    actions.push({ label: 'Set Value...', icon: <Hash size={13} />, panel: 'editValue' });
  }
  if (comp.type === 'Timer') {
    actions.push({ label: 'Set Interval...', icon: <Clock size={13} />, panel: 'editInterval' });
  }
  if (comp.type === 'LinkLabel') {
    actions.push({ label: 'Set Link Color...', icon: <Palette size={13} />, panel: 'editLinkColor' });
  }

  return actions;
}

interface MenuItemDef {
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  shortcut?: string;
  danger?: boolean;
  divider?: boolean;
  toggle?: boolean;
  toggleState?: boolean;
  subPanel?: SubPanel;
  disabled?: boolean;
}

function MenuItem({ item, onHoverPanel }: { item: MenuItemDef; onHoverPanel?: (panel: SubPanel) => void }) {
  if (item.divider) {
    return <div className="h-px bg-[#D4D4D8] my-1 mx-2" />;
  }

  return (
    <button
      className={`w-full text-left px-2.5 py-[5px] text-[12px] flex items-center gap-2.5 transition-colors group
        ${item.danger ? 'text-[#D32F2F] hover:bg-[#FDECEA]' : 'text-[#1E1E1E] hover:bg-[#E8E8EC]'}
        ${item.disabled ? 'opacity-40 pointer-events-none' : ''}
      `}
      onClick={item.action}
      onMouseEnter={() => {
        if (item.subPanel && onHoverPanel) onHoverPanel(item.subPanel);
      }}
      disabled={item.disabled}
    >
      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[#616161]">
        {item.toggle ? (
          item.toggleState ? <Check size={13} className="text-[#0078D4]" /> : null
        ) : (
          item.icon || null
        )}
      </span>
      <span className="flex-1">{item.label}</span>
      {item.shortcut && (
        <span className="text-[11px] text-[#888] ml-4">{item.shortcut}</span>
      )}
      {item.subPanel && (
        <ChevronRight size={12} className="text-[#888] ml-1" />
      )}
    </button>
  );
}

interface InlineEditorProps {
  comp: FormComponent;
  panel: SubPanel;
  onClose: () => void;
}

function InlineEditor({ comp, panel, onClose }: InlineEditorProps) {
  const updateComponent = useProjectStore((s) => s.updateComponent);
  const pushHistory = useProjectStore((s) => s.pushHistory);
  const [textValue, setTextValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    switch (panel) {
      case 'editText': setTextValue(comp.text); break;
      case 'editItems': setTextValue((comp.items ?? []).join('\n')); break;
      case 'editColumns': setTextValue((comp.columns ?? []).join('\n')); break;
      case 'editNodes': setTextValue((comp.nodes ?? []).join('\n')); break;
      case 'editTabs': setTextValue((comp.tabs ?? []).join('\n')); break;
      case 'editMenuItems': setTextValue((comp.menuItems ?? []).join('\n')); break;
      case 'editImageUrl': setTextValue(comp.imageUrl ?? ''); break;
      case 'editUrl': setTextValue(comp.url ?? ''); break;
      case 'editValue': setTextValue(String(comp.value ?? 0)); break;
      case 'editInterval': setTextValue(String(comp.interval ?? 1000)); break;
      case 'editLinkColor': setTextValue(comp.linkColor ?? '#0066CC'); break;
    }
  }, [panel, comp]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleApply = useCallback(() => {
    pushHistory();
    switch (panel) {
      case 'editText': updateComponent(comp.id, { text: textValue }); break;
      case 'editItems': updateComponent(comp.id, { items: textValue.split('\n').filter((s) => s.trim()) }); break;
      case 'editColumns': updateComponent(comp.id, { columns: textValue.split('\n').filter((s) => s.trim()) }); break;
      case 'editNodes': updateComponent(comp.id, { nodes: textValue.split('\n').filter((s) => s.trim()) }); break;
      case 'editTabs': updateComponent(comp.id, { tabs: textValue.split('\n').filter((s) => s.trim()) }); break;
      case 'editMenuItems': updateComponent(comp.id, { menuItems: textValue.split('\n').filter((s) => s.trim()) }); break;
      case 'editImageUrl': updateComponent(comp.id, { imageUrl: textValue }); break;
      case 'editUrl': updateComponent(comp.id, { url: textValue }); break;
      case 'editValue': updateComponent(comp.id, { value: parseInt(textValue, 10) || 0 }); break;
      case 'editInterval': updateComponent(comp.id, { interval: parseInt(textValue, 10) || 1000 }); break;
      case 'editLinkColor': updateComponent(comp.id, { linkColor: textValue }); break;
    }
    onClose();
  }, [panel, textValue, comp.id, updateComponent, pushHistory, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleApply();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }, [handleApply, onClose]);

  const isMultiline = ['editItems', 'editColumns', 'editNodes', 'editTabs', 'editMenuItems'].includes(panel!);
  const isColor = panel === 'editLinkColor';
  const isNumber = panel === 'editValue' || panel === 'editInterval';

  const panelLabels: Record<string, string> = {
    editText: 'Text',
    editItems: 'Items (one per line)',
    editColumns: 'Columns (one per line)',
    editNodes: 'Nodes (one per line)',
    editTabs: 'Tabs (one per line)',
    editMenuItems: 'Menu Items (one per line)',
    editImageUrl: 'Image URL',
    editUrl: 'URL',
    editValue: 'Value',
    editInterval: 'Interval (ms)',
    editLinkColor: 'Link Color',
  };

  return (
    <div
      className="absolute top-0 left-full ml-1 bg-white border border-[#CCCEDB] rounded shadow-lg z-[10000] w-56"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 border-b border-[#E0E0E0] bg-[#F5F5F5]">
        <span className="text-[11px] font-semibold text-[#444] uppercase tracking-wide">
          {panelLabels[panel!] ?? 'Edit'}
        </span>
      </div>
      <div className="p-2.5">
        {isColor ? (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              className="w-8 h-8 border border-[#ADADAD] cursor-pointer p-0 rounded"
            />
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-[12px] px-2 py-1.5 border border-[#CCCEDB] rounded outline-none focus:border-[#0078D4]"
            />
          </div>
        ) : isMultiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
            className="w-full h-28 text-[12px] px-2 py-1.5 border border-[#CCCEDB] rounded outline-none focus:border-[#0078D4] resize-none font-mono"
            spellCheck={false}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={isNumber ? 'number' : 'text'}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full text-[12px] px-2 py-1.5 border border-[#CCCEDB] rounded outline-none focus:border-[#0078D4]"
          />
        )}
        <div className="flex justify-end gap-1.5 mt-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-[11px] bg-white border border-[#CCCEDB] rounded hover:bg-[#F0F0F0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-1 text-[11px] bg-[#0078D4] text-white rounded hover:bg-[#006CBD] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContextMenu({ x, y, componentId, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState<SubPanel>(null);

  const removeComponents = useProjectStore((s) => s.removeComponents);
  const bringToFront = useProjectStore((s) => s.bringToFront);
  const sendToBack = useProjectStore((s) => s.sendToBack);
  const setViewMode = useProjectStore((s) => s.setViewMode);
  const setCodeEditorTarget = useProjectStore((s) => s.setCodeEditorTarget);
  const components = useProjectStore((s) => s.components);
  const updateComponent = useProjectStore((s) => s.updateComponent);
  const copySelected = useProjectStore((s) => s.copySelected);
  const pasteClipboard = useProjectStore((s) => s.pasteClipboard);
  const clipboard = useProjectStore((s) => s.clipboard);
  const pushHistory = useProjectStore((s) => s.pushHistory);
  const setSelectedIds = useProjectStore((s) => s.setSelectedIds);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const comp = components.find((c) => c.id === componentId);
  if (!comp) return null;

  const typeActions = getTypeSpecificActions(comp);

  const handleCut = () => {
    setSelectedIds([componentId]);
    copySelected();
    removeComponents([componentId]);
    onClose();
  };

  const handleCopy = () => {
    setSelectedIds([componentId]);
    copySelected();
    onClose();
  };

  const handlePaste = () => {
    pasteClipboard();
    onClose();
  };

  const handleToggleEnabled = () => {
    pushHistory();
    updateComponent(componentId, { enabled: !comp.enabled });
    onClose();
  };

  const handleToggleVisible = () => {
    pushHistory();
    updateComponent(componentId, { visible: !comp.visible });
    onClose();
  };

  const handleToggleChecked = () => {
    pushHistory();
    updateComponent(componentId, { checked: !comp.checked });
    onClose();
  };

  const items: MenuItemDef[] = [];

  for (const ta of typeActions) {
    items.push({ label: ta.label, icon: ta.icon, subPanel: ta.panel, action: () => setActivePanel(ta.panel) });
  }

  if (typeActions.length > 0) {
    items.push({ divider: true } as MenuItemDef);
  }

  if (comp.type === 'CheckBox' || comp.type === 'RadioButton') {
    items.push({
      label: 'Checked',
      toggle: true,
      toggleState: comp.checked ?? false,
      action: handleToggleChecked,
    });
    items.push({ divider: true } as MenuItemDef);
  }

  items.push(
    { label: 'Cut', icon: <Scissors size={13} />, shortcut: 'Ctrl+X', action: handleCut },
    { label: 'Copy', icon: <Copy size={13} />, shortcut: 'Ctrl+C', action: handleCopy },
    { label: 'Paste', icon: <Clipboard size={13} />, shortcut: 'Ctrl+V', action: handlePaste, disabled: clipboard.length === 0 },
    { divider: true } as MenuItemDef,
    {
      label: 'View Code',
      icon: <Code size={13} />,
      action: () => {
        setCodeEditorTarget(comp.name);
        setViewMode('code');
        onClose();
      },
    },
    { divider: true } as MenuItemDef,
    {
      label: 'Bring to Front',
      icon: <ArrowUpToLine size={13} />,
      action: () => { bringToFront(componentId); onClose(); },
    },
    {
      label: 'Send to Back',
      icon: <ArrowDownToLine size={13} />,
      action: () => { sendToBack(componentId); onClose(); },
    },
    { divider: true } as MenuItemDef,
    {
      label: 'Enabled',
      toggle: true,
      toggleState: comp.enabled,
      icon: comp.enabled ? <ToggleRight size={13} /> : <ToggleLeft size={13} />,
      action: handleToggleEnabled,
    },
    {
      label: 'Visible',
      toggle: true,
      toggleState: comp.visible,
      icon: comp.visible ? <Eye size={13} /> : <EyeOff size={13} />,
      action: handleToggleVisible,
    },
    { divider: true } as MenuItemDef,
    {
      label: 'Delete',
      icon: <Trash2 size={13} />,
      shortcut: 'Del',
      danger: true,
      action: () => { removeComponents([componentId]); onClose(); },
    },
  );

  return (
    <div
      ref={ref}
      className="absolute z-[9999]"
      style={{ left: x, top: y }}
    >
      <div className="relative bg-white border border-[#CCCEDB] shadow-xl rounded-md py-1 min-w-[200px]">
        <div className="px-3 py-1.5 border-b border-[#E8E8E8] mb-0.5">
          <span className="text-[11px] text-[#888] font-medium">
            {comp.type} - {comp.name}
          </span>
        </div>
        {items.map((item, i) => (
          <MenuItem key={i} item={item} onHoverPanel={setActivePanel} />
        ))}
      </div>
      {activePanel && (
        <InlineEditor
          comp={comp}
          panel={activePanel}
          onClose={() => setActivePanel(null)}
        />
      )}
    </div>
  );
}
