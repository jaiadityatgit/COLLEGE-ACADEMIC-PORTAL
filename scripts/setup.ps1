# PowerShell setup script for College Academic Portal — EE-VDT Department Operating System
# Run this script to bootstrap the directory layout and configuration templates under C:\StudyAI

$targetDir = "C:\StudyAI"

Write-Host "Creating target directories under $targetDir..." -ForegroundColor Green
$dirs = @(
    "$targetDir\frontend\public",
    "$targetDir\frontend\src\assets",
    "$targetDir\frontend\src\components\common",
    "$targetDir\frontend\src\components\layout",
    "$targetDir\frontend\src\components\ui",
    "$targetDir\frontend\src\pages\student",
    "$targetDir\frontend\src\pages\faculty",
    "$targetDir\frontend\src\pages\hod",
    "$targetDir\frontend\src\pages\admin",
    "$targetDir\frontend\src\services",
    "$targetDir\frontend\src\store",
    "$targetDir\backend\src\config",
    "$targetDir\backend\src\middleware",
    "$targetDir\backend\src\models",
    "$targetDir\backend\src\controllers",
    "$targetDir\backend\src\routes",
    "$targetDir\backend\src\services",
    "$targetDir\docs",
    "$targetDir\scripts",
    "$targetDir\deployment"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

Write-Host "College Academic Portal Platform Skeleton Bootstrapped successfully at $targetDir!" -ForegroundColor Green
