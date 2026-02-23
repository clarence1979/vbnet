import type { FormComponent, EventHandler, FormSettings } from '../types/component.types';

function getDefaultEvent(type: string): string {
  switch (type) {
    case 'Button': return 'Click';
    case 'TextBox':
    case 'MaskedTextBox':
    case 'RichTextBox': return 'TextChanged';
    case 'CheckBox':
    case 'RadioButton': return 'CheckedChanged';
    case 'ComboBox':
    case 'ListBox':
    case 'CheckedListBox':
    case 'ListView':
    case 'TabControl': return 'SelectedIndexChanged';
    case 'NumericUpDown':
    case 'DateTimePicker':
    case 'MonthCalendar': return 'ValueChanged';
    case 'TreeView': return 'AfterSelect';
    case 'Timer': return 'Tick';
    case 'PictureBox': return 'Click';
    case 'LinkLabel': return 'LinkClicked';
    case 'WebBrowser': return 'DocumentCompleted';
    case 'MenuStrip':
    case 'ToolStrip':
    case 'ContextMenuStrip': return 'ItemClicked';
    case 'StatusStrip': return 'ItemClicked';
    default: return 'Click';
  }
}

export function generateFullCode(
  formSettings: FormSettings,
  components: FormComponent[],
  eventHandlers: EventHandler[]
): string {
  const lines: string[] = [];

  lines.push(`Public Class ${formSettings.name}`);
  lines.push('');
  lines.push("    ' Component declarations");

  for (const comp of components) {
    lines.push(`    Private ${comp.name} As ${comp.type}`);
  }

  lines.push('');
  lines.push('    Private Sub InitializeComponent()');

  for (const comp of components) {
    lines.push(`        Me.${comp.name} = New ${comp.type}()`);
    lines.push(`        Me.${comp.name}.Name = "${comp.name}"`);
    if (comp.text) lines.push(`        Me.${comp.name}.Text = "${comp.text}"`);
    lines.push(`        Me.${comp.name}.Left = ${comp.left}`);
    lines.push(`        Me.${comp.name}.Top = ${comp.top}`);
    lines.push(`        Me.${comp.name}.Width = ${comp.width}`);
    lines.push(`        Me.${comp.name}.Height = ${comp.height}`);
    if (comp.backColor !== 'transparent' && comp.backColor !== '#FFFFFF') {
      lines.push(`        Me.${comp.name}.BackColor = Color.FromHex("${comp.backColor}")`);
    }
    if (!comp.enabled) lines.push(`        Me.${comp.name}.Enabled = False`);
    if (!comp.visible) lines.push(`        Me.${comp.name}.Visible = False`);
    lines.push(`        Me.Controls.Add(Me.${comp.name})`);
    lines.push('');
  }

  lines.push('    End Sub');
  lines.push('');
  lines.push(`    Private Sub ${formSettings.name}_Load(sender As Object, e As EventArgs)`);

  const loadHandler = eventHandlers.find(
    (h) => h.componentName === formSettings.name && h.eventName === 'Load'
  );
  if (loadHandler?.code) {
    loadHandler.code.split('\n').forEach((l) => lines.push(`        ${l}`));
  } else {
    lines.push("        ' Form load event");
  }

  lines.push('    End Sub');

  const handledEvents = new Set<string>();

  for (const handler of eventHandlers) {
    if (handler.componentName === formSettings.name) continue;

    const key = `${handler.componentName}_${handler.eventName}`;
    if (handledEvents.has(key)) continue;
    handledEvents.add(key);

    const component = components.find(c => c.name === handler.componentName);
    if (!component) continue;

    lines.push('');
    lines.push(`    Private Sub ${handler.componentName}_${handler.eventName}(sender As Object, e As EventArgs)`);
    if (handler.code) {
      handler.code.split('\n').forEach((l) => lines.push(`        ${l}`));
    } else {
      lines.push("        ' TODO: Add your code here");
    }
    lines.push('    End Sub');
  }

  for (const comp of components) {
    const defaultEvent = getDefaultEvent(comp.type);
    const key = `${comp.name}_${defaultEvent}`;

    if (handledEvents.has(key)) continue;

    const handler = eventHandlers.find(
      (h) => h.componentName === comp.name && h.eventName === defaultEvent
    );

    lines.push('');
    lines.push(`    Private Sub ${comp.name}_${defaultEvent}(sender As Object, e As EventArgs)`);
    if (handler?.code) {
      handler.code.split('\n').forEach((l) => lines.push(`        ${l}`));
    } else {
      lines.push("        ' TODO: Add your code here");
    }
    lines.push('    End Sub');
  }

  lines.push('');
  lines.push('End Class');

  return lines.join('\n');
}

export function getDefaultEventName(type: string): string {
  return getDefaultEvent(type);
}

export function extractHandlerCode(fullCode: string, componentName: string, eventName: string): string {
  const subPattern = new RegExp(
    `Private Sub ${componentName}_${eventName}\\(.*?\\)\\s*\\n((?:.|\\n)*?)\\n\\s*End Sub`,
    'i'
  );
  const match = fullCode.match(subPattern);
  if (!match) return '';
  return match[1]
    .split('\n')
    .map((l) => l.replace(/^        /, ''))
    .join('\n')
    .trim();
}
