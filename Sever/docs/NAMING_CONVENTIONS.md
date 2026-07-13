# 🏷️ Laya游戏服务器 - 命名规范

> **重要**：本文档定义了项目中核心ID字段的命名规范和使用指南

**版本**: 1.0
**创建日期**: 2025-12-02
**最后更新**: 2025-12-02
**适用范围**: 全部服务器（Login/Gateway/Central/Game Server）

---

## 📖 概述

### 为什么需要这个文档？

在游戏服务器开发中，我们经常遇到 `userId`、`playerId`、`sessionId` 等ID字段。这些ID的含义容易混淆，导致：

- ❌ 代码可读性差：不知道某个ID是账号还是角色
- ❌ Bug频发：将账号ID当作角色ID使用
- ❌ 协作困难：不同开发者对同一ID理解不同
- ❌ 维护困难：后续修改时不知道影响范围

**本文档的目标**：
- ✅ 统一命名规范，提升代码可读性
- ✅ 明确各ID的作用域和使用场景
- ✅ 为未来的角色系统预留扩展空间
- ✅ 减少沟通成本，提升开发效率

---

## 🎯 核心ID体系

本系统采用**三层ID体系**，对应游戏中的三个维度：

```
┌─────────────────────────────────────────────────────────┐
│                     账号（Account）                       │
│              userId: "guest_1761815046402"              │
│         作用：登录、充值、封号、VIP管理                   │
└─────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼─────┐     ┌─────▼────┐     ┌─────▼────┐
    │  角色1    │     │  角色2    │     │  角色3    │
    │ playerId │     │ playerId │     │ playerId │
    │ player_  │     │ player_  │     │ player_  │
    │  12345   │     │  12346   │     │  12347   │
    └──────────┘     └──────────┘     └──────────┘
         │
    ┌────▼───────┐
    │   会话1     │  ← PC端登录
    │ sessionId  │
    │ 550e8400   │
    └────────────┘
    ┌────────────┐
    │   会话2     │  ← 手机端登录
    │ sessionId  │
    │ 661f9511   │
    └────────────┘
```

### 关系说明

- 一个**账号**（userId）可以创建多个**角色**（playerId）
- 一个**账号**可以在多个设备上登录，每个设备一个**会话**（sessionId）
- 一个**角色**可以在多个设备上登录（共享角色数据）

---

## 1️⃣ userId（账号ID）

### 定义

**userId = Account ID（账号唯一标识）**

### 特征

- 登录后由 Login Server 颁发
- 代表用户的账号，不是游戏角色
- 一个账号可以创建多个游戏角色（当前版本未实现多角色）
- 用于账号级别的操作和管理

### 使用场景

| 场景分类 | 具体场景 | 示例代码 |
|---------|---------|---------|
| **消息路由** | Gateway 路由消息到 Game Server | `routeManager.updateUserRoute(userId, gatewayId)` |
| **账号操作** | 充值、VIP升级 | `accountService.recharge(userId, amount)` |
|          | 账号封禁/解封 | `accountService.ban(userId, reason)` |
|          | 账号信息查询 | `accountService.getAccountInfo(userId)` |
| **登录认证** | JWT Token验证 | `jwtService.validate(token, userId)` |
|          | 三要素验证 | `centralService.validateThreeFactors(userId, ...)` |
| **日志追踪** | 日志记录 | `log.info("操作失败: userId={}, error={}", userId, error)` |

### 命名格式

```
游客登录：guest_{timestamp}
  示例: guest_1761815046402

微信登录：wx_openid_{openid}
  示例: wx_openid_oX4kf5ABCDEFG

用户名登录：user_{id}
  示例: user_12345
```

### 代码位置

- **MessageContext**: [MessageContext.java:44](../game-server/src/main/java/com/laya/game/game/handler/MessageContext.java#L44)
- **GameMessage**: [GameMessage.java:72](../game-server/src/main/java/com/laya/game/game/protocol/GameMessage.java#L72)
- **LoginService**: [LoginService.java](../login-server/src/main/java/com/jojohello_laya/login/service/LoginService.java)

### 最佳实践

```java
// ✅ 正确：清晰标注是账号ID
public void banAccount(String userId) {
    log.info("封禁账号: userId={}", userId);
    // 封禁账号（影响该账号下所有角色）
}

// ✅ 正确：日志清晰
log.info("账号充值成功: userId={}, amount={}", userId, amount);

// ❌ 错误：参数名模糊
public void ban(String id) {  // id是什么？
    // ...
}

// ❌ 错误：日志不清晰
log.info("操作成功: id={}", someId);  // 哪种ID？
```

---

## 2️⃣ playerId（角色ID）

### 定义

**playerId = Player ID / Character ID（游戏角色唯一标识）**

### 特征

- 一个账号（userId）可以拥有多个角色（playerId）
- 游戏业务逻辑主要使用 playerId
- **当前阶段未实现，预留字段（Phase 2 启用）**

### 使用场景（Phase 2 实现后）

| 场景分类 | 具体场景 | 示例代码 |
|---------|---------|---------|
| **游戏数据** | 背包管理 | `bagService.getItems(playerId)` |
|          | 装备管理 | `equipmentService.equip(playerId, itemId)` |
|          | 技能管理 | `skillService.upgradeSkill(playerId, skillId)` |
| **战斗系统** | 角色属性 | `playerService.getAttributes(playerId)` |
|          | 战斗力计算 | `battleService.calculatePower(playerId)` |
| **社交系统** | 好友管理 | `friendService.addFriend(playerId, targetPlayerId)` |
|          | 公会管理 | `guildService.joinGuild(playerId, guildId)` |
| **任务系统** | 任务进度 | `questService.getProgress(playerId, questId)` |
|          | 成就系统 | `achievementService.unlock(playerId, achievementId)` |

### 命名格式

```
角色ID：player_{id}
  示例: player_12345

角色ID：char_{uuid}
  示例: char_abc123def456
```

### 设计原则

```java
// ❌ 错误：背包属于角色，不应使用 userId
bagService.addItem(userId, itemId);

// ✅ 正确：使用 playerId 清晰表达归属
bagService.addItem(playerId, itemId);

// ❌ 错误：战斗力是角色属性，不应使用 userId
int power = calculatePower(userId);

// ✅ 正确：使用 playerId
int power = calculatePower(playerId);
```

### 代码位置

- **MessageContext**: [MessageContext.java:81](../game-server/src/main/java/com/laya/game/game/handler/MessageContext.java#L81) - 预留字段（注释状态）

### Phase 2 实施计划

#### 数据库表设计

```sql
-- 账号表
CREATE TABLE accounts (
    user_id VARCHAR(64) PRIMARY KEY,
    platform VARCHAR(32),          -- 平台：guest/wechat/qq
    created_at TIMESTAMP,
    vip_level INT DEFAULT 0,       -- 账号级VIP
    banned BOOLEAN DEFAULT FALSE   -- 账号级封禁
);

-- 角色表
CREATE TABLE players (
    player_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,        -- 所属账号
    player_name VARCHAR(32) NOT NULL,    -- 角色名
    level INT DEFAULT 1,
    exp BIGINT DEFAULT 0,
    created_at TIMESTAMP,
    last_login_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES accounts(user_id),
    INDEX idx_user_id (user_id)
);

-- 背包表（属于角色）
CREATE TABLE player_inventory (
    player_id VARCHAR(64) NOT NULL,      -- 使用 playerId
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    acquired_at TIMESTAMP,
    PRIMARY KEY (player_id, item_id)
);
```

#### MessageContext 启用 playerId

```java
// 当前状态（注释掉）
// private String playerId;

// Phase 2 启用
/**
 * 角色ID（Player/Character ID）
 */
private String playerId;
```

#### 业务逻辑调整

```java
// LoginHandler: 登录成功后查询角色列表
List<Player> players = playerService.getPlayersByUserId(userId);

if (players.isEmpty()) {
    // 首次登录，创建默认角色
    String playerId = playerService.createPlayer(userId, "新手");
    context.setPlayerId(playerId);
} else if (players.size() == 1) {
    // 只有一个角色，自动选择
    context.setPlayerId(players.get(0).getPlayerId());
} else {
    // 多个角色，返回角色列表让客户端选择
    sendPlayerList(context, players);
    return; // 等待客户端选择角色
}

// SelectPlayerHandler: 客户端选择角色
String selectedPlayerId = (String) data.get("playerId");
context.setPlayerId(selectedPlayerId);
routeManager.updatePlayerRoute(playerId, gatewayId);

// GetPlayerInfoHandler: 查询角色信息
PlayerInfo info = playerService.getPlayerInfo(playerId);  // 使用 playerId
```

---

## 3️⃣ sessionId（会话ID）

### 定义

**sessionId = Session ID（客户端连接唯一标识）**

### 特征

- Gateway 为每个 WebSocket 连接生成（通常是 UUID）
- 用于精准的消息路由
- 支持断线重连和多端登录

### 使用场景

| 场景分类 | 具体场景 | 示例代码 |
|---------|---------|---------|
| **消息路由** | 精准发送到客户端 | `context.sendResponse(message)` 优先使用 sessionId |
| **断线重连** | 客户端恢复会话 | `reconnectService.restore(sessionId)` |
| **多端登录** | 同账号不同设备 | 每个设备有独立 sessionId |
| **连接管理** | 踢人下线 | `gatewayService.kick(sessionId)` |

### 命名格式

```
UUID格式：550e8400-e29b-41d4-a716-446655440000

短ID格式：sess_{timestamp}_{random}
  示例: sess_1730123456_abc123
```

### 路由优先级

在 `MessageContext.sendResponse()` 中的路由优先级：

```java
String targetId = (sessionId != null) ? sessionId :      // ⚡ 最优先
                  (userId != null) ? userId :             // ⚡⚡ 次优先
                  gatewayId;                              // ⚡⚡⚡ 兜底
```

**原因**：
- `sessionId`：最精准，直接对应客户端连接
- `userId`：账号级别，Gateway 需要查找该账号的所有连接
- `gatewayId`：网关级别，广播到整个网关（一般不应该用到）

### 代码位置

- **MessageContext**: [MessageContext.java:60](../game-server/src/main/java/com/laya/game/game/handler/MessageContext.java#L60)
- **GatewayWebSocketHandler**: [GatewayWebSocketHandler.java](../gateway-server/src/main/java/com/laya/game/gateway/websocket/GatewayWebSocketHandler.java)

---

## 4️⃣ gatewayId（网关ID）

### 定义

**gatewayId = Gateway Server ID（网关服务器唯一标识）**

### 特征

- Gateway 启动时注册到 Central Server
- Game Server 通过 gatewayId 发送消息到指定网关
- 用于网关级别的操作

### 命名格式

```
gateway-1
gateway-2
gateway-{hostname}
```

### 使用场景

| 场景分类 | 具体场景 |
|---------|---------|
| **消息路由** | Game Server 发送消息到指定 Gateway |
| **负载均衡** | Central Server 分配 Gateway |
| **健康检查** | 监控 Gateway 状态 |

### 代码位置

- **MessageContext**: [MessageContext.java:92](../game-server/src/main/java/com/laya/game/game/handler/MessageContext.java#L92)
- **GatewayRouteManager**: [GatewayRouteManager.java](../game-server/src/main/java/com/laya/game/game/gateway/GatewayRouteManager.java)

---

## 📋 最佳实践

### 1. 函数命名规范

```java
// ✅ 正确：使用准确的参数名
public void banAccount(String userId) {
    // 封禁账号（影响所有角色）
}

public void resetPlayerLevel(String playerId) {
    // 重置角色等级（仅影响单个角色）
}

public void kickSession(String sessionId) {
    // 踢掉特定连接
}

// ❌ 错误：参数名不清晰
public void ban(String id) {  // id 是什么？userId？playerId？
    // 不清楚操作对象
}

public void reset(String id) {  // 重置什么？账号？角色？
    // 不清楚操作范围
}
```

### 2. 日志记录规范

```java
// ✅ 正确：清晰标注ID类型
log.info("账号充值成功: userId={}, amount={}", userId, amount);
log.info("角色升级: playerId={}, level={}", playerId, newLevel);
log.info("消息发送: sessionId={}, type={}", sessionId, messageType);
log.info("Gateway心跳: gatewayId={}, load={}", gatewayId, load);

// ❌ 错误：ID类型不明
log.info("操作成功: id={}", someId);  // 哪种ID？
log.info("用户充值: user={}", user);  // user是userId还是username？
```

### 3. 注释规范

```java
/**
 * 获取玩家背包
 *
 * @param playerId 角色ID（Player ID），不是账号ID（User ID）
 * @return 背包信息
 */
public Bag getPlayerBag(String playerId) {
    // ...
}

/**
 * 封禁账号
 *
 * @param userId 账号ID（User ID / Account ID）
 * @param reason 封禁原因
 */
public void banAccount(String userId, String reason) {
    // ...
}
```

### 4. 字段注释规范

```java
public class PlayerData {
    /**
     * 账号ID（Account ID）
     * 用于账号级操作
     */
    private String userId;

    /**
     * 角色ID（Player/Character ID）
     * 用于角色数据存储
     */
    private String playerId;

    /**
     * 会话ID（Session ID）
     * 用于连接标识
     */
    private String sessionId;
}
```

### 5. API设计规范

```java
// ✅ 正确：接口名称清晰
GET  /api/account/{userId}/info          // 查询账号信息
POST /api/account/{userId}/recharge      // 账号充值
GET  /api/player/{playerId}/info         // 查询角色信息
POST /api/player/{playerId}/level-up     // 角色升级
POST /api/session/{sessionId}/kick       // 踢掉连接

// ❌ 错误：接口不清晰
GET  /api/user/{id}/info                 // id是什么？
POST /api/player/{id}/operation          // 什么操作？
```

---

## ⚠️ 常见错误与纠正

| 错误写法 | 问题 | 正确写法 |
|---------|------|---------|
| `String id` | 不清楚是哪种ID | `String userId` 或 `String playerId` |
| `getUserInfo(userId)` | 账号信息还是角色信息？ | `getAccountInfo(userId)` 或 `getPlayerInfo(playerId)` |
| `playerData.userId` | 玩家数据应该用playerId | `playerData.playerId` |
| `log.info("id={}", id)` | 日志不清晰 | `log.info("userId={}", userId)` |
| `ban(String id)` | 封禁账号还是角色？ | `banAccount(String userId)` |
| `Map<String, Object> user` | user是ID还是对象？ | `String userId` 或 `UserAccount account` |

---

## 📚 相关文档

- [Game Server 架构设计](../game-server/DESIGN.md#命名规范naming-conventions)
- [Game Server 开发计划](../game-server/PlanAndStatus.md)
- [整体项目计划](../PlanAndStatus.md)
- [MessageContext 源码](../game-server/src/main/java/com/laya/game/game/handler/MessageContext.java)
- [GameMessage 源码](../game-server/src/main/java/com/laya/game/game/protocol/GameMessage.java)

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 | 负责人 |
|------|------|---------|-------|
| 1.0  | 2025-12-02 | 初始版本，定义三层ID体系 | Claude |

---

**文档维护者**: Laya Development Team
**最后更新**: 2025-12-02
**反馈渠道**: 项目 Issue Tracker
