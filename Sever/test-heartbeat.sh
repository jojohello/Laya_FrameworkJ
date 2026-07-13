#!/bin/bash

# 心跳机制集成测试脚本
# 用途：自动化执行基本的心跳机制测试
# 作者：Laya Game Server Framework
# 日期：2025-11-10

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 服务器地址
CENTRAL_SERVER="http://localhost:8083"
GATEWAY_SERVER="http://localhost:8082"
GAME_SERVER="http://localhost:8084"

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 打印标题
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# 打印成功消息
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
}

# 打印失败消息
print_failure() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

# 打印警告消息
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 打印信息消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 测试服务器是否运行
test_server_running() {
    local server_name=$1
    local server_url=$2

    echo ""
    print_info "测试: $server_name 是否运行..."
    ((TOTAL_TESTS++))

    if curl -s -f "$server_url/actuator/health" > /dev/null 2>&1; then
        print_success "$server_name 正在运行"
    else
        print_failure "$server_name 未运行或无法访问"
        return 1
    fi
}

# 测试 Game Server 列表
test_game_server_list() {
    echo ""
    print_info "测试: 查询 Game Server 列表..."
    ((TOTAL_TESTS++))

    response=$(curl -s "$CENTRAL_SERVER/api/v1/game-server/list")

    if [ -z "$response" ] || [ "$response" = "[]" ]; then
        print_warning "Game Server 列表为空（可能未启动或未注册）"
        return 0
    fi

    # 检查是否包含 game-server-1
    if echo "$response" | grep -q "game-server-1"; then
        print_success "找到 Game Server: game-server-1"

        # 检查在线状态
        if echo "$response" | grep -q '"online":true'; then
            print_success "Game Server 状态: online=true"
        else
            print_warning "Game Server 状态: online=false"
        fi

        # 打印负载信息
        echo -e "${BLUE}Game Server 详情:${NC}"
        echo "$response" | jq '.[0] | {id, online, load}' 2>/dev/null || echo "$response"
    else
        print_failure "未找到 Game Server: game-server-1"
    fi
}

# 测试 Gateway 列表
test_gateway_list() {
    echo ""
    print_info "测试: 查询 Gateway 列表..."
    ((TOTAL_TESTS++))

    response=$(curl -s "$CENTRAL_SERVER/api/v1/gateway/list")

    if [ -z "$response" ] || [ "$response" = "[]" ]; then
        print_warning "Gateway 列表为空（可能未启动或未注册）"
        return 0
    fi

    # 检查是否包含 gateway-1
    if echo "$response" | grep -q "gateway-1"; then
        print_success "找到 Gateway: gateway-1"

        # 检查在线状态
        if echo "$response" | grep -q '"online":true'; then
            print_success "Gateway 状态: online=true"
        else
            print_warning "Gateway 状态: online=false"
        fi

        # 打印负载信息
        echo -e "${BLUE}Gateway 详情:${NC}"
        echo "$response" | jq '.[0] | {id, online, activeConnections, authenticatedUsers}' 2>/dev/null || echo "$response"
    else
        print_failure "未找到 Gateway: gateway-1"
    fi
}

# 测试 Gateway 回调接口
test_gateway_callback() {
    echo ""
    print_info "测试: Gateway 回调接口..."
    ((TOTAL_TESTS++))

    response=$(curl -s -X POST "$GATEWAY_SERVER/api/v1/callback/game-server-change" \
        -H "Content-Type: application/json" \
        -d '{
            "type": "GAME_SERVER_ONLINE",
            "gameServerId": "test-server",
            "ip": "localhost",
            "port": 9999,
            "timestamp": '$(date +%s000)'
        }')

    if echo "$response" | grep -q '"success":true'; then
        print_success "Gateway 回调接口正常"
    else
        print_failure "Gateway 回调接口异常: $response"
    fi
}

# 监控心跳（需要日志文件路径）
monitor_heartbeat() {
    echo ""
    print_header "心跳监控（30秒）"
    print_info "监控 Game Server 和 Gateway 心跳日志..."
    print_info "如果日志文件不存在，将跳过此测试"

    local game_log="../../logs/game-server.log"
    local gateway_log="../../logs/gateway-server.log"
    local central_log="../../logs/central-data-server.log"

    if [ ! -f "$game_log" ] && [ ! -f "$gateway_log" ] && [ ! -f "$central_log" ]; then
        print_warning "日志文件不存在，跳过心跳监控"
        return 0
    fi

    print_info "监控开始，等待30秒..."

    # 记录开始时间
    start_time=$(date +%s)

    # 监控30秒
    while [ $(($(date +%s) - start_time)) -lt 30 ]; do
        sleep 5

        # 检查 Game Server 心跳
        if [ -f "$game_log" ]; then
            game_heartbeat_count=$(tail -n 100 "$game_log" | grep -c "心跳成功发送到Central Server" || true)
            echo -ne "\r${BLUE}Game Server 心跳次数: $game_heartbeat_count${NC}  "
        fi

        # 检查 Gateway 心跳
        if [ -f "$gateway_log" ]; then
            gateway_heartbeat_count=$(tail -n 100 "$gateway_log" | grep -c "心跳成功发送到Central Server" || true)
            echo -ne "${BLUE}Gateway 心跳次数: $gateway_heartbeat_count${NC}   "
        fi
    done

    echo ""
    print_success "心跳监控完成"
}

# 测试超时检测（需要手动停止服务器）
test_timeout_detection() {
    echo ""
    print_header "超时检测测试（可选）"
    print_warning "此测试需要手动操作："
    echo "1. 停止 Game Server（使用 Ctrl+C 或 kill）"
    echo "2. 等待15秒"
    echo "3. 观察 Central Server 日志，应该看到超时检测日志"
    echo ""
    print_info "按回车跳过此测试，或按任意键继续..."

    read -n 1 -t 5 key || true

    if [ -z "$key" ]; then
        print_info "跳过超时检测测试"
        return 0
    fi

    echo ""
    print_info "请停止 Game Server，然后按回车继续..."
    read

    print_info "等待15秒，检测超时..."
    sleep 15

    # 检查 Game Server 是否被标记为离线
    response=$(curl -s "$CENTRAL_SERVER/api/v1/game-server/list")

    if echo "$response" | grep -q '"online":false'; then
        print_success "超时检测成功：Game Server 已标记为离线"
    else
        print_failure "超时检测失败：Game Server 仍为在线状态"
    fi
}

# 打印测试报告
print_report() {
    echo ""
    print_header "测试报告"
    echo -e "总测试数: $TOTAL_TESTS"
    echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
    echo -e "${RED}失败: $FAILED_TESTS${NC}"

    if [ $FAILED_TESTS -eq 0 ]; then
        echo ""
        print_success "所有测试通过！"
        return 0
    else
        echo ""
        print_failure "$FAILED_TESTS 个测试失败"
        return 1
    fi
}

# 主函数
main() {
    print_header "心跳机制集成测试"
    echo -e "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # 检查依赖工具
    if ! command -v curl &> /dev/null; then
        print_failure "未找到 curl 命令，请先安装"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        print_warning "未找到 jq 命令，JSON输出将不美化"
    fi

    # 执行测试
    test_server_running "Central Server" "$CENTRAL_SERVER"
    test_server_running "Gateway" "$GATEWAY_SERVER"
    test_server_running "Game Server" "$GAME_SERVER"

    test_game_server_list
    test_gateway_list
    test_gateway_callback

    # 可选：心跳监控
    print_info "是否执行心跳监控（30秒）？[y/N]"
    read -n 1 -t 5 do_monitor || do_monitor="n"
    echo ""

    if [ "$do_monitor" = "y" ] || [ "$do_monitor" = "Y" ]; then
        monitor_heartbeat
    fi

    # 打印报告
    print_report
}

# 执行主函数
main
