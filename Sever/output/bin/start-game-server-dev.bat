@echo off
chcp 65001 >nul
echo ========================================
echo   启动 Game Server (开发环境)
echo ========================================
echo.

set OUTPUT_DIR=%~dp0..
set CONFIG_DIR=%OUTPUT_DIR%\config
set LOG_DIR=%OUTPUT_DIR%\logs
set SERVERS_DIR=%OUTPUT_DIR%\servers

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo 环境: 开发环境 (Development)
echo 热更新: 已启用
echo 配置目录: %CONFIG_DIR%
echo 日志目录: %LOG_DIR%
echo.

:: 开发环境JVM参数（轻量级）
set JVM_OPTS=-Xms512m -Xmx1g

:: Spring Boot参数
set SPRING_OPTS=--spring.profiles.active=dev
set SPRING_OPTS=%SPRING_OPTS% --spring.config.additional-location=file:///%CONFIG_DIR%/application-common.yml

echo 正在启动 Game Server (开发模式)...
echo.

start "Game-Server-Dev" cmd /c "cd /d %SERVERS_DIR%\game-server && java %JVM_OPTS% -jar game-server-1.0.0.jar %SPRING_OPTS% > %LOG_DIR%\game-server.log 2>&1"

echo.
echo ========================================
echo   Game Server 已启动 (开发环境)
echo ========================================
echo.
echo 日志文件: %LOG_DIR%\game-server.log
echo 健康检查: http://localhost:8084/actuator/health
echo.
echo 开发环境特性:
echo   - 热更新: 启用
echo   - 日志级别: DEBUG
echo   - 快速启动
echo.
pause
