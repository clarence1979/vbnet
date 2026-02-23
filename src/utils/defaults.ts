import type { FormComponent, FormSettings, FontInfo, ComponentType } from '../types/component.types';
import { PALETTE_ITEMS } from '../types/palette.types';
import { generateId, generateComponentName } from './idGenerator';

export const DEFAULT_FONT: FontInfo = {
  family: 'Segoe UI',
  size: 9,
  bold: false,
  italic: false,
};

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  name: 'Form1',
  text: 'Form1',
  width: 400,
  height: 300,
  backColor: '#F0F0F0',
  gridSize: 10,
  snapToGrid: true,
  showGrid: true,
};

export function createDefaultComponent(
  type: ComponentType,
  x: number,
  y: number,
  existingNames: string[],
  zIndex: number
): FormComponent {
  const palette = PALETTE_ITEMS.find(p => p.type === type)!;
  const name = generateComponentName(type, existingNames);

  const base: FormComponent = {
    id: generateId(),
    type,
    name,
    text: palette.defaultText ?? name,
    left: x,
    top: y,
    width: palette.defaultWidth,
    height: palette.defaultHeight,
    backColor: type === 'Button' ? '#E1E1E1' : '#FFFFFF',
    foreColor: '#000000',
    font: { ...DEFAULT_FONT },
    enabled: true,
    visible: true,
    tabIndex: 0,
    zIndex,
  };

  switch (type) {
    case 'TextBox':
      base.maxLength = 32767;
      base.passwordChar = '';
      base.multiline = false;
      base.readOnly = false;
      base.backColor = '#FFFFFF';
      break;
    case 'CheckBox':
    case 'RadioButton':
      base.checked = false;
      base.backColor = 'transparent';
      break;
    case 'ComboBox':
      base.items = ['Item1', 'Item2', 'Item3'];
      base.selectedIndex = -1;
      break;
    case 'ListBox':
      base.items = ['Item1', 'Item2', 'Item3'];
      base.selectedIndex = -1;
      break;
    case 'PictureBox':
      base.imageUrl = '';
      base.borderStyle = 'FixedSingle';
      base.backColor = '#E0E0E0';
      break;
    case 'Panel':
      base.borderStyle = 'None';
      base.backColor = 'transparent';
      break;
    case 'GroupBox':
      base.borderStyle = 'FixedSingle';
      base.backColor = 'transparent';
      break;
    case 'ProgressBar':
      base.value = 0;
      base.minimum = 0;
      base.maximum = 100;
      break;
    case 'Timer':
      base.interval = 1000;
      base.enabled = false;
      base.visible = false;
      break;
    case 'Label':
      base.backColor = 'transparent';
      break;
    case 'Button':
      base.backColor = '#E1E1E1';
      break;
    case 'LinkLabel':
      base.backColor = 'transparent';
      base.linkColor = '#0066CC';
      base.foreColor = '#0066CC';
      break;
    case 'NumericUpDown':
      base.value = 0;
      base.minimum = 0;
      base.maximum = 100;
      base.increment = 1;
      base.decimalPlaces = 0;
      base.backColor = '#FFFFFF';
      break;
    case 'DateTimePicker':
      base.text = new Date().toLocaleDateString();
      base.backColor = '#FFFFFF';
      break;
    case 'MaskedTextBox':
      base.mask = '';
      base.backColor = '#FFFFFF';
      break;
    case 'RichTextBox':
      base.multiline = true;
      base.readOnly = false;
      base.backColor = '#FFFFFF';
      break;
    case 'CheckedListBox':
      base.items = ['Item1', 'Item2', 'Item3'];
      base.checkedIndices = [];
      base.selectedIndex = -1;
      break;
    case 'ListView':
      base.columns = ['Column1', 'Column2', 'Column3'];
      base.items = [];
      break;
    case 'TreeView':
      base.nodes = ['Node1', 'Node2', 'Node3'];
      break;
    case 'MonthCalendar':
      base.backColor = '#FFFFFF';
      break;
    case 'WebBrowser':
      base.url = '';
      base.backColor = '#FFFFFF';
      break;
    case 'TabControl':
      base.tabs = ['TabPage1', 'TabPage2'];
      base.selectedIndex = 0;
      base.backColor = '#F0F0F0';
      break;
    case 'SplitContainer':
      base.orientation = 'Vertical';
      base.backColor = '#F0F0F0';
      break;
    case 'FlowLayoutPanel':
      base.flowDirection = 'LeftToRight';
      base.backColor = 'transparent';
      base.borderStyle = 'None';
      break;
    case 'TableLayoutPanel':
      base.backColor = 'transparent';
      base.borderStyle = 'None';
      break;
    case 'MenuStrip':
      base.menuItems = ['File', 'Edit', 'View', 'Help'];
      base.backColor = '#F0F0F0';
      break;
    case 'StatusStrip':
      base.statusText = 'Ready';
      base.backColor = '#007ACC';
      base.foreColor = '#FFFFFF';
      break;
    case 'ToolStrip':
      base.menuItems = ['New', 'Open', 'Save'];
      base.backColor = '#F0F0F0';
      break;
    case 'ContextMenuStrip':
      base.menuItems = ['Cut', 'Copy', 'Paste'];
      base.visible = false;
      break;
    case 'ToolStripContainer':
      base.backColor = 'transparent';
      break;
    case 'BindingNavigator':
      base.backColor = '#F0F0F0';
      break;
    case 'Chart':
      base.chartType = 'Bar';
      base.backColor = '#FFFFFF';
      break;
    case 'NotifyIcon':
      base.visible = false;
      break;
    case 'ToolTip':
      base.visible = false;
      break;
  }

  return base;
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
