@echo off
chcp 65001 >nul
echo ========================================
echo   Laya Game Server - 构建并部署
echo ========================================
echo.

:: 设置环境变量
set PROJECT_DIR=%~dp0
set OUTPUT_DIR=%PROJECT_DIR%output

echo [工作目录] %PROJECT_DIR%
echo [输出目录] %OUTPUT_DIR%
echo.

:: 检查Maven环境
call mvn -version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Maven环境，请先安装Maven
    pause
    exit /b 1
)

:: 询问是否清理旧的output
echo [提示] 检测到现有 output 目录
set /p clean_output="是否清理旧的部署文件? (y/n, 默认n): "
if /i "%clean_output%"=="y" (
    echo.
    echo [1/5] 清理旧的 output 目录...
    if exist "%OUTPUT_DIR%\servers" rmdir /s /q "%OUTPUT_DIR%\servers"
    if exist "%OUTPUT_DIR%\logs" rmdir /s /q "%OUTPUT_DIR%\logs"
    mkdir "%OUTPUT_DIR%\servers"
    mkdir "%OUTPUT_DIR%\logs"
    echo       已清理
) else (
    echo.
    echo [1/5] 跳过清理
)

:: Maven 清理和编译
echo.
echo [2/5] Maven 清理...
call mvn clean
if errorlevel 1 (
    echo [错误] Maven 清理失败！
    pause
    exit /b 1
)

echo.
echo [3/5] Maven 编译打包 (跳过测试)...
call mvn package -DskipTests
if errorlevel 1 (
    echo [错误] Maven 编译失败！
    pause
    exit /b 1
)

:: 复制JAR文件到output目录
echo.
echo [4/5] 复制JAR文件到 output/servers/...

:: Central Data Server
if exist "central-data-server\target\central-data-server-1.0.0.jar" (
    echo       - central-data-server-1.0.0.jar
    copy /y "central-data-server\target\central-data-server-1.0.0.jar" "%OUTPUT_DIR%\servers\central-data-server\" >nul
    if exist "central-data-server\src\main\resources\application.yml" (
        copy /y "central-data-server\src\main\resources\application.yml" "%OUTPUT_DIR%\servers\central-data-server\" >nul
    )
) else (
    echo       [警告] central-data-server JAR未找到
)

:: Login Server
if exist "login-server\target\login-server-1.0.0.jar" (
    echo       - login-server-1.0.0.jar
    copy /y "login-server\target\login-server-1.0.0.jar" "%OUTPUT_DIR%\servers\login-server\" >nul
    if exist "login-server\src\main\resources\application.yml" (
        copy /y "login-server\src\main\resources\application.yml" "%OUTPUT_DIR%\servers\login-server\" >nul
    )
) else (
    echo       [警告] login-server JAR未找到
)

:: Gateway Server
if exist "gateway-server\target\gateway-server-1.0.0.jar" (
    echo       - gateway-server-1.0.0.jar
    copy /y "gateway-server\target\gateway-server-1.0.0.jar" "%OUTPUT_DIR%\servers\gateway-server\" >nul
    if exist "gateway-server\src\main\resources\application.yml" (
        copy /y "gateway-server\src\main\resources\application.yml" "%OUTPUT_DIR%\servers\gateway-server\" >nul
    )
) else (
    echo       [警告] gateway-server JAR未找到
)

:: Game Server
if exist "game-server\target\game-server-1.0.0.jar" (
    echo       - game-server-1.0.0.jar
    copy /y "game-server\target\game-server-1.0.0.jar" "%OUTPUT_DIR%\servers\game-server\" >nul
    if exist "game-server\src\main\resources\application.yml" (
        copy /y "game-server\src\main\resources\application.yml" "%OUTPUT_DIR%\servers\game-server\" >nul
    )
) else (
    echo       [警告] game-server JAR未找到
)

:: 复制配置文件（如果不存在）
echo.
echo [5/5] 检查配置文件...
if not exist "%OUTPUT_DIR%\config\application-common.yml" (
    echo       [提示] 首次部署，需要手动配置 output/config/application-common.yml
)
if not exist "%OUTPUT_DIR%\config\tables\items.json" (
    echo       [提示] 首次部署，需要添加配置表到 output/config/tables/
)

echo.
echo ========================================
echo   构建部署完成！
echo ========================================
echo.
echo [部署位置] %OUTPUT_DIR%
echo.
echo [下一步操作]
echo   1. 检查配置文件: %OUTPUT_DIR%\config\application-common.yml
echo   2. 检查配置表:   %OUTPUT_DIR%\config\tables\
echo   3. 启动服务器:   cd output\bin ^& start-all.bat
echo.
echo [JAR文件列表]
dir /b "%OUTPUT_DIR%\servers\*\*.jar" 2>nul
echo.
pause
