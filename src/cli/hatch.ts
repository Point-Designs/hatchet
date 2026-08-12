import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { Lexer } from "../lexer";
import { Parser } from "../parser";
import { SymbolResolver, SymbolTable } from "../semantics/symbol_resolver";
import { CGenerator } from "../codegen/c";
import { JSGenerator } from "../codegen/js";
import { HatchetJIT } from "../jit/jit_engine";

export interface HatchConfig {
  name: string;
  version: string;
  entry: string;
  target: "c" | "js" | "jit";
  output: string;
  compilerOptions?: {
    optimizationLevel?: "O0" | "O1" | "O2" | "O3";
    unsafeAllowed?: boolean;
    headerDirectories?: string[];
  };
}

export class HatchCLI {
  private currentDir: string;

  constructor(currentDir: string = process.cwd()) {
    this.currentDir = currentDir;
  }

  public runCommand(args: string[]): void {
    const command = args[0] || "help";

    switch (command) {
      case "new":
        this.createNewProject(args[1]);
        break;
      case "build":
        this.buildProject();
        break;
      case "run":
        this.runProject();
        break;
      case "clean":
        this.cleanProject();
        break;
      default:
        this.printHelp();
        break;
    }
  }

  private createNewProject(projectName?: string): void {
    if (!projectName) {
      console.error("[Hatch Error] Please specify a project name: hatch new <project_name>");
      return;
    }

    const projectPath = path.join(this.currentDir, projectName);
    if (fs.existsSync(projectPath)) {
      console.error(`[Hatch Error] Directory '${projectName}' already exists.`);
      return;
    }

    fs.mkdirSync(path.join(projectPath, "src"), { recursive: true });
    fs.mkdirSync(path.join(projectPath, "bin"), { recursive: true });

    const config: HatchConfig = {
      name: projectName,
      version: "0.1.0",
      entry: "src/main.ht",
      target: "c",
      output: `bin/${projectName}`,
      compilerOptions: {
        optimizationLevel: "O2",
        unsafeAllowed: true
      }
    };

    fs.writeFileSync(
      path.join(projectPath, "hatch.json"),
      JSON.stringify(config, null, 2)
    );

    const starterCode = `include "std::io";\n\npub static func main(): void {\n    println("Hello from ${projectName} powered by Hatchet!");\n}\n`;
    fs.writeFileSync(path.join(projectPath, "src", "main.ht"), starterCode);

    console.log(`[Hatch] Successfully scaffolded new project '${projectName}'!`);
  }

  private buildProject(): string | null {
    const configPath = path.join(this.currentDir, "hatch.json");
    if (!fs.existsSync(configPath)) {
      console.error("[Hatch Error] No hatch.json found in current directory.");
      return null;
    }

    const config: HatchConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    console.log(`[Hatch] Building ${config.name} v${config.version} (Target: ${config.target})...`);

    // Resolve source files
    const sourceFiles = this.findSourceFiles(path.join(this.currentDir, "src"));
    const headerFiles = sourceFiles.filter((f) => f.endsWith(".h.ht"));
    const implFiles = sourceFiles.filter((f) => f.endsWith(".ht") && !f.endsWith(".h.ht"));

    const symbolTable = new SymbolTable();
    const resolver = new SymbolResolver(symbolTable);

    for (const hFile of headerFiles) {
      const code = fs.readFileSync(hFile, "utf-8");
      const tokens = new Lexer(code).tokenize();
      const ast = new Parser(tokens).parse(true);
      resolver.resolveHeader(ast);
    }

    if (config.target === "c") {
      const cGen = new CGenerator();
      const generatedCBlocks: string[] = [];

      for (const iFile of implFiles) {
        const code = fs.readFileSync(iFile, "utf-8");
        const tokens = new Lexer(code).tokenize();
        const ast = new Parser(tokens).parse(false);
        resolver.resolveImplementation(ast);
        generatedCBlocks.push(cGen.generate(ast));
      }

      const outDir = path.join(this.currentDir, path.dirname(config.output));
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const mergedCFile = path.join(outDir, `${config.name}_build.c`);
      fs.writeFileSync(mergedCFile, generatedCBlocks.join("\n\n"));

      const binaryPath = path.join(this.currentDir, config.output);
      const optFlag = config.compilerOptions?.optimizationLevel || "O2";
      const gccCmd = `gcc -${optFlag} "${mergedCFile}" -o "${binaryPath}"`;

      console.log(`[Hatch] Compiling C source: ${gccCmd}`);
      execSync(gccCmd, { stdio: "inherit" });
      console.log(`[Hatch] Build complete: ${config.output}`);
      return binaryPath;

    } else if (config.target === "js") {
      const jsGen = new JSGenerator();
      const generatedJSBlocks: string[] = [];

      for (const iFile of implFiles) {
        const code = fs.readFileSync(iFile, "utf-8");
        const tokens = new Lexer(code).tokenize();
        const ast = new Parser(tokens).parse(false);
        generatedJSBlocks.push(jsGen.generate(ast));
      }

      const jsOutputPath = path.join(this.currentDir, `${config.output}.js`);
      fs.writeFileSync(jsOutputPath, generatedJSBlocks.join("\n\n"));
      console.log(`[Hatch] JS bundle generated: ${config.output}.js`);
      return jsOutputPath;
    }

    return null;
  }

  private runProject(): void {
    const configPath = path.join(this.currentDir, "hatch.json");
    if (!fs.existsSync(configPath)) {
      console.error("[Hatch Error] No hatch.json found.");
      return;
    }

    const config: HatchConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    if (config.target === "jit") {
      console.log(`[Hatch] JIT Executing ${config.name}...`);
      const entryCode = fs.readFileSync(path.join(this.currentDir, config.entry), "utf-8");
      const jit = new HatchetJIT();
      jit.run(entryCode);
    } else {
      const outputPath = this.buildProject();
      if (outputPath && fs.existsSync(outputPath)) {
        console.log(`[Hatch] Executing ${outputPath}:\n---`);
        execSync(`"${outputPath}"`, { stdio: "inherit" });
      }
    }
  }

  private cleanProject(): void {
    const binDir = path.join(this.currentDir, "bin");
    if (fs.existsSync(binDir)) {
      fs.rmSync(binDir, { recursive: true, force: true });
      console.log("[Hatch] Cleaned bin/ build directory.");
    }
  }

  private printHelp(): void {
    console.log(`
Hatch build tool for Hatchet 1.2
--------------------------------
Usage: hatch <command> [options]

Commands:
  new <name>   Scaffolds a new Hatchet project
  build        Compiles current project according to hatch.json
  run          Builds and executes project binary/JIT script
  clean        Removes output build artifacts (bin/)
    `);
  }

  private findSourceFiles(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        results = results.concat(this.findSourceFiles(filePath));
      } else if (file.endsWith(".ht")) {
        results.push(filePath);
      }
    }
    return results;
  }
}