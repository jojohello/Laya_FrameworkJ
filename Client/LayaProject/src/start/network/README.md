# Network 模块 - 网络通信

## 模块简介

Network 模块负责游戏的网络通信，包括 WebSocket 连接、消息收发、心跳保活、断线重连等功能。

**模块位置**: `src/start/network/`
**原因**: WebSocket 需要在登录成功后立即连接，放在 Start 模块可以保证在需要时已加载。

## 架构设计

本模块采用**分层架构 + 事件驱动**设计：

```
NetworkManager（统一入口）
  ├─ ISocket（传输层接口）
  │   └─ WebSocketImpl（WebSocket 实现）
  ├─ HeartbeatManager（心跳管理器）
  └─ ReconnectManager（重连管理器）
```

**设计原则**：
- ✅ **扁平架构**：文件组织清晰，避免深层嵌套
- ✅ **依赖倒置**：依赖接口（ISocket），不依赖具体实现
- ✅ **事件驱动**：通过事件注册，支持多个监听器
- ✅ **单一职责**：每个类只负责一件事
- ✅ **配置集中**：所有配置集中在 NetworkManager

## 核心组件

### NetworkManager - 网络管理器（统一入口）

**职责**：
- 统一入口点，对外提供简洁 API
- 配置集中管理（连接、心跳、重连）
- 组合各功能模块（传输层、心跳、重连）
- 单例模式，全局唯一

**核心接口**：
```typescript
// 连接服务器
await NetworkManager.instance.connect({
    url: "ws://localhost:8082/ws",
    heartbeat: { interval: 5000 },
    reconnect: { autoReconnect: true, maxRetries: 5 }
});

// 注册事件监听
NetworkManager.instance.on(SocketEvent.MESSAGE, (data) => { /* ... */ });

// 发送消息
NetworkManager.instance.send({ type: "chat", content: "Hello" });

// 断开连接
NetworkManager.instance.disconnect();
```

### ISocket - 传输层接口

**职责**：
- 抽象不同的传输协议（WebSocket、TCP、UDP 等）
- 定义统一的连接、收发、事件接口
- 上层业务不关心具体使用哪种协议

**事件类型**：
- `CONNECTED`: 连接成功
- `DISCONNECTED`: 连接断开
- `MESSAGE`: 收到消息
- `ERROR`: 发生错误

### WebSocketImpl - WebSocket 实现

**职责**：
- 实现 ISocket 接口
- 封装 Laya.Socket，提供纯粹的传输层功能
- 不包含业务逻辑（心跳、重连、协议解析）
- 支持多个事件监听器（事件驱动架构）

### HeartbeatManager - 心跳管理器

**职责**：
- 事件驱动：监听 Socket 连接/断开事件
- 自动启动/停止心跳
- 单一职责：只负责心跳发送
- 解耦设计：通过 ISocket 接口操作

**工作原理**：
1. 监听 Socket 的 CONNECTED 事件，连接成功后自动启动心跳
2. 监听 Socket 的 DISCONNECTED 事件，断开后自动停止心跳
3. 定时发送心跳消息，保持连接活跃

**心跳策略**：
- 客户端间隔：5 秒
- Gateway 超时：15 秒
- 客户端必须消费 `2002` 响应；不能只发送 `2001` 而不处理返回

### ReconnectManager - 重连管理器

**职责**：
- 事件驱动：监听 Socket 断开事件
- 指数退避算法（1s, 2s, 4s, 8s, 16s）
- 状态管理：跟踪重连次数、延迟时间
- 解耦设计：通过 ISocket 接口操作

**重连策略**：
```
第 1 次：延迟 1 秒
第 2 次：延迟 2 秒
第 3 次：延迟 4 秒
第 4 次：延迟 8 秒
第 5 次：延迟 16 秒（最大延迟）
```

### SystemProtocol - Gateway 鉴权与全局服务器错误

`SystemProtocol` 在 WebSocket 连接前注册 `AUTH_SUCCESS/AUTH_FAILED/ERROR`。连接建立后必须先使用 Login Server 返回的 `userId + loginTimestamp + token` 完成 `AUTH=1001`，成功后才允许发送 game-server 业务协议。它同时统一记录 `ERROR=9001` 的 `reason/code` 并派发 `serverError` 事件；业务 UI 不应重复注册这些消息。

首次连接与断线重连都必须遵守：`WebSocket connected → Gateway AUTH 成功 → Game LOGIN 成功 → 请求统一初始化`。不得使用固定延时假定登录成功。

## 快速开始

### 1. 连接服务器

```typescript
import { NetworkManager, SocketEvent } from '../network/NetworkManager';

// 登录成功后连接
const loginResult = await LoginMgr.instance.login(accountName);

await NetworkManager.instance.connect({
    url: loginResult.gatewayWsUrl,
    connectTimeout: 10000,
    heartbeat: {
        interval: 5000,         // 心跳间隔 5 秒；必须小于 Gateway 的 15 秒超时
        autoStart: true         // 自动启动心跳
    },
    reconnect: {
        autoReconnect: true,    // 自动重连
        maxRetries: 5           // 最大重连次数
    }
});
```

### 2. 监听消息

```typescript
// 监听消息事件
NetworkManager.instance.on(SocketEvent.MESSAGE, (data: any) => {
    console.log("收到服务器消息:", data);

    // 解析 JSON（如果是字符串）
    if (typeof data === 'string') {
        try {
            const message = JSON.parse(data);
            // 处理消息
        } catch (e) {
            // 解析失败
        }
    }
});

// 监听连接断开
NetworkManager.instance.on(SocketEvent.DISCONNECTED, (reason: string) => {
    console.log("连接断开:", reason);
    // 显示提示（重连管理器会自动重连）
});

// 监听错误
NetworkManager.instance.on(SocketEvent.ERROR, (error: any) => {
    console.error("网络错误:", error);
});
```

### 3. 发送消息

```typescript
// 发送对象（自动转换为 JSON 字符串）
NetworkManager.instance.send({
    type: "chat",
    content: "Hello, server!"
});

// 发送字符串
NetworkManager.instance.send("plain text message");

// 发送二进制数据（未来支持 Protobuf）
NetworkManager.instance.send(arrayBuffer);
```

### 4. 断开连接

```typescript
// 断开连接（会自动停止心跳和重连）
NetworkManager.instance.disconnect();
```

## 连接流程

```
用户登录成功
    ↓
获取 Gateway 信息（gatewayWsUrl）
    ↓
调用 NetworkManager.instance.connect(config)
    ↓
创建 WebSocketImpl（传输层）
    ↓
创建 HeartbeatManager（心跳管理）
    ↓
创建 ReconnectManager（重连管理）
    ↓
建立 WebSocket 连接（阻塞式）
    ↓ 成功
触发 CONNECTED 事件
    ↓
HeartbeatManager 自动启动心跳
    ↓
进入游戏主界面
    ↓
持续通信（发送/接收消息）
    ↓ 如果断开
触发 DISCONNECTED 事件
    ↓
ReconnectManager 自动重连（指数退避）
```

## 错误处理

### 连接失败

如果连接失败，会抛出异常，用户无法进入游戏：

```typescript
try {
    await NetworkManager.instance.connect(config);
    // 连接成功，进入游戏
    this.enterGame();
} catch (error) {
    console.error("连接失败:", error);
    // 显示错误提示，停留在登录界面
    showTip("连接服务器失败，请重试");
}
```

### 连接断开

连接断开时会触发 `DISCONNECTED` 事件，重连管理器会自动尝试重连：

```typescript
NetworkManager.instance.on(SocketEvent.DISCONNECTED, (reason: string) => {
    console.log("连接断开:", reason);
    // 显示"正在重连..."提示
    showTip("连接断开，正在重连...");
});

// 监听重连事件
NetworkManager.instance.reconnectManager.onReconnecting = (attempt, delay) => {
    console.log(`第 ${attempt} 次重连，延迟 ${delay}ms`);
};

NetworkManager.instance.reconnectManager.onReconnected = () => {
    console.log("重连成功");
    showTip("已重新连接");
};

NetworkManager.instance.reconnectManager.onReconnectFailed = () => {
    console.log("重连失败，已达最大次数");
    showTip("连接已断开，请重新登录");
};
```

## 消息格式

**当前格式**：JSON 字符串

**发送示例**：
```typescript
NetworkManager.instance.send({
    type: "chat",
    data: { content: "Hello, world!" }
});
```

**接收示例**：
```typescript
NetworkManager.instance.on(SocketEvent.MESSAGE, (data: any) => {
    // data 可能是字符串或已解析的对象
    if (typeof data === 'string') {
        const message = JSON.parse(data);
        console.log("消息类型:", message.type);
        console.log("消息数据:", message.data);
    }
});
```

**未来支持**：
- Protobuf 二进制协议（通过 ArrayBuffer 发送/接收）
- MessagePack 等高效序列化格式

## 配置说明

### NetworkConfig - 网络配置

```typescript
export interface NetworkConfig {
    url: string;                    // 连接 URL（必填）
    connectTimeout?: number;        // 连接超时（默认：10000ms）
    heartbeat?: HeartbeatConfig;    // 心跳配置
    reconnect?: ReconnectConfig;    // 重连配置
}
```

### HeartbeatConfig - 心跳配置

```typescript
export interface HeartbeatConfig {
    interval?: number;          // 心跳间隔（默认：5000ms；必须小于 Gateway 超时）
    messageType?: string;       // 心跳消息类型（默认：'HEARTBEAT'）
    autoStart?: boolean;        // 是否自动启动（默认：true）
}
```

### ReconnectConfig - 重连配置

```typescript
export interface ReconnectConfig {
    autoReconnect?: boolean;      // 是否自动重连（默认：true）
    maxRetries?: number;          // 最大重连次数（默认：5，-1 表示无限）
    initialDelay?: number;        // 初始延迟（默认：1000ms）
    maxDelay?: number;            // 最大延迟（默认：16000ms）
    delayMultiplier?: number;     // 延迟倍增因子（默认：2）
}
```

## 扩展性

### 支持其他传输协议

**只需两步**：

1. 实现 ISocket 接口：
   ```typescript
   export class TcpSocketImpl implements ISocket {
       connect(url: string): Promise<void> { /* TCP 实现 */ }
       disconnect(): void { /* ... */ }
       send(data: string | ArrayBuffer): void { /* ... */ }
       on(event: SocketEvent, handler: (...args: any[]) => void): void { /* ... */ }
       off(event: SocketEvent, handler: (...args: any[]) => void): void { /* ... */ }
       get connected(): boolean { /* ... */ }
       get connecting(): boolean { /* ... */ }
   }
   ```

2. 修改 NetworkManager 中的一行代码：
   ```typescript
   // 从 WebSocketImpl 改为 TcpSocketImpl
   this._socket = new TcpSocketImpl();
   ```

**HeartbeatManager、ReconnectManager 无需任何修改**，因为它们依赖 ISocket 接口。

## 注意事项

1. **模块加载顺序**: Network 模块随 Start 模块加载，必须在登录流程中可用
2. **阻塞式连接**: 连接失败会阻止用户进入游戏，确保网络就绪
3. **JSON 格式**: 当前假设所有消息为 JSON 字符串格式
4. **事件清理**: 组件销毁时记得移除事件监听，避免内存泄漏
5. **单例模式**: NetworkManager 是全局唯一实例，使用 `NetworkManager.instance` 访问

## 技术细节

详见 [DESIGN.md](DESIGN.md)

---

**最后更新**: 2025-12-02（架构重构）
**状态**: ✅ 重构完成
