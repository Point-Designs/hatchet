import { ASTNode, ProgramNode, StructNode, ProcNode } from "../parser";

export class JavaGenerator {
  private packageName: string;

  constructor(packageName: string = "com.hatchet.generated") {
    this.packageName = packageName;
  }

  public generate(ast: ProgramNode): string {
    const bodyCode = ast.body.map((node) => this.visit(node)).join("\n\n");
    return `package ${this.packageName};\n\nimport java.util.*;\n\n${bodyCode}`;
  }

  private visit(node: ASTNode): string {
    switch (node.type) {
      case "Struct":
        return this.genStruct(node);
      case "Proc":
        return this.genProc(node);
      case "Destructure":
        return node.names
          .map((name, idx) => `Object ${name} = ((List<?>) ${this.visit(node.value)}).get(${idx});`)
          .join("\n");
      case "InterpolatedString":
        return node.raw.replace(/\{([^}]+)\}/g, ` + $1 + `);
      case "Literal":
        return node.rawType === "string" ? `"${node.value}"` : `${node.value}`;
      case "Identifier":
        return node.name;
      default:
        return "";
    }
  }

  private genStruct(node: StructNode): string {
    const extendsClause = node.parent ? ` extends ${node.parent}` : "";
    
    const members = node.members
      .map((m) => {
        if (m.type === "VarDecl") {
          return `    public Object ${m.name} = ${this.visit(m.value)};`;
        }
        if (m.type === "Proc") {
          const paramsList = m.params.map((p) => `Object ${p}`).join(", ");
          const bodyCode = m.isArrow 
            ? `return ${this.visit(m.body[0])};`
            : m.body.map((b) => `        ${this.visit(b)};`).join("\n");
          return `    public Object ${m.name}(${paramsList}) {\n        ${bodyCode}\n    }`;
        }
        return "";
      })
      .join("\n\n");

    return `public class ${node.name}${extendsClause} {\n${members}\n}`;
  }

  private genProc(node: ProcNode): string {
    const paramsList = node.params.map((p) => `Object ${p}`).join(", ");
    const bodyCode = node.isArrow 
      ? `return ${this.visit(node.body[0])};` 
      : node.body.map((b) => `    ${this.visit(b)};`).join("\n");
      
    return `public static Object ${node.name}(${paramsList}) {\n    ${bodyCode}\n}`;
  }
}