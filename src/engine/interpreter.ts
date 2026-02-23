import type { ASTNode, ExpressionNode } from './parser';
import { tokenize } from './tokenizer';
import { Parser } from './parser';
import { SqlConnection, SqlCommand, DataTable, SqlDataAdapter } from './database';

export interface RuntimeComponent {
  name: string;
  type: string;
  props: Record<string, unknown>;
  element?: HTMLElement;
}

export interface RuntimeContext {
  components: Map<string, RuntimeComponent>;
  variables: Map<string, unknown>;
  eventHandlers: Map<string, ASTNode[]>;
  consoleOutput: string[];
  onPropertyChange: (name: string, prop: string, value: unknown) => void;
  onConsoleLog: (msg: string) => void;
  onConsoleWrite: (msg: string) => void;
  onError: (msg: string, line?: number) => void;
  onMessageBox: (msg: string) => Promise<void>;
  onInputBox: (prompt: string, title?: string, defaultValue?: string) => Promise<string>;
  onConsoleReadLine: () => Promise<string>;
  onConsoleReadKey: () => Promise<string>;
  onFileWriteAllText: (name: string, content: string, extension: string) => void;
  onFileReadAllText: (name: string, extension: string) => string;
  paused: boolean;
  stopped: boolean;
}

export class VBInterpreter {
  private ctx: RuntimeContext;
  private callStack: string[] = [];

  constructor(ctx: RuntimeContext) {
    this.ctx = ctx;
  }

  async parseAndExecute(code: string) {
    try {
      const tokens = tokenize(code);
      const parser = new Parser(tokens);
      const stmts = parser.parseSubBody();
      await this.executeBlock(stmts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.ctx.onError(msg);
    }
  }

  async executeBlock(stmts: ASTNode[]) {
    for (const stmt of stmts) {
      if (this.ctx.stopped || this.ctx.paused) return;
      await this.executeStatement(stmt);
    }
  }

  async executeStatement(node: ASTNode) {
    if (this.ctx.stopped) return;

    switch (node.kind) {
      case 'dim':
        await this.executeDim(node);
        break;
      case 'assignment':
        await this.executeAssignment(node);
        break;
      case 'call':
        await this.executeCall(node);
        break;
      case 'if':
        await this.executeIf(node);
        break;
      case 'for':
        await this.executeFor(node);
        break;
      case 'while':
        await this.executeWhile(node);
        break;
      case 'doloop':
        await this.executeDoLoop(node);
        break;
      default:
        break;
    }
  }

  private async executeDim(node: ASTNode & { kind: 'dim' }) {
    let value: unknown = '';
    if (node.initialValue) {
      value = await this.evaluateExpression(node.initialValue);
    } else {
      switch (node.typeName.toLowerCase()) {
        case 'integer':
        case 'long':
        case 'double':
        case 'single':
          value = 0;
          break;
        case 'boolean':
          value = false;
          break;
        case 'sqlconnection':
        case 'sqlcommand':
        case 'datatable':
        case 'sqldatareader':
        case 'sqldataadapter':
          value = null;
          break;
        default:
          value = '';
      }
    }
    this.ctx.variables.set(node.name, value);
  }

  private async executeAssignment(node: ASTNode & { kind: 'assignment' }) {
    const value = await this.evaluateExpression(node.value);
    this.assignToTarget(node.target, value);
  }

  private assignToTarget(target: ExpressionNode, value: unknown) {
    if (target.kind === 'identifier') {
      if (this.ctx.components.has(target.name)) return;
      this.ctx.variables.set(target.name, value);
      return;
    }

    if (target.kind === 'member') {
      if (target.object.kind === 'identifier') {
        const obj = this.ctx.variables.get(target.object.name);

        if (obj instanceof SqlCommand) {
          const prop = target.property.toLowerCase();
          if (prop === 'commandtext') {
            obj.setCommandText(String(value));
            return;
          }
        }

        if (obj && typeof obj === 'object' && obj !== null) {
          (obj as Record<string, unknown>)[target.property] = value;
          return;
        }
      }

      const objName = this.resolveComponentName(target.object);
      if (objName && this.ctx.components.has(objName)) {
        const comp = this.ctx.components.get(objName)!;
        const prop = target.property.toLowerCase();
        const propMap: Record<string, string> = {
          text: 'text',
          value: 'value',
          enabled: 'enabled',
          visible: 'visible',
          checked: 'checked',
          backcolor: 'backColor',
          forecolor: 'foreColor',
          left: 'left',
          top: 'top',
          width: 'width',
          height: 'height',
          selectedindex: 'selectedIndex',
          maximum: 'maximum',
          minimum: 'minimum',
          interval: 'interval',
        };
        const mappedProp = propMap[prop] || target.property;
        comp.props[mappedProp] = value;
        this.ctx.onPropertyChange(objName, mappedProp, value);
        return;
      }
    }
  }

  private async executeCall(node: ASTNode & { kind: 'call' }) {
    const args: unknown[] = [];
    for (const a of node.args) {
      args.push(await this.evaluateExpression(a));
    }
    await this.callFunction(node.target, args);
  }

  private async callFunction(target: ExpressionNode, args: unknown[]): Promise<unknown> {
    if (target.kind === 'member') {
      if (target.object.kind === 'member') {
        const parentObj = await this.evaluateExpression(target.object);
        if (parentObj && typeof parentObj === 'object' && (parentObj as any)._isParameters) {
          const method = target.property.toLowerCase();
          if (method === 'add' || method === 'addwithvalue') {
            const name = String(args[0]);
            const value = args[1];
            (parentObj as any).Add(name, value);
            return undefined;
          }
        }
      }

      const objName = this.resolveComponentName(target.object);

      if (target.object.kind === 'identifier') {
        const obj = this.ctx.variables.get(target.object.name);

        if (obj && typeof obj === 'object' && (obj as any)._isParameters) {
          const method = target.property.toLowerCase();
          if (method === 'add' || method === 'addwithvalue') {
            const name = String(args[0]);
            const value = args[1];
            (obj as any).Add(name, value);
            return undefined;
          }
        }

        if (obj instanceof SqlConnection) {
          const method = target.property.toLowerCase();
          if (method === 'open') {
            await obj.open();
            return undefined;
          }
          if (method === 'close') {
            obj.close();
            return undefined;
          }
          if (method === 'createcommand') {
            return obj.createCommand();
          }
        }

        if (obj instanceof SqlCommand) {
          const method = target.property.toLowerCase();
          if (method === 'executereader') {
            return await obj.executeReader();
          }
          if (method === 'executenonquery') {
            return await obj.executeNonQuery();
          }
          if (method === 'executescalar') {
            return await obj.executeScalar();
          }
        }

        if (obj && typeof obj === 'object' && 'read' in obj) {
          const method = target.property.toLowerCase();
          if (method === 'read') {
            return await (obj as any).read();
          }
          if (method === 'close') {
            (obj as any).close();
            return undefined;
          }
          if (method === 'getstring') {
            return (obj as any).getString(String(args[0]));
          }
          if (method === 'getint32') {
            return (obj as any).getInt32(String(args[0]));
          }
          if (method === 'getvalue') {
            return (obj as any).getValue(String(args[0]));
          }
        }

        if (obj instanceof DataTable) {
          const method = target.property.toLowerCase();
          if (method === 'clear') {
            obj.clear();
            return undefined;
          }
        }

        if (obj instanceof SqlDataAdapter) {
          const method = target.property.toLowerCase();
          if (method === 'fill') {
            const dt = args[0] as DataTable;
            return await obj.fill(dt);
          }
        }
      }

      if (objName === 'MessageBox' && target.property === 'Show') {
        const msg = args.map(String).join('');
        await this.ctx.onMessageBox(msg);
        return undefined;
      }

      if (objName === 'Console' && target.property === 'WriteLine') {
        const msg = args.map(String).join('');
        this.ctx.consoleOutput.push(msg);
        this.ctx.onConsoleLog(msg);
        return undefined;
      }

      if (objName === 'Console' && target.property === 'Write') {
        const msg = args.map(String).join('');
        this.ctx.onConsoleWrite(msg);
        return undefined;
      }

      if (objName === 'Console' && target.property === 'ReadLine') {
        return await this.ctx.onConsoleReadLine();
      }

      if (objName === 'Console' && target.property === 'ReadKey') {
        const result = await this.ctx.onConsoleReadKey();
        return result;
      }

      if (objName === 'File' && target.property === 'WriteAllText') {
        const name = String(args[0] ?? '');
        const content = String(args[1] ?? '');
        const extension = String(args[2] ?? 'txt');
        this.ctx.onFileWriteAllText(name, content, extension);
        return undefined;
      }

      if (objName === 'File' && target.property === 'ReadAllText') {
        const name = String(args[0] ?? '');
        const extension = String(args[1] ?? 'txt');
        return this.ctx.onFileReadAllText(name, extension);
      }

      if (objName && this.ctx.components.has(objName)) {
        const comp = this.ctx.components.get(objName)!;
        const method = target.property.toLowerCase();
        if (method === 'clear' && comp.type === 'ListBox') {
          comp.props['items'] = [];
          this.ctx.onPropertyChange(objName, 'items', []);
          return undefined;
        }
        if (method === 'focus') {
          comp.element?.focus();
          return undefined;
        }
      }

      const obj = await this.evaluateExpression(target.object);
      if (typeof obj === 'string') {
        return this.callStringMethod(obj, target.property, args);
      }
    }

    if (target.kind === 'identifier') {
      const name = target.name;
      const lower = name.toLowerCase();

      if (lower === 'sqlconnection') {
        const connectionString = String(args[0] ?? '');
        return new SqlConnection(connectionString);
      }

      if (lower === 'sqlcommand') {
        if (args.length === 2) {
          const sql = String(args[0]);
          const conn = args[1] as SqlConnection;
          const cmd = conn.createCommand();
          cmd.setCommandText(sql);
          return cmd;
        }
        return new SqlCommand('');
      }

      if (lower === 'datatable') {
        return new DataTable();
      }

      if (lower === 'sqldataadapter') {
        const cmd = args[0] as SqlCommand;
        return new SqlDataAdapter(cmd);
      }

      if (lower === 'msgbox') {
        await this.ctx.onMessageBox(String(args[0] ?? ''));
        return undefined;
      }

      if (lower === 'cint' || lower === 'cstr' || lower === 'cdbl' || lower === 'val') {
        return this.convertType(lower, args[0]);
      }

      if (lower === 'inputbox') {
        const prompt = String(args[0] ?? '');
        const title = args[1] !== undefined ? String(args[1]) : undefined;
        const defaultVal = args[2] !== undefined ? String(args[2]) : undefined;
        return await this.ctx.onInputBox(prompt, title, defaultVal);
      }

      if (lower === 'len') return String(args[0] ?? '').length;
      if (lower === 'mid') {
        const s = String(args[0] ?? '');
        const start = Number(args[1] ?? 1) - 1;
        const length = args[2] !== undefined ? Number(args[2]) : undefined;
        return s.substring(start, length !== undefined ? start + length : undefined);
      }
      if (lower === 'left') return String(args[0] ?? '').substring(0, Number(args[1] ?? 0));
      if (lower === 'right') {
        const s = String(args[0] ?? '');
        return s.substring(s.length - Number(args[1] ?? 0));
      }
      if (lower === 'ucase') return String(args[0] ?? '').toUpperCase();
      if (lower === 'lcase') return String(args[0] ?? '').toLowerCase();
      if (lower === 'trim') return String(args[0] ?? '').trim();
      if (lower === 'str') return String(args[0] ?? '');
      if (lower === 'abs') return Math.abs(Number(args[0] ?? 0));
      if (lower === 'int') return Math.floor(Number(args[0] ?? 0));
      if (lower === 'rnd') return Math.random();
      if (lower === 'sqr') return Math.sqrt(Number(args[0] ?? 0));
      if (lower === 'evaluateexpression') {
        return this.evaluateMathExpression(String(args[0] ?? ''));
      }

      const handlerKey = name;
      if (this.ctx.eventHandlers.has(handlerKey)) {
        if (this.callStack.includes(handlerKey)) return undefined;
        this.callStack.push(handlerKey);
        const body = this.ctx.eventHandlers.get(handlerKey)!;
        await this.executeBlock(body);
        this.callStack.pop();
        return undefined;
      }
    }

    return undefined;
  }

  private callStringMethod(str: string, method: string, args: unknown[]): unknown {
    switch (method.toLowerCase()) {
      case 'length': return str.length;
      case 'toupper': return str.toUpperCase();
      case 'tolower': return str.toLowerCase();
      case 'trim': return str.trim();
      case 'substring': {
        const start = Number(args[0] ?? 0);
        const len = args[1] !== undefined ? Number(args[1]) : undefined;
        return len !== undefined ? str.substring(start, start + len) : str.substring(start);
      }
      case 'contains': return str.includes(String(args[0] ?? ''));
      case 'indexof': return str.indexOf(String(args[0] ?? ''));
      case 'replace': return str.replace(String(args[0] ?? ''), String(args[1] ?? ''));
      case 'split': return str.split(String(args[0] ?? ','));
      case 'startswith': return str.startsWith(String(args[0] ?? ''));
      case 'endswith': return str.endsWith(String(args[0] ?? ''));
      default: return str;
    }
  }

  private convertType(func: string, value: unknown): unknown {
    switch (func) {
      case 'cint': return Math.floor(Number(value) || 0);
      case 'cdbl': return Number(value) || 0;
      case 'cstr': return String(value ?? '');
      case 'val': return parseFloat(String(value)) || 0;
      default: return value;
    }
  }

  private async executeIf(node: ASTNode & { kind: 'if' }) {
    if (this.isTruthy(await this.evaluateExpression(node.condition))) {
      await this.executeBlock(node.thenBlock);
      return;
    }
    for (const elseIf of node.elseIfBlocks) {
      if (this.isTruthy(await this.evaluateExpression(elseIf.condition))) {
        await this.executeBlock(elseIf.block);
        return;
      }
    }
    if (node.elseBlock.length > 0) {
      await this.executeBlock(node.elseBlock);
    }
  }

  private async executeFor(node: ASTNode & { kind: 'for' }) {
    const start = Number(await this.evaluateExpression(node.start));
    const end = Number(await this.evaluateExpression(node.end));
    const step = node.step ? Number(await this.evaluateExpression(node.step)) : 1;
    this.ctx.variables.set(node.variable, start);

    let iterations = 0;
    const maxIterations = 100000;

    if (step > 0) {
      for (let i = start; i <= end; i += step) {
        if (this.ctx.stopped || iterations++ > maxIterations) break;
        this.ctx.variables.set(node.variable, i);
        await this.executeBlock(node.body);
      }
    } else if (step < 0) {
      for (let i = start; i >= end; i += step) {
        if (this.ctx.stopped || iterations++ > maxIterations) break;
        this.ctx.variables.set(node.variable, i);
        await this.executeBlock(node.body);
      }
    }
  }

  private async executeWhile(node: ASTNode & { kind: 'while' }) {
    let iterations = 0;
    const maxIterations = 100000;
    while (this.isTruthy(await this.evaluateExpression(node.condition)) && !this.ctx.stopped) {
      if (iterations++ > maxIterations) {
        this.ctx.onError('Infinite loop detected in While loop');
        break;
      }
      await this.executeBlock(node.body);
    }
  }

  private async executeDoLoop(node: ASTNode & { kind: 'doloop' }) {
    let iterations = 0;
    const maxIterations = 100000;
    do {
      if (this.ctx.stopped || iterations++ > maxIterations) {
        if (iterations > maxIterations) this.ctx.onError('Infinite loop detected in Do loop');
        break;
      }
      await this.executeBlock(node.body);
      if (node.condition && node.conditionAtEnd) {
        if (this.isTruthy(await this.evaluateExpression(node.condition))) break;
      }
    } while (!this.ctx.stopped);
  }

  async evaluateExpression(node: ExpressionNode): Promise<unknown> {
    switch (node.kind) {
      case 'number': return node.value;
      case 'string': return node.value;
      case 'boolean': return node.value;
      case 'nothing': return null;

      case 'identifier': {
        const name = node.name;
        if (name === 'Me') return 'Me';
        if (this.ctx.components.has(name)) return name;
        if (this.ctx.variables.has(name)) return this.ctx.variables.get(name);
        return name;
      }

      case 'member': {
        if (node.object.kind === 'identifier') {
          const obj = this.ctx.variables.get(node.object.name);

          if (obj instanceof SqlConnection) {
            const prop = node.property.toLowerCase();
            if (prop === 'state') return obj.state;
          }

          if (obj instanceof SqlCommand) {
            const prop = node.property.toLowerCase();
            if (prop === 'parameters') {
              return {
                _isParameters: true,
                _command: obj,
                Add: (name: string, value: unknown) => obj.addParameter(name, value),
                AddWithValue: (name: string, value: unknown) => obj.addParameter(name, value),
              };
            }
          }

          if (obj instanceof DataTable) {
            const prop = node.property.toLowerCase();
            if (prop === 'rows') {
              return {
                _isRows: true,
                _dataTable: obj,
                Count: obj.rowCount,
              };
            }
          }

          if (obj && typeof obj === 'object' && (obj as any)._isParameters) {
            return obj;
          }
        }

        const objName = this.resolveComponentName(node.object);
        if (objName && this.ctx.components.has(objName)) {
          const comp = this.ctx.components.get(objName)!;
          const prop = node.property.toLowerCase();
          const propMap: Record<string, string> = {
            text: 'text',
            value: 'value',
            enabled: 'enabled',
            visible: 'visible',
            checked: 'checked',
            backcolor: 'backColor',
            forecolor: 'foreColor',
            left: 'left',
            top: 'top',
            width: 'width',
            height: 'height',
            selectedindex: 'selectedIndex',
            maximum: 'maximum',
            minimum: 'minimum',
            items: 'items',
            count: 'count',
          };
          const mapped = propMap[prop] || node.property;
          if (mapped === 'count' && Array.isArray(comp.props['items'])) {
            return (comp.props['items'] as unknown[]).length;
          }
          return comp.props[mapped];
        }

        const obj = await this.evaluateExpression(node.object);
        if (typeof obj === 'string') {
          if (node.property.toLowerCase() === 'length') return obj.length;
        }
        if (obj && typeof obj === 'object' && (obj as any)._isRows) {
          const prop = node.property.toLowerCase();
          if (prop === 'count') return (obj as any).Count;
        }
        return undefined;
      }

      case 'call_expr': {
        const args: unknown[] = [];
        for (const a of node.args) {
          args.push(await this.evaluateExpression(a));
        }
        return await this.callFunction(node.target, args);
      }

      case 'binary':
        return await this.evaluateBinary(node.op, node.left, node.right);

      case 'unary': {
        const operand = await this.evaluateExpression(node.operand);
        if (node.op === '-') return -Number(operand);
        if (node.op === 'not') return !this.isTruthy(operand);
        return operand;
      }

      case 'index': {
        const obj = await this.evaluateExpression(node.object);
        const idx = await this.evaluateExpression(node.index);
        if (Array.isArray(obj)) return obj[Number(idx)];
        return undefined;
      }

      default:
        return undefined;
    }
  }

  private async evaluateBinary(op: string, leftNode: ExpressionNode, rightNode: ExpressionNode): Promise<unknown> {
    const left = await this.evaluateExpression(leftNode);
    const right = await this.evaluateExpression(rightNode);

    switch (op) {
      case '+': return Number(left) + Number(right);
      case '-': return Number(left) - Number(right);
      case '*': return Number(left) * Number(right);
      case '/': {
        const r = Number(right);
        if (r === 0) { this.ctx.onError('Division by zero'); return 0; }
        return Number(left) / r;
      }
      case '\\': {
        const r = Number(right);
        if (r === 0) { this.ctx.onError('Division by zero'); return 0; }
        return Math.floor(Number(left) / r);
      }
      case 'mod': return Number(left) % Number(right);
      case '^': return Math.pow(Number(left), Number(right));
      case '&': return String(left ?? '') + String(right ?? '');
      case '=': return left == right;
      case '<>': return left != right;
      case '<': return Number(left) < Number(right);
      case '>': return Number(left) > Number(right);
      case '<=': return Number(left) <= Number(right);
      case '>=': return Number(left) >= Number(right);
      case 'and': return this.isTruthy(left) && this.isTruthy(right);
      case 'or': return this.isTruthy(left) || this.isTruthy(right);
      default: return undefined;
    }
  }

  private resolveComponentName(expr: ExpressionNode): string | null {
    if (expr.kind === 'identifier') {
      if (expr.name === 'Me') return null;
      return expr.name;
    }
    if (expr.kind === 'member' && expr.object.kind === 'identifier' && expr.object.name === 'Me') {
      return expr.property;
    }
    return null;
  }

  private isTruthy(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    return value != null;
  }

  private evaluateMathExpression(expr: string): number {
    try {
      // Clean the expression
      expr = expr.trim();
      if (!expr) return 0;

      // Simple expression evaluator with proper operator precedence
      // Tokenize the expression
      const tokens: (number | string)[] = [];
      let i = 0;
      while (i < expr.length) {
        const char = expr[i];

        // Skip whitespace
        if (char === ' ') {
          i++;
          continue;
        }

        // Parse numbers (including decimals)
        if (char >= '0' && char <= '9' || char === '.') {
          let num = '';
          while (i < expr.length && (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.')) {
            num += expr[i];
            i++;
          }
          tokens.push(parseFloat(num));
          continue;
        }

        // Parse operators
        if (['+', '-', '*', '/'].includes(char)) {
          tokens.push(char);
          i++;
          continue;
        }

        // Unknown character, skip it
        i++;
      }

      if (tokens.length === 0) return 0;
      if (tokens.length === 1 && typeof tokens[0] === 'number') return tokens[0];

      // Evaluate with operator precedence (* and / before + and -)
      // First pass: handle * and /
      let i2 = 1;
      while (i2 < tokens.length) {
        const op = tokens[i2];
        if (op === '*' || op === '/') {
          const left = Number(tokens[i2 - 1]);
          const right = Number(tokens[i2 + 1]);
          const result = op === '*' ? left * right : left / right;
          tokens.splice(i2 - 1, 3, result);
        } else {
          i2 += 2;
        }
      }

      // Second pass: handle + and -
      i2 = 1;
      while (i2 < tokens.length) {
        const op = tokens[i2];
        if (op === '+' || op === '-') {
          const left = Number(tokens[i2 - 1]);
          const right = Number(tokens[i2 + 1]);
          const result = op === '+' ? left + right : left - right;
          tokens.splice(i2 - 1, 3, result);
        } else {
          i2 += 2;
        }
      }

      return Number(tokens[0]) || 0;
    } catch {
      throw new Error('Invalid expression');
    }
  }
}

export function parseHandlerCode(code: string): ASTNode[] {
  const tokens = tokenize(code);
  const parser = new Parser(tokens);
  return parser.parseSubBody();
}
