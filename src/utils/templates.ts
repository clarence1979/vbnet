import type { FormComponent, FormSettings, EventHandler } from '../types/component.types';
import { DEFAULT_FONT } from './defaults';

export interface ProjectExample {
  name: string;
  description: string;
  formSettings: FormSettings;
  components: FormComponent[];
  eventHandlers: EventHandler[];
}

let idCounter = 1;
function tid() { return `tmpl_${idCounter++}`; }

export const EXAMPLES: ProjectExample[] = [
  {
    name: 'Simple Calculator',
    description: 'Basic calculator with number buttons and arithmetic operations',
    formSettings: {
      name: 'Form1',
      text: 'Calculator',
      width: 320,
      height: 400,
      backColor: '#F0F0F0',
      gridSize: 10,
      snapToGrid: true,
      showGrid: true,
    },
    components: [
      { id: tid(), type: 'TextBox', name: 'txtDisplay', text: '0', left: 20, top: 20, width: 270, height: 35, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT, size: 14 }, enabled: true, visible: true, tabIndex: 0, zIndex: 1, readOnly: true },
      ...['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map((ch, i) => ({
        id: tid(),
        type: 'Button' as const,
        name: `btn${ch === '.' ? 'Dot' : ch === '=' ? 'Equals' : ch === '+' ? 'Plus' : ch === '-' ? 'Minus' : ch === '*' ? 'Multiply' : ch === '/' ? 'Divide' : ch}`,
        text: ch,
        left: 20 + (i % 4) * 67,
        top: 70 + Math.floor(i / 4) * 55,
        width: 60,
        height: 45,
        backColor: ['+','-','*','/'].includes(ch) ? '#FFA500' : ch === '=' ? '#0078D4' : '#E1E1E1',
        foreColor: ch === '=' ? '#FFFFFF' : '#000000',
        font: { ...DEFAULT_FONT, size: 12, bold: true },
        enabled: true,
        visible: true,
        tabIndex: i + 1,
        zIndex: i + 2,
      })),
      { id: tid(), type: 'Button', name: 'btnClear', text: 'C', left: 20, top: 300, width: 270, height: 40, backColor: '#D32F2F', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, size: 12, bold: true }, enabled: true, visible: true, tabIndex: 17, zIndex: 18 },
    ],
    eventHandlers: [
      ...['7','8','9','4','5','6','1','2','3','0'].map((n) => ({
        componentName: `btn${n}`,
        eventName: 'Click',
        code: `If txtDisplay.Text = "0" Then\n    txtDisplay.Text = "${n}"\nElse\n    txtDisplay.Text = txtDisplay.Text & "${n}"\nEnd If`,
      })),
      { componentName: 'btnDot', eventName: 'Click', code: 'txtDisplay.Text = txtDisplay.Text & "."' },
      ...([
        ['+', 'Plus'],
        ['-', 'Minus'],
        ['*', 'Multiply'],
        ['/', 'Divide'],
      ] as const).map(([op, name]) => ({
        componentName: `btn${name}`,
        eventName: 'Click',
        code: `txtDisplay.Text = txtDisplay.Text & " ${op} "`,
      })),
      {
        componentName: 'btnEquals',
        eventName: 'Click',
        code: `Dim expression As String = txtDisplay.Text
Dim result As Double = EvaluateExpression(expression)
txtDisplay.Text = CStr(result)`
      },
      { componentName: 'btnClear', eventName: 'Click', code: 'txtDisplay.Text = "0"' },
    ],
  },
  {
    name: 'To-Do List',
    description: 'Simple task manager with add and remove functionality',
    formSettings: {
      name: 'Form1',
      text: 'To-Do List',
      width: 400,
      height: 450,
      backColor: '#F5F5F5',
      gridSize: 10,
      snapToGrid: true,
      showGrid: true,
    },
    components: [
      { id: tid(), type: 'Label', name: 'lblTitle', text: 'My To-Do List', left: 20, top: 15, width: 200, height: 25, backColor: 'transparent', foreColor: '#0078D4', font: { ...DEFAULT_FONT, size: 14, bold: true }, enabled: true, visible: true, tabIndex: 0, zIndex: 1 },
      { id: tid(), type: 'TextBox', name: 'txtTask', text: '', left: 20, top: 50, width: 260, height: 28, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 1, zIndex: 2 },
      { id: tid(), type: 'Button', name: 'btnAdd', text: 'Add', left: 290, top: 50, width: 80, height: 28, backColor: '#0078D4', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, bold: true }, enabled: true, visible: true, tabIndex: 2, zIndex: 3 },
      { id: tid(), type: 'ListBox', name: 'lstTasks', text: '', left: 20, top: 90, width: 350, height: 270, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 3, zIndex: 4, items: [] },
      { id: tid(), type: 'Button', name: 'btnRemove', text: 'Remove Selected', left: 20, top: 370, width: 140, height: 30, backColor: '#D32F2F', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 4, zIndex: 5 },
      { id: tid(), type: 'Label', name: 'lblCount', text: 'Tasks: 0', left: 280, top: 375, width: 90, height: 20, backColor: 'transparent', foreColor: '#555555', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 5, zIndex: 6 },
    ],
    eventHandlers: [
      { componentName: 'btnAdd', eventName: 'Click', code: 'If txtTask.Text <> "" Then\n    MessageBox.Show("Task added: " & txtTask.Text)\n    txtTask.Text = ""\nEnd If' },
      { componentName: 'btnRemove', eventName: 'Click', code: 'MessageBox.Show("Remove selected task")' },
    ],
  },
  {
    name: 'Login Form',
    description: 'Simple login screen with username and password validation',
    formSettings: {
      name: 'Form1',
      text: 'Login',
      width: 380,
      height: 300,
      backColor: '#F0F0F0',
      gridSize: 10,
      snapToGrid: true,
      showGrid: true,
    },
    components: [
      { id: tid(), type: 'Label', name: 'lblTitle', text: 'Sign In', left: 130, top: 25, width: 120, height: 30, backColor: 'transparent', foreColor: '#0078D4', font: { ...DEFAULT_FONT, size: 16, bold: true }, enabled: true, visible: true, tabIndex: 0, zIndex: 1 },
      { id: tid(), type: 'Label', name: 'lblUser', text: 'Username:', left: 40, top: 80, width: 80, height: 20, backColor: 'transparent', foreColor: '#333333', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 1, zIndex: 2 },
      { id: tid(), type: 'TextBox', name: 'txtUsername', text: '', left: 130, top: 77, width: 200, height: 26, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 2, zIndex: 3 },
      { id: tid(), type: 'Label', name: 'lblPass', text: 'Password:', left: 40, top: 120, width: 80, height: 20, backColor: 'transparent', foreColor: '#333333', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 3, zIndex: 4 },
      { id: tid(), type: 'TextBox', name: 'txtPassword', text: '', left: 130, top: 117, width: 200, height: 26, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 4, zIndex: 5, passwordChar: '*' },
      { id: tid(), type: 'CheckBox', name: 'chkRemember', text: 'Remember me', left: 130, top: 155, width: 150, height: 24, backColor: 'transparent', foreColor: '#333333', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 5, zIndex: 6, checked: false },
      { id: tid(), type: 'Button', name: 'btnLogin', text: 'Login', left: 130, top: 195, width: 200, height: 35, backColor: '#0078D4', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, size: 10, bold: true }, enabled: true, visible: true, tabIndex: 6, zIndex: 7 },
      { id: tid(), type: 'Label', name: 'lblStatus', text: '', left: 40, top: 245, width: 300, height: 20, backColor: 'transparent', foreColor: '#D32F2F', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 7, zIndex: 8 },
    ],
    eventHandlers: [
      {
        componentName: 'btnLogin',
        eventName: 'Click',
        code: `If txtUsername.Text = "" Then\n    lblStatus.Text = "Please enter a username"\nElseIf txtPassword.Text = "" Then\n    lblStatus.Text = "Please enter a password"\nElse\n    MessageBox.Show("Welcome, " & txtUsername.Text & "!")\n    lblStatus.Text = ""\nEnd If`,
      },
    ],
  },
  {
    name: 'Database Example',
    description: 'Student management system demonstrating database connectivity',
    formSettings: {
      name: 'Form1',
      text: 'Student Database',
      width: 550,
      height: 500,
      backColor: '#F0F0F0',
      gridSize: 10,
      snapToGrid: true,
      showGrid: true,
    },
    components: [
      { id: tid(), type: 'Label', name: 'lblTitle', text: 'Student Management', left: 20, top: 15, width: 200, height: 25, backColor: 'transparent', foreColor: '#0078D4', font: { ...DEFAULT_FONT, size: 14, bold: true }, enabled: true, visible: true, tabIndex: 0, zIndex: 1 },
      { id: tid(), type: 'Label', name: 'lblName', text: 'Name:', left: 20, top: 55, width: 60, height: 20, backColor: 'transparent', foreColor: '#333333', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 1, zIndex: 2 },
      { id: tid(), type: 'TextBox', name: 'txtName', text: '', left: 90, top: 52, width: 150, height: 26, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 2, zIndex: 3 },
      { id: tid(), type: 'Label', name: 'lblAge', text: 'Age:', left: 260, top: 55, width: 40, height: 20, backColor: 'transparent', foreColor: '#333333', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 3, zIndex: 4 },
      { id: tid(), type: 'TextBox', name: 'txtAge', text: '', left: 310, top: 52, width: 60, height: 26, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 4, zIndex: 5 },
      { id: tid(), type: 'Label', name: 'lblGrade', text: 'Grade:', left: 390, top: 55, width: 50, height: 20, backColor: 'transparent', foreColor: '#333333', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 5, zIndex: 6 },
      { id: tid(), type: 'TextBox', name: 'txtGrade', text: '', left: 450, top: 52, width: 60, height: 26, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 6, zIndex: 7 },
      { id: tid(), type: 'Button', name: 'btnLoad', text: 'Load Students', left: 20, top: 95, width: 120, height: 30, backColor: '#0078D4', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, bold: true }, enabled: true, visible: true, tabIndex: 7, zIndex: 8 },
      { id: tid(), type: 'Button', name: 'btnAdd', text: 'Add Student', left: 150, top: 95, width: 110, height: 30, backColor: '#28A745', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, bold: true }, enabled: true, visible: true, tabIndex: 8, zIndex: 9 },
      { id: tid(), type: 'Button', name: 'btnClear', text: 'Clear', left: 270, top: 95, width: 80, height: 30, backColor: '#6C757D', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 9, zIndex: 10 },
      { id: tid(), type: 'ListBox', name: 'lstStudents', text: '', left: 20, top: 140, width: 500, height: 300, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 10, zIndex: 11, items: [] },
      { id: tid(), type: 'Label', name: 'lblStatus', text: 'Ready', left: 20, top: 455, width: 500, height: 20, backColor: 'transparent', foreColor: '#555555', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 11, zIndex: 12 },
    ],
    eventHandlers: [
      {
        componentName: 'Form1',
        eventName: 'Load',
        code: `' Database is pre-configured and ready to use\nlblStatus.Text = "Click 'Load Students' to view database records"`,
      },
      {
        componentName: 'btnLoad',
        eventName: 'Click',
        code: `Dim conn As SqlConnection = New SqlConnection("database")\nDim cmd As SqlCommand = conn.CreateCommand()\ncmd.CommandText = "SELECT * FROM students ORDER BY name"\n\nconn.Open()\nDim reader As SqlDataReader = cmd.ExecuteReader()\n\nlstStudents.Items.Clear()\nDim count As Integer = 0\n\nWhile reader.Read()\n    Dim name As String = reader.GetString("name")\n    Dim age As Integer = reader.GetInt32("age")\n    Dim grade As String = reader.GetString("grade")\n    lstStudents.Items.Add(name & " - Age: " & CStr(age) & ", Grade: " & grade)\n    count = count + 1\nWend\n\nreader.Close()\nconn.Close()\n\nlblStatus.Text = "Loaded " & CStr(count) & " students from database"`,
      },
      {
        componentName: 'btnAdd',
        eventName: 'Click',
        code: `If txtName.Text = "" Then\n    MessageBox.Show("Please enter a name")\nElseIf txtAge.Text = "" Then\n    MessageBox.Show("Please enter an age")\nElseIf txtGrade.Text = "" Then\n    MessageBox.Show("Please enter a grade")\nElse\n    Dim conn As SqlConnection = New SqlConnection("database")\n    Dim cmd As SqlCommand = conn.CreateCommand()\n    cmd.CommandText = "INSERT INTO students (name, age, grade) VALUES (@name, @age, @grade)"\n    cmd.Parameters.Add("@name", txtName.Text)\n    cmd.Parameters.Add("@age", CInt(txtAge.Text))\n    cmd.Parameters.Add("@grade", txtGrade.Text)\n    \n    conn.Open()\n    cmd.ExecuteNonQuery()\n    conn.Close()\n    \n    MessageBox.Show("Student added successfully!")\n    txtName.Text = ""\n    txtAge.Text = ""\n    txtGrade.Text = ""\n    lblStatus.Text = "Student added - Click 'Load Students' to refresh"\nEnd If`,
      },
      {
        componentName: 'btnClear',
        eventName: 'Click',
        code: `txtName.Text = ""\ntxtAge.Text = ""\ntxtGrade.Text = ""\nlstStudents.Items.Clear()\nlblStatus.Text = "Cleared"`,
      },
    ],
  },
  {
    name: 'CSV File Manager',
    description: 'Manage a 1D CSV file with add, delete, modify, search, and sort operations',
    formSettings: {
      name: 'Form1',
      text: 'CSV File Manager',
      width: 520,
      height: 550,
      backColor: '#F5F5F5',
      gridSize: 10,
      snapToGrid: true,
      showGrid: true,
    },
    components: [
      { id: tid(), type: 'Label', name: 'lblTitle', text: 'Names Manager (CSV)', left: 20, top: 15, width: 220, height: 25, backColor: 'transparent', foreColor: '#0078D4', font: { ...DEFAULT_FONT, size: 14, bold: true }, enabled: true, visible: true, tabIndex: 0, zIndex: 1 },
      { id: tid(), type: 'Label', name: 'lblFile', text: 'File: names.csv', left: 350, top: 20, width: 150, height: 20, backColor: 'transparent', foreColor: '#666666', font: { ...DEFAULT_FONT, size: 9 }, enabled: true, visible: true, tabIndex: 1, zIndex: 2 },

      { id: tid(), type: 'Label', name: 'lblName', text: 'Name:', left: 20, top: 55, width: 50, height: 20, backColor: 'transparent', foreColor: '#333333', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 2, zIndex: 3 },
      { id: tid(), type: 'TextBox', name: 'txtName', text: '', left: 80, top: 52, width: 250, height: 26, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 3, zIndex: 4 },

      { id: tid(), type: 'Button', name: 'btnAdd', text: 'Add', left: 340, top: 50, width: 70, height: 30, backColor: '#28A745', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, bold: true }, enabled: true, visible: true, tabIndex: 4, zIndex: 5 },
      { id: tid(), type: 'Button', name: 'btnModify', text: 'Modify', left: 420, top: 50, width: 70, height: 30, backColor: '#FFA500', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, bold: true }, enabled: true, visible: true, tabIndex: 5, zIndex: 6 },

      { id: tid(), type: 'Label', name: 'lblSearch', text: 'Search:', left: 20, top: 95, width: 60, height: 20, backColor: 'transparent', foreColor: '#333333', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 6, zIndex: 7 },
      { id: tid(), type: 'TextBox', name: 'txtSearch', text: '', left: 80, top: 92, width: 250, height: 26, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 7, zIndex: 8 },
      { id: tid(), type: 'Button', name: 'btnSearch', text: 'Search', left: 340, top: 90, width: 70, height: 30, backColor: '#0078D4', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, bold: true }, enabled: true, visible: true, tabIndex: 8, zIndex: 9 },
      { id: tid(), type: 'Button', name: 'btnShowAll', text: 'Show All', left: 420, top: 90, width: 70, height: 30, backColor: '#6C757D', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 9, zIndex: 10 },

      { id: tid(), type: 'ListBox', name: 'lstNames', text: '', left: 20, top: 135, width: 470, height: 280, backColor: '#FFFFFF', foreColor: '#000000', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 10, zIndex: 11, items: [] },

      { id: tid(), type: 'Button', name: 'btnDelete', text: 'Delete Selected', left: 20, top: 430, width: 120, height: 32, backColor: '#D32F2F', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, bold: true }, enabled: true, visible: true, tabIndex: 11, zIndex: 12 },
      { id: tid(), type: 'Button', name: 'btnSort', text: 'Sort A-Z', left: 150, top: 430, width: 100, height: 32, backColor: '#9C27B0', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, bold: true }, enabled: true, visible: true, tabIndex: 12, zIndex: 13 },
      { id: tid(), type: 'Button', name: 'btnLoad', text: 'Load CSV', left: 260, top: 430, width: 100, height: 32, backColor: '#0078D4', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, bold: true }, enabled: true, visible: true, tabIndex: 13, zIndex: 14 },
      { id: tid(), type: 'Button', name: 'btnSave', text: 'Save CSV', left: 370, top: 430, width: 120, height: 32, backColor: '#28A745', foreColor: '#FFFFFF', font: { ...DEFAULT_FONT, bold: true }, enabled: true, visible: true, tabIndex: 14, zIndex: 15 },

      { id: tid(), type: 'Label', name: 'lblStatus', text: 'Ready', left: 20, top: 475, width: 470, height: 20, backColor: 'transparent', foreColor: '#555555', font: { ...DEFAULT_FONT }, enabled: true, visible: true, tabIndex: 15, zIndex: 16 },
      { id: tid(), type: 'Label', name: 'lblCount', text: 'Items: 0', left: 20, top: 500, width: 150, height: 20, backColor: 'transparent', foreColor: '#555555', font: { ...DEFAULT_FONT, size: 9 }, enabled: true, visible: true, tabIndex: 16, zIndex: 17 },
    ],
    eventHandlers: [
      {
        componentName: 'Form1',
        eventName: 'Load',
        code: `' Initialize with sample data\nlstNames.Items.Clear()\nlstNames.Items.Add("Alice")\nlstNames.Items.Add("Bob")\nlstNames.Items.Add("Charlie")\nlstNames.Items.Add("Diana")\nlstNames.Items.Add("Eve")\nlblCount.Text = "Items: " & CStr(lstNames.Items.Count)\nlblStatus.Text = "Sample data loaded - Ready to manage CSV"`,
      },
      {
        componentName: 'btnAdd',
        eventName: 'Click',
        code: `If txtName.Text = "" Then\n    MessageBox.Show("Please enter a name")\nElse\n    ' Check if name already exists\n    Dim found As Boolean = False\n    Dim i As Integer = 0\n    While i < lstNames.Items.Count\n        If lstNames.Items(i) = txtName.Text Then\n            found = True\n        End If\n        i = i + 1\n    Wend\n    \n    If found Then\n        MessageBox.Show("Name already exists!")\n    Else\n        lstNames.Items.Add(txtName.Text)\n        txtName.Text = ""\n        lblCount.Text = "Items: " & CStr(lstNames.Items.Count)\n        lblStatus.Text = "Name added successfully"\n    End If\nEnd If`,
      },
      {
        componentName: 'btnModify',
        eventName: 'Click',
        code: `If lstNames.SelectedIndex < 0 Then\n    MessageBox.Show("Please select a name to modify")\nElseIf txtName.Text = "" Then\n    MessageBox.Show("Please enter the new name")\nElse\n    Dim oldName As String = lstNames.SelectedItem\n    lstNames.Items(lstNames.SelectedIndex) = txtName.Text\n    txtName.Text = ""\n    lblStatus.Text = "Modified: " & oldName & " -> " & lstNames.Items(lstNames.SelectedIndex)\nEnd If`,
      },
      {
        componentName: 'btnDelete',
        eventName: 'Click',
        code: `If lstNames.SelectedIndex < 0 Then\n    MessageBox.Show("Please select a name to delete")\nElse\n    Dim name As String = lstNames.SelectedItem\n    lstNames.Items.RemoveAt(lstNames.SelectedIndex)\n    lblCount.Text = "Items: " & CStr(lstNames.Items.Count)\n    lblStatus.Text = "Deleted: " & name\nEnd If`,
      },
      {
        componentName: 'btnSearch',
        eventName: 'Click',
        code: `If txtSearch.Text = "" Then\n    MessageBox.Show("Please enter a search term")\nElse\n    Dim found As Boolean = False\n    Dim i As Integer = 0\n    While i < lstNames.Items.Count\n        If InStr(LCase(lstNames.Items(i)), LCase(txtSearch.Text)) > 0 Then\n            lstNames.SelectedIndex = i\n            found = True\n            lblStatus.Text = "Found: " & lstNames.Items(i)\n        End If\n        i = i + 1\n    Wend\n    \n    If Not found Then\n        MessageBox.Show("Name not found")\n        lblStatus.Text = "Search completed - No matches"\n    End If\nEnd If`,
      },
      {
        componentName: 'btnShowAll',
        eventName: 'Click',
        code: `txtSearch.Text = ""\nlstNames.SelectedIndex = -1\nlblStatus.Text = "Showing all items"`,
      },
      {
        componentName: 'btnSort',
        eventName: 'Click',
        code: `' Simple bubble sort algorithm\nDim i As Integer = 0\nDim j As Integer = 0\nDim temp As String = ""\n\nWhile i < lstNames.Items.Count - 1\n    j = i + 1\n    While j < lstNames.Items.Count\n        If lstNames.Items(i) > lstNames.Items(j) Then\n            temp = lstNames.Items(i)\n            lstNames.Items(i) = lstNames.Items(j)\n            lstNames.Items(j) = temp\n        End If\n        j = j + 1\n    Wend\n    i = i + 1\nWend\n\nlblStatus.Text = "Names sorted alphabetically"`,
      },
      {
        componentName: 'btnLoad',
        eventName: 'Click',
        code: `' Load data from CSV file\nDim csvContent As String = File.ReadAllText("names", "csv")\nIf csvContent <> "" Then\n    lstNames.Items.Clear()\n    Dim lines() As String = Split(csvContent, vbCrLf)\n    Dim i As Integer = 0\n    While i < UBound(lines) + 1\n        If lines(i) <> "" Then\n            lstNames.Items.Add(lines(i))\n        End If\n        i = i + 1\n    Wend\n    lblCount.Text = "Items: " & CStr(lstNames.Items.Count)\n    lblStatus.Text = "CSV file loaded from Solution Explorer"\nElse\n    MessageBox.Show("CSV file not found or empty")\n    lblStatus.Text = "No CSV file found"\nEnd If`,
      },
      {
        componentName: 'btnSave',
        eventName: 'Click',
        code: `' Save data to CSV file\nDim csvData As String = ""\nDim i As Integer = 0\nWhile i < lstNames.Items.Count\n    csvData = csvData & lstNames.Items(i)\n    If i < lstNames.Items.Count - 1 Then\n        csvData = csvData & vbCrLf\n    End If\n    i = i + 1\nWend\n\n' Write to CSV file in Solution Explorer\nFile.WriteAllText("names", csvData, "csv")\nMessageBox.Show("CSV saved with " & CStr(lstNames.Items.Count) & " items")\nlblStatus.Text = "CSV file saved to Solution Explorer"`,
      },
      {
        componentName: 'lstNames',
        eventName: 'Click',
        code: `If lstNames.SelectedIndex >= 0 Then\n    txtName.Text = lstNames.SelectedItem\n    lblStatus.Text = "Selected: " & lstNames.SelectedItem\nEnd If`,
      },
    ],
  },
];
