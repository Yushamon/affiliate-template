@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
node "%SCRIPT_DIR%apply-pfotentechnik-theme-kaufberatung-8.0.2.mjs" %*
exit /b %errorlevel%
