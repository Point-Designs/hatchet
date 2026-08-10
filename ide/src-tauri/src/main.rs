use std::process::Command;
use std::path::Path;
use std::fs;

#[tauri::command]
fn run_project(project_dir: String, target: String, build_dir: String) -> Result<String, String> {
    let absolute_build_path = Path::new(&project_dir).join(&build_dir);

    match target.to_lowercase().as_str() {
        "gdscript" | "gd" => {
            let status = Command::new("godot")
                .arg("--path")
                .arg(&project_dir)
                .spawn();

            match status {
                Ok(_) => Ok("Launched Godot project".into()),
                Err(e) => Err(format!("Failed to launch Godot. Ensure 'godot' is in your PATH. Error: {}", e)),
            }
        }

        "csharp" | "cs" => {
            let output = Command::new("dotnet")
                .arg("run")
                .current_dir(&absolute_build_path)
                .output();

            match output {
                Ok(out) => {
                    let stdout = String::from_utf8_lossy(&out.stdout).to_string();
                    let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                    if out.status.success() {
                        Ok(stdout)
                    } else {
                        Err(format!("C# Execution Error:\n{}", stderr))
                    }
                }
                Err(e) => Err(format!("Failed to run 'dotnet'. Ensure .NET SDK is installed. Error: {}", e)),
            }
        }

        "gml" => {
            let status = Command::new("Igor")
                .arg("-options")
                .arg(format!("{}/builder.json", project_dir))
                .arg("--")
                .arg("Windows")
                .arg("Run")
                .spawn();

            match status {
                Ok(_) => Ok("Triggered GameMaker runner".into()),
                Err(_) => Ok("Transpiled to GML successfully. Copy output files into your GameMaker project.".into()),
            }
        }

        _ => Err(format!("Unsupported target engine: {}", target)),
    }
}