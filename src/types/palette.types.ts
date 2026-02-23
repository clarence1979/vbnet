import type { ComponentType } from './component.types';

export interface PaletteItem {
  type: ComponentType;
  label: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultText?: string;
  category: 'Common' | 'Container' | 'Menus & Toolbars' | 'Data';
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'Button', label: 'Button', icon: 'RectangleHorizontal', defaultWidth: 100, defaultHeight: 30, defaultText: 'Button', category: 'Common' },
  { type: 'CheckBox', label: 'CheckBox', icon: 'CheckSquare', defaultWidth: 120, defaultHeight: 24, defaultText: 'CheckBox', category: 'Common' },
  { type: 'CheckedListBox', label: 'CheckedListBox', icon: 'ListChecks', defaultWidth: 150, defaultHeight: 100, defaultText: '', category: 'Common' },
  { type: 'ComboBox', label: 'ComboBox', icon: 'ChevronDown', defaultWidth: 150, defaultHeight: 24, defaultText: '', category: 'Common' },
  { type: 'DateTimePicker', label: 'DateTimePicker', icon: 'Calendar', defaultWidth: 200, defaultHeight: 24, defaultText: '', category: 'Common' },
  { type: 'Label', label: 'Label', icon: 'Type', defaultWidth: 80, defaultHeight: 20, defaultText: 'Label', category: 'Common' },
  { type: 'LinkLabel', label: 'LinkLabel', icon: 'Link', defaultWidth: 80, defaultHeight: 20, defaultText: 'LinkLabel', category: 'Common' },
  { type: 'ListBox', label: 'ListBox', icon: 'List', defaultWidth: 150, defaultHeight: 100, defaultText: '', category: 'Common' },
  { type: 'ListView', label: 'ListView', icon: 'LayoutList', defaultWidth: 200, defaultHeight: 120, defaultText: '', category: 'Common' },
  { type: 'MaskedTextBox', label: 'MaskedTextBox', icon: 'TextSelect', defaultWidth: 150, defaultHeight: 24, defaultText: '', category: 'Common' },
  { type: 'MonthCalendar', label: 'MonthCalendar', icon: 'CalendarDays', defaultWidth: 230, defaultHeight: 170, defaultText: '', category: 'Common' },
  { type: 'NotifyIcon', label: 'NotifyIcon', icon: 'Bell', defaultWidth: 32, defaultHeight: 32, defaultText: '', category: 'Common' },
  { type: 'NumericUpDown', label: 'NumericUpDown', icon: 'Hash', defaultWidth: 120, defaultHeight: 24, defaultText: '', category: 'Common' },
  { type: 'PictureBox', label: 'PictureBox', icon: 'Image', defaultWidth: 120, defaultHeight: 120, defaultText: '', category: 'Common' },
  { type: 'ProgressBar', label: 'ProgressBar', icon: 'Loader', defaultWidth: 200, defaultHeight: 24, defaultText: '', category: 'Common' },
  { type: 'RadioButton', label: 'RadioButton', icon: 'Circle', defaultWidth: 120, defaultHeight: 24, defaultText: 'RadioButton', category: 'Common' },
  { type: 'RichTextBox', label: 'RichTextBox', icon: 'FileText', defaultWidth: 200, defaultHeight: 100, defaultText: '', category: 'Common' },
  { type: 'TextBox', label: 'TextBox', icon: 'TextCursorInput', defaultWidth: 150, defaultHeight: 24, defaultText: '', category: 'Common' },
  { type: 'Timer', label: 'Timer', icon: 'Clock', defaultWidth: 32, defaultHeight: 32, defaultText: '', category: 'Common' },
  { type: 'ToolTip', label: 'ToolTip', icon: 'MessageCircle', defaultWidth: 32, defaultHeight: 32, defaultText: '', category: 'Common' },
  { type: 'TreeView', label: 'TreeView', icon: 'FolderTree', defaultWidth: 150, defaultHeight: 120, defaultText: '', category: 'Common' },
  { type: 'WebBrowser', label: 'WebBrowser', icon: 'Globe', defaultWidth: 250, defaultHeight: 200, defaultText: '', category: 'Common' },

  { type: 'FlowLayoutPanel', label: 'FlowLayoutPanel', icon: 'LayoutPanelLeft', defaultWidth: 200, defaultHeight: 100, defaultText: '', category: 'Container' },
  { type: 'GroupBox', label: 'GroupBox', icon: 'Box', defaultWidth: 200, defaultHeight: 150, defaultText: 'GroupBox', category: 'Container' },
  { type: 'Panel', label: 'Panel', icon: 'Square', defaultWidth: 200, defaultHeight: 150, defaultText: '', category: 'Container' },
  { type: 'SplitContainer', label: 'SplitContainer', icon: 'Columns', defaultWidth: 250, defaultHeight: 150, defaultText: '', category: 'Container' },
  { type: 'TabControl', label: 'TabControl', icon: 'PanelTop', defaultWidth: 250, defaultHeight: 150, defaultText: '', category: 'Container' },
  { type: 'TableLayoutPanel', label: 'TableLayoutPanel', icon: 'Table', defaultWidth: 200, defaultHeight: 150, defaultText: '', category: 'Container' },

  { type: 'ContextMenuStrip', label: 'ContextMenuStrip', icon: 'Menu', defaultWidth: 32, defaultHeight: 32, defaultText: '', category: 'Menus & Toolbars' },
  { type: 'MenuStrip', label: 'MenuStrip', icon: 'AlignJustify', defaultWidth: 800, defaultHeight: 24, defaultText: '', category: 'Menus & Toolbars' },
  { type: 'StatusStrip', label: 'StatusStrip', icon: 'GripHorizontal', defaultWidth: 800, defaultHeight: 22, defaultText: 'Ready', category: 'Menus & Toolbars' },
  { type: 'ToolStrip', label: 'ToolStrip', icon: 'Grip', defaultWidth: 800, defaultHeight: 25, defaultText: '', category: 'Menus & Toolbars' },
  { type: 'ToolStripContainer', label: 'ToolStripContainer', icon: 'LayoutPanelTop', defaultWidth: 250, defaultHeight: 150, defaultText: '', category: 'Menus & Toolbars' },

  { type: 'BindingNavigator', label: 'BindingNavigator', icon: 'Navigation', defaultWidth: 800, defaultHeight: 25, defaultText: '', category: 'Data' },
  { type: 'Chart', label: 'Chart', icon: 'BarChart3', defaultWidth: 300, defaultHeight: 200, defaultText: '', category: 'Data' },
];
