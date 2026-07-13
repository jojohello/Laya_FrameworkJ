@echo off
chcp 65001 >nul
echo ========================================
echo   启动 Game Server (生产环境优化)
echo ========================================
echo.

set OUTPUT_DIR=%~dp0..
set CONFIG_DIR=%OUTPUT_DIR%\config
set LOG_DIR=%OUTPUT_DIR%\logs
set SERVERS_DIR=%OUTPUT_DIR%\servers

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo 环境: 生产环境 (Production)
echo JVM优化: 已启用
echo 配置目录: %CONFIG_DIR%
echo 日志目录: %LOG_DIR%
echo.

:: JVM优化参数
set JVM_OPTS=-server
set JVM_OPTS=%JVM_OPTS% -Xms2g -Xmx4g
set JVM_OPTS=%JVM_OPTS% -XX:+UseG1GC
set JVM_OPTS=%JVM_OPTS% -XX:MaxGCPauseMillis=200
set JVM_OPTS=%JVM_OPTS% -XX:+UseStringDeduplication
set JVM_OPTS=%JVM_OPTS% -XX:+OptimizeStringConcat
set JVM_OPTS=%JVM_OPTS% -XX:+TieredCompilation
set JVM_OPTS=%JVM_OPTS% -XX:+AggressiveOpts
set JVM_OPTS=%JVM_OPTS% -XX:+UseCompressedOops
set JVM_OPTS=%JVM_OPTS% -XX:+UseCompressedClassPointers

:: GC日志（可选）
:: set JVM_OPTS=%JVM_OPTS% -Xlog:gc*:file=%LOG_DIR%\gc.log:time,uptime,level,tags

:: Spring Boot参数
set SPRING_OPTS=--spring.profiles.active=prod
set SPRING_OPTS=%SPRING_OPTS% --spring.config.additional-location=file:///%CONFIG_DIR%/application-common.yml

echo 正在启动 Game Server (生产模式)...
echo JVM参数: %JVM_OPTS%
echo.

start "Game-Server-Prod" cmd /c "cd /d %SERVERS_DIR%\game-server && java %JVM_OPTS% -jar game-server-1.0.0.jar %SPRING_OPTS% > %LOG_DIR%\game-server.log 2>&1"

echo.
echo ========================================
echo   Game Server 已启动 (生产环境)
echo ========================================
echo.
echo 日志文件: %LOG_DIR%\game-server.log
echo 健康检查: http://localhost:8084/actuator/health
echo.
echo JVM优化配置:
echo   - 堆内存: 2GB-4GB
echo   - GC: G1垃圾回收器
echo   - 字符串优化: 已启用
echo   - 分层编译: 已启用
echo.
pause
