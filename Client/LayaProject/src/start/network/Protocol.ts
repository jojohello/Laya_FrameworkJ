// jojohello 2025-12-10
// Protocol 消息处理基类
// 2025-12-11 重构：使用依赖注入，避免循环依赖

import { GameMessage } from "./GameMessage";

/**
 * Protocol - 消息处理基类（抽象类）
 *
 * 职责：
 * 1. 统一管理消息的注册和反注册
 * 2. 提供发送消息的便捷方法
 * 3. 管理完整的生命周期
 *
 * 设计原则：
 * - 抽象基类：子类必须实现 register() 方法
 * - 依赖注入：通过静态方法注入 MessageDispatcher 和 NetworkManager
 * - 类型安全：使用 MessageIds 常量，避免字符串硬编码
 */
export abstract class Protocol {
    /**
     * 静态依赖：消息分发器
     * 在 Start 模块初始化时注入
     */
    private static messageDispatcher: any = null;

    /**
     * 静态依赖：网络管理器
     * 在 Start 模块初始化时注入
     */
    private static networkManager: any = null;

    /**
     * 注入依赖（由 Start 模块调用）
     */
    static injectDependencies(messageDispatcher: any, networkManager: any): void {
        Protocol.messageDispatcher = messageDispatcher;
        Protocol.networkManager = networkManager;
    }

    /**
     * 已注册的消息处理函数
     * 用于自动反注册
     */
    private registeredHandlers: Map<number, Function> = new Map();

    /**
     * 初始化
     *
     * 调用子类的 register() 方法注册消息
     *
     * 调用时机：Manager.init() 中调用
     */
    init(): void {
        this.register();
    }

    /**
     * 注册消息（抽象方法，子类必须实现）
     *
     * 在此方法中调用 registerMessage() 注册所有需要处理的消息
     */
    protected abstract register(): void;

    /**
     * 注册单个消息
     *
     * @param msgId 消息ID（使用 MessageIds 常量）
     * @param handler 处理函数
     */
    protected registerMessage(msgId: number, handler: Function): void {
        if (!msgId) {
            console.error(`[${this.constructor.name}] 注册失败: msgId 无效`, msgId);
            return;
        }

        if (!handler) {
            console.error(`[${this.constructor.name}] 注册失败: handler 无效`);
            return;
        }

        // 记录已注册的消息（用于反注册）
        this.registeredHandlers.set(msgId, handler);

        // 注册到 MessageDispatcher（通过依赖注入）
        if (Protocol.messageDispatcher) {
            Protocol.messageDispatcher.register(msgId, handler);
        } else {
            console.error(`[${this.constructor.name}] MessageDispatcher 未注入`);
        }
    }

    /**
     * 发送消息
     *
     * @param msgId 消息ID（使用 MessageIds 常量）
     * @param data 消息数据（可选）
     * @param userId 用户ID（可选，用于路由）
     */
    protected sendMessage(msgId: number, data?: any, userId?: string): void {
        if (!Protocol.networkManager) {
            console.error(`[${this.constructor.name}] NetworkManager 未注入`);
            return;
        }

        if (!Protocol.networkManager.connected) {
            console.warn(`[${this.constructor.name}] 发送失败: 网络未连接, msgId=${msgId}`);
            return;
        }

        // 构造 GameMessage（统一使用 msgId）
        const message: GameMessage = {
            msgId: msgId,
            userId: userId,
            data: data
        };

        Protocol.networkManager.send(message);
    }

    /**
     * 释放资源
     *
     * 自动反注册所有已注册的消息
     */
    release(): void {
        // 反注册所有消息
        if (Protocol.messageDispatcher) {
            this.registeredHandlers.forEach((handler, msgId) => {
                Protocol.messageDispatcher.unregister(msgId);
            });
        }

        // 清空记录
        this.registeredHandlers.clear();
    }

    /**
     * 获取已注册的消息数量
     */
    get registeredCount(): number {
        return this.registeredHandlers.size;
    }
}
