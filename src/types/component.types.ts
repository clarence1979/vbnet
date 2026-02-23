export type ComponentType =
  | 'Button'
  | 'TextBox'
  | 'Label'
  | 'CheckBox'
  | 'RadioButton'
  | 'ComboBox'
  | 'ListBox'
  | 'PictureBox'
  | 'Panel'
  | 'GroupBox'
  | 'ProgressBar'
  | 'Timer'
  | 'CheckedListBox'
  | 'DateTimePicker'
  | 'LinkLabel'
  | 'ListView'
  | 'MaskedTextBox'
  | 'MonthCalendar'
  | 'NotifyIcon'
  | 'NumericUpDown'
  | 'RichTextBox'
  | 'ToolTip'
  | 'TreeView'
  | 'WebBrowser'
  | 'FlowLayoutPanel'
  | 'SplitContainer'
  | 'TabControl'
  | 'TableLayoutPanel'
  | 'ContextMenuStrip'
  | 'MenuStrip'
  | 'StatusStrip'
  | 'ToolStrip'
  | 'ToolStripContainer'
  | 'BindingNavigator'
  | 'Chart';

export type BorderStyle = 'None' | 'FixedSingle' | 'Fixed3D';

export interface FontInfo {
  family: string;
  size: number;
  bold: boolean;
  italic: boolean;
}

export interface FormComponent {
  id: string;
  type: ComponentType;
  name: string;
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  backColor: string;
  foreColor: string;
  font: FontInfo;
  enabled: boolean;
  visible: boolean;
  tabIndex: number;
  zIndex: number;

  maxLength?: number;
  passwordChar?: string;
  multiline?: boolean;
  readOnly?: boolean;
  checked?: boolean;
  items?: string[];
  selectedIndex?: number;
  imageUrl?: string;
  borderStyle?: BorderStyle;
  interval?: number;
  value?: number;
  maximum?: number;
  minimum?: number;

  increment?: number;
  decimalPlaces?: number;
  mask?: string;
  url?: string;
  linkColor?: string;
  columns?: string[];
  checkedIndices?: number[];
  nodes?: string[];
  tabs?: string[];
  orientation?: 'Horizontal' | 'Vertical';
  flowDirection?: 'LeftToRight' | 'TopDown' | 'RightToLeft' | 'BottomUp';
  chartType?: string;
  menuItems?: string[];
  statusText?: string;
}

export interface FormSettings {
  name: string;
  text: string;
  width: number;
  height: number;
  backColor: string;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
}

export interface EventHandler {
  componentName: string;
  eventName: string;
  code: string;
}

export interface ProjectData {
  formSettings: FormSettings;
  components: FormComponent[];
  eventHandlers: EventHandler[];
  userCode: string;
}

export type ProjectFileType = 'form' | 'module' | 'class' | 'folder' | 'csv';

export interface ProjectFile {
  id: string;
  name: string;
  fileType: ProjectFileType;
  formSettings?: FormSettings;
  components?: FormComponent[];
  eventHandlers?: EventHandler[];
  code: string;
  parentId?: string;
  children?: string[];
  isExpanded?: boolean;
}

export type ViewMode = 'design' | 'code' | 'split';
export type ExecutionState = 'stopped' | 'running' | 'paused';

export interface HistoryEntry {
  components: FormComponent[];
  formSettings: FormSettings;
}

export interface ClipboardData {
  components: FormComponent[];
}
