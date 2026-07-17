// jojohello 2025-12-02
// 网络上下文对象（已重构）
// 存储在 Laya.Browser.window.network，供 logic 包使用

import { NetworkManager } from "./NetworkManager";
import { SocketEvent } from "./ISocket";

/**
 * 网络上下文对象
 *
 * 职责：
 * 1. 存储 Gateway 连接信息（URL、userId、token）
 * 2. 提供网络连接能力（基于新的 NetworkManager 架构）
 * 3. 作为 start 和 logic 之间的桥梁
 *
 * 设计说明：
 * - 由 start 包创建并挂载到 window.network
 * - logic 包从 window.network 获取并使用
 * - 使用新的 NetworkManager（支持心跳、重连、事件驱动）
 *
 * 重构说明（2025-12-02）：
 * - 从 GatewaySocket 迁移到 NetworkManager
 * - 支持配置化的心跳和重连
 * - 事件驱动架构，支持多个监听器
 *
 * @author jojohello
 * @since 2025-10-30（原版），2025-12-02（重构）
 */
export class NetworkContext {
    // ========== 连接信息 ==========
    public gatewayWsUrl: string = "";      // Gateway WebSocket URL
    public userId: string = "";            // 用户ID
    public token: string = "";             // 认证Token
    public loginTimestamp: number = 0;     // 登录时间戳

    /**
     * 连接到 Gateway
     *
     * 新架构说明：
     * - 使用 NetworkManager 统一入口
     * - 自动配置心跳（5秒间隔）
     * - 自动配置重连（指数退避，最多5次）
     * - 事件驱动，通过 on() 注册监听器
     *
     * @param wsUrl WebSocket URL（可选，默认使用 this.gatewayWsUrl）
     * @param timeout 连接超时时间（毫秒），默认 10 秒
     * @returns Promise<void>
     *
     * 使用示例：
     * ```typescript
     * // logic 包中
     * const network = (window as any).network as NetworkContext;
     * await network.connect();
     *
     * // 监听消息
     * network.on(SocketEvent.MESSAGE, (data) => {
     *     console.log("收到消息:", data);
     * });
     * ```
     */
    public async connect(wsUrl?: string, timeout: number = 10000): Promise<void> {
        const url = wsUrl || this.gatewayWsUrl;

        if (!url) {
            throw new Error("Gateway URL 未设置");
        }

        try {
            await NetworkManager.instance.connect({
                url: url,
                connectTimeout: timeout,
                heartbeat: {
                    interval: 5000,         // 5秒心跳；必须小于 Gateway 的15秒超时
                    messageType: 'HEARTBEAT',
                    autoStart: true         // 自动启动心跳
                },
                reconnect: {
                    autoReconnect: true,    // 自动重连
                    maxRetries: 5,          // 最多重连5次
                    initialDelay: 1000,     // 初始延迟1秒
                    maxDelay: 16000,        // 最大延迟16秒
                    delayMultiplier: 2      // 指数退避因子
                }
            });

        } catch (error) {
            console.error("[NetworkContext] ❌ Gateway 连接失败:", error);
            throw error;
        }
    }

    /**
     * 发送消息
     *
     * @param data 要发送的数据（会自动转换为 JSON 字符串）
     */
    public send(data: any): void {
        if (!NetworkManager.instance.connected) {
            console.error("[NetworkContext] Gateway 未连接，无法发送消息");
            return;
        }

        NetworkManager.instance.send(data);
    }

    /**
     * 注册事件监听
     *
     * @param event 事件类型（SocketEvent.MESSAGE, SocketEvent.DISCONNECTED 等）
     * @param handler 事件处理函数
     *
     * 使用示例：
     * ```typescript
     * network.on(SocketEvent.MESSAGE, (data) => {
     *     console.log("收到消息:", data);
     * });
     * ```
     */
    public on(event: SocketEvent, handler: (...args: any[]) => void): void {
        NetworkManager.instance.on(event, handler);
    }

    /**
     * 移除事件监听
     *
     * @param event 事件类型
     * @param handler 事件处理函数（必须是注册时的同一个引用）
     */
    public off(event: SocketEvent, handler: (...args: any[]) => void): void {
        NetworkManager.instance.off(event, handler);
    }

    /**
     * 断开连接
     *
     * 说明：
     * - 自动停止心跳和重连
     * - 清理所有事件监听器
     */
    public disconnect(): void {
        if (NetworkManager.instance.connected) {
            NetworkManager.instance.disconnect();
        }
    }

    /**
     * 手动触发重连
     *
     * 说明：
     * - 如果已连接，先断开
     * - 使用保存的配置重新连接
     */
    public async reconnect(): Promise<void> {
        await NetworkManager.instance.reconnect();
    }

    /**
     * 获取 NetworkManager 实例
     *
     * logic 包可以通过这个方法获取 NetworkManager，进行高级操作
     *
     * @returns NetworkManager
     */
    public getNetworkManager(): typeof NetworkManager.instance {
        return NetworkManager.instance;
    }

    /**
     * 获取连接状态
     */
    public get connected(): boolean {
        return NetworkManager.instance.connected;
    }

    /**
     * 获取连接中状态
     */
    public get connecting(): boolean {
        return NetworkManager.instance.connecting;
    }

    /**
     * 清空连接信息
     *
     * 用于退出登录或切换账号时清理数据
     */
    public clear(): void {
        this.disconnect();

        this.gatewayWsUrl = "";
        this.userId = "";
        this.token = "";
        this.loginTimestamp = 0;
    }

    /**
     * 获取当前状态（调试用）
     */
    public getStatus(): object {
        return {
            gatewayWsUrl: this.gatewayWsUrl,
            userId: this.userId,
            hasToken: !!this.token,
            connected: this.connected,
            connecting: this.connecting
        };
    }
}
