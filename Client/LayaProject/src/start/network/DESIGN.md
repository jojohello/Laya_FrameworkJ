# Network 模块技术设计文档

## 模块定位

### 为什么放在 Start 模块？

**加载时序决定模块位置**：

```
时间线：
├─ Main.ts 启动
├─ Start 模块加载（首包）✅
│   ├─ LoginMgr
│   ├─ SDK
│   └─ Network ← 在这里！
├─ 用户登录
├─ 【关键时刻】登录成功，需要连接 WebSocket ← 必须立即可用
├─ Logic 模块加载（主包）✅
└─ 游戏运行（Logic 使用 Network）
```

**核心结论**：
- WebSocket 需要在登录成功后**立即连接**
- 如果放在 Logic 模块，登录时还没加载，无法连接
- 因此必须放在 Start 模块

**权衡**：
- ✅ 满足时序要求
- ⚠️ Start 模块变"重"了
- ✅ 但这是必要的权衡

### Start 模块的重新定义

**Start 模块 = 应用启动 + 用户认证 + 连接建立**

不仅是"登录界面"，而是"进入游戏前的所有准备工作"。

---

## 架构设计

### 整体架构（重构后）

```
┌──────────────────────────────────────────┐
│          NetworkManager（统一入口）        │
│   - 单例模式                              │
│   - 配置集中管理                          │
│   - 组合各功能模块                        │
│   - 对外提供统一 API                      │
└──────┬────────┬────────┬──────────────────┘
       │        │        │
       ↓        ↓        ↓
┌──────────┐ ┌──────────────┐ ┌──────────────┐
│ ISocket  │ │ Heartbeat    │ │ Reconnect    │
│ (接口)   │ │ Manager      │ │ Manager      │
│          │ │              │ │              │
│ 传输层   │ │ 心跳管理     │ │ 重连管理     │
│ 抽象     │ │ (事件驱动)   │ │ (事件驱动)   │
└────┬─────┘ └──────────────┘ └──────────────┘
     │
     ↓
┌──────────────┐
│ WebSocketImpl│
│              │
│ WebSocket    │
│ 传输层实现   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Laya.Socket  │
│ (引擎层)     │
└──────────────┘
```

**分层职责**：

1. **NetworkManager（网络管理器）**
   - 统一入口点，对外提供简洁 API
   - 配置集中管理（连接、心跳、重连）
   - 组合各功能模块（传输层、心跳、重连）
   - 单例模式，全局唯一

2. **ISocket（传输层接口）**
   - 抽象不同的传输协议（WebSocket、TCP、UDP 等）
   - 定义统一的连接、收发、事件接口
   - 上层业务不关心具体使用哪种协议
   - 依赖倒置原则（依赖接口，不依赖实现）

3. **WebSocketImpl（WebSocket 实现）**
   - 实现 ISocket 接口
   - 封装 Laya.Socket，提供纯粹的传输层功能
   - 不包含业务逻辑（心跳、重连、协议解析）
   - 支持多个事件监听器（事件驱动架构）

4. **HeartbeatManager（心跳管理器）**
   - 事件驱动：监听 Socket 连接/断开事件
   - 自动启动/停止心跳
   - 单一职责：只负责心跳发送
   - 解耦设计：通过 ISocket 接口操作

5. **ReconnectManager（重连管理器）**
   - 事件驱动：监听 Socket 断开事件
   - 指数退避算法（1s, 2s, 4s, 8s, 16s）
   - 状态管理：跟踪重连次数、延迟时间
   - 解耦设计：通过 ISocket 接口操作

---

## 核心设计原则

### 1. 扁平架构

**目录结构**：
```
network/
├── ISocket.ts                 # 传输层接口
├── WebSocketImpl.ts           # WebSocket 实现
├── HeartbeatManager.ts        # 心跳管理器
├── ReconnectManager.ts        # 重连管理器
├── NetworkManager.ts          # 网络管理器（统一入口）
├── README.md                  # 使用文档
└── DESIGN.md                  # 技术设计文档
```

**理由**：
- ✅ 文件组织清晰，易于查找
- ✅ 避免深层嵌套，降低复杂度
- ✅ 每个文件职责单一

### 2. 依赖倒置（Dependency Inversion）

**核心思想**：依赖接口（ISocket），不依赖具体实现（WebSocketImpl）

**实现**：
```typescript
// ✅ 正确：依赖 ISocket 接口
export class NetworkManager {
    private _socket: ISocket | null = null;

    public async connect(config: NetworkConfig): Promise<void> {
        // 直接 new 具体实现（不使用工厂模式）
        this._socket = new WebSocketImpl();
    }
}

// ✅ 正确：HeartbeatManager 依赖 ISocket 接口
export class HeartbeatManager {
    private _socket: ISocket;

    constructor(socket: ISocket, config?: HeartbeatConfig) {
        this._socket = socket;
    }
}
```

**好处**：
- ✅ 未来可以轻松替换 WebSocket 为 TCP/UDP
- ✅ 只需修改 NetworkManager 中的一行代码（new WebSocketImpl → new TcpSocketImpl）
- ✅ HeartbeatManager、ReconnectManager 无需任何修改

### 3. 事件驱动（Event-Driven）

**核心思想**：通过事件通知，而非回调函数

**对比**：

```typescript
// ❌ 旧设计：回调函数
export class GatewaySocket {
    public onConnect: (() => void) | null = null;
    public onMessage: ((data: any) => void) | null = null;
    public onClose: ((reason: string) => void) | null = null;
}

// ✅ 新设计：事件注册
export interface ISocket {
    on(event: SocketEvent, handler: (...args: any[]) => void): void;
    off(event: SocketEvent, handler: (...args: any[]) => void): void;
}

// 使用示例
socket.on(SocketEvent.CONNECTED, () => { console.log("连接成功"); });
socket.on(SocketEvent.MESSAGE, (data) => { console.log("收到消息:", data); });
```

**好处**：
- ✅ 支持多个事件监听器（一对多）
- ✅ 可以动态添加/移除监听器
- ✅ 更符合浏览器 WebSocket API 设计

### 4. 单一职责（Single Responsibility）

**每个类只负责一件事**：

| 类 | 职责 | 不包含 |
|---|------|-------|
| WebSocketImpl | 传输层（连接、收发、事件） | 心跳、重连、协议解析 |
| HeartbeatManager | 心跳发送 | 传输层、协议解析 |
| ReconnectManager | 断线重连 | 传输层、心跳 |
| NetworkManager | 统一入口、配置管理 | 具体传输逻辑 |

### 5. 配置集中管理

**所有配置集中在 NetworkManager**：

```typescript
export interface NetworkConfig {
    url: string;                    // 连接 URL
    connectTimeout?: number;        // 连接超时
    heartbeat?: HeartbeatConfig;    // 心跳配置
    reconnect?: ReconnectConfig;    // 重连配置
}

// 使用示例
await NetworkManager.instance.connect({
    url: "ws://localhost:8082/ws",
    connectTimeout: 10000,
    heartbeat: {
        interval: 20000,
        autoStart: true
    },
    reconnect: {
        autoReconnect: true,
        maxRetries: 5
    }
});
```

**好处**：
- ✅ 配置一目了然
- ✅ 易于调整参数
- ✅ 避免配置散落各处

---

## 心跳机制设计（已实现）

### 设计理念

**事件驱动 + 自动管理**：
- 监听 Socket 的 CONNECTED 事件，连接成功后自动启动心跳
- 监听 Socket 的 DISCONNECTED 事件，断开后自动停止心跳
- 定时发送心跳消息，保持连接活跃

### 配置参数

```typescript
export interface HeartbeatConfig {
    interval?: number;          // 心跳间隔（默认：20000ms）
    messageType?: string;       // 心跳消息类型（默认：'HEARTBEAT'）
    autoStart?: boolean;        // 是否自动启动（默认：true）
}
```

### 心跳策略

**客户端策略**：
- 心跳间隔：20 秒
- 心跳消息：`{ type: 'HEARTBEAT', data: { timestamp: 当前时间戳 } }`

**服务器配置**：
- heartbeat-interval = 30 秒
- 超时判定 = 60 秒（heartbeat-interval × 2）

**余量分析**：
- 客户端每 20 秒发送一次
- 服务器 60 秒未收到消息才判定超时
- 留有 40 秒的安全余量

### 实现示例

```typescript
const socket = new WebSocketImpl();
const heartbeatMgr = new HeartbeatManager(socket, {
    interval: 20000,
    messageType: 'HEARTBEAT',
    autoStart: true
});

heartbeatMgr.start(); // 开始监听（连接后自动发心跳）
```

---

## 断线重连机制（已实现）

### 设计理念

**指数退避 + 事件驱动**：
- 监听 Socket 的 DISCONNECTED 事件，自动触发重连
- 使用指数退避算法，避免频繁重连
- 跟踪重连次数、延迟时间等状态
- 重连成功后重置计数

### 配置参数

```typescript
export interface ReconnectConfig {
    autoReconnect?: boolean;      // 是否自动重连（默认：true）
    maxRetries?: number;          // 最大重连次数（默认：5，-1 表示无限）
    initialDelay?: number;        // 初始延迟（默认：1000ms）
    maxDelay?: number;            // 最大延迟（默认：16000ms）
    delayMultiplier?: number;     // 延迟倍增因子（默认：2）
}
```

### 重连策略（指数退避）

**延迟计算公式**：
```
delay = min(initialDelay * (multiplier ^ (attempt - 1)), maxDelay)
```

**示例（默认配置）**：
- 第 1 次：1000 * (2 ^ 0) = 1000ms  (1秒)
- 第 2 次：1000 * (2 ^ 1) = 2000ms  (2秒)
- 第 3 次：1000 * (2 ^ 2) = 4000ms  (4秒)
- 第 4 次：1000 * (2 ^ 3) = 8000ms  (8秒)
- 第 5 次：1000 * (2 ^ 4) = 16000ms (16秒，达到最大值)

### 回调接口

```typescript
reconnectMgr.onReconnecting = (attempt, delay) => {
    console.log(`正在重连... (第 ${attempt} 次，延迟 ${delay}ms)`);
};

reconnectMgr.onReconnected = () => {
    console.log("重连成功");
};

reconnectMgr.onReconnectFailed = () => {
    console.log("重连失败，已达最大重试次数");
};
```

---

## 使用示例

### 基本使用

```typescript
import { NetworkManager, SocketEvent } from '../network/NetworkManager';

// 1. 获取单例
const networkMgr = NetworkManager.instance;

// 2. 配置并连接
await networkMgr.connect({
    url: "ws://localhost:8082/ws",
    connectTimeout: 10000,
    heartbeat: {
        interval: 20000,
        autoStart: true
    },
    reconnect: {
        autoReconnect: true,
        maxRetries: 5
    }
});

// 3. 监听消息
networkMgr.on(SocketEvent.MESSAGE, (data: any) => {
    console.log("收到消息:", data);
    // 处理消息
});

// 4. 监听断开
networkMgr.on(SocketEvent.DISCONNECTED, (reason: string) => {
    console.log("连接断开:", reason);
});

// 5. 发送消息
networkMgr.send({
    type: "chat",
    content: "Hello, server!"
});

// 6. 断开连接
networkMgr.disconnect();
```

### 登录流程集成

```typescript
// LoginView.ts
export class LoginView extends Laya.Scene {
    async onLoginSuccess(): Promise<void> {
        const loginResult = await LoginMgr.instance.login(accountName);

        try {
            // 阻塞式：必须连接成功
            await NetworkManager.instance.connect({
                url: loginResult.gatewayWsUrl,
                heartbeat: { interval: 20000 },
                reconnect: { autoReconnect: true, maxRetries: 5 }
            });

            // 连接成功才能进入游戏
            this.enterGame();

        } catch (error) {
            console.error("连接 Gateway 失败:", error);
            showTip("连接服务器失败，请重试");
        }
    }
}
```

---

## 性能优化

### 1. JSON 性能优化

**当前配置**：
```typescript
socket.disableInput = true; // 禁用二进制缓存
```

**原因**：
- JSON 是文本格式，不需要二进制处理
- 减少字符串 ↔ ArrayBuffer 转换开销

### 2. 事件监听优化

**注意事项**：
```typescript
// ✅ 正确：使用 this 作为 caller
socket.on(Laya.Event.OPEN, this, this._onOpen);

// ❌ 错误：使用箭头函数或 bind
socket.on(Laya.Event.OPEN, () => this._onOpen()); // 无法正确移除
socket.on(Laya.Event.OPEN, this._onOpen.bind(this)); // 无法正确移除
```

**原因**：
- LayaAir 的 `off` 需要完全相同的引用
- 箭头函数和 bind 每次创建新引用，无法移除
- 导致内存泄漏

### 3. 事件处理器错误隔离

**设计**：
```typescript
private _emitEvent(event: SocketEvent, ...args: any[]): void {
    const handlers = this._eventHandlers.get(event);
    if (handlers) {
        handlers.forEach(handler => {
            try {
                handler(...args);
            } catch (error) {
                console.error(`[WebSocketImpl] 事件处理器执行出错 [${event}]:`, error);
            }
        });
    }
}
```

**好处**：
- 某个事件处理器出错不会影响其他处理器
- 防止事件系统崩溃

---

## 错误处理

### 连接错误类型

1. **网络错误**
   - 服务器不可达
   - DNS 解析失败
   - 超时

2. **协议错误**
   - URL 格式错误
   - 握手失败

3. **认证错误**（待确认）
   - Token 验证失败
   - 权限不足

### 错误处理策略

```typescript
// 连接失败会触发 ERROR 事件
networkMgr.on(SocketEvent.ERROR, (error: any) => {
    console.error("网络错误:", error);

    // 根据错误类型处理
    let userMessage = "连接服务器失败";

    if (error.message?.includes("timeout")) {
        userMessage = "连接超时，请检查网络";
    } else if (error.message?.includes("refused")) {
        userMessage = "服务器拒绝连接，请稍后重试";
    }

    showTip(userMessage);
});
```

---

## 调试和日志

### 日志级别

```typescript
enum LogLevel {
    DEBUG,   // 详细日志（开发环境）
    INFO,    // 一般信息
    WARN,    // 警告
    ERROR    // 错误
}
```

### 关键日志点

1. **连接生命周期**
   ```typescript
   console.log("[NetworkManager] ✅ 连接成功:", config.url);
   console.log("[WebSocketImpl] ❌ 连接失败:", error);
   console.log("[WebSocketImpl] 连接关闭:", reason);
   ```

2. **心跳状态**
   ```typescript
   console.log("[HeartbeatManager] ❤️ 心跳已启动（间隔: 20000ms）");
   console.log("[HeartbeatManager] 💔 心跳已停止");
   ```

3. **重连状态**
   ```typescript
   console.log("[ReconnectManager] 🔄 准备重连... (第 1 次，延迟 1000ms)");
   console.log("[ReconnectManager] ✅ 重连成功（共尝试 3 次）");
   console.log("[ReconnectManager] ❌ 重连失败，已达最大重试次数 (5)");
   ```

---

## 已知问题和坑点

### 0. 登录、鉴权与业务初始化必须形成可等待的状态链

- WebSocket 连接成功只代表传输层可用，不代表 Gateway 鉴权成功。
- 客户端必须等待明确的鉴权成功响应后才能发送 Game 登录、`GAME_INIT` 或其他业务协议；禁止用固定延迟猜测服务器已经就绪。
- 鉴权失败响应必须保留完整 envelope，至少把 `msgId`、`code`、`message/reason` 和 `data` 传给协议处理层，不能只转发 `data` 后丢失真实失败原因。
- 新增协议时按作用域决定由 Gateway 本地处理还是转发 Game Server；除心跳、鉴权和连接管理外，Gateway 不应重复实现游戏业务协议。
- 登录和重连都必须重新请求统一初始化快照；各业务模块只消费自己的 section，不得依赖其他 section 的到达顺序。
- 初始化调试至少保留三类日志：请求已发出、响应 section 列表、各模块 `applyInit` 结果。缺少其中任一项时，不能仅凭“进入主界面”判断初始化成功。

### 1. LayaAir Socket 的 connectByUrl 行为

**观察**：
- `connectByUrl` 是异步的，但不返回 Promise
- 需要通过事件监听判断连接结果

**解决方案**：
```typescript
public connect(url: string, timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
        // 设置超时
        const timer = setTimeout(() => {
            reject(new Error(`连接超时 (${timeout}ms)`));
        }, timeout);

        // 监听成功
        const onOpen = () => {
            clearTimeout(timer);
            resolve();
        };

        // 监听失败
        const onError = (error: any) => {
            clearTimeout(timer);
            reject(error);
        };

        // 绑定事件
        this._socket.on(Laya.Event.OPEN, this, onOpen);
        this._socket.on(Laya.Event.ERROR, this, onError);

        // 发起连接
        this._socket.connectByUrl(url);
    });
}
```

### 2. 事件监听的内存泄漏风险

**问题**：
- 忘记 `off` 导致内存泄漏
- 组件销毁后仍然接收消息

**解决方案**：
```typescript
public disconnect(): void {
    if (this._socket) {
        // ✅ 先移除所有事件监听
        this._unbindLayaEvents();

        // 然后关闭连接
        this._socket.close();
        this._socket = null;
    }
}

private _unbindLayaEvents(): void {
    if (!this._socket) return;

    this._socket.off(Laya.Event.MESSAGE, this, this._onLayaMessage);
    this._socket.off(Laya.Event.CLOSE, this, this._onLayaClose);
    this._socket.off(Laya.Event.ERROR, this, this._onLayaError);
}
```

---

## 扩展性设计

### 未来支持其他传输协议

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
   public async connect(config: NetworkConfig): Promise<void> {
       // 从 WebSocketImpl 改为 TcpSocketImpl
       this._socket = new TcpSocketImpl();

       // 其他代码完全不变
       // ...
   }
   ```

**HeartbeatManager、ReconnectManager 无需任何修改**，因为它们依赖 ISocket 接口，不依赖具体实现。

---

## 参考资料

- [LayaAir 3.3 WebSocket 文档](https://layaair.com/3.x/doc/basics/common/network/WebSocket/)
- [WebSocket 心跳最佳实践](https://websockets.readthedocs.io/en/stable/topics/keepalive.html)
- 项目 README.md（使用说明）

---

**文档维护**：
- 遇到新的技术问题，及时更新本文档
- 做出架构决策后，记录理由和权衡
- 定期回顾，保持文档准确性

**最后更新**: 2025-12-02（架构重构）
