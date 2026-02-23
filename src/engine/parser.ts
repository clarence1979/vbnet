import type { Token } from './tokenizer';

export type ASTNode =
  | AssignmentNode
  | DimNode
  | IfNode
  | ForNode
  | WhileNode
  | DoLoopNode
  | CallNode
  | ReturnNode
  | ExpressionNode
  | BlockNode
  | ExitNode;

export interface BlockNode {
  kind: 'block';
  statements: ASTNode[];
}

export interface AssignmentNode {
  kind: 'assignment';
  target: ExpressionNode;
  value: ExpressionNode;
  line: number;
}

export interface DimNode {
  kind: 'dim';
  name: string;
  typeName: string;
  initialValue?: ExpressionNode;
  line: number;
}

export interface IfNode {
  kind: 'if';
  condition: ExpressionNode;
  thenBlock: ASTNode[];
  elseIfBlocks: { condition: ExpressionNode; block: ASTNode[] }[];
  elseBlock: ASTNode[];
  line: number;
}

export interface ForNode {
  kind: 'for';
  variable: string;
  start: ExpressionNode;
  end: ExpressionNode;
  step: ExpressionNode | null;
  body: ASTNode[];
  line: number;
}

export interface WhileNode {
  kind: 'while';
  condition: ExpressionNode;
  body: ASTNode[];
  line: number;
}

export interface DoLoopNode {
  kind: 'doloop';
  condition: ExpressionNode | null;
  conditionAtEnd: boolean;
  body: ASTNode[];
  line: number;
}

export interface CallNode {
  kind: 'call';
  target: ExpressionNode;
  args: ExpressionNode[];
  line: number;
}

export interface ReturnNode {
  kind: 'return';
  value: ExpressionNode | null;
  line: number;
}

export interface ExitNode {
  kind: 'exit';
  what: string;
  line: number;
}

export type ExpressionNode =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'identifier'; name: string }
  | { kind: 'member'; object: ExpressionNode; property: string }
  | { kind: 'index'; object: ExpressionNode; index: ExpressionNode }
  | { kind: 'call_expr'; target: ExpressionNode; args: ExpressionNode[] }
  | { kind: 'binary'; op: string; left: ExpressionNode; right: ExpressionNode }
  | { kind: 'unary'; op: string; operand: ExpressionNode }
  | { kind: 'nothing' };

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter((t) => t.type !== 'COMMENT');
  }

  parse(): ASTNode[] {
    const stmts: ASTNode[] = [];
    this.skipNewlines();

    while (!this.isAtEnd()) {
      const kw = this.peek().value;
      if (kw === 'public' || kw === 'private') {
        this.advance();
        if (this.peek().value === 'class') {
          this.skipClassWrapper();
          continue;
        }
        if (this.peek().value === 'sub' || this.peek().value === 'function') {
          this.skipSubDeclaration();
          continue;
        }
      }
      if (kw === 'class') {
        this.skipClassWrapper();
        continue;
      }
      if (kw === 'end') {
        this.advance();
        this.skipNewlines();
        continue;
      }
      const stmt = this.parseStatement();
      if (stmt) stmts.push(stmt);
      this.skipNewlines();
    }
    return stmts;
  }

  parseSubBody(): ASTNode[] {
    const stmts: ASTNode[] = [];
    this.skipNewlines();
    while (
      !this.isAtEnd() &&
      !(this.peek().value === 'end' && this.peekAhead(1)?.value === 'sub') &&
      !(this.peek().value === 'end' && this.peekAhead(1)?.value === 'function')
    ) {
      const stmt = this.parseStatement();
      if (stmt) stmts.push(stmt);
      this.skipNewlines();
    }
    return stmts;
  }

  private skipClassWrapper() {
    while (!this.isAtEnd() && !(this.peek().value === 'end' && this.peekAhead(1)?.value === 'class')) {
      this.advance();
    }
    if (!this.isAtEnd()) {
      this.advance();
      this.advance();
    }
    this.skipNewlines();
  }

  private skipSubDeclaration() {
    while (!this.isAtEnd() && this.peek().type !== 'NEWLINE') {
      this.advance();
    }
    this.skipNewlines();
  }

  parseStatement(): ASTNode | null {
    this.skipNewlines();
    if (this.isAtEnd()) return null;

    const token = this.peek();

    if (token.value === 'dim') return this.parseDim();
    if (token.value === 'if') return this.parseIf();
    if (token.value === 'for') return this.parseFor();
    if (token.value === 'while') return this.parseWhile();
    if (token.value === 'do') return this.parseDoLoop();
    if (token.value === 'return') return this.parseReturn();
    if (token.value === 'exit') return this.parseExit();

    return this.parseExpressionStatement();
  }

  private parseDim(): DimNode {
    const line = this.peek().line;
    this.expect('dim');
    const name = this.advance().value;
    let typeName = 'Object';
    let initialValue: ExpressionNode | undefined;

    if (this.peek().value === 'as') {
      this.advance();
      typeName = this.advance().value;
    }

    if (this.peek().value === '=') {
      this.advance();
      initialValue = this.parseExpression();
    }

    return { kind: 'dim', name, typeName, initialValue, line };
  }

  private parseIf(): IfNode {
    const line = this.peek().line;
    this.expect('if');
    const condition = this.parseExpression();
    this.expect('then');
    this.skipNewlines();

    const thenBlock: ASTNode[] = [];
    const elseIfBlocks: { condition: ExpressionNode; block: ASTNode[] }[] = [];
    let elseBlock: ASTNode[] = [];

    while (
      !this.isAtEnd() &&
      this.peek().value !== 'else' &&
      this.peek().value !== 'elseif' &&
      !(this.peek().value === 'end' && this.peekAhead(1)?.value === 'if')
    ) {
      const stmt = this.parseStatement();
      if (stmt) thenBlock.push(stmt);
      this.skipNewlines();
    }

    while (this.peek().value === 'elseif') {
      this.advance();
      const cond = this.parseExpression();
      this.expect('then');
      this.skipNewlines();
      const block: ASTNode[] = [];
      while (
        !this.isAtEnd() &&
        this.peek().value !== 'else' &&
        this.peek().value !== 'elseif' &&
        !(this.peek().value === 'end' && this.peekAhead(1)?.value === 'if')
      ) {
        const stmt = this.parseStatement();
        if (stmt) block.push(stmt);
        this.skipNewlines();
      }
      elseIfBlocks.push({ condition: cond, block });
    }

    if (this.peek().value === 'else') {
      this.advance();
      this.skipNewlines();
      while (!this.isAtEnd() && !(this.peek().value === 'end' && this.peekAhead(1)?.value === 'if')) {
        const stmt = this.parseStatement();
        if (stmt) elseBlock.push(stmt);
        this.skipNewlines();
      }
    }

    if (this.peek().value === 'end') {
      this.advance();
      if (this.peek().value === 'if') this.advance();
    }

    return { kind: 'if', condition, thenBlock, elseIfBlocks, elseBlock, line };
  }

  private parseFor(): ForNode {
    const line = this.peek().line;
    this.expect('for');
    const variable = this.advance().value;
    this.expect('=');
    const start = this.parseExpression();
    this.expect('to');
    const end = this.parseExpression();
    let step: ExpressionNode | null = null;
    if (this.peek().value === 'step') {
      this.advance();
      step = this.parseExpression();
    }
    this.skipNewlines();

    const body: ASTNode[] = [];
    while (!this.isAtEnd() && this.peek().value !== 'next') {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
      this.skipNewlines();
    }
    if (this.peek().value === 'next') {
      this.advance();
      if (this.peek().type === 'IDENTIFIER') this.advance();
    }

    return { kind: 'for', variable, start, end, step, body, line };
  }

  private parseWhile(): WhileNode {
    const line = this.peek().line;
    this.expect('while');
    const condition = this.parseExpression();
    this.skipNewlines();

    const body: ASTNode[] = [];
    while (!this.isAtEnd() && this.peek().value !== 'wend') {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
      this.skipNewlines();
    }
    if (this.peek().value === 'wend') this.advance();

    return { kind: 'while', condition, body, line };
  }

  private parseDoLoop(): DoLoopNode {
    const line = this.peek().line;
    this.expect('do');
    this.skipNewlines();

    const body: ASTNode[] = [];
    while (
      !this.isAtEnd() &&
      this.peek().value !== 'loop'
    ) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
      this.skipNewlines();
    }

    let condition: ExpressionNode | null = null;
    if (this.peek().value === 'loop') {
      this.advance();
      if (this.peek().value === 'until' || this.peek().value === 'while') {
        this.advance();
        condition = this.parseExpression();
      }
    }

    return { kind: 'doloop', condition, conditionAtEnd: true, body, line };
  }

  private parseReturn(): ReturnNode {
    const line = this.peek().line;
    this.expect('return');
    let value: ExpressionNode | null = null;
    if (!this.isAtEnd() && this.peek().type !== 'NEWLINE') {
      value = this.parseExpression();
    }
    return { kind: 'return', value, line };
  }

  private parseExit(): ExitNode {
    const line = this.peek().line;
    this.expect('exit');
    const what = this.advance().value;
    return { kind: 'exit', what, line };
  }

  private parseExpressionStatement(): ASTNode | null {
    this.skipNewlines();
    if (this.isAtEnd()) return null;

    const savedPos = this.pos;
    const lhs = this.parsePostfix();

    if ((lhs.kind === 'identifier' || lhs.kind === 'member') && this.peek().value === '=') {
      this.advance();
      const value = this.parseExpression();
      return { kind: 'assignment', target: lhs, value, line: this.tokens[Math.max(0, this.pos - 1)].line };
    }

    this.pos = savedPos;
    const expr = this.parseExpression();
    if (!expr) return null;

    if (expr.kind === 'call_expr') {
      return {
        kind: 'call',
        target: expr.target,
        args: expr.args,
        line: this.tokens[Math.max(0, this.pos - 1)].line,
      };
    }

    if (expr.kind === 'identifier' || expr.kind === 'member') {
      if (!this.isAtEnd() && this.peek().type !== 'NEWLINE' && this.peek().type !== 'EOF') {
        const args: ExpressionNode[] = [];
        args.push(this.parseExpression());
        while (this.peek().value === ',') {
          this.advance();
          args.push(this.parseExpression());
        }
        return {
          kind: 'call',
          target: expr,
          args,
          line: this.tokens[Math.max(0, this.pos - 1)].line,
        };
      }
    }

    return null;
  }

  parseExpression(): ExpressionNode {
    return this.parseOr();
  }

  private parseOr(): ExpressionNode {
    let left = this.parseAnd();
    while (this.peek().value === 'or') {
      this.advance();
      const right = this.parseAnd();
      left = { kind: 'binary', op: 'or', left, right };
    }
    return left;
  }

  private parseAnd(): ExpressionNode {
    let left = this.parseNot();
    while (this.peek().value === 'and') {
      this.advance();
      const right = this.parseNot();
      left = { kind: 'binary', op: 'and', left, right };
    }
    return left;
  }

  private parseNot(): ExpressionNode {
    if (this.peek().value === 'not') {
      this.advance();
      const operand = this.parseComparison();
      return { kind: 'unary', op: 'not', operand };
    }
    return this.parseComparison();
  }

  private parseComparison(): ExpressionNode {
    let left = this.parseConcat();
    while (['=', '<>', '<', '>', '<=', '>='].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseConcat();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parseConcat(): ExpressionNode {
    let left = this.parseAddSub();
    while (this.peek().value === '&') {
      this.advance();
      const right = this.parseAddSub();
      left = { kind: 'binary', op: '&', left, right };
    }
    return left;
  }

  private parseAddSub(): ExpressionNode {
    let left = this.parseMulDiv();
    while (['+', '-'].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseMulDiv();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parseMulDiv(): ExpressionNode {
    let left = this.parsePower();
    while (['*', '/', '\\', 'mod'].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parsePower();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parsePower(): ExpressionNode {
    let left = this.parseUnary();
    while (this.peek().value === '^') {
      this.advance();
      const right = this.parseUnary();
      left = { kind: 'binary', op: '^', left, right };
    }
    return left;
  }

  private parseUnary(): ExpressionNode {
    if (this.peek().value === '-') {
      this.advance();
      const operand = this.parsePostfix();
      return { kind: 'unary', op: '-', operand };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): ExpressionNode {
    let expr = this.parsePrimary();

    while (true) {
      if (this.peek().value === '.') {
        this.advance();
        const prop = this.advance().value;
        expr = { kind: 'member', object: expr, property: prop };
      } else if (this.peek().value === '(') {
        this.advance();
        const args: ExpressionNode[] = [];
        if (this.peek().value !== ')') {
          args.push(this.parseExpression());
          while (this.peek().value === ',') {
            this.advance();
            args.push(this.parseExpression());
          }
        }
        if (this.peek().value === ')') this.advance();
        expr = { kind: 'call_expr', target: expr, args };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): ExpressionNode {
    const token = this.peek();

    if (token.type === 'NUMBER') {
      this.advance();
      return { kind: 'number', value: parseFloat(token.value) };
    }

    if (token.type === 'STRING') {
      this.advance();
      return { kind: 'string', value: token.value };
    }

    if (token.value === 'true') {
      this.advance();
      return { kind: 'boolean', value: true };
    }

    if (token.value === 'false') {
      this.advance();
      return { kind: 'boolean', value: false };
    }

    if (token.value === 'nothing') {
      this.advance();
      return { kind: 'nothing' };
    }

    if (token.value === 'me') {
      this.advance();
      return { kind: 'identifier', name: 'Me' };
    }

    if (token.value === 'new') {
      this.advance();
      const typeName = this.advance().value;
      if (this.peek().value === '(') {
        this.advance();
        if (this.peek().value === ')') this.advance();
      }
      return { kind: 'call_expr', target: { kind: 'identifier', name: typeName }, args: [] };
    }

    if (token.value === '(') {
      this.advance();
      const expr = this.parseExpression();
      if (this.peek().value === ')') this.advance();
      return expr;
    }

    if (token.type === 'IDENTIFIER') {
      this.advance();
      return { kind: 'identifier', name: token.value };
    }

    this.advance();
    return { kind: 'string', value: '' };
  }

  private peek(): Token {
    if (this.pos >= this.tokens.length) return { type: 'EOF', value: '', line: 0, col: 0 };
    return this.tokens[this.pos];
  }

  private peekAhead(offset: number): Token | undefined {
    return this.tokens[this.pos + offset];
  }

  private advance(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private expect(value: string) {
    const token = this.peek();
    if (token.value !== value) {
      throw new Error(`Expected '${value}' but got '${token.value}' at line ${token.line}`);
    }
    this.advance();
  }

  private skipNewlines() {
    while (this.pos < this.tokens.length && this.tokens[this.pos].type === 'NEWLINE') {
      this.pos++;
    }
  }

  private isAtEnd(): boolean {
    return this.pos >= this.tokens.length || this.tokens[this.pos].type === 'EOF';
  }
}
