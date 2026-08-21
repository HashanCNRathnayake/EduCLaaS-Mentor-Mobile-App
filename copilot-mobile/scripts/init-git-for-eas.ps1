Param()
Set-StrictMode -Version Latest
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location (Join-Path $scriptDir "..")
if (Test-Path -Path .git -PathType Container) {
    Write-Output "Git repo already exists in $(Get-Location)"
    exit 0
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git not found. Install git and re-run this script."
    exit 2
}
git init
git add .
try {
    git commit -m "chore: prepare for EAS build (init repo for packaging)"
} catch {
    Write-Output "Commit failed (likely missing user.name/user.email); you can set them or run the commit manually."
}
Write-Output "Git initialized. Run: npx eas-cli build -p android --profile preview --clear-cache"
