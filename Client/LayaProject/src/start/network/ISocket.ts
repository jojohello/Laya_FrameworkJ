// jojohello 2025-12-02
// 网络传输层接口

/**
 * 网络传输层接口
 *
 * 设计理念：
 * - 抽象不同的传输协议（WebSocket、TCP、UDP 等）
 * - 提供统一的连接、收发、事件机制
 * - 上层业务不关心具体使用哪种协议
 *
 * 类比：类似 Java 的 Socket 抽象
 * - WebSocket：基于 HTTP 的双向通信协议
 * - TCP Socket：原生 TCP 连接
 * - UDP Socket：无连接的数据报协议
 *
 * 职责：
 * - 只负责数据传输（收发）
 * - 不包含业务逻辑（心跳、重连、协议解析）
 *
 * @author jojohello
 * @since 2025-12-02
 */
export interface ISocket {
    /**
     * 连接到远程服务器
     *
     * @param url 连接地址（格式取决于具体实现）
     *   - WebSocket: ws://host:port/path 或 wss://host:port/path
     *   - TCP: tcp://host:port
     *   - 其他协议根据需要定义
     *
     * @returns Promise<void> 连接成功时 resolve，失败时 reject
     *
     * @throws Error 连接失败、超时、参数错误等
     */
    connect(url: string, timeout?: number): Promise<void>;

    /**
     * 断开连接
     *
     * 说明：
     * - 应该清理所有资源（移除事件监听、关闭底层连接）
     * - 触发 DISCONNECTED 事件
     * - 幂等操作（多次调用不会报错）
     */
    disconnect(): void;

    /**
     * 发送数据
     *
     * @param data 要发送的数据
     *   - string: JSON 文本或普通字符串
     *   - ArrayBuffer: 二进制数据（未来支持 Protobuf 等）
     *
     * 注意：
     * - 如果未连接，应该打印警告但不抛异常
     * - 上层业务通过 connected 属性判断状态
     */
    send(data: string | ArrayBuffer): void;

    /**
     * 注册事件监听
     *
     * @param event 事件类型（见 SocketEvent 枚举）
     * @param handler 事件处理函数
     *
     * 说明：
     * - 支持同一事件注册多个监听器
     * - 同一个 handler 多次注册应该只生效一次
     */
    on(event: SocketEvent, handler: (...args: any[]) => void): void;

    /**
     * 移除事件监听
     *
     * @param event 事件类型
     * @param handler 事件处理函数（必须是注册时的同一个引用）
     */
    off(event: SocketEvent, handler: (...args: any[]) => void): void;

    /**
     * 获取连接状态
     *
     * @returns true: 已连接，false: 未连接
     */
    readonly connected: boolean;

    /**
     * 获取连接中状态
     *
     * @returns true: 正在连接，false: 不在连接中
     */
    readonly connecting: boolean;
}

/**
 * Socket 事件类型
 *
 * 说明：
 * - 所有实现必须支持这些事件
 * - 上层业务通过监听这些事件来响应网络状态变化
 */
export enum SocketEvent {
    /**
     * 连接成功事件
     *
     * 触发时机：底层连接建立成功后
     * 参数：无
     *
     * 示例：
     * socket.on(SocketEvent.CONNECTED, () => {
     *     console.log("连接成功");
     * });
     */
    CONNECTED = "connected",

    /**
     * 连接断开事件
     *
     * 触发时机：
     * - 服务器主动断开
     * - 网络中断
     * - 手动调用 disconnect()
     *
     * 参数：reason: string（断开原因）
     *
     * 示例：
     * socket.on(SocketEvent.DISCONNECTED, (reason: string) => {
     *     console.log("连接断开:", reason);
     * });
     */
    DISCONNECTED = "disconnected",

    /**
     * 收到数据事件
     *
     * 触发时机：收到服务器推送的数据
     * 参数：data: string | ArrayBuffer（原始数据）
     *
     * 注意：
     * - 传输层只负责传递原始数据
     * - 协议层负责解析（JSON.parse 等）
     *
     * 示例：
     * socket.on(SocketEvent.MESSAGE, (data: string) => {
     *     const msg = JSON.parse(data);
     *     console.log("收到消息:", msg);
     * });
     */
    MESSAGE = "message",

    /**
     * 错误事件
     *
     * 触发时机：
     * - 连接失败
     * - 发送失败
     * - 网络异常
     *
     * 参数：error: any（错误对象）
     *
     * 示例：
     * socket.on(SocketEvent.ERROR, (error: any) => {
     *     console.error("网络错误:", error);
     * });
     */
    ERROR = "error"
}
