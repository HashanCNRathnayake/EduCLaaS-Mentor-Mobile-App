Param()
Set-StrictMode -Version Latest

$projectRoot = Resolve-Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) "..")
Set-Location $projectRoot

$nested = Join-Path $projectRoot "copilot-mobile"
if (Test-Path $nested) {
    Remove-Item -Recurse -Force $nested
}
New-Item -ItemType Directory -Path $nested | Out-Null

# Mirror project into nested folder so EAS projects configured with root "copilot-mobile"
# can resolve package.json at /build/copilot-mobile/package.json.
$excludeDirs = @(
    "node_modules",
    ".git",
    ".expo",
    "android",
    "ios",
    "dist",
    "web-build",
    "copilot-mobile"
)

$excludeFiles = @(
    "*.log",
    "*.tmp",
    "*.swp"
)

$robocopyArgs = @(
    "$projectRoot",
    "$nested",
    "*.*",
    "/E",
    "/NFL",
    "/NDL",
    "/NJH",
    "/NJS",
    "/NP",
    "/R:1",
    "/W:1"
)

if ($excludeDirs.Count -gt 0) {
    $robocopyArgs += "/XD"
    $robocopyArgs += $excludeDirs
}

if ($excludeFiles.Count -gt 0) {
    $robocopyArgs += "/XF"
    $robocopyArgs += $excludeFiles
}

& robocopy @robocopyArgs | Out-Null
$code = $LASTEXITCODE

# Robocopy return codes < 8 are success statuses.
if ($code -ge 8) {
    throw "robocopy failed with exit code $code"
}

Write-Output "Prepared nested build folder: $nested"
