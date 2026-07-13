@echo off
chcp 65001 >nul
echo ========================================
echo   重启 Game Server
echo ========================================
echo.

:: 停止 Game Server
echo [1/2] 停止 Game Server...
taskkill /FI "WindowTitle eq Game-Server*" /T /F >nul 2>&1
if errorlevel 1 (
    echo       Game Server 未运行
) else (
    echo       Game Server 已停止
    timeout /t 3 /nobreak >nul
)

:: 启动 Game Server
echo [2/2] 启动 Game Server...
set OUTPUT_DIR=%~dp0..
set CONFIG_DIR=%OUTPUT_DIR%\config
set LOG_DIR=%OUTPUT_DIR%\logs
set SERVERS_DIR=%OUTPUT_DIR%\servers

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

start "Game-Server" /MIN cmd /c "cd /d %SERVERS_DIR%\game-server && java -jar game-server-1.0.0.jar --spring.config.additional-location=file:///%CONFIG_DIR%/application-common.yml --laya.game.config.tables-path=%CONFIG_DIR%/tables > %LOG_DIR%\game-server.log 2>&1"

echo.
echo ========================================
echo   Game Server 已重启！
echo ========================================
echo.
echo 日志文件: %LOG_DIR%\game-server.log
echo 健康检查: http://localhost:8084/actuator/health
echo.
echo [提示] 策划修改配置表后，运行此脚本即可热更新
echo.
pause
