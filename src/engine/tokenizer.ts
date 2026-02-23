export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'OPERATOR'
  | 'PUNCTUATION'
  | 'NEWLINE'
  | 'COMMENT'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

const KEYWORDS = new Set([
  'dim', 'as', 'integer', 'string', 'boolean', 'double', 'single', 'long', 'object',
  'if', 'then', 'else', 'elseif', 'end', 'sub', 'function', 'return',
  'for', 'to', 'step', 'next', 'while', 'wend', 'do', 'loop', 'until',
  'true', 'false', 'not', 'and', 'or', 'mod',
  'private', 'public', 'class', 'new', 'me', 'nothing',
  'select', 'case', 'exit', 'byval', 'byref',
  'try', 'catch', 'finally',
]);

const OPERATORS = new Set(['=', '<', '>', '<>', '<=', '>=', '+', '-', '*', '/', '\\', '^', '&']);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  while (pos < source.length) {
    const ch = source[pos];

    if (ch === '\r') {
      pos++;
      if (source[pos] === '\n') pos++;
      tokens.push({ type: 'NEWLINE', value: '\n', line, col });
      line++;
      col = 1;
      continue;
    }

    if (ch === '\n') {
      tokens.push({ type: 'NEWLINE', value: '\n', line, col });
      pos++;
      line++;
      col = 1;
      continue;
    }

    if (ch === ' ' || ch === '\t') {
      pos++;
      col++;
      continue;
    }

    if (ch === "'") {
      let comment = '';
      while (pos < source.length && source[pos] !== '\n' && source[pos] !== '\r') {
        comment += source[pos];
        pos++;
      }
      tokens.push({ type: 'COMMENT', value: comment, line, col });
      col += comment.length;
      continue;
    }

    if (ch === '"') {
      let str = '';
      pos++;
      col++;
      while (pos < source.length && source[pos] !== '"') {
        str += source[pos];
        pos++;
        col++;
      }
      if (pos < source.length) {
        pos++;
        col++;
      }
      tokens.push({ type: 'STRING', value: str, line, col: col - str.length - 2 });
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '.' && pos + 1 < source.length && /[0-9]/.test(source[pos + 1]))) {
      let num = '';
      while (pos < source.length && /[0-9.]/.test(source[pos])) {
        num += source[pos];
        pos++;
        col++;
      }
      tokens.push({ type: 'NUMBER', value: num, line, col: col - num.length });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      const startCol = col;
      while (pos < source.length && /[a-zA-Z0-9_]/.test(source[pos])) {
        ident += source[pos];
        pos++;
        col++;
      }
      const lower = ident.toLowerCase();
      if (KEYWORDS.has(lower)) {
        tokens.push({ type: 'KEYWORD', value: lower, line, col: startCol });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: ident, line, col: startCol });
      }
      continue;
    }

    if (ch === '<' && pos + 1 < source.length) {
      if (source[pos + 1] === '>') {
        tokens.push({ type: 'OPERATOR', value: '<>', line, col });
        pos += 2;
        col += 2;
        continue;
      }
      if (source[pos + 1] === '=') {
        tokens.push({ type: 'OPERATOR', value: '<=', line, col });
        pos += 2;
        col += 2;
        continue;
      }
    }

    if (ch === '>' && pos + 1 < source.length && source[pos + 1] === '=') {
      tokens.push({ type: 'OPERATOR', value: '>=', line, col });
      pos += 2;
      col += 2;
      continue;
    }

    if (OPERATORS.has(ch)) {
      tokens.push({ type: 'OPERATOR', value: ch, line, col });
      pos++;
      col++;
      continue;
    }

    if ('(),.'.includes(ch)) {
      tokens.push({ type: 'PUNCTUATION', value: ch, line, col });
      pos++;
      col++;
      continue;
    }

    pos++;
    col++;
  }

  tokens.push({ type: 'EOF', value: '', line, col });
  return tokens;
}
