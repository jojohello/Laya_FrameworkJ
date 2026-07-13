@echo off
chcp 65001 >nul
echo ========================================
echo   启动 Central Data Server
echo ========================================
echo.

set OUTPUT_DIR=%~dp0..
set CONFIG_DIR=%OUTPUT_DIR%\config
set LOG_DIR=%OUTPUT_DIR%\logs
set SERVERS_DIR=%OUTPUT_DIR%\servers
set JVM_ENCODING_OPTS=-Dfile.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -Dsun.stderr.encoding=UTF-8

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo 正在启动 Central Data Server...
start "Central-Data-Server" cmd /c "cd /d %SERVERS_DIR%\central-data-server && java %JVM_ENCODING_OPTS% -jar central-data-server-1.0.0.jar --spring.config.additional-location=file:///%CONFIG_DIR%/application-common.yml > %LOG_DIR%\central-data-server.log 2>&1"

echo.
echo Central Data Server 已启动！
echo 日志文件: %LOG_DIR%\central-data-server.log
echo 健康检查: http://localhost:8083/actuator/health
echo.
pause
