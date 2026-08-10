import { ASTNode, ProgramNode, StructNode, ProcNode } from "../parser";

export class GMLGenerator {
  public generate(ast: ProgramNode): string {
    return ast.body.map((node) => this.visit(node)).join("\n\n");
  }

  private visit(node: ASTNode): string {
    switch (node.type) {
      case "Struct":
        return this.genStruct(node);
      case "Proc":
        return this.genProc(node);
      case "Destructure":
        return node.names
          .map((name, idx) => `var ${name} = ${this.visit(node.value)}[${idx}];`)
          .join("\n");
      case "InterpolatedString":
        return node.raw.replace(/\{([^}]+)\}/g, `" + string($1) + "`);
      case "Literal":
        return node.rawType === "string" ? `"${node.value}"` : `${node.value}`;
      case "Identifier":
        return node.name;
      default:
        return "";
    }
  }

  private genStruct(node: StructNode): string {
    const parentClause = node.parent ? ` : ${node.parent}()` : "";
    const members = node.members
      .map((m) => {
        if (m.type === "VarDecl") return `    self.${m.name} = ${this.visit(m.value)};`;
        if (m.type === "Proc") {
          const bodyCode = m.isArrow 
            ? `return ${this.visit(m.body[0])};`
            : m.body.map((b) => this.visit(b)).join("\n");
          return `    static ${m.name} = function(${m.params.join(", ")}) {\n        ${bodyCode}\n    };`;
        }
        return "";
      })
      .join("\n");

    return `function ${node.name}()${parentClause} constructor {\n${members}\n}`;
  }

  private genProc(node: ProcNode): string {
    const bodyCode = node.isArrow 
      ? `return ${this.visit(node.body[0])};` 
      : node.body.map((b) => `    ${this.visit(b)}`).join("\n");
    return `function ${node.name}(${node.params.join(", ")}) {\n    ${bodyCode}\n}`;
  }
}