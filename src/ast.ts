export type AccessModifier = "public" | "private" | "protected";

export type ASTNode =
  | IncludeNode
  | TypeAliasNode
  | InterfaceNode
  | StructNode
  | FuncNode
  | VarDeclNode
  | LiteralNode
  | IdentifierNode;

export interface IncludeNode {
  type: "Include";
  path: string;
}

export interface TypeAliasNode {
  type: "TypeAlias";
  name: string;
  targetType: string;
}

export interface InterfaceMember {
  name: string;
  isAsync: boolean;
  paramTypes: string[];
  returnType: string;
}

export interface InterfaceNode {
  type: "Interface";
  name: string;
  members: InterfaceMember[];
}

export interface StructNode {
  type: "Struct";
  name: string;
  implementsInterface?: string;
  members: ASTNode[];
}

export interface FuncParam {
  name: string;
  paramType?: string;
}

export interface FuncNode {
  type: "Func";
  name: string;
  accessModifier?: AccessModifier;
  isStatic: boolean;
  isAsync: boolean;
  params: FuncParam[];
  returnType?: string;
  body?: ASTNode[];
  isHeaderSignature: boolean;
}

export interface VarDeclNode {
  type: "VarDecl";
  name: string;
  accessModifier?: AccessModifier;
  isStatic: boolean;
  varType?: string;
  value: ASTNode;
}

export interface LiteralNode {
  type: "Literal";
  value: string;
}

export interface IdentifierNode {
  type: "Identifier";
  name: string;
}

export interface ProgramNode {
  type: "Program";
  isHeader: boolean;
  body: ASTNode[];
}