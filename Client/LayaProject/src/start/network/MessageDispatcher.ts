// jojohello 2025-12-10
// 消息分发器

/**
 * MessageDispatcher - 消息分发器
 *
 * 职责：
 * 1. 管理消息ID和处理函数的映射关系
 * 2. 接收网络消息，分发到对应的处理函数
 * 3. 支持注册/反注册机制
 *
 * 设计原则：
 * - 单一处理器：一个消息ID只能注册一个处理函数
 * - 静态类：全局唯一，无需实例化
 * - 性能优化：使用 Map 查找，O(1) 时间复杂度
 *
 * 使用流程：
 * ```
 * NetworkManager（网络层）
 *   ↓ 收到消息
 * MessageDispatcher.dispatch()（分发层）
 *   ↓ 根据 msgId 查找处理函数
 * Protocol.onXXX()（业务层）
 * ```
 *
 * 注意：
 * - 不应该直接调用 register/unregister，应该通过 Protocol 基类
 * - Protocol 基类会自动管理注册和反注册
 */
export class MessageDispatcher {
    /**
     * 消息处理函数映射表
     * key: 消息ID (number)
     * value: 处理函数 (data: any) => void
     */
    private static handlers: Map<number, Function> = new Map();

    /**
     * 注册消息处理函数
     *
     * @param msgId 消息ID
     * @param handler 处理函数
     *
     * 注意：
     * - 一个消息ID只能注册一个处理函数
     * - 重复注册会覆盖旧的处理函数（会发出警告）
     * - 不应该直接调用，应该通过 Protocol.registerMessage()
     */
    static register(msgId: number, handler: Function): void {
        if (!msgId) {
            console.error("[MessageDispatcher] 注册失败: msgId 无效", msgId);
            return;
        }

        if (!handler) {
            console.error("[MessageDispatcher] 注册失败: handler 无效", handler);
            return;
        }

        // 检查重复注册
        if (this.handlers.has(msgId)) {
            console.warn(`[MessageDispatcher] ⚠️ 消息ID ${msgId} 已注册，将覆盖旧处理函数`);
        }

        this.handlers.set(msgId, handler);
    }

    /**
     * 反注册消息处理函数
     *
     * @param msgId 消息ID
     *
     * 注意：
     * - 不应该直接调用，应该通过 Protocol.release()
     * - Protocol 释放时会自动反注册所有消息
     */
    static unregister(msgId: number): void {
        if (!msgId) {
            console.error("[MessageDispatcher] 反注册失败: msgId 无效", msgId);
            return;
        }

        if (!this.handlers.has(msgId)) {
            console.warn(`[MessageDispatcher] 反注册失败: 消息ID ${msgId} 未注册`);
            return;
        }

        this.handlers.delete(msgId);
    }

    /**
     * 分发消息
     *
     * 根据消息ID查找处理函数并调用
     *
     * @param msgId 消息ID
     * @param data 消息数据
     *
     * 调用者：NetworkManager（从消息队列中取出消息后调用）
     *
     * 流程：
     * 1. 根据 msgId 查找处理函数
     * 2. 如果找到，调用处理函数并传入 data
     * 3. 如果没找到，输出警告
     */
    static dispatch(msgId: number, data: any): void {
        const handler = this.handlers.get(msgId);

        if (!handler) {
            console.warn(`[MessageDispatcher] 未找到消息处理函数: msgId=${msgId}, data=`, data);
            return;
        }

        try {
            handler(data);
        } catch (error) {
            console.error(`[MessageDispatcher] 消息处理异常: msgId=${msgId}`, error);
        }
    }

    /**
     * 检查消息是否已注册
     *
     * @param msgId 消息ID
     * @returns 是否已注册
     */
    static isRegistered(msgId: number): boolean {
        return this.handlers.has(msgId);
    }

    /**
     * 获取已注册的消息数量
     */
    static get count(): number {
        return this.handlers.size;
    }

    /**
     * 清空所有注册（用于测试或热更新）
     *
     * ⚠️ 危险操作！通常不应该调用
     */
    static clear(): void {
        console.warn("[MessageDispatcher] 清空所有消息注册");
        this.handlers.clear();
    }

    /**
     * 获取所有已注册的消息ID列表（用于调试）
     */
    static getRegisteredMessageIds(): number[] {
        return Array.from(this.handlers.keys());
    }
}
