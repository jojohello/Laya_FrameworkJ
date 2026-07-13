# 🔐 完整登录流程文档

> Laya 游戏服务器框架的完整登录认证流程说明

## 📋 目录

- [流程概览](#流程概览)
- [详细步骤](#详细步骤)
- [数据流转](#数据流转)
- [时序图](#时序图)
- [API 接口](#api-接口)
- [错误处理](#错误处理)
- [安全机制](#安全机制)

---

## 流程概览

登录流程分为 **5 个核心步骤**，涉及 4 个服务组件：

```
客户端 → Login Server → Central Data Server → Gateway Server → 游戏开始
```

### 核心流程
1. **第三方认证** - 验证用户身份（微信/QQ/游客）
2. **生成凭证** - 创建 JWT Token 和 loginTimestamp
3. **网关分配** - 从 Central Server 获取最优网关
4. **数据存储** - 保存登录记录到数据库和 Redis
5. **客户端连接** - WebSocket 连接到分配的网关

---

## 详细步骤

### 步骤 1: 客户端发起登录请求

**接口**: `POST /api/login`

**请求参数**:
```json
{
  "type": "GUEST|WECHAT|QQ|ALIPAY",
  "authCode": "授权码或设备标识",
  "platform": "web|miniprogram|android|ios",
  "deviceInfo": "设备信息字符串",
  "version": "1.0.0",
  "extraParams": "{...}"  // 可选的扩展参数
}
```

**示例 - 微信小游戏登录**:
```javascript
wx.login({
  success: async (res) => {
    const response = await fetch('http://localhost:8081/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'WECHAT',
        authCode: res.code,
        platform: 'miniprogram',
        deviceInfo: 'WeChat MiniProgram',
        version: '1.0.0'
      })
    });
    const data = await response.json();
  }
});
```

**示例 - 游客登录**:
```javascript
const response = await fetch('http://localhost:8081/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'GUEST',
    authCode: `guest_${deviceId}_${Date.now()}`,
    platform: 'web',
    deviceInfo: navigator.userAgent,
    version: '1.0.0'
  })
});
```

---

### 步骤 2: Login Server 处理认证

#### 2.1 第三方身份验证

```java
// LoginService.java
ThirdPartyAuthResult authResult = authenticateThirdParty(request);
```

**支持的登录方式**:
- **GUEST** - 游客登录（使用设备标识，无需第三方验证）
- **WECHAT** - 微信登录（调用微信 API 验证 code）
- **QQ** - QQ 登录（调用 QQ API 验证）
- **ALIPAY** - 支付宝登录（调用支付宝 API 验证）

**验证流程**:
1. 根据 `type` 查找对应的 `ThirdPartyAuthService`
2. 检查服务是否启用
3. 调用第三方 API 验证 `authCode`
4. 返回 `thirdPartyUserId`（如微信的 openId）

#### 2.2 获取或创建用户

```java
User user = userService.findOrCreateUser(
    thirdPartyUserId,
    type,
    deviceInfo,
    platform,
    version,
    extraParams
);
```

**用户创建逻辑**:
- 首次登录：创建新用户记录（User 表）
- 已登录过：返回现有用户信息
- 自动生成 `userId`（UUID 格式）
- 设置默认昵称和头像

#### 2.3 生成登录凭证

```java
long loginTimestamp = System.currentTimeMillis();
String token = jwtUtil.generateToken(userId, loginTimestamp);
```

**JWT Token 包含**:
- `userId` - 用户唯一标识
- `loginTimestamp` - 登录时间戳（防重放攻击）
- `exp` - Token 过期时间（24小时）

---

### 步骤 3: 调用 Central Server 获取网关

#### 3.1 发送账号验证信息

```java
boolean authSuccess = centralDataService.sendAccountVerification(
    userId, token, sessionKey
);
```

**接口**: `POST /api/v1/sessions` (Central Server)

**作用**:
- 在 Central Server 创建会话记录
- 存储 userId、token、loginTimestamp 到 Redis
- 用于后续的三要素验证

#### 3.2 请求网关分配

```java
Map<String, Object> gatewayInfo = centralDataService.getGatewayAssignment(userId);
```

**接口**: `POST /api/v1/gateway/allocate`

**请求**:
```json
{
  "userId": "user-uuid-123",
  "preferredGatewayIp": null,  // 可选
  "preferredGatewayPort": null  // 可选
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
    "expiresAt": "2025-10-27T20:00:30"  // 30秒超时
  }
}
```

**网关分配策略** (LEAST_CONNECTIONS):
1. 过滤所有 ONLINE 状态的网关
2. 按当前连接数升序排序
3. 选择连接数最少的网关
4. 创建分配记录（30秒超时）

---

### 步骤 4: 存储登录记录

#### 4.1 本地数据库存储

```java
LoginRecord loginRecord = LoginRecord.builder()
    .userId(userId)
    .token(token)
    .loginTimestamp(loginTimestamp)
    .loginTime(LocalDateTime.now())
    .thirdPartyType(user.getThirdPartyType())
    .deviceId(deviceInfo)
    .clientIp(clientIp)
    .isActive(true)
    .expireTime(LocalDateTime.now().plusHours(24))
    .build();

loginRecordRepository.save(loginRecord);
```

**LoginRecord 表字段**:
- `userId` - 用户ID
- `token` - JWT Token
- `loginTimestamp` - 登录时间戳
- `loginTime` - 登录日期时间
- `thirdPartyType` - 第三方类型
- `deviceId` - 设备标识
- `clientIp` - 客户端IP
- `isActive` - 是否活跃
- `expireTime` - Token过期时间

#### 4.2 同步到 Central Server

```java
centralDataService.storeLoginRecord(loginRecord);
```

**接口**: `POST /api/v1/sessions/login-record`

**作用**:
- 在 Central Server 同步登录记录
- 用于全局登录状态管理
- 支持多设备登录检测

---

### 步骤 5: 返回登录成功响应

**响应结构**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "user-uuid-123",
  "loginTimestamp": 1698400000000,
  "nickname": "玩家123",
  "avatar": "https://example.com/avatar.jpg",
  "gatewayIp": "localhost",
  "gatewayPort": 8082,
  "gatewayWsUrl": "ws://localhost:8082/ws"
}
```

**客户端接收后**:
1. 保存 `token`、`userId`、`loginTimestamp`
2. 记录 `gatewayWsUrl`
3. 建立 WebSocket 连接
4. 发送认证消息

---

### 步骤 6: 客户端连接 Gateway (下一阶段)

**WebSocket 连接**:
```javascript
const ws = new WebSocket(gatewayWsUrl);

ws.onopen = () => {
  // 发送三要素认证
  ws.send(JSON.stringify({
    type: 'AUTH',
    data: {
      userId: 'user-uuid-123',
      loginTimestamp: 1698400000000,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'AUTH_SUCCESS') {
    console.log('认证成功，开始游戏');
  }
};
```

**Gateway 验证流程**:
1. 接收 AUTH 消息
2. 调用 Central Server 验证三要素
3. 返回 AUTH_SUCCESS 或 AUTH_FAILED
4. 建立游戏会话

---

## 数据流转

### 完整数据流

```
┌─────────┐     ①登录请求      ┌──────────────┐
│ 客户端   │ ───────────────> │ Login Server │
└─────────┘                   └──────────────┘
                                     │
                              ②第三方验证 (微信/QQ/游客)
                                     │
                              ③生成 Token & Timestamp
                                     │
                              ④调用 Central Server
                                     ↓
                             ┌────────────────┐
                             │ Central Server │
                             └────────────────┘
                                     │
                              ⑤网关分配 (负载均衡)
                                     │
                              ⑥返回网关信息
                                     ↓
                             ┌──────────────┐
                             │ Login Server │
                             └──────────────┘
                                     │
                              ⑦存储登录记录
                                     │
                              ⑧返回登录成功
                                     ↓
                             ┌─────────┐
                             │ 客户端   │
                             └─────────┘
                                     │
                              ⑨连接 Gateway WebSocket
                                     ↓
                             ┌───────────────┐
                             │ Gateway Server│
                             └───────────────┘
```

---

## 时序图

```
客户端          Login Server      Central Server     Gateway Server
  │                  │                   │                 │
  │──①登录请求───────>│                   │                 │
  │                  │                   │                 │
  │                  │──②验证authCode──> │                 │
  │                  │                   │                 │
  │                  │──③分配网关────────>│                 │
  │                  │<─④返回网关信息────│                 │
  │                  │                   │                 │
  │<─⑤登录成功────────│                   │                 │
  │  (含网关地址)     │                   │                 │
  │                  │                   │                 │
  │──⑥WebSocket连接───────────────────────────────────────>│
  │                  │                   │                 │
  │──⑦三要素认证──────────────────────────────────────────>│
  │                  │                   │<────验证请求────│
  │                  │                   │─────验证结果───>│
  │<─⑧认证成功────────────────────────────────────────────│
  │                  │                   │                 │
  │──⑨开始游戏────────────────────────────────────────────>│
```

---

## API 接口

### Login Server API

#### 1. 用户登录
```
POST /api/login
Content-Type: application/json
```

**请求体**: 见步骤 1

**响应**: 见步骤 5

---

### Central Server API

#### 1. 创建会话
```
POST /api/v1/sessions
Content-Type: application/json

{
  "userId": "user-uuid-123",
  "token": "jwt-token",
  "loginTimestamp": 1698400000000
}
```

#### 2. 分配网关
```
POST /api/v1/gateway/allocate
Content-Type: application/json

{
  "userId": "user-uuid-123",
  "preferredGatewayIp": "localhost",  // 可选
  "preferredGatewayPort": 8082        // 可选
}
```

#### 3. 同步登录记录
```
POST /api/v1/sessions/login-record
Content-Type: application/json

{
  "userId": "user-uuid-123",
  "token": "jwt-token",
  "loginTimestamp": 1698400000000,
  "deviceId": "device-123",
  "clientIp": "192.168.1.100"
}
```

---

## 错误处理

### 常见错误码

| 错误码 | 说明 | 原因 | 解决方案 |
|--------|------|------|----------|
| `AUTH_FAILED` | 认证失败 | authCode 无效 | 重新获取授权码 |
| `SERVICE_DISABLED` | 服务未启用 | 该登录方式被禁用 | 使用其他登录方式 |
| `USER_NOT_FOUND` | 用户不存在 | 数据库查询失败 | 检查用户数据 |
| `GATEWAY_UNAVAILABLE` | 网关不可用 | 无可用网关 | 等待网关上线 |
| `ALLOCATION_TIMEOUT` | 分配超时 | 网关分配失败 | 重试登录 |
| `SYSTEM_ERROR` | 系统错误 | 服务器内部错误 | 查看日志排查 |

### 错误响应示例

```json
{
  "success": false,
  "errorCode": "AUTH_FAILED",
  "errorMessage": "微信授权码验证失败"
}
```

### 重试策略

1. **认证失败** - 提示用户重新登录
2. **网关不可用** - 延迟 3-5 秒重试（最多3次）
3. **系统错误** - 记录日志，提示用户稍后重试

---

## 安全机制

### 1. JWT Token 安全

- **签名算法**: HS256
- **密钥管理**: 配置文件中配置，生产环境使用环境变量
- **过期时间**: 24 小时
- **包含信息**: userId + loginTimestamp

### 2. 防重放攻击

**三要素验证**: `userId + loginTimestamp + token`

- `loginTimestamp` 确保每次登录的凭证唯一
- Gateway 验证时检查时间戳是否匹配
- 防止 Token 被窃取后重复使用

### 3. 网关分配安全

**30 秒超时机制**:
- 分配后 30 秒内必须连接
- 超时自动释放，防止资源占用
- 防止恶意请求占用网关资源

### 4. 数据传输安全

**生产环境建议**:
- 使用 HTTPS 加密 HTTP 通信
- 使用 WSS 加密 WebSocket 通信
- 敏感信息（如 Token）不记录到日志

### 5. 第三方认证安全

- 验证 `authCode` 的时效性
- 检查第三方返回的用户信息完整性
- 防止 authCode 重复使用

---

## 配置说明

### Login Server 配置

```yaml
# application.yml
server:
  port: 8081

# 中心服务器配置
laya:
  central:
    url: http://localhost:8083
    timeout: 5000

# JWT 配置
jwt:
  secret: your-secret-key-here
  expiration: 86400000  # 24小时

# 第三方登录配置
third-party:
  wechat:
    enabled: true
    app-id: your-wechat-appid
    app-secret: your-wechat-secret
  qq:
    enabled: false
  alipay:
    enabled: false
  guest:
    enabled: true  # 游客登录始终可用
```

### Central Server 配置

```yaml
# application.yml
laya:
  central:
    gateway:
      allocation-timeout: 30000  # 30秒
      max-allocations-per-gateway: 10000
      heartbeat-timeout: 30      # 心跳超时30秒
      load-balance-strategy: "LEAST_CONNECTIONS"
```

---

## 相关文档

- [网关分配机制](GATEWAY_ALLOCATION.md)
- [三要素验证](THREE_FACTOR_AUTH.md)
- [心跳机制](HEARTBEAT_MECHANISM.md)
- [主架构设计](../DESIGN.md)

---

**📝 文档版本**: v1.0
**📅 最后更新**: 2025-10-27
**✍️ 维护者**: Laya Game Server Team
