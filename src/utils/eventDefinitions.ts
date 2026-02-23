import type { ComponentType } from '../types/component.types';

export interface EventDefinition {
  name: string;
  description: string;
  parameters: string;
}

export function getAvailableEvents(type: ComponentType | 'Form'): EventDefinition[] {
  const commonEvents: EventDefinition[] = [
    { name: 'Click', description: 'Occurs when the control is clicked', parameters: 'sender As Object, e As EventArgs' },
    { name: 'DoubleClick', description: 'Occurs when the control is double-clicked', parameters: 'sender As Object, e As EventArgs' },
    { name: 'MouseDown', description: 'Occurs when mouse button is pressed', parameters: 'sender As Object, e As MouseEventArgs' },
    { name: 'MouseUp', description: 'Occurs when mouse button is released', parameters: 'sender As Object, e As MouseEventArgs' },
    { name: 'MouseMove', description: 'Occurs when mouse is moved over control', parameters: 'sender As Object, e As MouseEventArgs' },
    { name: 'MouseEnter', description: 'Occurs when mouse enters control', parameters: 'sender As Object, e As EventArgs' },
    { name: 'MouseLeave', description: 'Occurs when mouse leaves control', parameters: 'sender As Object, e As EventArgs' },
    { name: 'MouseHover', description: 'Occurs when mouse hovers over control', parameters: 'sender As Object, e As EventArgs' },
    { name: 'KeyDown', description: 'Occurs when key is pressed', parameters: 'sender As Object, e As KeyEventArgs' },
    { name: 'KeyUp', description: 'Occurs when key is released', parameters: 'sender As Object, e As KeyEventArgs' },
    { name: 'KeyPress', description: 'Occurs when key is pressed', parameters: 'sender As Object, e As KeyPressEventArgs' },
    { name: 'GotFocus', description: 'Occurs when control receives focus', parameters: 'sender As Object, e As EventArgs' },
    { name: 'LostFocus', description: 'Occurs when control loses focus', parameters: 'sender As Object, e As EventArgs' },
    { name: 'Enter', description: 'Occurs when control is entered', parameters: 'sender As Object, e As EventArgs' },
    { name: 'Leave', description: 'Occurs when focus leaves control', parameters: 'sender As Object, e As EventArgs' },
    { name: 'Paint', description: 'Occurs when control is redrawn', parameters: 'sender As Object, e As PaintEventArgs' },
    { name: 'Resize', description: 'Occurs when control is resized', parameters: 'sender As Object, e As EventArgs' },
  ];

  const formEvents: EventDefinition[] = [
    { name: 'Load', description: 'Occurs when form is loaded', parameters: 'sender As Object, e As EventArgs' },
    { name: 'Shown', description: 'Occurs when form is first displayed', parameters: 'sender As Object, e As EventArgs' },
    { name: 'FormClosing', description: 'Occurs before form closes', parameters: 'sender As Object, e As FormClosingEventArgs' },
    { name: 'FormClosed', description: 'Occurs after form closes', parameters: 'sender As Object, e As FormClosedEventArgs' },
    { name: 'Activated', description: 'Occurs when form is activated', parameters: 'sender As Object, e As EventArgs' },
    { name: 'Deactivate', description: 'Occurs when form loses focus', parameters: 'sender As Object, e As EventArgs' },
    ...commonEvents,
  ];

  const typeSpecificEvents: Record<string, EventDefinition[]> = {
    Form: formEvents,
    Button: [
      ...commonEvents,
    ],
    TextBox: [
      { name: 'TextChanged', description: 'Occurs when text is changed', parameters: 'sender As Object, e As EventArgs' },
      { name: 'Validating', description: 'Occurs when control is validating', parameters: 'sender As Object, e As CancelEventArgs' },
      { name: 'Validated', description: 'Occurs when control is validated', parameters: 'sender As Object, e As EventArgs' },
      ...commonEvents,
    ],
    CheckBox: [
      { name: 'CheckedChanged', description: 'Occurs when checked state changes', parameters: 'sender As Object, e As EventArgs' },
      { name: 'CheckStateChanged', description: 'Occurs when check state changes', parameters: 'sender As Object, e As EventArgs' },
      ...commonEvents,
    ],
    RadioButton: [
      { name: 'CheckedChanged', description: 'Occurs when checked state changes', parameters: 'sender As Object, e As EventArgs' },
      ...commonEvents,
    ],
    ComboBox: [
      { name: 'SelectedIndexChanged', description: 'Occurs when selection changes', parameters: 'sender As Object, e As EventArgs' },
      { name: 'SelectedValueChanged', description: 'Occurs when selected value changes', parameters: 'sender As Object, e As EventArgs' },
      { name: 'TextChanged', description: 'Occurs when text changes', parameters: 'sender As Object, e As EventArgs' },
      { name: 'DropDown', description: 'Occurs when dropdown opens', parameters: 'sender As Object, e As EventArgs' },
      { name: 'DropDownClosed', description: 'Occurs when dropdown closes', parameters: 'sender As Object, e As EventArgs' },
      ...commonEvents,
    ],
    ListBox: [
      { name: 'SelectedIndexChanged', description: 'Occurs when selection changes', parameters: 'sender As Object, e As EventArgs' },
      { name: 'SelectedValueChanged', description: 'Occurs when selected value changes', parameters: 'sender As Object, e As EventArgs' },
      ...commonEvents,
    ],
    Timer: [
      { name: 'Tick', description: 'Occurs when interval elapses', parameters: 'sender As Object, e As EventArgs' },
    ],
    NumericUpDown: [
      { name: 'ValueChanged', description: 'Occurs when value changes', parameters: 'sender As Object, e As EventArgs' },
      ...commonEvents,
    ],
    DateTimePicker: [
      { name: 'ValueChanged', description: 'Occurs when value changes', parameters: 'sender As Object, e As EventArgs' },
      { name: 'CloseUp', description: 'Occurs when dropdown closes', parameters: 'sender As Object, e As EventArgs' },
      { name: 'DropDown', description: 'Occurs when dropdown opens', parameters: 'sender As Object, e As EventArgs' },
      ...commonEvents,
    ],
    TreeView: [
      { name: 'AfterSelect', description: 'Occurs after node is selected', parameters: 'sender As Object, e As TreeViewEventArgs' },
      { name: 'BeforeSelect', description: 'Occurs before node is selected', parameters: 'sender As Object, e As TreeViewCancelEventArgs' },
      { name: 'AfterExpand', description: 'Occurs after node expands', parameters: 'sender As Object, e As TreeViewEventArgs' },
      { name: 'BeforeExpand', description: 'Occurs before node expands', parameters: 'sender As Object, e As TreeViewCancelEventArgs' },
      { name: 'NodeMouseClick', description: 'Occurs when node is clicked', parameters: 'sender As Object, e As TreeNodeMouseClickEventArgs' },
      ...commonEvents,
    ],
    ListView: [
      { name: 'SelectedIndexChanged', description: 'Occurs when selection changes', parameters: 'sender As Object, e As EventArgs' },
      { name: 'ItemSelectionChanged', description: 'Occurs when item selection changes', parameters: 'sender As Object, e As ListViewItemSelectionChangedEventArgs' },
      { name: 'ItemActivate', description: 'Occurs when item is activated', parameters: 'sender As Object, e As EventArgs' },
      { name: 'ColumnClick', description: 'Occurs when column is clicked', parameters: 'sender As Object, e As ColumnClickEventArgs' },
      ...commonEvents,
    ],
    LinkLabel: [
      { name: 'LinkClicked', description: 'Occurs when link is clicked', parameters: 'sender As Object, e As LinkLabelLinkClickedEventArgs' },
      ...commonEvents,
    ],
    WebBrowser: [
      { name: 'DocumentCompleted', description: 'Occurs when document loads', parameters: 'sender As Object, e As WebBrowserDocumentCompletedEventArgs' },
      { name: 'Navigating', description: 'Occurs before navigation', parameters: 'sender As Object, e As WebBrowserNavigatingEventArgs' },
      { name: 'Navigated', description: 'Occurs after navigation', parameters: 'sender As Object, e As WebBrowserNavigatedEventArgs' },
      ...commonEvents,
    ],
    TabControl: [
      { name: 'SelectedIndexChanged', description: 'Occurs when selected tab changes', parameters: 'sender As Object, e As EventArgs' },
      { name: 'Selecting', description: 'Occurs before tab selection', parameters: 'sender As Object, e As TabControlCancelEventArgs' },
      { name: 'Selected', description: 'Occurs after tab selection', parameters: 'sender As Object, e As TabControlEventArgs' },
      ...commonEvents,
    ],
    MenuStrip: [
      { name: 'ItemClicked', description: 'Occurs when menu item is clicked', parameters: 'sender As Object, e As ToolStripItemClickedEventArgs' },
      ...commonEvents,
    ],
    ToolStrip: [
      { name: 'ItemClicked', description: 'Occurs when tool item is clicked', parameters: 'sender As Object, e As ToolStripItemClickedEventArgs' },
      ...commonEvents,
    ],
    ContextMenuStrip: [
      { name: 'ItemClicked', description: 'Occurs when menu item is clicked', parameters: 'sender As Object, e As ToolStripItemClickedEventArgs' },
      { name: 'Opening', description: 'Occurs before menu opens', parameters: 'sender As Object, e As CancelEventArgs' },
      { name: 'Opened', description: 'Occurs after menu opens', parameters: 'sender As Object, e As EventArgs' },
      { name: 'Closing', description: 'Occurs before menu closes', parameters: 'sender As Object, e As ToolStripDropDownClosingEventArgs' },
      { name: 'Closed', description: 'Occurs after menu closes', parameters: 'sender As Object, e As ToolStripDropDownClosedEventArgs' },
      ...commonEvents,
    ],
  };

  return typeSpecificEvents[type] || commonEvents;
}

export function getDefaultEvent(type: ComponentType | 'Form'): string {
  const events = getAvailableEvents(type);
  const defaults: Record<string, string> = {
    Form: 'Load',
    Button: 'Click',
    TextBox: 'TextChanged',
    CheckBox: 'CheckedChanged',
    RadioButton: 'CheckedChanged',
    ComboBox: 'SelectedIndexChanged',
    ListBox: 'SelectedIndexChanged',
    Timer: 'Tick',
    NumericUpDown: 'ValueChanged',
    DateTimePicker: 'ValueChanged',
    TreeView: 'AfterSelect',
    ListView: 'SelectedIndexChanged',
    LinkLabel: 'LinkClicked',
    WebBrowser: 'DocumentCompleted',
    TabControl: 'SelectedIndexChanged',
    MenuStrip: 'ItemClicked',
    ToolStrip: 'ItemClicked',
    ContextMenuStrip: 'ItemClicked',
  };

  return defaults[type] || 'Click';
}
