import { useCallback, useState } from 'react';
import {
  RectangleHorizontal,
  TextCursorInput,
  Type,
  CheckSquare,
  Circle,
  ChevronDown,
  List,
  Image,
  Square,
  Box,
  Loader,
  Clock,
  ListChecks,
  Calendar,
  Link,
  LayoutList,
  TextSelect,
  CalendarDays,
  Bell,
  Hash,
  FileText,
  MessageCircle,
  FolderTree,
  Globe,
  LayoutPanelLeft,
  Columns,
  PanelTop,
  Table,
  Menu,
  AlignJustify,
  GripHorizontal,
  Grip,
  LayoutPanelTop,
  Navigation,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { PALETTE_ITEMS } from '../../types/palette.types';
import { useProjectStore } from '../../store/useProjectStore';
import type { ComponentType } from '../../types/component.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.FC<any>> = {
  RectangleHorizontal,
  TextCursorInput,
  Type,
  CheckSquare,
  Circle,
  ChevronDown,
  List,
  Image,
  Square,
  Box,
  Loader,
  Clock,
  ListChecks,
  Calendar,
  Link,
  LayoutList,
  TextSelect,
  CalendarDays,
  Bell,
  Hash,
  FileText,
  MessageCircle,
  FolderTree,
  Globe,
  LayoutPanelLeft,
  Columns,
  PanelTop,
  Table,
  Menu,
  AlignJustify,
  GripHorizontal,
  Grip,
  LayoutPanelTop,
  Navigation,
  BarChart3,
};

interface Props {
  onDragStart: (type: ComponentType) => void;
}

const CATEGORIES = ['Common', 'Container', 'Menus & Toolbars', 'Data'] as const;

export default function ComponentPalette({ onDragStart }: Props) {
  const addComponent = useProjectStore((s) => s.addComponent);
  const formSettings = useProjectStore((s) => s.formSettings);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const handleDragStart = useCallback(
    (e: React.DragEvent, type: ComponentType) => {
      e.dataTransfer.setData('componentType', type);
      e.dataTransfer.effectAllowed = 'copy';
      onDragStart(type);
    },
    [onDragStart]
  );

  const handleDoubleClick = useCallback(
    (type: ComponentType) => {
      const centerX = Math.round((formSettings.width / 2) - 50);
      const centerY = Math.round((formSettings.height / 2) - 15);
      addComponent(type, centerX, centerY);
    },
    [addComponent, formSettings.width, formSettings.height]
  );

  const toggleCategory = useCallback((cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  const [toolboxCollapsed, setToolboxCollapsed] = useState(false);

  return (
    <div className="bg-[#F5F5F5] flex flex-col overflow-hidden h-full">
      <button
        onClick={() => setToolboxCollapsed(!toolboxCollapsed)}
        className="px-2 py-1.5 bg-[#EEEEF2] border-y border-[#CCCEDB] flex items-center gap-1.5 hover:bg-[#E4E4E8] transition-colors shrink-0 w-full text-left"
      >
        <ChevronRight
          size={12}
          className={`text-[#666] transition-transform duration-150 ${toolboxCollapsed ? '' : 'rotate-90'}`}
        />
        <span className="text-[11px] font-semibold text-[#1E1E1E] tracking-wide uppercase">
          Toolbox
        </span>
      </button>
      {!toolboxCollapsed && <div className="flex-1 overflow-y-auto py-1">
        {CATEGORIES.map((cat) => {
          const items = PALETTE_ITEMS.filter((p) => p.category === cat);
          if (items.length === 0) return null;
          const isCollapsed = collapsed[cat];
          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-[#6D6D6D] uppercase tracking-wider hover:bg-[#E8E8E8] transition-colors"
              >
                <ChevronRight
                  size={12}
                  className={`transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`}
                />
                {cat} Controls
              </button>
              {!isCollapsed && items.map((item) => {
                const Icon = ICON_MAP[item.icon];
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.type)}
                    onDoubleClick={() => handleDoubleClick(item.type)}
                    className="flex items-center gap-2.5 px-3 py-1.5 cursor-grab hover:bg-[#C9DEF5] active:cursor-grabbing select-none transition-colors duration-100"
                    title={`Drag or double-click to add ${item.type}`}
                  >
                    {Icon && <Icon size={14} className="text-[#555555] flex-shrink-0" />}
                    <span className="text-xs text-[#1E1E1E]">{item.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>}
    </div>
  );
}
