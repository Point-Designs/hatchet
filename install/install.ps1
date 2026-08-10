$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     Hatchet transpiler CLI installer     " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "Error: Node.js and npm are required to build Hatchet. Please install Node.js first."
    exit 1
}

Write-Host "`n[1/3] Installing dependencies and building..." -ForegroundColor Yellow
npm install
npm run build

$InstallDir = "$env:USERPROFILE\.hatchet\bin"
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

Write-Host "[2/3] Copying executable files to $InstallDir..." -ForegroundColor Yellow
Copy-Item -Path "dist\*" -Destination $InstallDir -Recurse -Force
Copy-Item -Path "package.json" -Destination "$env:USERPROFILE\.hatchet\" -Force

$BatchLauncher = "$InstallDir\hatchet.cmd"
"@echo off`nnode `"$env:USERPROFILE\.hatchet\bin\index.js`" %*" | Out-File -FilePath $BatchLauncher -Encoding ascii

Write-Host "[3/3] Updating System PATH..." -ForegroundColor Yellow
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($UserPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$UserPath;$InstallDir", "User")
    Write-Host "Added $InstallDir to User PATH." -ForegroundColor Green
} else {
    Write-Host "$InstallDir is already in PATH." -ForegroundColor Gray
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "       Good, Hatchet is installed.         " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Restart your terminal and run: hatchet --help" -ForegroundColor White