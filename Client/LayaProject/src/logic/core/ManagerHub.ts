// jojohello 2025-12-10
// Manager 统一管理中枢

import { IManager } from "./IManager";

/**
 * ManagerHub - Manager 统一管理中枢
 *
 * 职责：
 * 1. 统一管理所有 Manager 的生命周期
 * 2. 按注册顺序调用 init()、update()、reset()、release()
 * 3. 避免遗漏初始化或释放
 *
 * 设计原则：
 * - 单例模式：全局唯一实例
 * - 按注册顺序初始化：先注册的 Manager 先初始化（如 NetworkManager → LoginMgr）
 * - 性能开销极小：遍历 Manager 数组的开销 < 0.02ms（60FPS 每帧 16.67ms）
 *
 * 使用示例：
 * ```typescript
 * // 1. 在 Main.ts 中注册所有 Manager
 * ManagerHub.instance.register(NetworkManager.instance);  // 优先级高
 * ManagerHub.instance.register(LoginMgr.instance);
 * ManagerHub.instance.register(PlayerMgr.instance);
 *
 * // 2. 初始化所有 Manager
 * ManagerHub.instance.init();
 *
 * // 3. 在游戏主循环中调用 update
 * Laya.timer.frameLoop(1, this, () => {
 *     const dt = Laya.timer.delta / 1000;  // 转换为秒
 *     ManagerHub.instance.update(dt);
 * });
 *
 * // 4. 登出时重置
 * ManagerHub.instance.reset();
 *
 * // 5. 游戏退出时释放
 * ManagerHub.instance.release();
 * ```
 */
export class ManagerHub {
    private static _instance: ManagerHub;

    /**
     * 单例实例
     */
    static get instance(): ManagerHub {
        if (!this._instance) {
            this._instance = new ManagerHub();
        }
        return this._instance;
    }

    private constructor() {
        // 私有构造函数，防止外部 new
    }

    /**
     * 已注册的 Manager 列表
     * 按注册顺序存储
     */
    private managers: IManager[] = [];

    /**
     * 注册 Manager
     *
     * @param manager Manager 实例
     *
     * 注意：
     * - 注册顺序很重要！先注册的先初始化
     * - 例如：NetworkManager 必须在 LoginMgr 之前注册
     * - 可以重复注册同一个 Manager（会忽略）
     */
    register(manager: IManager): void {
        if (!manager) {
            console.error("[ManagerHub] 注册失败: manager 为 null");
            return;
        }

        // 防止重复注册
        if (this.managers.indexOf(manager) !== -1) {
            console.warn("[ManagerHub] Manager 已注册，忽略重复注册:", manager.constructor.name);
            return;
        }

        this.managers.push(manager);
    }

    /**
     * 初始化所有 Manager
     *
     * 按注册顺序调用每个 Manager 的 init() 方法
     *
     * 调用时机：游戏启动时调用一次
     */
    async init(): Promise<void> {
        for (let i = 0; i < this.managers.length; i++) {
            const manager = this.managers[i];
            const name = manager.constructor.name;

            try {
                await manager.init?.();
            } catch (error) {
                console.error(`[ManagerHub] ❌ ${name}.init() 失败:`, error);
                throw error;
            }
        }
    }

    /**
     * 每帧更新所有 Manager
     *
     * 按注册顺序调用每个 Manager 的 update() 方法
     *
     * @param dt 距离上一帧的时间间隔（秒）
     *
     * 性能：遍历 20 个 Manager 的开销 < 0.02ms（可忽略）
     *
     * 调用时机：游戏主循环每帧调用
     */
    update(dt: number): void {
        for (let i = 0; i < this.managers.length; i++) {
            try {
                this.managers[i].update?.(dt);
            } catch (error) {
                console.error(`[ManagerHub] ${this.managers[i].constructor.name}.update() 异常:`, error);
            }
        }
    }

    /**
     * 重置所有 Manager
     *
     * 按注册顺序调用每个 Manager 的 reset() 方法
     *
     * 用途：
     * - 用户登出
     * - 切换场景
     * - 重新开始游戏
     *
     * 注意：reset 后 Manager 仍然可用，只是数据清空
     */
    reset(): void {
        for (let i = 0; i < this.managers.length; i++) {
            const manager = this.managers[i];
            try {
                manager.reset?.();
            } catch (error) {
                console.error(`[ManagerHub] ❌ ${manager.constructor.name}.reset() 失败:`, error);
            }
        }
    }

    /**
     * 释放所有 Manager
     *
     * 按**反向顺序**调用每个 Manager 的 release() 方法
     * （后注册的先释放，避免依赖问题）
     *
     * 用途：
     * - 游戏退出
     * - 热更新
     *
     * 注意：release 后需要重新 init 才能使用
     */
    release(): void {
        // 反向释放（后注册的先释放）
        for (let i = this.managers.length - 1; i >= 0; i--) {
            const manager = this.managers[i];
            try {
                manager.release?.();
            } catch (error) {
                console.error(`[ManagerHub] ❌ ${manager.constructor.name}.release() 失败:`, error);
            }
        }

        // 清空列表
        this.managers = [];
    }

    /**
     * 获取已注册的 Manager 数量
     */
    get count(): number {
        return this.managers.length;
    }

    /**
     * 获取所有已注册的 Manager 名称列表（用于调试）
     */
    getManagerNames(): string[] {
        return this.managers.map(m => m.constructor.name);
    }
}
