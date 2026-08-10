export enum TokenType {
  Struct, Extends, Proc, Var, Const, If, Else, Switch, Case, Default, Return,
  Identifier, NumberLiteral, StringLiteral, InterpolatedString,
  OpenBrace, CloseBrace, OpenParen, CloseParen, OpenBracket, CloseBracket,
  Semicolon, Colon, Dot, Equals, Plus, Minus, Star, Slash,
  FatArrow,
  SafeNav,
  NullCoalesce,
  DotDot,
  Comma,
  EOF
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
}

export class Lexer {
  private source: string;
  private cursor: number = 0;
  private line: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  public nextToken(): Token {
    while (this.cursor < this.source.length) {
      const char = this.source[this.cursor];

      if (char === '\n') { this.line++; this.cursor++; continue; }
      if (/\s/.test(char)) { this.cursor++; continue; }

      if (char === '/' && this.source[this.cursor + 1] === '/') {
        while (this.cursor < this.source.length && this.source[this.cursor] !== '\n') {
          this.cursor++;
        }
        continue;
      }

      if (char === '?' && this.source[this.cursor + 1] === '.') {
        this.cursor += 2;
        return { type: TokenType.SafeNav, value: "?.", line: this.line };
      }
      if (char === '?' && this.source[this.cursor + 1] === '?') {
        this.cursor += 2;
        return { type: TokenType.NullCoalesce, value: "??", line: this.line };
      }
      if (char === '=' && this.source[this.cursor + 1] === '>') {
        this.cursor += 2;
        return { type: TokenType.FatArrow, value: "=>", line: this.line };
      }
      if (char === '.' && this.source[this.cursor + 1] === '.') {
        this.cursor += 2;
        return { type: TokenType.DotDot, value: "..", line: this.line };
      }

      if (char === '{') { this.cursor++; return { type: TokenType.OpenBrace, value: '{', line: this.line }; }
      if (char === '}') { this.cursor++; return { type: TokenType.CloseBrace, value: '}', line: this.line }; }
      if (char === '(') { this.cursor++; return { type: TokenType.OpenParen, value: '(', line: this.line }; }
      if (char === ')') { this.cursor++; return { type: TokenType.CloseParen, value: ')', line: this.line }; }
      if (char === '[') { this.cursor++; return { type: TokenType.OpenBracket, value: '[', line: this.line }; }
      if (char === ']') { this.cursor++; return { type: TokenType.CloseBracket, value: ']', line: this.line }; }
      if (char === ';') { this.cursor++; return { type: TokenType.Semicolon, value: ';', line: this.line }; }
      if (char === ':') { this.cursor++; return { type: TokenType.Colon, value: ':', line: this.line }; }
      if (char === '.') { this.cursor++; return { type: TokenType.Dot, value: '.', line: this.line }; }
      if (char === '=') { this.cursor++; return { type: TokenType.Equals, value: '=', line: this.line }; }
      if (char === ',') { this.cursor++; return { type: TokenType.Comma, value: ',', line: this.line }; }

      if (char === '$' && this.source[this.cursor + 1] === '"') {
        this.cursor += 2;
        let str = "";
        while (this.cursor < this.source.length && this.source[this.cursor] !== '"') {
          str += this.source[this.cursor];
          this.cursor++;
        }
        this.cursor++;
        return { type: TokenType.InterpolatedString, value: str, line: this.line };
      }

      if (char === '"') {
        this.cursor++;
        let str = "";
        while (this.cursor < this.source.length && this.source[this.cursor] !== '"') {
          str += this.source[this.cursor];
          this.cursor++;
        }
        this.cursor++;
        return { type: TokenType.StringLiteral, value: str, line: this.line };
      }

      if (/[0-9]/.test(char)) {
        let num = "";
        while (this.cursor < this.source.length && /[0-9]/.test(this.source[this.cursor])) {
          num += this.source[this.cursor];
          this.cursor++;
        }
        return { type: TokenType.NumberLiteral, value: num, line: this.line };
      }

      if (/[a-zA-Z_]/.test(char)) {
        let ident = "";
        while (this.cursor < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.cursor])) {
          ident += this.source[this.cursor];
          this.cursor++;
        }
        switch (ident) {
          case "struct": return { type: TokenType.Struct, value: ident, line: this.line };
          case "extends": return { type: TokenType.Extends, value: ident, line: this.line };
          case "proc": return { type: TokenType.Proc, value: ident, line: this.line };
          case "var": return { type: TokenType.Var, value: ident, line: this.line };
          case "const": return { type: TokenType.Const, value: ident, line: this.line };
          case "return": return { type: TokenType.Return, value: ident, line: this.line };
          default: return { type: TokenType.Identifier, value: ident, line: this.line };
        }
      }

      this.cursor++;
    }

    return { type: TokenType.EOF, value: "", line: this.line };
  }
}