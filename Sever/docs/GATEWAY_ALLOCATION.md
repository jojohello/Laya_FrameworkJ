# 🌐 网关分配机制文档

> Gateway 智能分配与负载均衡机制详解

## 📋 目录

- [机制概览](#机制概览)
- [分配策略](#分配策略)
- [30秒超时机制](#30秒超时机制)
- [负载均衡算法](#负载均衡算法)
- [生命周期管理](#生命周期管理)
- [API 接口](#api-接口)
- [配置说明](#配置说明)

---

## 机制概览

网关分配是用户登录成功后，Central Data Server 为用户分配最优 Gateway Server 的过程。

### 核心特性

- ✅ **智能负载均衡** - 基于连接数的最小负载策略
- ✅ **30秒超时保护** - 防止资源长期占用
- ✅ **自动状态管理** - 分配/连接/过期自动流转
- ✅ **偏好网关支持** - 支持指定首选网关
- ✅ **故障转移** - 网关离线自动重新分配

### 分配状态

| 状态 | 说明 | 持续时间 |
|------|------|----------|
| **ALLOCATED** | 已分配，等待连接 | 最长30秒 |
| **CONNECTED** | 已连接 | 直到断开 |
| **EXPIRED** | 超时过期 | 自动清理 |
| **RELEASED** | 已释放 | 自动清理 |

---

## 分配策略

### 负载均衡策略

**当前实现**: `LEAST_CONNECTIONS` (最少连接数)

#### 算法流程

```java
public Optional<GatewayAllocation> allocateGateway(
    String userId,
    String preferredGatewayIp,
    Integer preferredGatewayPort
) {
    // 1. 检查是否有有效分配
    Optional<GatewayAllocation> existing = getUserCurrentAllocation(userId);
    if (existing.isPresent() && !existing.get().isExpired()) {
        return existing; // 返回现有分配
    }

    // 2. 清理过期分配
    cleanupUserExpiredAllocations(userId);

    // 3. 选择网关
    GatewayInfo gateway;
    if (preferredGatewayIp != null && preferredGatewayPort != null) {
        // 优先使用指定网关
        gateway = getGateway(preferredGatewayIp, preferredGatewayPort);
    } else {
        // 使用负载均衡策略
        gateway = selectGatewayByStrategy();
    }

    // 4. 创建分配记录
    GatewayAllocation allocation = createAllocation(userId, gateway);

    return Optional.of(allocation);
}
```

#### 网关选择逻辑

```java
private GatewayInfo selectGatewayByStrategy() {
    return heartbeatService.getAllGateways().stream()
        .filter(g -> g.getStatus() == GatewayInfo.GatewayStatus.ONLINE)
        .filter(g -> getCurrentLoad(g) < maxAllocationsPerGateway)
        .min(Comparator.comparingInt(this::getCurrentLoad))
        .orElseThrow(() -> new RuntimeException("No available gateway"));
}
```

**关键点**:
1. 只选择 ONLINE 状态的网关
2. 过滤已达到最大连接数的网关
3. 选择当前连接数最少的网关

---

## 30秒超时机制

### 设计目的

防止以下问题：
- 用户获取分配后未连接，占用资源
- 网络异常导致连接失败，资源无法释放
- 恶意请求刷网关分配接口

### 生命周期

```
分配创建 → 30秒倒计时 → 超时检查 → 自动清理
    ↓
  连接成功 → 更新状态为CONNECTED → 不再超时
```

### 实现细节

#### 1. 创建分配时设置超时

```java
GatewayAllocation allocation = GatewayAllocation.builder()
    .userId(userId)
    .gatewayIp(gateway.getIp())
    .gatewayPort(gateway.getPort())
    .status(AllocationStatus.ALLOCATED)
    .allocatedAt(LocalDateTime.now())
    .expiresAt(LocalDateTime.now().plusSeconds(allocationTimeout / 1000)) // 30秒
    .build();
```

#### 2. 定时清理过期分配

```java
@Scheduled(fixedDelayString = "${laya.central.gateway.cleanup-interval}")
public int cleanupExpiredAllocations() {
    LocalDateTime now = LocalDateTime.now();
    List<GatewayAllocation> expired = allocationRepository
        .findByStatusAndExpiresAtBefore(AllocationStatus.ALLOCATED, now);

    for (GatewayAllocation allocation : expired) {
        allocation.setStatus(AllocationStatus.EXPIRED);
        allocationRepository.save(allocation);
    }

    return expired.size();
}
```

**清理频率**: 每 60 秒执行一次

#### 3. 连接确认

当用户成功连接到 Gateway 后，调用确认接口：

```java
public boolean confirmConnection(String userId, String gatewayIp, Integer gatewayPort) {
    Optional<GatewayAllocation> allocationOpt =
        allocationRepository.findByUserIdAndStatusAndGatewayIpAndGatewayPort(
            userId, AllocationStatus.ALLOCATED, gatewayIp, gatewayPort);

    if (allocationOpt.isPresent()) {
        GatewayAllocation allocation = allocationOpt.get();

        // 检查是否过期
        if (allocation.isExpired()) {
            allocation.setStatus(AllocationStatus.EXPIRED);
            return false;
        }

        // 更新为已连接状态
        allocation.setStatus(AllocationStatus.CONNECTED);
        allocation.setConnectedAt(LocalDateTime.now());
        allocationRepository.save(allocation);

        return true;
    }

    return false;
}
```

---

## 负载均衡算法

### LEAST_CONNECTIONS 策略

#### 负载计算

```java
private int getCurrentLoad(GatewayInfo gateway) {
    // 方案1: 使用心跳上报的连接数
    return gateway.getActiveConnections();

    // 方案2: 统计分配记录（更准确但性能较低）
    // return allocationRepository.countByGatewayIpAndGatewayPortAndStatus(
    //     gateway.getIp(), gateway.getPort(), AllocationStatus.CONNECTED);
}
```

**当前使用**: 方案1 - 心跳上报的实时连接数

**优点**:
- 性能高，无需查询数据库
- 实时性好，每10秒更新一次

**缺点**:
- 依赖 Gateway 心跳
- Gateway 故障时数据可能不准确

#### 排序逻辑

```java
List<GatewayInfo> sortedGateways = availableGateways.stream()
    .sorted(Comparator.comparingInt(g ->
        g.getActiveConnections() + g.getAuthenticatedUsers()))
    .collect(Collectors.toList());
```

**排序依据**: `activeConnections + authenticatedUsers`

---

## 生命周期管理

### 完整生命周期

```
①分配请求 → ②检查现有分配 → ③选择网关 → ④创建分配
                ↓ 已有分配
             返回现有分配
                ↓ 无分配
          ⑤设置30秒超时 → ⑥等待连接
                           ↓
                     ⑦连接成功?
                    /          \
                  是             否
                  ↓              ↓
            ⑧更新为CONNECTED   ⑨超时EXPIRED
                  ↓              ↓
            游戏会话开始      自动清理
                  ↓
            断开连接
                  ↓
            ⑩释放RELEASED
```

### 状态转换图

```
ALLOCATED ──连接成功──→ CONNECTED ──断开连接──→ RELEASED
    │                                           ↓
    └────────30秒超时────→ EXPIRED ──清理──→ (删除记录)
```

### 核心接口

#### 1. 分配网关

```
POST /api/v1/gateway/allocate
```

#### 2. 确认连接

```
PUT /api/v1/gateway/confirm-connection
```

#### 3. 延长分配

```
PUT /api/v1/gateway/extend
{
  "userId": "user-123",
  "gatewayIp": "localhost",
  "gatewayPort": 8082,
  "extendMinutes": 5
}
```

#### 4. 释放分配

```
DELETE /api/v1/gateway/release
```

---

## API 接口

### 1. 分配网关

**请求**:
```http
POST /api/v1/gateway/allocate
Content-Type: application/json

{
  "userId": "user-uuid-123",
  "preferredGatewayIp": "localhost",  // 可选
  "preferredGatewayPort": 8082        // 可选
}
```

**响应**:
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "userId": "user-uuid-123",
    "gatewayIp": "localhost",
    "gatewayPort": 8082,
    "status": "ALLOCATED",
    "allocatedAt": "2025-10-27T20:00:00",
    "expiresAt": "2025-10-27T20:00:30"
  }
}
```

### 2. 确认连接

**请求**:
```http
PUT /api/v1/gateway/confirm-connection
Content-Type: application/json

{
  "userId": "user-uuid-123",
  "gatewayIp": "localhost",
  "gatewayPort": 8082
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

### 3. 获取用户分配

**请求**:
```http
GET /api/v1/gateway/user/{userId}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid-123",
    "gatewayIp": "localhost",
    "gatewayPort": 8082,
    "status": "CONNECTED",
    "allocatedAt": "2025-10-27T20:00:00",
    "connectedAt": "2025-10-27T20:00:05"
  }
}
```

### 4. 获取网关负载

**请求**:
```http
GET /api/v1/gateway/load
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "gatewayIp": "localhost",
      "gatewayPort": 8082,
      "activeConnections": 150,
      "authenticatedUsers": 148,
      "waitingReconnections": 2,
      "maxConnections": 10000,
      "loadPercentage": 1.5,
      "status": "ONLINE"
    }
  ]
}
```

### 5. 清理过期分配

**请求**:
```http
DELETE /api/v1/gateway/cleanup-expired
```

**响应**:
```json
{
  "success": true,
  "data": 15  // 清理的数量
}
```

---

## 配置说明

### Central Server 配置

```yaml
# application.yml
laya:
  central:
    gateway:
      # 分配超时时间（毫秒）
      allocation-timeout: 30000  # 30秒

      # 每个网关最大分配数
      max-allocations-per-gateway: 10000

      # 清理间隔（毫秒）
      cleanup-interval: 60000  # 1分钟

      # 负载均衡策略
      load-balance-strategy: "LEAST_CONNECTIONS"

      # 心跳超时（秒）
      heartbeat-timeout: 30

      # 可用网关列表（可选，主要依赖心跳自动注册）
      available-gateways:
        - ip: "localhost"
          port: 8082
          weight: 1
```

### 配置项说明

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `allocation-timeout` | 30000 | 分配超时时间（毫秒） |
| `max-allocations-per-gateway` | 10000 | 单个网关最大连接数 |
| `cleanup-interval` | 60000 | 清理任务执行间隔（毫秒） |
| `load-balance-strategy` | LEAST_CONNECTIONS | 负载均衡策略 |
| `heartbeat-timeout` | 30 | Gateway心跳超时（秒） |

---

## 监控指标

### 关键指标

1. **分配统计**
```http
GET /api/v1/gateway/statistics
```

```json
{
  "totalAllocations": 1500,
  "allocatedCount": 50,
  "connectedCount": 1400,
  "expiredCount": 30,
  "releasedCount": 20
}
```

2. **网关统计**
```http
GET /api/v1/gateway/gateway-statistics
```

```json
{
  "totalGateways": 3,
  "onlineGateways": 3,
  "offlineGateways": 0,
  "totalConnections": 4500,
  "averageLoad": 1500
}
```

### 告警阈值

- **分配超时率** > 5% - 检查网络或客户端问题
- **网关负载** > 80% - 考虑扩容
- **离线网关** > 0 - 检查 Gateway 服务状态

---

## 故障处理

### 场景1: 网关离线

**问题**: Gateway Server 宕机或心跳超时

**处理流程**:
1. Central Server 检测到心跳超时（30秒）
2. 标记 Gateway 为 OFFLINE
3. 新的分配请求不再选择该网关
4. 已连接的用户断开后需要重新登录
5. 清理该网关的所有 ALLOCATED 状态分配

**恢复**:
1. Gateway 重启后发送心跳
2. 自动注册为 ONLINE
3. 恢复接受新的分配

### 场景2: 分配超时

**问题**: 用户获取分配后30秒内未连接

**处理流程**:
1. 定时任务检测到过期（每60秒）
2. 更新状态为 EXPIRED
3. 资源自动释放
4. 用户需要重新请求分配

**预防**:
- 客户端收到分配后立即连接
- 网络异常时重试登录
- 使用延长接口延长分配时间

### 场景3: 负载不均

**问题**: 某个网关负载过高

**处理流程**:
1. 检查心跳数据是否准确
2. 检查其他网关是否在线
3. 检查负载均衡策略配置
4. 考虑调整 `max-allocations-per-gateway`

---

## 相关文档

- [完整登录流程](LOGIN_FLOW.md)
- [三要素验证](THREE_FACTOR_AUTH.md)
- [心跳机制](HEARTBEAT_MECHANISM.md)

---

**📝 文档版本**: v1.0
**📅 最后更新**: 2025-10-27
**✍️ 维护者**: Laya Game Server Team
