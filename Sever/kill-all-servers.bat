@echo off
chcp 65001 >nul
echo ========================================
echo   快速停止所有Laya服务器进程
echo ========================================
echo.

echo 正在检查端口占用情况...
echo.

set KILLED_COUNT=0

:: 检查并停止 8081 端口 (Login Server)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING 2^>nul') do (
    echo [Login Server - 8081] 停止进程 %%a
    taskkill /F /PID %%a >nul 2>&1
    if not errorlevel 1 set /a KILLED_COUNT+=1
)

:: 检查并停止 8082 端口 (Gateway Server)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8082 ^| findstr LISTENING 2^>nul') do (
    echo [Gateway Server - 8082] 停止进程 %%a
    taskkill /F /PID %%a >nul 2>&1
    if not errorlevel 1 set /a KILLED_COUNT+=1
)

:: 检查并停止 8083 端口 (Central Data Server)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8083 ^| findstr LISTENING 2^>nul') do (
    echo [Central Data Server - 8083] 停止进程 %%a
    taskkill /F /PID %%a >nul 2>&1
    if not errorlevel 1 set /a KILLED_COUNT+=1
)

:: 检查并停止 8084 端口 (Game Server)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8084 ^| findstr LISTENING 2^>nul') do (
    echo [Game Server - 8084] 停止进程 %%a
    taskkill /F /PID %%a >nul 2>&1
    if not errorlevel 1 set /a KILLED_COUNT+=1
)

echo.
if %KILLED_COUNT% EQU 0 (
    echo 未发现运行中的服务器进程
) else (
    echo 成功停止 %KILLED_COUNT% 个服务器进程！
)

echo.
echo ========================================
echo   当前端口状态
echo ========================================
echo.
netstat -ano | findstr :808 | findstr LISTENING
if errorlevel 1 (
    echo 所有服务器端口已释放 ✓
)

echo.
pause
