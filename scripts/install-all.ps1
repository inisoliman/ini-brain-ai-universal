#requires -Version 5.0
# INI Brain installer: build locally, configure only detected selected clients.
[CmdletBinding()]
param(
  [switch]$SkipBuild,
  [switch]$InstallCodeIntel,
  [switch]$SkipCodeIntel,
  [switch]$SkipCodex,
  [switch]$SkipClaude,
  [switch]$SkipCline,
  [string[]]$Clients = @('codex', 'claude', 'cline', 'opencode')
)
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ServerJs = Join-Path $ProjectRoot 'dist\mcp\server.js'
function Write-Step($text) { Write-Host "==> $text" -ForegroundColor Cyan }
Write-Step 'INI Brain AI Universal installer'
& node --version
if ($LASTEXITCODE -ne 0) { throw 'Node.js is required.' }
if (-not $SkipBuild) {
  Push-Location $ProjectRoot
  try {
    if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
      & npm.cmd install
      if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
    }
    & npm.cmd run compile
    if ($LASTEXITCODE -ne 0) { throw 'compile failed' }
  } finally { Pop-Location }
}
if (-not (Test-Path $ServerJs)) { throw 'Server missing; rerun without -SkipBuild.' }
if ($InstallCodeIntel -and -not $SkipCodeIntel) {
  try {
    & codebase-memory-mcp --version
    if ($LASTEXITCODE -ne 0) { throw 'Advanced provider unavailable.' }
  } catch {
    & npm.cmd install -g codebase-memory-mcp
    if ($LASTEXITCODE -ne 0) { Write-Warning 'Advanced provider unavailable; Lite Graph remains active.' }
  }
}
# Both installers share validation, backups, atomic updates and option preservation.
$selected = @($Clients | Where-Object {
  -not (($_ -eq 'codex' -and $SkipCodex) -or ($_ -eq 'claude' -and $SkipClaude) -or ($_ -eq 'cline' -and $SkipCline))
})
if ($selected.Count -gt 0) {
  & node (Join-Path $ScriptDir 'install-mcp-clients.cjs') $ServerJs ($selected -join ',')
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'Some configs were refused unchanged. Review errors and merge manually.'
    exit 1
  }
}
Write-Step 'Installation complete'
Write-Host 'Restart selected clients. Call ini_brain_status first, then ini_brain_auto_brief and ini_brain_get_context.'
Write-Host 'For no-roots desktop hosts, pass the current project workspace on EVERY call.'
