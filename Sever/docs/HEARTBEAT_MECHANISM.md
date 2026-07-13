# 💓 Gateway 心跳机制文档

> Gateway Server 与 Central Data Server 之间的心跳与自动注册机制

## 📋 目录

- [机制概览](#机制概览)
- [设计理念](#设计理念)
- [心跳流程](#心跳流程)
- [自动注册](#自动注册)
- [状态管理](#状态管理)
- [超时检测](#超时检测)
- [负载上报](#负载上报)
- [配置说明](#配置说明)

---

## 机制概览

### 核心理念

**心跳 = 注册 + 保活**

Gateway Server 无需手动注册，只需定期发送心跳。Central Server 收到第一个心跳时自动创建 Gateway 记录。

### 关键特性

- ✅ **自动注册** - 首次心跳自动创建 Gateway
- ✅ **实时负载** - 每次心跳携带当前负载信息
- ✅ **故障检测** - 30秒未收到心跳标记为 OFFLINE
- ✅ **自动恢复** - Gateway 重启后自动重新注册
- ✅ **无依赖** - 无需配置文件预定义 Gateway 列表

### 数据流向

```
Gateway Server               Central Data Server
     │                              │
     │──① 10秒心跳────────────────→ │
     │   {ip, port, load}           │
     │                              │
     │                         ② 检查是否存在
     │                              │
     │                         ③ 不存在 → 自动注册
     │                              │
     │                         ④ 存在 → 更新负载
     │                              │
     │←──⑤ 返回成功──────────────── │
```

---

## 设计理念

### 为什么这样设计？

1. **简化部署** - 无需手动配置 Gateway 列表
2. **动态扩容** - 新 Gateway 启动即可用
3. **故障恢复** - Gateway 重启自动重新注册
4. **负载均衡** - 实时负载信息用于分配决策

### 与传统方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| **手动注册** | 控制严格 | 需要手动配置，扩容麻烦 |
| **配置文件** | 集中管理 | 修改配置需重启服务 |
| **心跳自动注册** ✅ | 自动化，灵活 | 需要心跳机制 |

---

## 心跳流程

### Gateway Server 端

#### 定时任务

```java
@Scheduled(fixedDelayString = "${laya.gateway.heartbeat.to-central-interval:10000}")
public void sendHeartbeatToCentral() {
    try {
        // 获取当前负载信息
        int activeConnections = webSocketHandler.getTotalConnectionCount();
        int authenticatedUsers = webSocketHandler.getOnlineUserCount();
        int waitingReconnections = webSocketHandler.getWaitingReconnectionCount();

        // 发送心跳
        boolean success = centralServerClient.sendHeartbeat(
            gatewayIp,
            gatewayPort,
            activeConnections,
            authenticatedUsers,
            waitingReconnections
        );

        if (!success) {
            log.warn("Failed to send heartbeat to Central Server");
        }

    } catch (Exception e) {
        log.error("Error during sending heartbeat", e);
    }
}
```

**执行频率**: 每 10 秒

#### HTTP 请求

```java
public boolean sendHeartbeat(String gatewayIp, int gatewayPort,
                             int activeConnections,
                             int authenticatedUsers,
                             int waitingReconnections) {
    String url = centralServerBaseUrl + "/gateway/heartbeat";

    Map<String, Object> requestBody = new HashMap<>();
    requestBody.put("gatewayIp", gatewayIp);
    requestBody.put("gatewayPort", gatewayPort);
    requestBody.put("timestamp", System.currentTimeMillis());
    requestBody.put("activeConnections", activeConnections);
    requestBody.put("authenticatedUsers", authenticatedUsers);
    requestBody.put("waitingReconnections", waitingReconnections);

    HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

    ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
        url, HttpMethod.POST, request,
        new ParameterizedTypeReference<Map<String, Object>>() {}
    );

    return response.getStatusCode() == HttpStatus.OK;
}
```

---

### Central Data Server 端

#### 接收心跳

```java
@PostMapping("/heartbeat")
public ResponseEntity<ApiResponse<Void>> handleHeartbeat(
    @Valid @RequestBody GatewayHeartbeatRequest request) {

    try {
        heartbeatService.handleHeartbeat(
            request.getGatewayIp(),
            request.getGatewayPort(),
            request.getActiveConnections(),
            request.getAuthenticatedUsers(),
            request.getWaitingReconnections()
        );

        return ResponseEntity.ok(ApiResponse.success(null));

    } catch (Exception e) {
        log.error("Error handling heartbeat", e);
        return ResponseEntity.ok(ApiResponse.error("心跳处理失败"));
    }
}
```

#### 处理逻辑

```java
public void handleHeartbeat(String gatewayIp, int gatewayPort,
                           int activeConnections,
                           int authenticatedUsers,
                           int waitingReconnections) {
    String key = gatewayIp + ":" + gatewayPort;
    GatewayInfo gateway = gatewayMap.get(key);

    if (gateway == null) {
        // 首次心跳 → 自动注册
        gateway = new GatewayInfo();
        gateway.setIp(gatewayIp);
        gateway.setPort(gatewayPort);
        gateway.setStatus(GatewayStatus.ONLINE);
        gateway.setFirstHeartbeatTime(LocalDateTime.now());
        gateway.setActiveConnections(activeConnections);
        gateway.setAuthenticatedUsers(authenticatedUsers);
        gateway.setWaitingReconnections(waitingReconnections);
        gateway.setLastHeartbeatTime(LocalDateTime.now());

        gatewayMap.put(key, gateway);

        log.info("Gateway自动注册成功: {}, 负载: {}/{}/{}",
            key, activeConnections, authenticatedUsers, waitingReconnections);

    } else {
        // 更新心跳和负载
        gateway.updateHeartbeat(activeConnections, authenticatedUsers, waitingReconnections);
    }
}
```

---

## 自动注册

### 注册时机

**首次心跳到达** → 自动创建 GatewayInfo

### Gateway 信息

```java
public class GatewayInfo {
    private String ip;                        // Gateway IP
    private Integer port;                     // Gateway 端口
    private GatewayStatus status;             // 状态: ONLINE/OFFLINE
    private Integer activeConnections;        // 活跃连接数
    private Integer authenticatedUsers;       // 已认证用户数
    private Integer waitingReconnections;     // 等待重连数
    private LocalDateTime lastHeartbeatTime;  // 最后心跳时间
    private LocalDateTime firstHeartbeatTime; // 首次心跳时间
    private Integer weight;                   // 权重（负载均衡）
}
```

### 注册日志

```
2025-10-27 20:00:00 [INFO] Gateway自动注册成功: localhost:8082, 负载: 0/0/0
```

---

## 状态管理

### Gateway 状态

| 状态 | 说明 | 触发条件 |
|------|------|----------|
| **ONLINE** | 在线 | 接收到心跳 |
| **OFFLINE** | 离线 | 30秒未收到心跳 |

### 状态转换

```
启动 → 发送第一个心跳 → ONLINE
                           ↓
                     持续发送心跳
                           ↓
                     30秒未收到心跳
                           ↓
                        OFFLINE
                           ↓
                     恢复心跳 → ONLINE
```

### 状态更新

```java
public void updateHeartbeat(int activeConnections,
                           int authenticatedUsers,
                           int waitingReconnections) {
    this.activeConnections = activeConnections;
    this.authenticatedUsers = authenticatedUsers;
    this.waitingReconnections = waitingReconnections;
    this.lastHeartbeatTime = LocalDateTime.now();
    this.status = GatewayStatus.ONLINE;  // 收到心跳，标记为在线
}
```

---

## 超时检测

### 检测机制

```java
@Scheduled(fixedRate = 60000)  // 每60秒检测一次
public void checkGatewayTimeout() {
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime timeoutThreshold = now.minusSeconds(heartbeatTimeoutSeconds);

    gatewayMap.values().forEach(gateway -> {
        if (gateway.getStatus() == GatewayStatus.ONLINE &&
            gateway.getLastHeartbeatTime().isBefore(timeoutThreshold)) {

            gateway.setStatus(GatewayStatus.OFFLINE);

            log.warn("Gateway心跳超时，标记为离线: {}:{}, 最后心跳: {}",
                gateway.getIp(), gateway.getPort(), gateway.getLastHeartbeatTime());
        }
    });
}
```

**检测频率**: 每 60 秒
**超时阈值**: 30 秒

### 超时处理

1. **标记离线** - 将状态改为 OFFLINE
2. **停止分配** - 不再向该 Gateway 分配新用户
3. **已连接用户** - 保持连接，直到自然断开
4. **自动恢复** - Gateway 恢复后自动重新上线

---

## 负载上报

### 负载指标

```json
{
  "gatewayIp": "localhost",
  "gatewayPort": 8082,
  "timestamp": 1698400000000,
  "activeConnections": 150,      // 当前 WebSocket 连接数
  "authenticatedUsers": 148,     // 已完成认证的用户数
  "waitingReconnections": 2      // 等待重连的用户数
}
```

### 负载计算

#### activeConnections
```java
public int getTotalConnectionCount() {
    return sessions.size();  // 所有 WebSocket 连接
}
```

#### authenticatedUsers
```java
public int getOnlineUserCount() {
    return (int) sessions.values().stream()
        .filter(session -> session.isAuthenticated())
        .count();
}
```

#### waitingReconnections
```java
public int getWaitingReconnectionCount() {
    return (int) sessions.values().stream()
        .filter(session -> session.getStatus() == WAITING_RECONNECT)
        .count();
}
```

### 负载应用

负载信息用于：
1. **负载均衡** - 选择负载最低的 Gateway
2. **监控告警** - 检测负载过高
3. **扩容决策** - 判断是否需要增加 Gateway

---

## 配置说明

### Gateway Server 配置

```yaml
# application.yml
laya:
  gateway:
    # 服务器信息（用于心跳上报）
    server-ip: ${GATEWAY_IP:localhost}
    server-port: ${server.port:8082}

    # 心跳配置
    heartbeat:
      to-central-interval: 10000  # 向Central发送心跳间隔（毫秒）

    # Central Server配置
    central-server:
      host: localhost
      port: 8083
      base-url: "http://localhost:8083/api/v1"
```

### Central Server 配置

```yaml
# application.yml
laya:
  central:
    gateway:
      # 心跳超时时间（秒）
      heartbeat-timeout: 30

      # Gateway 最大分配数
      max-allocations-per-gateway: 10000

      # 负载均衡策略
      load-balance-strategy: "LEAST_CONNECTIONS"
```

### 环境变量

```bash
# Gateway Server
export GATEWAY_IP=192.168.1.100
export GATEWAY_PORT=8082

# Central Server
export HEARTBEAT_TIMEOUT=30
```

---

## API 接口

### 1. 发送心跳

**Gateway → Central**

```http
POST /api/v1/gateway/heartbeat
Content-Type: application/json

{
  "gatewayIp": "localhost",
  "gatewayPort": 8082,
  "timestamp": 1698400000000,
  "activeConnections": 150,
  "authenticatedUsers": 148,
  "waitingReconnections": 2
}
```

**响应**:
```json
{
  "success": true,
  "message": "操作成功",
  "data": null
}
```

### 2. 获取 Gateway 列表

```http
GET /api/v1/gateway/list
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "ip": "localhost",
      "port": 8082,
      "status": "ONLINE",
      "activeConnections": 150,
      "authenticatedUsers": 148,
      "waitingReconnections": 2,
      "lastHeartbeatTime": "2025-10-27T20:00:00"
    }
  ]
}
```

### 3. 获取 Gateway 统计

```http
GET /api/v1/gateway/gateway-statistics
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalGateways": 3,
    "onlineGateways": 3,
    "offlineGateways": 0,
    "totalConnections": 450,
    "averageLoad": 150
  }
}
```

---

## 监控指标

### 关键指标

1. **心跳成功率**
   - 正常: >99%
   - 告警阈值: <95%

2. **心跳延迟**
   - 正常: <100ms
   - 告警阈值: >500ms

3. **Gateway 在线率**
   - 正常: 100%
   - 告警阈值: <100%

4. **负载分布**
   - 理想: 各 Gateway 负载均衡
   - 告警: 某个 Gateway 负载 >80%

### 日志查看

```bash
# Gateway 心跳日志
grep "Sending heartbeat" logs/gateway-server.log

# Central 接收日志
grep "Gateway自动注册" logs/central-data-server.log
grep "Gateway心跳更新" logs/central-data-server.log

# 超时告警
grep "心跳超时" logs/central-data-server.log
```

---

## 故障处理

### 场景1: Gateway 心跳失败

**症状**: Gateway 日志显示 "Failed to send heartbeat"

**原因**:
- Central Server 未启动
- 网络不通
- API 路径错误

**解决**:
1. 检查 Central Server 状态
2. 检查网络连接
3. 验证配置中的 base-url

### 场景2: Gateway 被标记为 OFFLINE

**症状**: Central Server 日志显示 "Gateway心跳超时"

**原因**:
- Gateway 宕机
- 心跳任务停止
- 网络故障

**解决**:
1. 重启 Gateway Server
2. 检查心跳定时任务
3. 排查网络问题

### 场景3: 负载信息不准确

**症状**: 显示的负载与实际不符

**原因**:
- WebSocket 连接统计错误
- 会话清理不及时

**解决**:
1. 检查 WebSocket Handler 的计数逻辑
2. 确认会话清理机制运行正常

---

## 最佳实践

### 1. 心跳间隔设置

- **推荐**: 10秒
- **最小**: 5秒（网络开销大）
- **最大**: 30秒（检测慢）

### 2. 超时时间设置

- **推荐**: 3倍心跳间隔
- **示例**: 心跳10秒，超时30秒

### 3. 生产环境部署

```yaml
# 生产环境配置
laya:
  gateway:
    heartbeat:
      to-central-interval: 10000  # 10秒

  central:
    gateway:
      heartbeat-timeout: 30       # 30秒
```

### 4. 监控告警

- 设置心跳失败告警
- 监控 Gateway 在线状态
- 跟踪负载变化趋势

---

## 相关文档

- [完整登录流程](LOGIN_FLOW.md)
- [网关分配机制](GATEWAY_ALLOCATION.md)
- [主架构设计](../DESIGN.md)

---

**📝 文档版本**: v1.0
**📅 最后更新**: 2025-10-27
**✍️ 维护者**: Laya Game Server Team
