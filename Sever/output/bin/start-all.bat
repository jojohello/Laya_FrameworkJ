@echo off
chcp 65001 >nul
echo ========================================
echo   Laya Game Server - 启动所有服务器
echo ========================================
echo.

set OUTPUT_DIR=%~dp0..
set CONFIG_DIR=%OUTPUT_DIR%\config
set LOG_DIR=%OUTPUT_DIR%\logs
set SERVERS_DIR=%OUTPUT_DIR%\servers
set JVM_ENCODING_OPTS=-Dfile.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -Dsun.stderr.encoding=UTF-8

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

java -version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Java 环境，请先安装 JDK 21 或更高版本
    pause
    exit /b 1
)

echo [启动顺序]
echo   1. Central Data Server  ^(端口 8083^)
echo   2. Login Server         ^(端口 8081^)
echo   3. Gateway Server       ^(端口 8082^)
echo   4. Game Server          ^(端口 8084^)
echo.
echo 正在启动服务器...
echo.

echo [1/4] 启动 Central Data Server...
start "Central-Data-Server" /MIN cmd /c "cd /d %SERVERS_DIR%\central-data-server && java %JVM_ENCODING_OPTS% -jar central-data-server-1.0.0.jar --spring.config.additional-location=file:///%CONFIG_DIR%/application-common.yml > %LOG_DIR%\central-data-server.log 2>&1"
echo       等待 Central Data Server 初始化...
timeout /t 15 /nobreak >nul

echo [2/4] 启动 Login Server...
start "Login-Server" /MIN cmd /c "cd /d %SERVERS_DIR%\login-server && java %JVM_ENCODING_OPTS% -jar login-server-1.0.0.jar --spring.config.additional-location=file:///%CONFIG_DIR%/application-common.yml > %LOG_DIR%\login-server.log 2>&1"
echo       等待 Login Server 初始化...
timeout /t 8 /nobreak >nul

echo [3/4] 启动 Gateway Server...
start "Gateway-Server" /MIN cmd /c "cd /d %SERVERS_DIR%\gateway-server && java %JVM_ENCODING_OPTS% -jar gateway-server-1.0.0.jar --spring.config.additional-location=file:///%CONFIG_DIR%/application-common.yml > %LOG_DIR%\gateway-server.log 2>&1"
echo       等待 Gateway Server 初始化...
timeout /t 12 /nobreak >nul

echo [4/4] 启动 Game Server...
start "Game-Server" /MIN cmd /c "cd /d %SERVERS_DIR%\game-server && java %JVM_ENCODING_OPTS% -jar game-server-1.0.0.jar --spring.config.additional-location=file:///%CONFIG_DIR%/application-common.yml --laya.game.config.tables-path=%CONFIG_DIR%/tables > %LOG_DIR%\game-server.log 2>&1"
echo       等待 Game Server 初始化...
timeout /t 8 /nobreak >nul

echo.
echo ========================================
echo   所有服务器已启动完成！
echo ========================================
echo.
echo [服务器列表]
echo   - Central Data Server: http://localhost:8083/actuator/health
echo   - Login Server:        http://localhost:8081/actuator/health
echo   - Gateway Server:      http://localhost:8082/actuator/health
echo   - Game Server:         http://localhost:8084/actuator/health
echo.
echo [重要目录]
echo   - 日志目录: %LOG_DIR%
echo   - 配置目录: %CONFIG_DIR%
echo   - 配置表:   %CONFIG_DIR%\tables
echo.
echo [提示]
echo   - 修改配置表后，运行 restart-game-server.bat 重启 Game Server
echo   - 查看日志: cd %LOG_DIR% ^& tail -f game-server.log
echo   - 停止服务器: 运行 stop-all.bat
echo.
pause
