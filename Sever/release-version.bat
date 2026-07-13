@echo off
chcp 65001 >nul
echo ========================================
echo   Laya Game Server - 版本发布
echo ========================================
echo.

set PROJECT_DIR=%~dp0
set OUTPUT_DIR=%PROJECT_DIR%output

:: 检查是否在Git仓库中
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [错误] 当前目录不是Git仓库！
    pause
    exit /b 1
)

:: 获取当前分支
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%i
echo [当前分支] %CURRENT_BRANCH%
echo.

:: 检查是否有未提交的更改
git diff-index --quiet HEAD --
if errorlevel 1 (
    echo [警告] 检测到未提交的更改！
    echo.
    git status --short
    echo.
    set /p continue="是否继续发布? (y/n): "
    if /i not "%continue%"=="y" (
        echo 取消发布
        pause
        exit /b 0
    )
)

:: 输入版本号
echo.
echo [版本号格式] v1.0.0, v1.0.1, v1.1.0 等
set /p VERSION="请输入版本号: "

if "%VERSION%"=="" (
    echo [错误] 版本号不能为空！
    pause
    exit /b 1
)

:: 确认版本号
echo.
echo ========================================
echo   准备发布版本: %VERSION%
echo   当前分支: %CURRENT_BRANCH%
echo ========================================
echo.
set /p confirm="确认发布? (y/n): "
if /i not "%confirm%"=="y" (
    echo 取消发布
    pause
    exit /b 0
)

:: 1. 构建项目
echo.
echo [1/5] 构建项目...
call build-and-deploy.bat
if errorlevel 1 (
    echo [错误] 构建失败！
    pause
    exit /b 1
)

:: 2. 创建Git Tag
echo.
echo [2/5] 创建Git Tag: %VERSION%...
git tag -a %VERSION% -m "Release %VERSION%"
if errorlevel 1 (
    echo [错误] 创建Tag失败！
    pause
    exit /b 1
)

:: 3. 打包发布文件
echo.
echo [3/5] 打包发布文件...
set RELEASE_NAME=laya-game-server-%VERSION%.tar.gz
cd output
tar -czf "../%RELEASE_NAME%" .
cd ..

if not exist "%RELEASE_NAME%" (
    echo [错误] 打包失败！
    git tag -d %VERSION%
    pause
    exit /b 1
)

echo       打包完成: %RELEASE_NAME%

:: 4. 推送到远程仓库
echo.
echo [4/5] 推送到远程仓库...
set /p push_remote="是否推送到远程仓库? (y/n): "
if /i "%push_remote%"=="y" (
    git push origin %CURRENT_BRANCH%
    git push origin %VERSION%
    echo       推送完成
) else (
    echo       跳过推送（记得稍后手动推送：git push origin %VERSION%）
)

:: 5. 生成发布说明
echo.
echo [5/5] 生成发布说明...
echo # Release %VERSION% > RELEASE_NOTES_%VERSION%.md
echo. >> RELEASE_NOTES_%VERSION%.md
echo ## 发布日期 >> RELEASE_NOTES_%VERSION%.md
echo %date% %time% >> RELEASE_NOTES_%VERSION%.md
echo. >> RELEASE_NOTES_%VERSION%.md
echo ## 发布内容 >> RELEASE_NOTES_%VERSION%.md
echo - 发布包: %RELEASE_NAME% >> RELEASE_NOTES_%VERSION%.md
echo - 分支: %CURRENT_BRANCH% >> RELEASE_NOTES_%VERSION%.md
echo - Git Tag: %VERSION% >> RELEASE_NOTES_%VERSION%.md
echo. >> RELEASE_NOTES_%VERSION%.md
echo ## 最近提交 >> RELEASE_NOTES_%VERSION%.md
git log -5 --oneline >> RELEASE_NOTES_%VERSION%.md

echo       发布说明已生成: RELEASE_NOTES_%VERSION%.md

:: 完成
echo.
echo ========================================
echo   版本 %VERSION% 发布完成！
echo ========================================
echo.
echo [发布文件]
echo   - 发布包: %RELEASE_NAME%
echo   - 发布说明: RELEASE_NOTES_%VERSION%.md
echo   - Git Tag: %VERSION%
echo.
echo [下一步操作]
echo   1. 将 %RELEASE_NAME% 上传到发布服务器或云存储
echo   2. 在GitHub/GitLab上创建Release（如果使用）
echo   3. 通知团队新版本已发布
echo.

:: 询问是否打开输出目录
set /p open_dir="是否打开发布文件所在目录? (y/n): "
if /i "%open_dir%"=="y" (
    explorer .
)

pause
