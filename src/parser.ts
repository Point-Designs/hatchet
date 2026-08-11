import { Token, TokenType } from "./tokens";
import {
  ProgramNode,
  ASTNode,
  IncludeNode,
  TypeAliasNode,
  InterfaceNode,
  InterfaceMember,
  StructNode,
  FuncNode,
  FuncParam,
  VarDeclNode,
  AccessModifier
} from "./ast";

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(isHeader: boolean = false): ProgramNode {
    const body: ASTNode[] = [];

    while (!this.isAtEnd()) {
      body.push(this.parseTopLevel(isHeader));
    }

    return {
      type: "Program",
      isHeader,
      body
    };
  }

  private parseTopLevel(isHeader: boolean): ASTNode {
    if (this.match(TokenType.Include)) {
      const pathToken = this.consume(TokenType.Literal, "Expected file path string for include");
      this.match(TokenType.Semicolon);
      return { type: "Include", path: pathToken.value } as IncludeNode;
    }

    if (this.match(TokenType.Type)) {
      const name = this.consume(TokenType.Identifier, "Expected type alias name").value;
      this.consume(TokenType.Equals, "Expected '=' in type declaration");
      const targetType = this.consumeTypeToken().value;
      this.match(TokenType.Semicolon);
      return { type: "TypeAlias", name, targetType } as TypeAliasNode;
    }

    if (this.match(TokenType.Interface)) {
      return this.parseInterface();
    }

    if (this.match(TokenType.Struct)) {
      return this.parseStruct(isHeader);
    }

    return this.parseFuncOrVar(isHeader);
  }

  private parseInterface(): InterfaceNode {
    const name = this.consume(TokenType.Identifier, "Expected interface name").value;
    this.consume(TokenType.OpenBrace, "Expected '{'");

    const members: InterfaceMember[] = [];

    while (!this.check(TokenType.CloseBrace) && !this.isAtEnd()) {
      let isAsync = false;
      if (this.match(TokenType.Async)) {
        isAsync = true;
      }

      this.consume(TokenType.Func, "Expected 'func' or 'proc' signature inside interface");
      const memberName = this.consume(TokenType.Identifier, "Expected method name").value;

      this.consume(TokenType.OpenParen, "Expected '('");
      const paramTypes: string[] = [];

      if (!this.check(TokenType.CloseParen)) {
        do {
          this.consume(TokenType.Identifier, "Expected parameter name");
          if (this.match(TokenType.Colon)) {
            paramTypes.push(this.consumeTypeToken().value);
          } else {
            paramTypes.push("any");
          }
        } while (this.match(TokenType.Semicolon) || this.check(TokenType.CloseParen) ? false : true);
      }

      this.consume(TokenType.CloseParen, "Expected ')'");

      let returnType = "void";
      if (this.match(TokenType.Colon)) {
        returnType = this.consumeTypeToken().value;
      }

      this.match(TokenType.Semicolon);
      members.push({ name: memberName, isAsync, paramTypes, returnType });
    }

    this.consume(TokenType.CloseBrace, "Expected '}'");
    return { type: "Interface", name, members };
  }

  private parseStruct(isHeader: boolean): StructNode {
    const name = this.consume(TokenType.Identifier, "Expected struct name").value;
    let implementsInterface: string | undefined;

    if (this.match(TokenType.Implements)) {
      implementsInterface = this.consume(TokenType.Identifier, "Expected interface name").value;
    }

    this.consume(TokenType.OpenBrace, "Expected '{'");
    const members: ASTNode[] = [];

    while (!this.check(TokenType.CloseBrace) && !this.isAtEnd()) {
      members.push(this.parseFuncOrVar(isHeader));
    }

    this.consume(TokenType.CloseBrace, "Expected '}'");
    return { type: "Struct", name, implementsInterface, members };
  }

  private parseFuncOrVar(isHeader: boolean): ASTNode {
    let accessModifier: AccessModifier | undefined;
    let isStatic = false;
    let isAsync = false;

    if (this.check(TokenType.Public) || this.check(TokenType.Private) || this.check(TokenType.Protected)) {
      accessModifier = this.tokens[this.pos++].value as AccessModifier;
    }

    if (this.match(TokenType.Static)) {
      isStatic = true;
    }

    if (this.match(TokenType.Async)) {
      isAsync = true;
    }

    if (this.match(TokenType.Func)) {
      const name = this.consume(TokenType.Identifier, "Expected function name").value;
      this.consume(TokenType.OpenParen, "Expected '('");

      const params: FuncParam[] = [];

      if (!this.check(TokenType.CloseParen)) {
        do {
          const paramName = this.consume(TokenType.Identifier, "Expected parameter name").value;
          let paramType: string | undefined;

          if (this.match(TokenType.Colon)) {
            paramType = this.consumeTypeToken().value;
          }

          params.push({ name: paramName, paramType });
        } while (this.check(TokenType.CloseParen) ? false : true);
      }

      this.consume(TokenType.CloseParen, "Expected ')'");

      let returnType: string | undefined;
      if (this.match(TokenType.Colon)) {
        returnType = this.consumeTypeToken().value;
      }

      if (isHeader || this.match(TokenType.Semicolon)) {
        return {
          type: "Func",
          name,
          accessModifier,
          isStatic,
          isAsync,
          params,
          returnType,
          isHeaderSignature: true
        } as FuncNode;
      }

      this.consume(TokenType.OpenBrace, "Expected '{'");
      const body: ASTNode[] = [];

      while (!this.check(TokenType.CloseBrace) && !this.isAtEnd()) {
        body.push(this.parseFuncOrVar(isHeader));
      }

      this.consume(TokenType.CloseBrace, "Expected '}'");

      return {
        type: "Func",
        name,
        accessModifier,
        isStatic,
        isAsync,
        params,
        returnType,
        body,
        isHeaderSignature: false
      } as FuncNode;
    }

    const varName = this.consume(TokenType.Identifier, "Expected variable name").value;
    let varType: string | undefined;

    if (this.match(TokenType.Colon)) {
      varType = this.consumeTypeToken().value;
    }

    this.consume(TokenType.Equals, "Expected '='");
    const valueToken = this.consume(TokenType.Literal, "Expected value");
    this.match(TokenType.Semicolon);

    return {
      type: "VarDecl",
      name: varName,
      accessModifier,
      isStatic,
      varType,
      value: { type: "Literal", value: valueToken.value }
    } as VarDeclNode;
  }

  private consumeTypeToken(): Token {
    if (this.check(TokenType.Void) || this.check(TokenType.Identifier)) {
      return this.tokens[this.pos++];
    }
    throw new Error(`[Parser Error] Line ${this.tokens[this.pos].line}: Expected type annotation or 'void'`);
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.pos++;
      return true;
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.tokens[this.pos].type === type;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.tokens[this.pos++];
    throw new Error(`[Parser Error] Line ${this.tokens[this.pos].line}: ${message}`);
  }

  private isAtEnd(): boolean {
    return this.tokens[this.pos].type === TokenType.EOF;
  }
}