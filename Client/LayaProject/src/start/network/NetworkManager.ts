// jojohello 2025-12-02
// 网络管理器（统一入口）

import { ISocket, SocketEvent } from "./ISocket";
import { WebSocketImpl } from "./WebSocketImpl";
import { HeartbeatManager, HeartbeatConfig } from "./HeartbeatManager";
import { ReconnectManager, ReconnectConfig } from "./ReconnectManager";
import { MessageDispatcher } from "./MessageDispatcher";
import { getMessageId } from "./MessageIds";

/**
 * 网络管理器配置
 */
export interface NetworkConfig {
    /**
     * 连接 URL
     */
    url: string;

    /**
     * 连接超时时间（毫秒）
     * 默认：10000（10秒）
     */
    connectTimeout?: number;

    /**
     * 心跳配置
     */
    heartbeat?: HeartbeatConfig | false;

    /**
     * 重连配置
     */
    reconnect?: ReconnectConfig | false;
}

/**
 * 网络管理器
 *
 * 设计理念：
 * - 统一入口：所有网络操作的唯一入口
 * - 单例模式：全局唯一实例
 * - 组合模式：组合 Socket、HeartbeatManager、ReconnectManager
 * - 配置集中：所有配置集中在 NetworkConfig
 * - 事件驱动：通过 ISocket 事件机制对外暴露
 *
 * 架构设计：
 * ```
 * NetworkManager（统一入口）
 *   ├─ ISocket（传输层接口）
 *   │   └─ WebSocketImpl（具体实现，直接 new）
 *   ├─ HeartbeatManager（心跳管理器）
 *   └─ ReconnectManager（重连管理器）
 * ```
 *
 * 职责：
 * - 管理 Socket 生命周期（创建、连接、断开、销毁）
 * - 管理心跳、重连等功能模块
 * - 提供统一的配置接口
 * - 对外暴露简洁的 API
 *
 * 使用示例：
 * ```typescript
 * // 获取单例
 * const networkMgr = NetworkManager.instance;
 *
 * // 配置并连接
 * await networkMgr.connect({
 *     url: "ws://localhost:8082/ws",
 *     heartbeat: {
 *         interval: 20000,
 *         autoStart: true
 *     },
 *     reconnect: {
 *         autoReconnect: true,
 *         maxRetries: 5
 *     }
 * });
 *
 * // 监听消息
 * networkMgr.on(SocketEvent.MESSAGE, (data) => {
 *     console.log("收到消息:", data);
 * });
 *
 * // 发送消息
 * networkMgr.send({ type: "chat", content: "Hello" });
 *
 * // 断开连接
 * networkMgr.disconnect();
 * ```
 *
 * @author jojohello
 * @since 2025-12-02
 */
export class NetworkManager {
    private static _instance: NetworkManager;

    private _socket: ISocket | null = null;
    private _heartbeatMgr: HeartbeatManager | null = null;
    private _reconnectMgr: ReconnectManager | null = null;

    private _config: NetworkConfig | null = null;

    /**
     * 消息队列
     *
     * 用途：
     * - 防止单帧处理过多消息导致卡顿
     * - 分帧处理，平滑分散到多帧
     *
     * 流程：
     * 1. WebSocket 收到消息后加入队列（不立即处理）
     * 2. update() 中每帧处理 batchSize 条消息
     * 3. 分发到 MessageDispatcher
     */
    private _messageQueue: any[] = [];

    /**
     * 每帧最多处理的消息数量
     *
     * 建议值：10-20
     * - 太小：消息积压
     * - 太大：单帧卡顿
     */
    private _batchSize: number = 10;

    // 私有构造函数（单例模式）
    private constructor() {}

    /**
     * 获取单例实例
     */
    public static get instance(): NetworkManager {
        if (!NetworkManager._instance) {
            NetworkManager._instance = new NetworkManager();
        }
        return NetworkManager._instance;
    }

    /**
     * 连接到服务器
     *
     * @param config 网络配置
     * @returns Promise<void>
     *
     * 说明：
     * - 如果已连接，会先断开旧连接
     * - 自动创建 Socket、HeartbeatManager、ReconnectManager
     * - 根据配置启动心跳、重连功能
     */
    public async connect(config: NetworkConfig): Promise<void> {
        // 如果已连接，先断开
        if (this._socket?.connected) {
            console.warn("[NetworkManager] 已连接，先断开旧连接");
            this.disconnect();
        }

        // 保存配置
        this._config = config;

        try {
            // 🔑 关键：直接创建 WebSocketImpl 实例（不使用工厂模式）
            this._socket = new WebSocketImpl();

            // 创建心跳管理器
            if (config.heartbeat !== false) {
                this._heartbeatMgr = new HeartbeatManager(this._socket, config.heartbeat);
                this._heartbeatMgr.start();
            }

            // 创建重连管理器
            if (config.reconnect !== false) {
                this._reconnectMgr = new ReconnectManager(
                    this._socket,
                    config.url,
                    config.reconnect
                );
                this._reconnectMgr.start();
            }

            // 设置消息处理器（在连接之前）
            this._setupMessageHandler();

            // 连接服务器
            await this._socket.connect(config.url, config.connectTimeout);

        } catch (error) {
            console.error("[NetworkManager] ❌ 连接失败:", error);

            // 清理资源
            this._cleanup();

            throw error;
        }
    }

    /**
     * 断开连接
     *
     * 说明：
     * - 停止心跳、重连功能
     * - 断开 Socket 连接
     * - 清理所有资源
     */
    public disconnect(): void {
        // 停止心跳
        if (this._heartbeatMgr) {
            this._heartbeatMgr.stop();
        }

        // 停止重连
        if (this._reconnectMgr) {
            this._reconnectMgr.stop();
        }

        // 断开连接
        if (this._socket) {
            this._socket.disconnect();
        }

        // 清理资源
        this._cleanup();
    }

    /**
     * 发送消息
     *
     * @param data 要发送的数据
     *   - object: 自动转换为 JSON 字符串
     *   - string: 直接发送
     *   - ArrayBuffer: 发送二进制数据
     */
    public send(data: any): void {
        if (!this._socket) {
            console.warn("[NetworkManager] Socket 未初始化，无法发送消息");
            return;
        }

        // 自动转换为 JSON 字符串
        if (typeof data === 'object' && !(data instanceof ArrayBuffer)) {
            data = JSON.stringify(data);
        }

        this._socket.send(data);
    }

    /**
     * 注册事件监听
     *
     * @param event 事件类型
     * @param handler 事件处理函数
     */
    public on(event: SocketEvent, handler: (...args: any[]) => void): void {
        if (!this._socket) {
            console.warn("[NetworkManager] Socket 未初始化，无法注册事件");
            return;
        }

        this._socket.on(event, handler);
    }

    /**
     * 移除事件监听
     *
     * @param event 事件类型
     * @param handler 事件处理函数
     */
    public off(event: SocketEvent, handler: (...args: any[]) => void): void {
        if (!this._socket) {
            return;
        }

        this._socket.off(event, handler);
    }

    /**
     * 手动触发重连
     *
     * 说明：
     * - 如果已连接，先断开
     * - 使用保存的配置重新连接
     */
    public async reconnect(): Promise<void> {
        if (!this._config) {
            throw new Error("未配置，无法重连");
        }

        // 如果已连接，先断开
        if (this._socket?.connected) {
            this.disconnect();
        }

        // 使用保存的配置重新连接
        await this.connect(this._config);
    }

    /**
     * 清理资源
     */
    private _cleanup(): void {
        this._socket = null;
        this._heartbeatMgr = null;
        this._reconnectMgr = null;
    }

    /**
     * 获取连接状态
     */
    public get connected(): boolean {
        return this._socket?.connected ?? false;
    }

    /**
     * 获取连接中状态
     */
    public get connecting(): boolean {
        return this._socket?.connecting ?? false;
    }

    /**
     * 获取 Socket 实例（只读）
     *
     * 说明：
     * - 提供给需要直接操作 Socket 的场景
     * - 不建议外部直接使用，优先使用 NetworkManager 提供的 API
     */
    public get socket(): ISocket | null {
        return this._socket;
    }

    /**
     * 获取心跳管理器（只读）
     */
    public get heartbeatManager(): HeartbeatManager | null {
        return this._heartbeatMgr;
    }

    /**
     * 获取重连管理器（只读）
     */
    public get reconnectManager(): ReconnectManager | null {
        return this._reconnectMgr;
    }

    /**
     * 获取配置（只读）
     */
    public get config(): Readonly<NetworkConfig> | null {
        return this._config;
    }

    // ========== IManager 接口实现 ==========

    /**
     * 初始化
     *
     * 启动 update 循环，用于处理消息队列
     *
     * 注意：
     * - 不在这里连接服务器，连接由外部调用 connect()
     * - update 循环会一直运行，即使到了 Logic 模块也继续运行
     */
    init(): void {
        // 启动 update 循环（处理消息队列）
        Laya.timer.frameLoop(1, this, () => {
            const dt = Laya.timer.delta / 1000;  // 转换为秒
            this.update(dt);
        });
    }

    /**
     * 每帧更新
     *
     * 处理消息队列：每帧处理 batchSize 条消息
     *
     * @param dt 距离上一帧的时间间隔（秒）
     */
    update(dt: number): void {
        // 处理消息队列
        this._processMessageQueue();
    }

    /**
     * 重置状态
     *
     * 清空消息队列
     */
    reset(): void {
        this._messageQueue = [];
    }

    /**
     * 释放资源
     *
     * 断开连接并清理
     */
    release(): void {
        // 停止 update 循环
        Laya.timer.clear(this, this.update);

        // 断开连接
        this.disconnect();

        // 清空消息队列
        this._messageQueue = [];
    }

    // ========== 消息队列处理 ==========

    /**
     * 设置每帧处理的消息数量
     *
     * @param batchSize 批量大小（建议 10-20）
     */
    setBatchSize(batchSize: number): void {
        if (batchSize <= 0) {
            console.warn("[NetworkManager] batchSize 必须大于 0");
            return;
        }
        this._batchSize = batchSize;
    }

    /**
     * 处理消息队列
     *
     * 每帧最多处理 batchSize 条消息
     *
     * 流程：
     * 1. 从队列头部取出消息
     * 2. 解析 JSON
     * 3. 提取 msgId
     * 4. 分发到 MessageDispatcher
     */
    private _processMessageQueue(): void {
        if (this._messageQueue.length === 0) {
            return;
        }

        let processed = 0;

        while (this._messageQueue.length > 0 && processed < this._batchSize) {
            const rawData = this._messageQueue.shift();

            try {
                // 解析消息
                let message: any;
                if (typeof rawData === 'string') {
                    message = JSON.parse(rawData);
                } else {
                    message = rawData;
                }

                // 提取 msgId（统一使用数字）
                const msgId = message.msgId;
                if (!msgId || typeof msgId !== 'number') {
                    console.warn("[NetworkManager] 消息缺少有效的 msgId:", message);
                    processed++;
                    continue;
                }

                const msgIdNum: number = msgId;

                // 分发到 MessageDispatcher
                MessageDispatcher.dispatch(msgIdNum, message.data);

            } catch (error) {
                console.error("[NetworkManager] 消息处理异常:", error, "原始数据:", rawData);
            }

            processed++;
        }

        // 如果队列积压，发出警告
        if (this._messageQueue.length > 50) {
            console.warn(`[NetworkManager] ⚠️ 消息队列积压: ${this._messageQueue.length} 条`);
        }
    }

    /**
     * 设置消息接收处理器
     *
     * 在 connect() 后调用，监听 MESSAGE 事件
     *
     * 注意：这是内部方法，connect() 会自动调用
     */
    private _setupMessageHandler(): void {
        if (!this._socket) {
            return;
        }

        // 监听消息事件，加入队列
        this._socket.on(SocketEvent.MESSAGE, (data: any) => {
            this._messageQueue.push(data);
        });
    }

    /**
     * 获取消息队列长度（用于调试）
     */
    get messageQueueLength(): number {
        return this._messageQueue.length;
    }
}
