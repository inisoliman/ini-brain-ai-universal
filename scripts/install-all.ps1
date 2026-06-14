# =============================================================================
# INI Brain AI Universal - Auto Installer (Codex + Claude Desktop + Cline)
# =============================================================================
# هذا السكربت يقوم تلقائيًا بـ:
#   1) تثبيت اعتمادات npm وبناء سيرفر MCP (dist/mcp/server.js)
#   2) إضافة السيرفر إلى إعدادات Codex CLI (~/.codex/config.toml)
#   3) إضافة السيرفر إلى إعدادات Claude Desktop (claude_desktop_config.json)
#   4) إضافة السيرفر إلى إعدادات Cline (cline_mcp_settings.json)
#
# طريقة التشغيل (PowerShell كمسؤول غير مطلوبة):
#   cd "C:\Users\helen\Downloads\vs\exbrain.all\ini-brain-ai-universal"
#   powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1
#
# يمكنك تخطي أي خطوة بمعاملات:
#   -SkipBuild   لا يعيد البناء
#   -SkipCodex   لا يعدّل إعدادات Codex
#   -SkipClaude  لا يعدّل إعدادات Claude Desktop
#   -SkipCline   لا يعدّل إعدادات Cline
# =============================================================================

[CmdletBinding()]
param(
  [switch]$SkipBuild,
  [switch]$SkipCodex,
  [switch]$SkipClaude,
  [switch]$SkipCline
)

$ErrorActionPreference = 'Stop'

function Write-Step($text) {
  Write-Host ""
  Write-Host "==> $text" -ForegroundColor Cyan
}

function Write-Ok($text)   { Write-Host "    [OK] $text" -ForegroundColor Green }
function Write-Warn2($text) { Write-Host "    [!]  $text" -ForegroundColor Yellow }
function Write-ErrLine($text) { Write-Host "    [X]  $text" -ForegroundColor Red }

# ----- اكتشاف مسار المشروع -----------------------------------------------------
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ServerJs = Join-Path $ProjectRoot 'dist\mcp\server.js'
$ServerJsPosix = ($ServerJs -replace '\\', '/')

Write-Step "INI Brain AI Universal - Auto Installer"
Write-Host "    Project root : $ProjectRoot"
Write-Host "    Server path  : $ServerJs"

# ----- 1) التحقق من Node.js ---------------------------------------------------
Write-Step "1) التحقق من Node.js"
try {
  $nodeVersion = & node --version
  Write-Ok "Node.js مكتشف: $nodeVersion"
} catch {
  Write-ErrLine "Node.js غير مثبت. ثبّته من https://nodejs.org ثم أعد التشغيل."
  exit 1
}

# ----- 2) بناء السيرفر --------------------------------------------------------
if (-not $SkipBuild) {
  Write-Step "2) تثبيت npm وبناء السيرفر"
  Push-Location $ProjectRoot
  try {
    if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
      Write-Host "    تشغيل: npm install"
      & npm install
      if ($LASTEXITCODE -ne 0) { throw "npm install فشل" }
    } else {
      Write-Ok "node_modules موجود مسبقًا"
    }
    Write-Host "    تشغيل: npm run compile"
    & npm run compile
    if ($LASTEXITCODE -ne 0) { throw "npm run compile فشل" }
    Write-Ok "تم بناء dist/ بنجاح"
  } finally {
    Pop-Location
  }
} else {
  Write-Warn2 "تم تخطي البناء (SkipBuild)"
}

if (-not (Test-Path $ServerJs)) {
  Write-ErrLine "ملف السيرفر غير موجود: $ServerJs"
  Write-ErrLine "أعد تشغيل السكربت بدون -SkipBuild"
  exit 1
}
Write-Ok "ملف السيرفر جاهز: $ServerJs"

# ----- 3) إعداد Codex CLI -----------------------------------------------------
if (-not $SkipCodex) {
  Write-Step "3) إعداد Codex CLI (~/.codex/config.toml)"
  $codexDir = Join-Path $env:USERPROFILE '.codex'
  $codexConfig = Join-Path $codexDir 'config.toml'
  if (-not (Test-Path $codexDir)) { New-Item -ItemType Directory -Path $codexDir | Out-Null }

  $existing = ''
  if (Test-Path $codexConfig) { $existing = Get-Content $codexConfig -Raw -ErrorAction SilentlyContinue }

  if ($existing -match '\[mcp_servers\.ini-brain-ai\]') {
    Write-Warn2 "إعداد ini-brain-ai موجود بالفعل في Codex، يتم تحديثه."
    # إزالة القسم القديم
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
  Set-Content -Path $codexConfig -Value $newContent -Encoding UTF8
  Write-Ok "تم تحديث: $codexConfig"
} else {
  Write-Warn2 "تم تخطي إعداد Codex (SkipCodex)"
}

# ----- 4) إعداد Claude Desktop -----------------------------------------------
if (-not $SkipClaude) {
  Write-Step "4) إعداد Claude Desktop"
  $claudeDir = Join-Path $env:APPDATA 'Claude'
  $claudeConfig = Join-Path $claudeDir 'claude_desktop_config.json'

  if (-not (Test-Path $claudeDir)) {
    Write-Warn2 "مجلد Claude غير موجود: $claudeDir"
    Write-Warn2 "ثبّت Claude Desktop أولًا من https://claude.ai/download ثم شغّل السكربت ثانية."
  } else {
    $json = $null
    if (Test-Path $claudeConfig) {
      try { $json = Get-Content $claudeConfig -Raw | ConvertFrom-Json } catch { $json = $null }
    }
    if ($null -eq $json) { $json = [pscustomobject]@{} }
    if (-not $json.PSObject.Properties.Name -contains 'mcpServers') {
      $json | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{}) -Force
    }
    $entry = [pscustomobject]@{
      command     = 'node'
      args        = @($ServerJsPosix)
      disabled    = $false
      autoApprove = @()
    }
    $json.mcpServers | Add-Member -NotePropertyName 'ini-brain-ai' -NotePropertyValue $entry -Force
    ($json | ConvertTo-Json -Depth 12) | Set-Content -Path $claudeConfig -Encoding UTF8
    Write-Ok "تم تحديث: $claudeConfig"
    Write-Warn2 "أعد تشغيل Claude Desktop بالكامل (Quit ثم فتحه)."
  }
} else {
  Write-Warn2 "تم تخطي إعداد Claude (SkipClaude)"
}

# ----- 5) إعداد Cline (داخل VS Code) -----------------------------------------
if (-not $SkipCline) {
  Write-Step "5) إعداد Cline (VS Code)"
  $clineDir = Join-Path $env:APPDATA 'Code\User\globalStorage\saoudrizwan.claude-dev\settings'
  $clineConfig = Join-Path $clineDir 'cline_mcp_settings.json'

  if (-not (Test-Path $clineDir)) {
    Write-Warn2 "مجلد إعدادات Cline غير موجود: $clineDir"
    Write-Warn2 "ثبّت إضافة Cline في VS Code أولًا، ثم أعد تشغيل السكربت."
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
    ($json | ConvertTo-Json -Depth 12) | Set-Content -Path $clineConfig -Encoding UTF8
    Write-Ok "تم تحديث: $clineConfig"
  }
} else {
  Write-Warn2 "تم تخطي إعداد Cline (SkipCline)"
}

# ----- النهاية ---------------------------------------------------------------
Write-Step "اكتمل التثبيت"
Write-Host ""
Write-Host "الخطوات التالية:" -ForegroundColor Cyan
Write-Host "  1) لـ Codex : افتح PowerShell جديد ثم نفّذ:  codex"
Write-Host "  2) لـ Claude: أغلق Claude Desktop تمامًا وافتحه. ستجد ini-brain-ai في قائمة MCP."
Write-Host "  3) لـ Cline : أعد تحميل VS Code، ثم افتح Cline > MCP Servers."
Write-Host ""
Write-Host "اختبار سريع داخل أي عميل:" -ForegroundColor Cyan
Write-Host "  - اطلب: 'استدعِ ini_brain_status'"
Write-Host "  - أو:   'استدعِ ini_brain_get_context للمهمة: شرح هذا المشروع'"
Write-Host ""
