import {
  ProgramNode,
  ASTNode,
  StructNode,
  FuncNode,
  VarDeclNode,
  TypeAliasNode,
  InterfaceNode
} from "../ast";

export class CGenerator {
  private indentLevel: number = 0;

  public generate(ast: ProgramNode): string {
    const lines: string[] = [];

    lines.push("#include <stdio.h>");
    lines.push("#include <stdlib.h>");
    lines.push("#include <stdbool.h>");
    lines.push("#include <stdint.h>");
    lines.push("");

    for (const node of ast.body) {
      lines.push(this.visit(node));
    }

    return lines.join("\n");
  }

  private visit(node: ASTNode): string {
    switch (node.type) {
      case "TypeAlias":
        return this.genTypeAlias(node as TypeAliasNode);
      case "Struct":
        return this.genStruct(node as StructNode);
      case "Func":
        return this.genFunc(node as FuncNode);
      case "VarDecl":
        return this.genVarDecl(node as VarDeclNode);
      case "Literal":
        return node.value;
      case "Identifier":
        return node.name;
      default:
        return "";
    }
  }

  private genTypeAlias(node: TypeAliasNode): string {
    const target = this.mapCType(node.targetType);
    return `typedef ${target} ${node.name};`;
  }

  private genStruct(node: StructNode): string {
    const lines: string[] = [];
    lines.push(`typedef struct ${node.name} {`);

    for (const member of node.members) {
      if (member.type === "VarDecl") {
        const v = member as VarDeclNode;
        const cType = this.mapCType(v.varType || "void*");
        lines.push(`    ${cType} ${v.name};`);
      }
    }

    lines.push(`} ${node.name};`);
    return lines.join("\n");
  }

  private genFunc(node: FuncNode): string {
    const lines: string[] = [];
    const returnType = this.mapCType(node.returnType || "void");
    const inlinePrefix = node.isStatic ? "static inline " : "";

    const paramsStr = node.params
      .map((p) => `${this.mapCType(p.paramType || "void*")} ${p.name}`)
      .join(", ");

    const signature = `${inlinePrefix}${returnType} ${node.name}(${paramsStr})`;

    if (node.isHeaderSignature || !node.body) {
      return `${signature};`;
    }

    lines.push(`${signature} {`);
    for (const stmt of node.body) {
      lines.push(`    ${this.visit(stmt)}`);
    }
    lines.push(`}`);

    return lines.join("\n");
  }

  private genVarDecl(node: VarDeclNode): string {
    const cType = this.mapCType(node.varType || "void*");
    const valStr = this.visit(node.value);
    return `${cType} ${node.name} = ${valStr};`;
  }

  private mapCType(typeStr: string): string {
    switch (typeStr) {
      case "number":
      case "float":
        return "double";
      case "int":
        return "int32_t";
      case "string":
        return "const char*";
      case "bool":
      case "boolean":
        return "bool";
      case "void":
        return "void";
      default:
        return typeStr;
    }
  }
}