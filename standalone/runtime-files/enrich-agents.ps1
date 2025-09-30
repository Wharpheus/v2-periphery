Param()
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
Write-Host "[agent-enrich] Node version:"; node -v
Write-Host "[agent-enrich] Running pipeline on $PWD"
node "$PSScriptRoot\..\..\scripts\copilotAgentRuntime_enrich.mjs" --dir "$PSScriptRoot"
Write-Host "[agent-enrich] Exit code: $LASTEXITCODE"
