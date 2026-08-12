import { Lexer } from "../lexer";
import { Parser } from "../parser";
import { JSGenerator } from "../codegen/js";

export class HatchetJIT {
  private scope: Record<string, any>;

  constructor(customBindings: Record<string, any> = {}) {
    this.scope = {
      println: console.log,
      ...customBindings,
    };
  }

  /**
   * compiles Hatchet source code to an executable function in memory..........
   */
  public compile(source: string): Function {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse(false);

    const jsGen = new JSGenerator();
    const jsCode = jsGen.generate(ast);

    const scopeKeys = Object.keys(this.scope);
    const scopeValues = Object.values(this.scope);

    const executableBody = `
      ${jsCode}
      if (typeof main === "function") {
        return main();
      }
    `;

    const factory = new Function(...scopeKeys, executableBody);
    return () => factory(...scopeValues);
  }

  public run(source: string): any {
    const fn = this.compile(source);
    return fn();
  }
}