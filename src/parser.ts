import { Lexer, Token, TokenType } from "./lexer";

export interface ProgramNode { type: "Program"; body: ASTNode[]; }
export interface StructNode { type: "Struct"; name: string; parent?: string; members: ASTNode[]; }
export interface ProcNode { type: "Proc"; name: string; params: string[]; body: ASTNode[]; isArrow?: boolean; }
export interface VarDeclNode { type: "VarDecl"; isConst: boolean; name: string; value: ASTNode; }
export interface DestructureNode { type: "Destructure"; names: string[]; value: ASTNode; }
export interface InterpolatedStringNode { type: "InterpolatedString"; raw: string; }
export interface BinaryOpNode { type: "BinaryOp"; op: string; left: ASTNode; right: ASTNode; }
export interface LiteralNode { type: "Literal"; value: any; rawType: "string" | "number"; }
export interface IdentifierNode { type: "Identifier"; name: string; }

export type ASTNode =
  | ProgramNode | StructNode | ProcNode | VarDeclNode 
  | DestructureNode | InterpolatedStringNode | BinaryOpNode 
  | LiteralNode | IdentifierNode;

export class Parser {
  private lexer: Lexer;
  private current: Token;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.current = this.lexer.nextToken();
  }

  private advance(): void { this.current = this.lexer.nextToken(); }

  private eat(type: TokenType): void {
    if (this.current.type === type) { this.advance(); }
    else { throw new Error(`[Line ${this.current.line}] Expected token '${TokenType[type]}', got '${this.current.value}'`); }
  }

  public parse(): ProgramNode {
    const body: ASTNode[] = [];
    while (this.current.type !== TokenType.EOF) {
      if (this.current.type === TokenType.Struct) body.push(this.parseStruct());
      else if (this.current.type === TokenType.Proc) body.push(this.parseProc());
      else this.advance();
    }
    return { type: "Program", body };
  }

  private parseStruct(): StructNode {
    this.eat(TokenType.Struct);
    const name = this.current.value;
    this.eat(TokenType.Identifier);

    let parent: string | undefined;
    if (this.current.type === TokenType.Extends) {
      this.advance();
      parent = this.current.value;
      this.eat(TokenType.Identifier);
    }

    this.eat(TokenType.OpenBrace);
    const members: ASTNode[] = [];
    while (this.current.type !== TokenType.CloseBrace && this.current.type !== TokenType.EOF) {
      if (this.current.type === TokenType.Var || this.current.type === TokenType.Const) {
        members.push(this.parseVarDecl());
      } else if (this.current.type === TokenType.Proc) {
        members.push(this.parseProc());
      } else {
        this.advance();
      }
    }
    this.eat(TokenType.CloseBrace);
    return { type: "Struct", name, parent, members };
  }

  private parseProc(): ProcNode {
    this.eat(TokenType.Proc);
    const name = this.current.value;
    this.eat(TokenType.Identifier);
    this.eat(TokenType.OpenParen);

    const params: string[] = [];
    if (this.current.type === TokenType.Identifier) {
      params.push(this.current.value);
      this.advance();
    }
    this.eat(TokenType.CloseParen);

    if (this.current.type === TokenType.FatArrow) {
      this.advance();
      const expr = this.parseExpr();
      this.eat(TokenType.Semicolon);
      return { type: "Proc", name, params, body: [expr], isArrow: true };
    }

    this.eat(TokenType.OpenBrace);
    const body: ASTNode[] = [];
    while (this.current.type !== TokenType.CloseBrace && this.current.type !== TokenType.EOF) {
      body.push(this.parseExpr());
      if (this.current.type === TokenType.Semicolon) this.advance();
    }
    this.eat(TokenType.CloseBrace);
    return { type: "Proc", name, params, body };
  }

  private parseVarDecl(): ASTNode {
    const isConst = this.current.type === TokenType.Const;
    this.advance();

    if (this.current.type === TokenType.OpenBracket) {
      this.advance();
      const names: string[] = [];
      while (this.current.type !== TokenType.CloseBracket) {
        names.push(this.current.value);
        this.eat(TokenType.Identifier);
        if (this.current.type === TokenType.Comma) this.advance();
      }
      this.eat(TokenType.CloseBracket);
      this.eat(TokenType.Equals);
      const value = this.parseExpr();
      this.eat(TokenType.Semicolon);
      return { type: "Destructure", names, value };
    }

    const name = this.current.value;
    this.eat(TokenType.Identifier);
    this.eat(TokenType.Equals);
    const value = this.parseExpr();
    this.eat(TokenType.Semicolon);

    return { type: "VarDecl", isConst, name, value };
  }

  private parseExpr(): ASTNode {
    if (this.current.type === TokenType.InterpolatedString) {
      const raw = this.current.value;
      this.advance();
      return { type: "InterpolatedString", raw };
    }
    if (this.current.type === TokenType.StringLiteral) {
      const val = this.current.value;
      this.advance();
      return { type: "Literal", value: val, rawType: "string" };
    }
    if (this.current.type === TokenType.NumberLiteral) {
      const val = parseInt(this.current.value, 10);
      this.advance();
      return { type: "Literal", value: val, rawType: "number" };
    }
    if (this.current.type === TokenType.Identifier) {
      const name = this.current.value;
      this.advance();
      return { type: "Identifier", name };
    }
    throw new Error(`[Line ${this.current.line}] Unexpected token '${this.current.value}'`);
  }
}