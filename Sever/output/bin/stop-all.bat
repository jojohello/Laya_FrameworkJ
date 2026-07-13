@echo off
chcp 65001 >nul
echo ========================================
echo   Laya Game Server - 停止所有服务器
echo ========================================
echo.

echo 正在停止所有服务器...
echo.

:: 按顺序停止服务器（反向顺序）
echo [1/4] 停止 Game Server...
taskkill /FI "WindowTitle eq Game-Server*" /T /F >nul 2>&1
if errorlevel 1 (
    echo       Game Server 未运行或已停止
) else (
    echo       Game Server 已停止
)

echo [2/4] 停止 Gateway Server...
taskkill /FI "WindowTitle eq Gateway-Server*" /T /F >nul 2>&1
if errorlevel 1 (
    echo       Gateway Server 未运行或已停止
) else (
    echo       Gateway Server 已停止
)

echo [3/4] 停止 Login Server...
taskkill /FI "WindowTitle eq Login-Server*" /T /F >nul 2>&1
if errorlevel 1 (
    echo       Login Server 未运行或已停止
) else (
    echo       Login Server 已停止
)

echo [4/4] 停止 Central Data Server...
taskkill /FI "WindowTitle eq Central-Data-Server*" /T /F >nul 2>&1
if errorlevel 1 (
    echo       Central Data Server 未运行或已停止
) else (
    echo       Central Data Server 已停止
)

echo.
echo ========================================
echo   所有服务器已停止！
echo ========================================
echo.
pause
