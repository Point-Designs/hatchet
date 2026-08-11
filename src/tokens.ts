export enum TokenType {
  Struct = "Struct",
  Proc = "Proc",
  Func = "Func",
  Async = "Async",
  Await = "Await",
  Type = "Type",
  Interface = "Interface",
  Implements = "Implements",
  Include = "Include",
  Public = "Public",
  Private = "Private",
  Protected = "Protected",
  Static = "Static",
  Void = "Void",
  Identifier = "Identifier",
  Literal = "Literal",
  TypeAnnotation = "TypeAnnotation",
  Colon = "Colon",
  Semicolon = "Semicolon",
  OpenBrace = "OpenBrace",
  CloseBrace = "CloseBrace",
  OpenParen = "OpenParen",
  CloseParen = "CloseParen",
  Equals = "Equals",
  EOF = "EOF"
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
}