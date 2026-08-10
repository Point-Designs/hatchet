import { ASTNode, ProgramNode, StructNode, ProcNode } from "../parser";

export class CSharpGenerator {
  public generate(ast: ProgramNode): string {
    const code = ast.body.map((node) => this.visit(node)).join("\n\n");
    return `using System;\n\nnamespace HatchetApp {\n${code}\n}`;
  }

  private visit(node: ASTNode, indent: string = "    "): string {
    switch (node.type) {
      case "Struct":
        return this.genStruct(node, indent);
      case "Proc":
        return this.genProc(node, indent);
      case "PrintStr":
        return `${indent}Console.Write(${this.visit(node.value, "")});`;
      case "Literal":
        return node.rawType === "string" ? `"${node.value}"` : `${node.value}`;
      case "Identifier":
        return node.name;
      default:
        return "";
    }
  }

  private genStruct(node: StructNode, indent: string): string {
    const parentClause = node.parent ? ` : ${node.parent}` : "";
    const members = node.members
      .map((m) => {
        if (m.type === "VarDecl") {
          const typeStr = m.value.type === "Literal" && m.value.rawType === "number" ? "int" : "string";
          return `${indent}    public ${typeStr} ${m.name} = ${this.visit(m.value, "")};`;
        }
        if (m.type === "Proc") {
          return this.genProc(m, indent + "    ");
        }
        return "";
      })
      .join("\n");

    return `${indent}public class ${node.name}${parentClause} {\n${members}\n${indent}}`;
  }

  private genProc(node: ProcNode, indent: string): string {
    const body = node.body.map((b) => this.visit(b, indent + "    ")).join("\n");
    return `${indent}public void ${node.name}(${node.params.join(", ")}) {\n${body}\n${indent}}`;
  }
}