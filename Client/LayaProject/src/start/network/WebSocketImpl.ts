// jojohello 2025-12-02
// WebSocket 传输层实现

import { ISocket, SocketEvent } from "./ISocket";

/**
 * WebSocket 传输层实现
 *
 * 设计理念：
 * - 实现 ISocket 接口，提供纯粹的传输层功能
 * - 封装 Laya.Socket，对外暴露统一的 ISocket API
 * - 不包含业务逻辑（心跳、重连、协议解析等）
 * - 支持多个事件监听器（事件驱动架构）
 *
 * 职责：
 * - 只负责 WebSocket 连接的建立、断开、收发数据
 * - 事件通知（连接成功、断开、收到消息、错误）
 * - 不关心消息内容，只传递原始数据
 *
 * @author jojohello
 * @since 2025-12-02
 */
export class WebSocketImpl implements ISocket {
    private _socket: Laya.Socket | null = null;
    private _connected: boolean = false;
    private _connecting: boolean = false;
    private _url: string = "";

    // 事件监听器集合（支持多个监听器）
    private _eventHandlers: Map<SocketEvent, Set<(...args: any[]) => void>> = new Map();

    /**
     * 连接到远程服务器
     *
     * @param url WebSocket URL（如：ws://localhost:8082/ws）
     * @param timeout 连接超时时间（毫秒），默认 10 秒
     * @returns Promise<void>
     */
    public connect(url: string, timeout: number = 10000): Promise<void> {
        if (this._connecting) {
            return Promise.reject(new Error("正在连接中，请勿重复调用"));
        }

        if (this._connected) {
            console.warn("[WebSocketImpl] 已经连接，关闭旧连接");
            this.disconnect();
        }

        this._url = url;
        this._connecting = true;

        return new Promise((resolve, reject) => {
            try {
                // 创建 Laya.Socket 实例
                this._socket = new Laya.Socket();

                // 🔑 关键：禁用二进制缓存，直接接收 JSON 字符串
                this._socket.disableInput = true;

                // 设置连接超时
                const timer = setTimeout(() => {
                    this._connecting = false;
                    this._cleanupSocket();
                    const error = new Error(`连接超时 (${timeout}ms)`);
                    console.error("[WebSocketImpl] ⏱️ 连接超时:", url);

                    // 触发错误事件
                    this._emitEvent(SocketEvent.ERROR, error);

                    reject(error);
                }, timeout);

                // 监听连接成功
                const onOpen = () => {
                    clearTimeout(timer);
                    this._connecting = false;
                    this._connected = true;

                    // 移除一次性监听
                    if (this._socket) {
                        this._socket.off(Laya.Event.OPEN, this, onOpen);
                        this._socket.off(Laya.Event.ERROR, this, onError);
                    }

                    // 绑定持久事件监听
                    this._bindLayaEvents();

                    // 触发连接成功事件
                    this._emitEvent(SocketEvent.CONNECTED);

                    resolve();
                };

                // 监听连接失败
                const onError = (error: any) => {
                    clearTimeout(timer);
                    this._connecting = false;
                    this._cleanupSocket();
                    console.error("[WebSocketImpl] ❌ 连接失败:", error);

                    // 移除一次性监听
                    if (this._socket) {
                        this._socket.off(Laya.Event.OPEN, this, onOpen);
                        this._socket.off(Laya.Event.ERROR, this, onError);
                    }

                    // 触发错误事件
                    this._emitEvent(SocketEvent.ERROR, error);

                    reject(error || new Error("WebSocket 连接失败"));
                };

                // 绑定一次性事件（用于 Promise 的 resolve/reject）
                this._socket.on(Laya.Event.OPEN, this, onOpen);
                this._socket.on(Laya.Event.ERROR, this, onError);

                // 发起连接
                this._socket.connectByUrl(url);

            } catch (error) {
                this._connecting = false;
                this._cleanupSocket();
                console.error("[WebSocketImpl] 💥 连接异常:", error);

                // 触发错误事件
                this._emitEvent(SocketEvent.ERROR, error);

                reject(error);
            }
        });
    }

    /**
     * 断开连接
     *
     * 说明：
     * - 清理所有资源（移除事件监听、关闭底层连接）
     * - 触发 DISCONNECTED 事件
     * - 幂等操作（多次调用不会报错）
     */
    public disconnect(): void {
        if (this._socket) {
            // 先移除事件监听
            this._unbindLayaEvents();

            // 关闭连接
            try {
                this._socket.close();
            } catch (error) {
                console.error("[WebSocketImpl] 关闭连接时出错:", error);
            }

            this._socket = null;
        }

        // 如果之前是已连接状态，触发断开事件
        if (this._connected) {
            this._connected = false;
            this._emitEvent(SocketEvent.DISCONNECTED, "主动断开");
        }

        this._connecting = false;
    }

    /**
     * 发送数据
     *
     * @param data 要发送的数据
     *   - string: JSON 文本或普通字符串
     *   - ArrayBuffer: 二进制数据（未来支持 Protobuf 等）
     *
     * 注意：
     * - 如果未连接，打印警告但不抛异常
     * - 上层业务通过 connected 属性判断状态
     */
    public send(data: string | ArrayBuffer): void {
        if (!this._connected || !this._socket) {
            console.warn("[WebSocketImpl] 未连接，无法发送消息");
            return;
        }

        try {
            this._socket.send(data);
        } catch (error) {
            console.error("[WebSocketImpl] 发送消息失败:", error);
            this._emitEvent(SocketEvent.ERROR, error);
        }
    }

    /**
     * 注册事件监听
     *
     * @param event 事件类型
     * @param handler 事件处理函数
     *
     * 说明：
     * - 支持同一事件注册多个监听器
     * - 同一个 handler 多次注册只生效一次（使用 Set 去重）
     */
    public on(event: SocketEvent, handler: (...args: any[]) => void): void {
        if (!this._eventHandlers.has(event)) {
            this._eventHandlers.set(event, new Set());
        }
        this._eventHandlers.get(event)!.add(handler);
    }

    /**
     * 移除事件监听
     *
     * @param event 事件类型
     * @param handler 事件处理函数（必须是注册时的同一个引用）
     */
    public off(event: SocketEvent, handler: (...args: any[]) => void): void {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    /**
     * 获取连接状态
     */
    public get connected(): boolean {
        return this._connected;
    }

    /**
     * 获取连接中状态
     */
    public get connecting(): boolean {
        return this._connecting;
    }

    // ========== 内部方法 ==========

    /**
     * 绑定 Laya.Socket 事件监听
     */
    private _bindLayaEvents(): void {
        if (!this._socket) return;

        this._socket.on(Laya.Event.MESSAGE, this, this._onLayaMessage);
        this._socket.on(Laya.Event.CLOSE, this, this._onLayaClose);
        this._socket.on(Laya.Event.ERROR, this, this._onLayaError);
    }

    /**
     * 移除 Laya.Socket 事件监听
     */
    private _unbindLayaEvents(): void {
        if (!this._socket) return;

        this._socket.off(Laya.Event.MESSAGE, this, this._onLayaMessage);
        this._socket.off(Laya.Event.CLOSE, this, this._onLayaClose);
        this._socket.off(Laya.Event.ERROR, this, this._onLayaError);
    }

    /**
     * 处理 Laya.Socket 消息事件
     */
    private _onLayaMessage(data: any): void {
        // 直接传递原始数据，不做任何解析
        this._emitEvent(SocketEvent.MESSAGE, data);
    }

    /**
     * 处理 Laya.Socket 关闭事件
     */
    private _onLayaClose(event: any): void {
        this._connected = false;
        const reason = event?.reason || "未知原因";

        // 触发断开事件
        this._emitEvent(SocketEvent.DISCONNECTED, String(reason));

        // 清理资源
        this._cleanupSocket();
    }

    /**
     * 处理 Laya.Socket 错误事件
     */
    private _onLayaError(error: any): void {
        console.error("[WebSocketImpl] ⚠️ 连接错误:", error);

        // 触发错误事件
        this._emitEvent(SocketEvent.ERROR, error);
    }

    /**
     * 清理 Socket 资源
     */
    private _cleanupSocket(): void {
        if (this._socket) {
            this._unbindLayaEvents();
            this._socket = null;
        }
        this._connected = false;
        this._connecting = false;
    }

    /**
     * 触发事件
     *
     * @param event 事件类型
     * @param args 事件参数
     */
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
}
