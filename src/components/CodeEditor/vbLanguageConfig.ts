import type { Monaco } from '@monaco-editor/react';
import type { FormComponent } from '../../types/component.types';
import { getAvailableEvents } from '../../utils/eventDefinitions';

let registered = false;
let completionProviderDisposable: any = null;

export function registerVBLanguage(monaco: Monaco, components?: FormComponent[]) {
  if (!registered) {
    registered = true;
    setupLanguageConfiguration(monaco);
  }

  if (components) {
    setupCompletionProvider(monaco, components);
  }
}

function setupLanguageConfiguration(monaco: Monaco) {
  monaco.languages.setLanguageConfiguration('vb', {
    indentationRules: {
      increaseIndentPattern: /^\s*(Public |Private |Protected )?(Sub|Function|Class|Module|Structure|Enum|Namespace|Interface|Property|If|ElseIf|Else|For|While|Do|Select|Case|Try|Catch|Finally|With|Using|SyncLock|Get|Set)\b/i,
      decreaseIndentPattern: /^\s*(End (Sub|Function|Class|Module|Structure|Enum|Namespace|Interface|Property|If|Select|Try|With|Using|SyncLock|Get|Set)|Next|Wend|Loop|Else|ElseIf|Catch|Finally|Case)\b/i,
    },
    onEnterRules: [
      {
        beforeText: /^\s*(Public |Private |Protected )?(Sub|Function)\b.*\)\s*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*(Public |Private |Protected )?(Class|Module|Structure|Enum|Namespace|Interface)\b.*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*If\b.*\bThen\s*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*ElseIf\b.*\bThen\s*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*Else\s*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*For\b.*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*While\b.*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*Do\b.*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*Select\s+Case\b.*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*Case\b.*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*Try\s*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*Catch\b.*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*Finally\s*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*With\b.*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*(Public |Private |Protected )?(Property)\b.*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*(Get|Set)\s*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*Private\s+Sub\s+InitializeComponent\(\)\s*$/i,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
    ],
    brackets: [
      ['(', ')'],
      ['[', ']'],
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
    ],
    folding: {
      markers: {
        start: /^\s*#Region\b/i,
        end: /^\s*#End\s+Region\b/i,
      },
    },
    wordPattern: /(-?\d*\.\d\w*)|([^\s\`\~\!\@\#\$\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/,
  });
}

function setupCompletionProvider(monaco: Monaco, components: FormComponent[]) {
  if (completionProviderDisposable) {
    completionProviderDisposable.dispose();
  }

  completionProviderDisposable = monaco.languages.registerCompletionItemProvider('vb', {
    triggerCharacters: ['.'],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);

      const suggestions: any[] = [];

      const vbKeywords = [
        { label: 'Dim', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Dim ${1:variable} As ${2:Type}', detail: 'Declare a variable', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'If', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'If ${1:condition} Then\n    ${0}\nEnd If', detail: 'If statement', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'For', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'For ${1:i} = ${2:0} To ${3:10}\n    ${0}\nNext', detail: 'For loop', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'While', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'While ${1:condition}\n    ${0}\nEnd While', detail: 'While loop', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'Select Case', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Select Case ${1:variable}\n    Case ${2:value}\n        ${0}\n    Case Else\n        \nEnd Select', detail: 'Select statement', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'Try', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Try\n    ${0}\nCatch ex As Exception\n    MessageBox.Show(ex.Message)\nEnd Try', detail: 'Try-Catch block', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'Function', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Private Function ${1:FunctionName}(${2:params}) As ${3:Type}\n    ${0}\nEnd Function', detail: 'Function declaration', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'Sub', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Private Sub ${1:SubName}(${2:params})\n    ${0}\nEnd Sub', detail: 'Subroutine declaration', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'Public', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Public ' },
        { label: 'Private', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Private ' },
        { label: 'Protected', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Protected ' },
        { label: 'Friend', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Friend ' },
        { label: 'Shared', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Shared ' },
        { label: 'Const', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Const ' },
        { label: 'And', kind: monaco.languages.CompletionItemKind.Operator, insertText: 'And ' },
        { label: 'Or', kind: monaco.languages.CompletionItemKind.Operator, insertText: 'Or ' },
        { label: 'Not', kind: monaco.languages.CompletionItemKind.Operator, insertText: 'Not ' },
        { label: 'AndAlso', kind: monaco.languages.CompletionItemKind.Operator, insertText: 'AndAlso ' },
        { label: 'OrElse', kind: monaco.languages.CompletionItemKind.Operator, insertText: 'OrElse ' },
        { label: 'Mod', kind: monaco.languages.CompletionItemKind.Operator, insertText: 'Mod ' },
        { label: 'Is', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Is ' },
        { label: 'IsNot', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'IsNot ' },
        { label: 'True', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'True' },
        { label: 'False', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'False' },
        { label: 'Nothing', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Nothing' },
        { label: 'Me', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Me', detail: 'Reference to current form' },
        { label: 'MyBase', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'MyBase' },
        { label: 'Return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Return ${0}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'Exit Sub', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Exit Sub' },
        { label: 'Exit Function', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Exit Function' },
      ];

      suggestions.push(...vbKeywords.map(kw => ({ ...kw, range })));

      const commonTypes = [
        'String', 'Integer', 'Long', 'Double', 'Decimal', 'Boolean', 'Date', 'DateTime',
        'Object', 'Byte', 'Short', 'Single', 'Char', 'List', 'Dictionary', 'Array'
      ];
      suggestions.push(...commonTypes.map(type => ({
        label: type,
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: type,
        range,
      })));

      const commonMethods = [
        { label: 'MessageBox.Show', insertText: 'MessageBox.Show("${1:message}", "${2:title}")', detail: 'Display a message box', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'MsgBox', insertText: 'MsgBox("${1:message}")', detail: 'Display a message box', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'Console.WriteLine', insertText: 'Console.WriteLine(${0})', detail: 'Write to console', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'ToString', insertText: 'ToString()', detail: 'Convert to string' },
        { label: 'Parse', insertText: 'Parse(${0})', detail: 'Parse value', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'TryParse', insertText: 'TryParse(${1:value}, ${2:result})', detail: 'Try parse value', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'String.IsNullOrEmpty', insertText: 'String.IsNullOrEmpty(${0})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'String.Format', insertText: 'String.Format("${1:format}", ${0})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'CType', insertText: 'CType(${1:value}, ${2:Type})', detail: 'Type conversion', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'DirectCast', insertText: 'DirectCast(${1:value}, ${2:Type})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
      ];
      suggestions.push(...commonMethods.map(method => ({
        ...method,
        kind: monaco.languages.CompletionItemKind.Method,
        range,
      })));

      // Suggest control names (case-insensitive matching)
      const currentWord = word.word.toLowerCase();
      components.forEach(comp => {
        if (comp.name.toLowerCase().startsWith(currentWord) && !textBeforeCursor.match(/\w+\.$/i)) {
          suggestions.push({
            label: comp.name,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: comp.name,
            detail: `${comp.type} control`,
            sortText: '0' + comp.name,
            range,
          });
        }
      });

      // Handle Me.ControlName suggestions
      if (textBeforeCursor.match(/\bMe\.\s*$/i)) {
        components.forEach(comp => {
          suggestions.push({
            label: comp.name,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: comp.name,
            detail: `${comp.type} control`,
            range,
          });
        });
      }

      // Handle ControlName. property suggestions with auto-capitalization
      const dotMatch = textBeforeCursor.match(/(\w+)\.\s*$/i);
      if (dotMatch) {
        const typedName = dotMatch[1];
        const component = components.find(c => c.name.toLowerCase() === typedName.toLowerCase());

        if (component) {
          // If capitalization is wrong, add correction suggestion
          if (component.name !== typedName) {
            const startCol = position.column - typedName.length - 1;
            const replaceRange = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: startCol,
              endColumn: position.column,
            };

            suggestions.push({
              label: `⚡ ${component.name}. (fix capitalization)`,
              kind: monaco.languages.CompletionItemKind.Text,
              insertText: component.name + '.',
              detail: `Auto-correct ${typedName} → ${component.name}`,
              sortText: '!0',
              preselect: true,
              range: replaceRange,
            });
          }

          // Add property suggestions
          const properties = getControlProperties(component.type);
          properties.forEach(prop => {
            suggestions.push({
              label: prop.name,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: prop.name,
              detail: prop.detail,
              documentation: prop.documentation,
              range,
            });
          });

          // Add event handler suggestions
          const events = getAvailableEvents(component.type);
          events.forEach(event => {
            suggestions.push({
              label: `${component.name}_${event.name}`,
              kind: monaco.languages.CompletionItemKind.Event,
              insertText: `${component.name}_${event.name}`,
              detail: event.description,
              range,
            });
          });
        }
      }

      return { suggestions };
    },
  });
}

function getControlProperties(type: string): Array<{ name: string; detail: string; documentation?: string }> {
  const commonProps = [
    { name: 'Text', detail: 'The text displayed on the control', documentation: 'Gets or sets the text associated with this control.' },
    { name: 'Enabled', detail: 'Whether control is enabled', documentation: 'Gets or sets a value indicating whether the control can respond to user interaction.' },
    { name: 'Visible', detail: 'Whether control is visible', documentation: 'Gets or sets a value indicating whether the control is displayed.' },
    { name: 'BackColor', detail: 'Background color', documentation: 'Gets or sets the background color for the control.' },
    { name: 'ForeColor', detail: 'Foreground color', documentation: 'Gets or sets the foreground color of the control.' },
    { name: 'Font', detail: 'Font of the text', documentation: 'Gets or sets the font of the text displayed by the control.' },
    { name: 'Width', detail: 'Width of control', documentation: 'Gets or sets the width of the control.' },
    { name: 'Height', detail: 'Height of control', documentation: 'Gets or sets the height of the control.' },
    { name: 'Left', detail: 'Left position', documentation: 'Gets or sets the distance from the left edge of its container.' },
    { name: 'Top', detail: 'Top position', documentation: 'Gets or sets the distance from the top edge of its container.' },
    { name: 'Location', detail: 'Location of control', documentation: 'Gets or sets the coordinates of the upper-left corner of the control.' },
    { name: 'Size', detail: 'Size of control', documentation: 'Gets or sets the size of the control.' },
    { name: 'Name', detail: 'Name of control', documentation: 'Gets or sets the name of the control.' },
    { name: 'TabIndex', detail: 'Tab order', documentation: 'Gets or sets the tab order of the control within its container.' },
    { name: 'Focus', detail: 'Set focus to control', documentation: 'Sets input focus to the control.' },
  ];

  const typeSpecificProps: Record<string, Array<{ name: string; detail: string; documentation?: string }>> = {
    TextBox: [
      { name: 'MaxLength', detail: 'Maximum text length' },
      { name: 'Multiline', detail: 'Allow multiple lines' },
      { name: 'ReadOnly', detail: 'Read-only mode' },
      { name: 'PasswordChar', detail: 'Password character' },
      { name: 'Clear', detail: 'Clear the text' },
      { name: 'SelectAll', detail: 'Select all text' },
    ],
    Button: [
      { name: 'PerformClick', detail: 'Simulate a click' },
    ],
    CheckBox: [
      { name: 'Checked', detail: 'Checked state' },
      { name: 'CheckState', detail: 'Check state value' },
    ],
    ComboBox: [
      { name: 'Items', detail: 'Item collection' },
      { name: 'SelectedIndex', detail: 'Selected item index' },
      { name: 'SelectedItem', detail: 'Selected item' },
      { name: 'SelectedText', detail: 'Selected text' },
      { name: 'DropDownStyle', detail: 'Dropdown style' },
    ],
    ListBox: [
      { name: 'Items', detail: 'Item collection' },
      { name: 'SelectedIndex', detail: 'Selected item index' },
      { name: 'SelectedItem', detail: 'Selected item' },
      { name: 'SelectionMode', detail: 'Selection mode' },
    ],
    Timer: [
      { name: 'Interval', detail: 'Timer interval in milliseconds' },
      { name: 'Start', detail: 'Start the timer' },
      { name: 'Stop', detail: 'Stop the timer' },
    ],
    ProgressBar: [
      { name: 'Value', detail: 'Current value' },
      { name: 'Minimum', detail: 'Minimum value' },
      { name: 'Maximum', detail: 'Maximum value' },
    ],
    TrackBar: [
      { name: 'Value', detail: 'Current value' },
      { name: 'Minimum', detail: 'Minimum value' },
      { name: 'Maximum', detail: 'Maximum value' },
    ],
  };

  return [...commonProps, ...(typeSpecificProps[type] || [])];
}
