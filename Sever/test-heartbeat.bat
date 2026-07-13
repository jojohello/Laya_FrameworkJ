@echo off
REM 心跳机制集成测试脚本 - Windows版本
REM 用途：自动化执行基本的心跳机制测试
REM 作者：Laya Game Server Framework
REM 日期：2025-11-10

setlocal enabledelayedexpansion

REM 服务器地址
set CENTRAL_SERVER=http://localhost:8083
set GATEWAY_SERVER=http://localhost:8082
set GAME_SERVER=http://localhost:8084

REM 测试结果统计
set TOTAL_TESTS=0
set PASSED_TESTS=0
set FAILED_TESTS=0

echo ========================================
echo 心跳机制集成测试
echo ========================================
echo 测试时间: %date% %time%
echo.

REM 检查 curl 是否可用
where curl >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 未找到 curl 命令，请先安装
    echo 下载地址: https://curl.se/windows/
    exit /b 1
)

echo [INFO] 开始执行测试...
echo.

REM ========================================
REM 测试1: Central Server 是否运行
REM ========================================
echo [TEST] 测试 Central Server 是否运行...
set /a TOTAL_TESTS+=1

curl -s -f "%CENTRAL_SERVER%/actuator/health" >nul 2>nul
if %errorlevel% equ 0 (
    echo [PASS] Central Server 正在运行
    set /a PASSED_TESTS+=1
) else (
    echo [FAIL] Central Server 未运行或无法访问
    set /a FAILED_TESTS+=1
)
echo.

REM ========================================
REM 测试2: Gateway 是否运行
REM ========================================
echo [TEST] 测试 Gateway 是否运行...
set /a TOTAL_TESTS+=1

curl -s -f "%GATEWAY_SERVER%/actuator/health" >nul 2>nul
if %errorlevel% equ 0 (
    echo [PASS] Gateway 正在运行
    set /a PASSED_TESTS+=1
) else (
    echo [FAIL] Gateway 未运行或无法访问
    set /a FAILED_TESTS+=1
)
echo.

REM ========================================
REM 测试3: Game Server 是否运行
REM ========================================
echo [TEST] 测试 Game Server 是否运行...
set /a TOTAL_TESTS+=1

curl -s -f "%GAME_SERVER%/actuator/health" >nul 2>nul
if %errorlevel% equ 0 (
    echo [PASS] Game Server 正在运行
    set /a PASSED_TESTS+=1
) else (
    echo [FAIL] Game Server 未运行或无法访问
    set /a FAILED_TESTS+=1
)
echo.

REM ========================================
REM 测试4: 查询 Game Server 列表
REM ========================================
echo [TEST] 测试查询 Game Server 列表...
set /a TOTAL_TESTS+=1

curl -s "%CENTRAL_SERVER%/api/v1/game-server/list" > temp_game_server_list.json
if %errorlevel% equ 0 (
    findstr /C:"game-server-1" temp_game_server_list.json >nul
    if !errorlevel! equ 0 (
        echo [PASS] 找到 Game Server: game-server-1
        set /a PASSED_TESTS+=1

        REM 检查在线状态
        findstr /C:"\"online\":true" temp_game_server_list.json >nul
        if !errorlevel! equ 0 (
            echo [INFO] Game Server 状态: online=true
        ) else (
            echo [WARN] Game Server 状态: online=false
        )

        echo [INFO] Game Server 列表:
        type temp_game_server_list.json
    ) else (
        echo [FAIL] 未找到 Game Server: game-server-1
        set /a FAILED_TESTS+=1
    )
) else (
    echo [FAIL] 无法查询 Game Server 列表
    set /a FAILED_TESTS+=1
)
del temp_game_server_list.json 2>nul
echo.

REM ========================================
REM 测试5: 查询 Gateway 列表
REM ========================================
echo [TEST] 测试查询 Gateway 列表...
set /a TOTAL_TESTS+=1

curl -s "%CENTRAL_SERVER%/api/v1/gateway/list" > temp_gateway_list.json
if %errorlevel% equ 0 (
    findstr /C:"gateway-1" temp_gateway_list.json >nul
    if !errorlevel! equ 0 (
        echo [PASS] 找到 Gateway: gateway-1
        set /a PASSED_TESTS+=1

        REM 检查在线状态
        findstr /C:"\"online\":true" temp_gateway_list.json >nul
        if !errorlevel! equ 0 (
            echo [INFO] Gateway 状态: online=true
        ) else (
            echo [WARN] Gateway 状态: online=false
        )

        echo [INFO] Gateway 列表:
        type temp_gateway_list.json
    ) else (
        echo [FAIL] 未找到 Gateway: gateway-1
        set /a FAILED_TESTS+=1
    )
) else (
    echo [FAIL] 无法查询 Gateway 列表
    set /a FAILED_TESTS+=1
)
del temp_gateway_list.json 2>nul
echo.

REM ========================================
REM 测试6: Gateway 回调接口
REM ========================================
echo [TEST] 测试 Gateway 回调接口...
set /a TOTAL_TESTS+=1

REM 创建测试数据
echo {"type":"GAME_SERVER_ONLINE","gameServerId":"test-server","ip":"localhost","port":9999,"timestamp":1731225600000} > temp_callback.json

curl -s -X POST "%GATEWAY_SERVER%/api/v1/callback/game-server-change" ^
    -H "Content-Type: application/json" ^
    -d @temp_callback.json > temp_callback_response.json

findstr /C:"\"success\":true" temp_callback_response.json >nul
if %errorlevel% equ 0 (
    echo [PASS] Gateway 回调接口正常
    set /a PASSED_TESTS+=1
) else (
    echo [FAIL] Gateway 回调接口异常
    type temp_callback_response.json
    set /a FAILED_TESTS+=1
)

del temp_callback.json 2>nul
del temp_callback_response.json 2>nul
echo.

REM ========================================
REM 测试报告
REM ========================================
echo ========================================
echo 测试报告
echo ========================================
echo 总测试数: %TOTAL_TESTS%
echo 通过: %PASSED_TESTS%
echo 失败: %FAILED_TESTS%
echo.

if %FAILED_TESTS% equ 0 (
    echo [SUCCESS] 所有测试通过！
    exit /b 0
) else (
    echo [FAILURE] %FAILED_TESTS% 个测试失败
    exit /b 1
)
