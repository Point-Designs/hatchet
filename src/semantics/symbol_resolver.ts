import {
  ProgramNode,
  ASTNode,
  StructNode,
  FuncNode,
  VarDeclNode,
  TypeAliasNode,
  InterfaceNode
} from "../ast";

export interface SymbolInfo {
  name: string;
  kind: "type" | "interface" | "struct" | "func" | "var";
  typeAnnotation?: string;
  isAsync?: boolean;
  isStatic?: boolean;
  params?: { name: string; type?: string }[];
  isHeaderDeclared: boolean;
}

export class SymbolTable {
  private symbols: Map<string, SymbolInfo> = new Map();

  public define(info: SymbolInfo): void {
    if (this.symbols.has(info.name)) {
      const existing = this.symbols.get(info.name)!;
      if (existing.isHeaderDeclared && !info.isHeaderDeclared) {
        this.symbols.set(info.name, { ...info, isHeaderDeclared: true });
        return;
      }
      throw new Error(`[Symbol Error] Duplicate definition of symbol '${info.name}'`);
    }
    this.symbols.set(info.name, info);
  }

  public lookup(name: string): SymbolInfo | undefined {
    return this.symbols.get(name);
  }

  public has(name: string): boolean {
    return this.symbols.has(name);
  }

  public getAllSymbols(): SymbolInfo[] {
    return Array.from(this.symbols.values());
  }
}

export class SymbolResolver {
  private globalTable: SymbolTable;

  constructor(globalTable?: SymbolTable) {
    this.globalTable = globalTable || new SymbolTable();
  }

  public resolveHeader(headerAST: ProgramNode): SymbolTable {
    if (!headerAST.isHeader) {
      throw new Error("[Resolver Error] Expected header AST program node");
    }

    for (const node of headerAST.body) {
      this.registerTopLevel(node, true);
    }

    return this.globalTable;
  }

  public resolveImplementation(implAST: ProgramNode): void {
    for (const node of implAST.body) {
      this.registerTopLevel(node, false);
    }
  }

  private registerTopLevel(node: ASTNode, isHeader: boolean): void {
    switch (node.type) {
      case "TypeAlias": {
        const typeNode = node as TypeAliasNode;
        this.globalTable.define({
          name: typeNode.name,
          kind: "type",
          typeAnnotation: typeNode.targetType,
          isHeaderDeclared: isHeader
        });
        break;
      }

      case "Interface": {
        const ifaceNode = node as InterfaceNode;
        this.globalTable.define({
          name: ifaceNode.name,
          kind: "interface",
          isHeaderDeclared: isHeader
        });
        break;
      }

      case "Struct": {
        const structNode = node as StructNode;
        if (structNode.implementsInterface && !this.globalTable.has(structNode.implementsInterface)) {
          throw new Error(
            `[Resolver Error] Struct '${structNode.name}' implements unknown interface '${structNode.implementsInterface}'`
          );
        }
        this.globalTable.define({
          name: structNode.name,
          kind: "struct",
          isHeaderDeclared: isHeader
        });
        break;
      }

      case "Func": {
        const funcNode = node as FuncNode;
        this.globalTable.define({
          name: funcNode.name,
          kind: "func",
          typeAnnotation: funcNode.returnType || "void",
          isAsync: funcNode.isAsync,
          isStatic: funcNode.isStatic,
          params: funcNode.params.map((p) => ({ name: p.name, type: p.paramType })),
          isHeaderDeclared: isHeader
        });
        break;
      }

      case "VarDecl": {
        const varNode = node as VarDeclNode;
        this.globalTable.define({
          name: varNode.name,
          kind: "var",
          typeAnnotation: varNode.varType,
          isStatic: varNode.isStatic,
          isHeaderDeclared: isHeader
        });
        break;
      }
    }
  }

  public getSymbolTable(): SymbolTable {
    return this.globalTable;
  }
}