@echo off
chcp 65001 >nul
echo ========================================
echo   快速重新编译单个服务器
echo ========================================
echo.
echo [1] Central Data Server
echo [2] Login Server
echo [3] Gateway Server
echo [4] Game Server
echo [5] 全部服务器
echo.
set /p choice="请选择要重新编译的服务器 (1-5): "

set PROJECT_DIR=%~dp0
set OUTPUT_DIR=%PROJECT_DIR%output

if "%choice%"=="1" (
    set MODULE=central-data-server
) else if "%choice%"=="2" (
    set MODULE=login-server
) else if "%choice%"=="3" (
    set MODULE=gateway-server
) else if "%choice%"=="4" (
    set MODULE=game-server
) else if "%choice%"=="5" (
    echo.
    echo 重新编译所有服务器，请运行 build-and-deploy.bat
    pause
    exit /b 0
) else (
    echo.
    echo 无效的选择！
    pause
    exit /b 1
)

echo.
echo [1/3] 编译 %MODULE%...
call mvn clean package -pl %MODULE% -am -DskipTests
if errorlevel 1 (
    echo [错误] 编译失败！
    pause
    exit /b 1
)

echo.
echo [2/3] 复制JAR文件到 output/servers/%MODULE%/...
copy /y "%MODULE%\target\%MODULE%-1.0.0.jar" "%OUTPUT_DIR%\servers\%MODULE%\" >nul
if exist "%MODULE%\src\main\resources\application.yml" (
    copy /y "%MODULE%\src\main\resources\application.yml" "%OUTPUT_DIR%\servers\%MODULE%\" >nul
)

echo.
echo [3/3] 完成！
echo.
echo ========================================
echo   %MODULE% 重新编译完成！
echo ========================================
echo.
echo [提示] 运行以下命令重启服务器:
echo   cd output\bin
echo   restart-%MODULE%.bat
echo.
pause
