@echo off
chcp 65001 >nul
echo ========================================
echo   查看服务器日志
echo ========================================
echo.
echo [1] Central Data Server
echo [2] Login Server
echo [3] Gateway Server
echo [4] Game Server
echo [5] 查看所有日志
echo.
set /p choice="请选择要查看的日志 (1-5): "

set OUTPUT_DIR=%~dp0..
set LOG_DIR=%OUTPUT_DIR%\logs

if "%choice%"=="1" (
    echo.
    echo 正在打开 Central Data Server 日志...
    notepad "%LOG_DIR%\central-data-server.log"
) else if "%choice%"=="2" (
    echo.
    echo 正在打开 Login Server 日志...
    notepad "%LOG_DIR%\login-server.log"
) else if "%choice%"=="3" (
    echo.
    echo 正在打开 Gateway Server 日志...
    notepad "%LOG_DIR%\gateway-server.log"
) else if "%choice%"=="4" (
    echo.
    echo 正在打开 Game Server 日志...
    notepad "%LOG_DIR%\game-server.log"
) else if "%choice%"=="5" (
    echo.
    echo 正在打开日志目录...
    explorer "%LOG_DIR%"
) else (
    echo.
    echo 无效的选择！
    pause
    exit /b 1
)
