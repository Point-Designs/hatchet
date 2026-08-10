import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [consoleLog, setConsoleLog] = useState<string>("");

  const handleBuildAndRun = async () => {
    setIsRunning(true);
    setConsoleLog("Building and launching project\n");

    try {
      const transpileResult: string = await invoke("transpile_hatchet", {
        source: code,
        target: project.target,
      });

      setConsoleLog((prev) => prev + "Transpilation successful.\n");

      const runResult: string = await invoke("run_project", {
        projectDir: projectPath ? projectPath.replace(/\/[^\/]+$/, "") : ".",
        target: project.target,
        buildDir: project.build_dir,
      });

      setConsoleLog((prev) => prev + `\n--- Execution output ---\n${runResult}\n`);
    } catch (err) {
      setConsoleLog((prev) => prev + `\nBuild/Execution error:\n${err}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        handleBuildAndRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, project]);

  return (
    <div className="toolbar">
      <span className="logo">Hatchet {project.name}</span>

      {/* Build & run controls */}
      <button 
        className="run-btn" 
        onClick={handleBuildAndRun} 
        disabled={isRunning}
      >
        {isRunning ? "Running" : "▶ Run (F5)"}
      </button>

      {/* Target selector */}
      <select
        value={project.target}
        onChange={(e) => setProject({ ...project, target: e.target.value })}
      >
        <option value="gml">Target: GameMaker (GML)</option>
        <option value="csharp">Target: C# (.NET)</option>
        <option value="gdscript">Target: Godot (GDScript)</option>
      </select>
    </div>
  );
};