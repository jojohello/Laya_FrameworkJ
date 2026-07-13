@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js was not found in PATH.
    echo Please install Node.js or add it to PATH, then run this file again.
    pause
    exit /b 1
)

echo ========================================
echo Export client configs
echo ========================================
node tools\exportClient.js
if errorlevel 1 (
    echo.
    echo [ERROR] Client config export failed.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Export server configs
echo ========================================
node tools\exportServer.js
if errorlevel 1 (
    echo.
    echo [ERROR] Server config export failed.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Config export completed successfully.
echo ========================================
pause
