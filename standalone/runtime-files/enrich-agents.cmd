@echo off
setlocal
cd /d "%~dp0"
echo [agent-enrich] Node version:
node -v
echo [agent-enrich] Running pipeline on %CD%
node "..\..\scripts\copilotAgentRuntime_enrich.mjs" --dir "."
set ERR=%ERRORLEVEL%
echo [agent-enrich] Exit code: %ERR%
echo [agent-enrich] Done. Press any key to exit...
pause >nul
exit /b %ERR%
