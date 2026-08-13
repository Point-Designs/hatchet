import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const DEFAULT_TEMPLATE_REPO = "https://github.com/Iconictacoma/hatchettemp.git";

export class HatchCLI {
  private currentDir: string;

  constructor(currentDir: string = process.cwd()) {
    this.currentDir = currentDir;
  }

  private createNewProject(projectName?: string, customRepo?: string): void {
    if (!projectName) {
      console.error("[Hatch Error] Please specify a project name: hatch new <project_name>");
      return;
    }

    const targetPath = path.join(this.currentDir, projectName);

    if (fs.existsSync(targetPath)) {
      console.error(`[Hatch Error] Directory '${projectName}' already exists.`);
      return;
    }

    const repoUrl = customRepo || DEFAULT_TEMPLATE_REPO;

    try {
      console.log(`[Hatch] Cloning template repository from ${repoUrl}...`);

      execSync(`git clone --depth=1 "${repoUrl}" "${targetPath}"`, { stdio: "inherit" });

      const gitDir = path.join(targetPath, ".git");
      if (fs.existsSync(gitDir)) {
        fs.rmSync(gitDir, { recursive: true, force: true });
      }

      const configPath = path.join(targetPath, "hatch.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        config.name = projectName;
        config.output = `bin/${projectName}`;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      }

      console.log(`\n[Hatch] Successfully created project '${projectName}' from template!`);
      console.log(`[Hatch] Run the following commands to get started:\n`);
      console.log(`  cd ${projectName}`);
      console.log(`  hatch run\n`);

    } catch (error) {
      console.error(`[Hatch Error] Failed to clone template repository.`);
    }
  }
}