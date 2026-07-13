// jojohello 2025-12-02
// 重连管理器（事件驱动）

import { ISocket, SocketEvent } from "./ISocket";

/**
 * 重连管理器配置
 */
export interface ReconnectConfig {
    /**
     * 是否自动重连
     * 默认：true
     */
    autoReconnect?: boolean;

    /**
     * 最大重连次数
     * 默认：5
     * 设置为 -1 表示无限重连
     */
    maxRetries?: number;

    /**
     * 初始重连延迟（毫秒）
     * 默认：1000（1秒）
     */
    initialDelay?: number;

    /**
     * 最大重连延迟（毫秒）
     * 默认：16000（16秒）
     */
    maxDelay?: number;

    /**
     * 延迟倍增因子
     * 默认：2（指数退避）
     * 例如：1s -> 2s -> 4s -> 8s -> 16s
     */
    delayMultiplier?: number;
}

/**
 * 重连管理器
 *
 * 设计理念：
 * - 事件驱动：监听 Socket 的断开事件，自动触发重连
 * - 指数退避：使用指数退避算法，避免频繁重连
 * - 状态管理：跟踪重连次数、延迟时间等状态
 * - 解耦设计：通过 ISocket 接口操作，不依赖具体实现
 *
 * 工作原理：
 * 1. 监听 Socket 的 DISCONNECTED 事件
 * 2. 断开后根据配置决定是否重连
 * 3. 使用指数退避算法计算延迟时间
 * 4. 延迟后尝试重连
 * 5. 重连成功后重置重连计数
 *
 * 重连策略（指数退避）：
 * - 第 1 次：延迟 1 秒
 * - 第 2 次：延迟 2 秒
 * - 第 3 次：延迟 4 秒
 * - 第 4 次：延迟 8 秒
 * - 第 5 次：延迟 16 秒（最大延迟）
 *
 * 使用示例：
 * ```typescript
 * const socket = new WebSocketImpl();
 * const reconnectMgr = new ReconnectManager(socket, "ws://localhost:8082/ws", {
 *     autoReconnect: true,
 *     maxRetries: 5
 * });
 * reconnectMgr.start();
 *
 * // 监听重连事件
 * reconnectMgr.onReconnecting = (attempt, delay) => {
 *     console.log(`正在重连... (第 ${attempt} 次，延迟 ${delay}ms)`);
 * };
 * reconnectMgr.onReconnected = () => {
 *     console.log("重连成功");
 * };
 * reconnectMgr.onReconnectFailed = () => {
 *     console.log("重连失败，已达最大重试次数");
 * };
 * ```
 *
 * @author jojohello
 * @since 2025-12-02
 */
export class ReconnectManager {
    private _socket: ISocket;
    private _url: string;
    private _config: Required<ReconnectConfig>;

    private _enabled: boolean = false;
    private _reconnecting: boolean = false;
    private _retryCount: number = 0;
    private _reconnectTimer: any = null;

    // 事件处理器（保存引用，用于解绑）
    private _onConnected: () => void;
    private _onDisconnected: (reason: string) => void;

    // 回调接口（对外暴露）
    public onReconnecting: ((attempt: number, delay: number) => void) | null = null;
    public onReconnected: (() => void) | null = null;
    public onReconnectFailed: (() => void) | null = null;

    /**
     * 构造函数
     *
     * @param socket ISocket 实例
     * @param url 连接 URL（用于重连）
     * @param config 重连配置
     */
    constructor(socket: ISocket, url: string, config?: ReconnectConfig) {
        this._socket = socket;
        this._url = url;

        // 合并默认配置
        this._config = {
            autoReconnect: config?.autoReconnect ?? true,
            maxRetries: config?.maxRetries ?? 5,
            initialDelay: config?.initialDelay ?? 1000,
            maxDelay: config?.maxDelay ?? 16000,
            delayMultiplier: config?.delayMultiplier ?? 2
        };

        // 绑定事件处理器（保存引用）
        this._onConnected = this._handleConnected.bind(this);
        this._onDisconnected = this._handleDisconnected.bind(this);
    }

    /**
     * 启动重连管理器
     *
     * 说明：
     * - 注册 Socket 事件监听
     * - 监听断开事件，自动触发重连
     */
    public start(): void {
        if (this._enabled) {
            console.warn("[ReconnectManager] 已经启动，无需重复调用");
            return;
        }

        this._enabled = true;

        // 注册事件监听
        this._socket.on(SocketEvent.CONNECTED, this._onConnected);
        this._socket.on(SocketEvent.DISCONNECTED, this._onDisconnected);

    }

    /**
     * 停止重连管理器
     *
     * 说明：
     * - 取消正在进行的重连
     * - 移除 Socket 事件监听
     */
    public stop(): void {
        if (!this._enabled) {
            return;
        }

        this._enabled = false;

        // 取消重连
        this._cancelReconnect();

        // 移除事件监听
        this._socket.off(SocketEvent.CONNECTED, this._onConnected);
        this._socket.off(SocketEvent.DISCONNECTED, this._onDisconnected);

    }

    /**
     * 处理连接成功事件
     */
    private _handleConnected(): void {
        // 重置重连计数
        if (this._retryCount > 0) {
            // 触发重连成功回调
            if (this.onReconnected) {
                this.onReconnected();
            }
        }

        this._retryCount = 0;
        this._reconnecting = false;
    }

    /**
     * 处理断开连接事件
     */
    private _handleDisconnected(reason: string): void {
        // 如果启用了自动重连
        if (this._config.autoReconnect) {
            this._scheduleReconnect();
        }
    }

    /**
     * 安排重连
     */
    private _scheduleReconnect(): void {
        // 检查是否已达最大重试次数（-1 表示无限重连）
        if (this._config.maxRetries !== -1 && this._retryCount >= this._config.maxRetries) {
            console.error(`[ReconnectManager] ❌ 重连失败，已达最大重试次数 (${this._config.maxRetries})`);

            // 触发重连失败回调
            if (this.onReconnectFailed) {
                this.onReconnectFailed();
            }

            return;
        }

        // 防止重复调度
        if (this._reconnecting) {
            return;
        }

        this._reconnecting = true;
        this._retryCount++;

        // 计算延迟时间（指数退避）
        const delay = this._calculateDelay();

        // 触发重连中回调
        if (this.onReconnecting) {
            this.onReconnecting(this._retryCount, delay);
        }

        // 延迟后执行重连
        this._reconnectTimer = Laya.timer.once(delay, this, this._attemptReconnect);
    }

    /**
     * 尝试重连
     */
    private async _attemptReconnect(): Promise<void> {
        try {
            await this._socket.connect(this._url);
            // 连接成功会触发 _handleConnected，在那里处理重置逻辑
        } catch (error) {
            console.error(`[ReconnectManager] 重连失败 (第 ${this._retryCount} 次):`, error);

            // 重连失败，继续下一次尝试
            this._reconnecting = false;
            this._scheduleReconnect();
        }
    }

    /**
     * 取消重连
     */
    private _cancelReconnect(): void {
        if (this._reconnectTimer) {
            Laya.timer.clear(this, this._attemptReconnect);
            this._reconnectTimer = null;
        }
        this._reconnecting = false;
    }

    /**
     * 计算重连延迟时间（指数退避算法）
     *
     * 公式：delay = min(initialDelay * (multiplier ^ (attempt - 1)), maxDelay)
     *
     * 示例（默认配置）：
     * - 第 1 次：1000 * (2 ^ 0) = 1000ms  (1秒)
     * - 第 2 次：1000 * (2 ^ 1) = 2000ms  (2秒)
     * - 第 3 次：1000 * (2 ^ 2) = 4000ms  (4秒)
     * - 第 4 次：1000 * (2 ^ 3) = 8000ms  (8秒)
     * - 第 5 次：1000 * (2 ^ 4) = 16000ms (16秒，达到最大值)
     */
    private _calculateDelay(): number {
        const delay = this._config.initialDelay * Math.pow(
            this._config.delayMultiplier,
            this._retryCount - 1
        );

        return Math.min(delay, this._config.maxDelay);
    }

    /**
     * 手动触发重连
     *
     * 说明：
     * - 重置重连计数
     * - 立即尝试重连
     */
    public reconnect(): void {
        if (this._socket.connected || this._socket.connecting) {
            console.warn("[ReconnectManager] 已连接或正在连接，无需重连");
            return;
        }

        // 取消当前重连计划
        this._cancelReconnect();

        // 重置计数
        this._retryCount = 0;

        // 立即尝试重连
        this._scheduleReconnect();
    }

    /**
     * 重置重连计数
     */
    public reset(): void {
        this._retryCount = 0;
        this._reconnecting = false;
        this._cancelReconnect();
    }

    /**
     * 更新连接 URL
     *
     * @param url 新的连接 URL
     */
    public updateUrl(url: string): void {
        this._url = url;
    }

    /**
     * 获取重连状态
     */
    public get reconnecting(): boolean {
        return this._reconnecting;
    }

    /**
     * 获取当前重连次数
     */
    public get retryCount(): number {
        return this._retryCount;
    }

    /**
     * 获取配置
     */
    public get config(): Readonly<Required<ReconnectConfig>> {
        return this._config;
    }
}
