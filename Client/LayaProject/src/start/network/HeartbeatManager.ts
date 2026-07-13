// jojohello 2025-12-02
// 心跳管理器（事件驱动）

import { ISocket, SocketEvent } from "./ISocket";

/**
 * 心跳管理器配置
 */
export interface HeartbeatConfig {
    /**
     * 心跳间隔（毫秒）
     * 默认：20000（20秒）
     *
     * 说明：
     * - 服务器端配置：heartbeat-interval = 30秒，超时判定 = 60秒
     * - 客户端策略：每20秒发送一次，留有40秒余量
     */
    interval?: number;

    /**
     * 心跳消息类型
     * 默认：'HEARTBEAT'
     */
    messageType?: string;

    /**
     * 是否自动启动心跳
     * 默认：true（连接成功后自动启动）
     */
    autoStart?: boolean;
}

/**
 * 心跳管理器
 *
 * 设计理念：
 * - 事件驱动：监听 Socket 的连接/断开事件，自动启动/停止心跳
 * - 单一职责：只负责心跳发送，不关心业务逻辑
 * - 解耦设计：通过 ISocket 接口操作，不依赖具体实现
 *
 * 工作原理：
 * 1. 监听 Socket 的 CONNECTED 事件，连接成功后自动启动心跳
 * 2. 监听 Socket 的 DISCONNECTED 事件，断开后自动停止心跳
 * 3. 定时发送心跳消息，保持连接活跃
 *
 * 使用示例：
 * ```typescript
 * const socket = new WebSocketImpl();
 * const heartbeatMgr = new HeartbeatManager(socket, {
 *     interval: 20000,
 *     messageType: 'HEARTBEAT'
 * });
 * heartbeatMgr.start(); // 开始监听（连接后自动发心跳）
 * ```
 *
 * @author jojohello
 * @since 2025-12-02
 */
export class HeartbeatManager {
    private _socket: ISocket;
    private _config: Required<HeartbeatConfig>;
    private _timer: any = null;
    private _enabled: boolean = false;
    private _active: boolean = false; // 心跳是否正在运行

    // 事件处理器（保存引用，用于解绑）
    private _onConnected: () => void;
    private _onDisconnected: (reason: string) => void;

    /**
     * 构造函数
     *
     * @param socket ISocket 实例
     * @param config 心跳配置
     */
    constructor(socket: ISocket, config?: HeartbeatConfig) {
        this._socket = socket;

        // 合并默认配置
        this._config = {
            interval: config?.interval ?? 20000,
            messageType: config?.messageType ?? 'HEARTBEAT',
            autoStart: config?.autoStart ?? true
        };

        // 绑定事件处理器（保存引用）
        this._onConnected = this._handleConnected.bind(this);
        this._onDisconnected = this._handleDisconnected.bind(this);
    }

    /**
     * 启动心跳管理器
     *
     * 说明：
     * - 注册 Socket 事件监听
     * - 如果已连接且 autoStart = true，立即启动心跳
     */
    public start(): void {
        if (this._enabled) {
            console.warn("[HeartbeatManager] 已经启动，无需重复调用");
            return;
        }

        this._enabled = true;

        // 注册事件监听
        this._socket.on(SocketEvent.CONNECTED, this._onConnected);
        this._socket.on(SocketEvent.DISCONNECTED, this._onDisconnected);

        // 如果已经连接，立即启动心跳
        if (this._socket.connected && this._config.autoStart) {
            this._startHeartbeat();
        }
    }

    /**
     * 停止心跳管理器
     *
     * 说明：
     * - 停止心跳发送
     * - 移除 Socket 事件监听
     */
    public stop(): void {
        if (!this._enabled) {
            return;
        }

        this._enabled = false;

        // 停止心跳
        this._stopHeartbeat();

        // 移除事件监听
        this._socket.off(SocketEvent.CONNECTED, this._onConnected);
        this._socket.off(SocketEvent.DISCONNECTED, this._onDisconnected);
    }

    /**
     * 处理连接成功事件
     */
    private _handleConnected(): void {
        if (this._config.autoStart) {
            this._startHeartbeat();
        }
    }

    /**
     * 处理断开连接事件
     */
    private _handleDisconnected(reason: string): void {
        this._stopHeartbeat();
    }

    /**
     * 启动心跳定时器
     */
    private _startHeartbeat(): void {
        // 防止重复启动
        if (this._active) {
            return;
        }

        this._active = true;

        // 使用 Laya.timer.loop 确保在游戏帧循环中执行
        this._timer = Laya.timer.loop(
            this._config.interval,
            this,
            this._sendHeartbeat
        );
    }

    /**
     * 停止心跳定时器
     */
    private _stopHeartbeat(): void {
        if (!this._active) {
            return;
        }

        this._active = false;

        // 清除定时器
        if (this._timer) {
            Laya.timer.clear(this, this._sendHeartbeat);
            this._timer = null;
        }
    }

    /**
     * 发送心跳消息
     *
     * 统一协议格式（使用 msgId）：
     * {
     *   msgId: 2001,  // HEARTBEAT
     *   data: { timestamp: 当前时间戳 }
     * }
     */
    private _sendHeartbeat(): void {
        // 检查连接状态
        if (!this._socket.connected) {
            this._stopHeartbeat();
            return;
        }

        // 构造心跳消息（使用 msgId）
        const heartbeatMsg = {
            msgId: 2001,  // MessageIds.HEARTBEAT
            data: { timestamp: Date.now() }
        };

        // 发送心跳
        try {
            this._socket.send(JSON.stringify(heartbeatMsg));
        } catch (error) {
            console.error("[HeartbeatManager] 发送心跳失败:", error);
        }
    }

    /**
     * 获取心跳是否正在运行
     */
    public get active(): boolean {
        return this._active;
    }

    /**
     * 获取心跳是否已启用（监听中）
     */
    public get enabled(): boolean {
        return this._enabled;
    }

    /**
     * 获取心跳配置
     */
    public get config(): Readonly<Required<HeartbeatConfig>> {
        return this._config;
    }
}
