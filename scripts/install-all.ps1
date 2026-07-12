#requires -Version 5.0
# =============================================================================
# INI Brain AI Universal - Auto Installer (Codex + Claude Desktop + Cline)
# =============================================================================
# This script automatically:
#   1) Installs npm dependencies and builds the MCP server (dist/mcp/server.js)
#   2) Adds the server to Codex CLI config (~/.codex/config.toml)
#   3) Adds the server to Claude Desktop (claude_desktop_config.json)
#   4) Adds the server to Cline (cline_mcp_settings.json)
#
# Usage (no admin rights needed):
#   cd ini-brain-ai-universal
#   powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1
#
# Skip flags:
#   -SkipBuild    do not rebuild
#   -InstallCodeIntel install optional codebase-memory-mcp (off by default)
#   -SkipCodex    do not modify Codex config
#   -SkipClaude   do not modify Claude Desktop config
#   -SkipCline    do not modify Cline config
# =============================================================================

[CmdletBinding()]
param(
  [switch]$SkipBuild,
  [switch]$InstallCodeIntel,
  [switch]$SkipCodeIntel,
  [switch]$SkipCodex,
  [switch]$SkipClaude,
  [switch]$SkipCline
)

$ErrorActionPreference = 'Stop'

function Write-Step($text) {
  Write-Host ""
  Write-Host "==> $text" -ForegroundColor Cyan
}

function Write-Ok($text)      { Write-Host "    [OK] $text" -ForegroundColor Green }
function Write-Warn2($text)   { Write-Host "    [!]  $text" -ForegroundColor Yellow }
function Write-ErrLine($text) { Write-Host "    [X]  $text" -ForegroundColor Red }
function Set-Utf8NoBom($Path, $Value) {
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  [System.IO.File]::WriteAllText($Path, $Value, [System.Text.UTF8Encoding]::new($false))
}

# ----- Resolve project root --------------------------------------------------
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ServerJs = Join-Path $ProjectRoot 'dist\mcp\server.js'
$ServerJsPosix = ($ServerJs -replace '\\', '/')

Write-Step "INI Brain AI Universal - Auto Installer"
Write-Host "    Project root : $ProjectRoot"
Write-Host "    Server path  : $ServerJs"

# ----- 1) Verify Node.js -----------------------------------------------------
Write-Step "1) Checking Node.js"
try {
  $nodeVersion = & node --version
  Write-Ok "Node.js detected: $nodeVersion"
} catch {
  Write-ErrLine "Node.js is not installed. Install it from https://nodejs.org and retry."
  exit 1
}

# ----- 2) Build the server ---------------------------------------------------
if (-not $SkipBuild) {
  Write-Step "2) npm install + build"
  Push-Location $ProjectRoot
  try {
    if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
      Write-Host "    Running: npm install"
      & npm install
      if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    } else {
      Write-Ok "node_modules already present"
    }
    Write-Host "    Running: npm run compile"
    & npm run compile
    if ($LASTEXITCODE -ne 0) { throw "npm run compile failed" }
    Write-Ok "dist/ built successfully"
  } finally {
    Pop-Location
  }
} else {
  Write-Warn2 "Build skipped (SkipBuild)"
}

if (-not (Test-Path $ServerJs)) {
  Write-ErrLine "Server file missing: $ServerJs"
  Write-ErrLine "Re-run without -SkipBuild"
  exit 1
}
Write-Ok "Server file ready: $ServerJs"

# ----- 3) Optional advanced Code Intelligence --------------------------------
if ($InstallCodeIntel -and -not $SkipCodeIntel) {
  Write-Step "3) Advanced Code Intelligence (optional)"
  try {
    $cbmVersion = & codebase-memory-mcp --version 2>$null
    if ($LASTEXITCODE -eq 0) {
      Write-Ok "codebase-memory-mcp already installed: $cbmVersion"
    } else {
      throw "codebase-memory-mcp returned exit code $LASTEXITCODE"
    }
  } catch {
    Write-Host "    Running: npm install -g codebase-memory-mcp"
    try {
      & npm install -g codebase-memory-mcp
      if ($LASTEXITCODE -ne 0) { throw "npm install -g codebase-memory-mcp failed" }
      $cbmVersion = & codebase-memory-mcp --version 2>$null
      Write-Ok "codebase-memory-mcp installed: $cbmVersion"
    } catch {
      Write-Warn2 "Could not install codebase-memory-mcp automatically. INI Brain Lite Graph fallback will still work."
      Write-Warn2 "$_"
    }
  }
} else {
  Write-Warn2 "Advanced Code Intelligence not installed. Use -InstallCodeIntel to opt in; Lite Graph remains available."
}

# ----- 4) Codex CLI config ---------------------------------------------------
if (-not $SkipCodex) {
  Write-Step "4) Codex CLI (~/.codex/config.toml)"
  $codexDir = Join-Path $env:USERPROFILE '.codex'
  $codexConfig = Join-Path $codexDir 'config.toml'
  if (-not (Test-Path $codexDir)) { New-Item -ItemType Directory -Path $codexDir | Out-Null }

  $existing = ''
  if (Test-Path $codexConfig) { $existing = Get-Content $codexConfig -Raw -ErrorAction SilentlyContinue }

  if ($existing -match '\[mcp_servers\.ini-brain-ai\]') {
    Write-Warn2 "ini-brain-ai already configured in Codex, replacing it."
    $pattern = '(?ms)\[mcp_servers\.ini-brain-ai\].*?(?=^\[|\z)'
    $existing = [regex]::Replace($existing, $pattern, '')
  }

  $block = @"

[mcp_servers.ini-brain-ai]
command = 'node'
args = ['$ServerJsPosix']
startup_timeout_sec = 120
"@

  $newContent = ($existing.TrimEnd() + "`r`n" + $block).TrimStart()
  Set-Utf8NoBom -Path $codexConfig -Value $newContent
  Write-Ok "Updated: $codexConfig"
} else {
  Write-Warn2 "Codex config skipped (SkipCodex)"
}

# ----- 5) Claude Desktop config ----------------------------------------------
if (-not $SkipClaude) {
  Write-Step "5) Claude Desktop"
  $claudeDir = Join-Path $env:APPDATA 'Claude'
  $claudeConfig = Join-Path $claudeDir 'claude_desktop_config.json'

  if (-not (Test-Path $claudeDir)) {
    Write-Warn2 "Claude folder not found: $claudeDir"
    Write-Warn2 "Install Claude Desktop from https://claude.ai/download then re-run."
  } else {
    $json = $null
    if (Test-Path $claudeConfig) {
      try { $json = Get-Content $claudeConfig -Raw | ConvertFrom-Json } catch { $json = $null }
    }
    if ($null -eq $json) { $json = [pscustomobject]@{} }
    if (-not ($json.PSObject.Properties.Name -contains 'mcpServers')) {
      $json | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{}) -Force
    }
    $entry = [pscustomobject]@{
      command     = 'node'
      args        = @($ServerJsPosix)
      disabled    = $false
      autoApprove = @()
    }
    $json.mcpServers | Add-Member -NotePropertyName 'ini-brain-ai' -NotePropertyValue $entry -Force
    Set-Utf8NoBom -Path $claudeConfig -Value ($json | ConvertTo-Json -Depth 12)
    Write-Ok "Updated: $claudeConfig"
    Write-Warn2 "Quit Claude Desktop completely (also from system tray) and reopen."
  }
} else {
  Write-Warn2 "Claude config skipped (SkipClaude)"
}

# ----- 6) Cline (VS Code) config ---------------------------------------------
if (-not $SkipCline) {
  Write-Step "6) Cline (VS Code)"
  $clineDir = Join-Path $env:APPDATA 'Code\User\globalStorage\saoudrizwan.claude-dev\settings'
  $clineConfig = Join-Path $clineDir 'cline_mcp_settings.json'

  if (-not (Test-Path $clineDir)) {
    Write-Warn2 "Cline settings folder not found: $clineDir"
    Write-Warn2 "Install the Cline extension in VS Code first, then re-run."
  } else {
    $json = $null
    if (Test-Path $clineConfig) {
      try { $json = Get-Content $clineConfig -Raw | ConvertFrom-Json } catch { $json = $null }
    }
    if ($null -eq $json) { $json = [pscustomobject]@{} }
    if (-not ($json.PSObject.Properties.Name -contains 'mcpServers')) {
      $json | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{}) -Force
    }
    $entry = [pscustomobject]@{
      command     = 'node'
      args        = @($ServerJsPosix)
      disabled    = $false
      autoApprove = @()
    }
    $json.mcpServers | Add-Member -NotePropertyName 'ini-brain-ai' -NotePropertyValue $entry -Force
    Set-Utf8NoBom -Path $clineConfig -Value ($json | ConvertTo-Json -Depth 12)
    Write-Ok "Updated: $clineConfig"
  }
} else {
  Write-Warn2 "Cline config skipped (SkipCline)"
}

# ----- Summary ---------------------------------------------------------------
Write-Step "Installation complete"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1) Codex : open a new PowerShell and run:  codex"
Write-Host "  2) Claude: quit Claude Desktop completely and reopen it."
Write-Host "  3) Cline : reload VS Code, open Cline > MCP Servers."
Write-Host ""
Write-Host "Quick test inside any client:" -ForegroundColor Cyan
Write-Host "  - call ini_brain_status"
Write-Host "  - call ini_brain_auto_brief for task: explain this project"
Write-Host ""
