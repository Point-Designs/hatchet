import { Token, TokenType } from "./tokens";

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.source.length) {
      const char = this.source[this.pos];

      if (char === "\n") {
        this.line++;
        this.pos++;
        continue;
      }

      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }

      if (char === ":") {
        tokens.push({ type: TokenType.Colon, value: ":", line: this.line });
        this.pos++;
        continue;
      }

      if (char === ";") {
        tokens.push({ type: TokenType.Semicolon, value: ";", line: this.line });
        this.pos++;
        continue;
      }

      if (char === "{") {
        tokens.push({ type: TokenType.OpenBrace, value: "{", line: this.line });
        this.pos++;
        continue;
      }

      if (char === "}") {
        tokens.push({ type: TokenType.CloseBrace, value: "}", line: this.line });
        this.pos++;
        continue;
      }

      if (char === "(") {
        tokens.push({ type: TokenType.OpenParen, value: "(", line: this.line });
        this.pos++;
        continue;
      }

      if (char === ")") {
        tokens.push({ type: TokenType.CloseParen, value: ")", line: this.line });
        this.pos++;
        continue;
      }

      if (char === "=") {
        tokens.push({ type: TokenType.Equals, value: "=", line: this.line });
        this.pos++;
        continue;
      }

      if (char === '"' || char === "'") {
        let strVal = "";
        const quote = char;
        this.pos++;
        while (this.pos < this.source.length && this.source[this.pos] !== quote) {
          strVal += this.source[this.pos];
          this.pos++;
        }
        this.pos++;
        tokens.push({ type: TokenType.Literal, value: strVal, line: this.line });
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let ident = "";
        while (this.pos < this.source.length && /[a-zA-Z0-9_\.]/.test(this.source[this.pos])) {
          ident += this.source[this.pos];
          this.pos++;
        }

        tokens.push(this.getKeywordToken(ident));
        continue;
      }

      if (/[0-9]/.test(char)) {
        let num = "";
        while (this.pos < this.source.length && /[0-9\.]/.test(this.source[this.pos])) {
          num += this.source[this.pos];
          this.pos++;
        }
        tokens.push({ type: TokenType.Literal, value: num, line: this.line });
        continue;
      }

      this.pos++;
    }

    tokens.push({ type: TokenType.EOF, value: "", line: this.line });
    return tokens;
  }

  private getKeywordToken(ident: string): Token {
    switch (ident) {
      case "struct": return { type: TokenType.Struct, value: ident, line: this.line };
      case "proc":
      case "func": return { type: TokenType.Func, value: ident, line: this.line };
      case "async": return { type: TokenType.Async, value: ident, line: this.line };
      case "await": return { type: TokenType.Await, value: ident, line: this.line };
      case "type": return { type: TokenType.Type, value: ident, line: this.line };
      case "interface": return { type: TokenType.Interface, value: ident, line: this.line };
      case "implements": return { type: TokenType.Implements, value: ident, line: this.line };
      case "include": return { type: TokenType.Include, value: ident, line: this.line };
      case "public": return { type: TokenType.Public, value: ident, line: this.line };
      case "private": return { type: TokenType.Private, value: ident, line: this.line };
      case "protected": return { type: TokenType.Protected, value: ident, line: this.line };
      case "static": return { type: TokenType.Static, value: ident, line: this.line };
      case "void": return { type: TokenType.Void, value: ident, line: this.line };
      default: return { type: TokenType.Identifier, value: ident, line: this.line };
    }
  }
}