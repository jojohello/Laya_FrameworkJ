// jojohello 2025-12-10
// Manager 接口定义

/**
 * Manager 统一接口
 *
 * 只有需要 ManagerHub 统一协调生命周期的 Manager 才实现此接口。
 * 各方法按需实现，不需要某阶段时直接省略。
 *
 * 生命周期顺序：
 * 1. init()    - 初始化（加载资源、创建Protocol、注册事件）
 * 2. update()  - 每帧更新（游戏逻辑、状态检查）
 * 3. reset()   - 重置状态（切换场景、登出时调用）
 * 4. release() - 释放资源（销毁对象、取消注册）
 *
 * @example
 * ```typescript
 * export class LoginMgr implements IManager {
 *     private static _instance: LoginMgr;
 *     static get instance() {
 *         if (!this._instance) this._instance = new LoginMgr();
 *         return this._instance;
 *     }
 *
 *     init() {
 *         console.log("LoginMgr 初始化");
 *     }
 *
 *     update(dt: number) {
 *         // 每帧更新逻辑
 *     }
 *
 *     reset() {
 *         // 重置数据
 *     }
 *
 *     release() {
 *         // 释放资源
 *     }
 * }
 *
 * // 注册到 ManagerHub
 * ManagerHub.register(LoginMgr.instance);
 * ```
 */
export interface IManager {
    /**
     * 初始化
     *
     * 用途：
     * - 加载配置
     * - 创建 Protocol 实例
     * - 注册事件监听
     * - 初始化数据结构
     *
     * 调用时机：ManagerHub.init() 时按注册顺序调用
     */
    init?(): void | Promise<void>;

    /**
     * 每帧更新
     *
     * 用途：
     * - 游戏逻辑更新
     * - 状态机更新
     * - 定时器检查
     * - 消息队列处理（如 NetworkManager）
     *
     * 调用时机：每帧调用（60 FPS = 每 16.67ms 调用一次）
     *
     * @param dt 距离上一帧的时间间隔（秒），例如 0.016（60FPS时）
     *
     * 注意：
     * - 如果 Manager 不需要每帧更新，应省略 update，不保留空方法
     * - 不要在 update 中执行耗时操作，会导致卡顿
     */
    update?(dt: number): void;

    /**
     * 重置状态
     *
     * 用途：
     * - 清空运行时数据
     * - 重置为初始状态
     * - 但不释放资源（Protocol 保持注册）
     *
     * 调用时机：
     * - 切换场景
     * - 用户登出
     * - 重新开始游戏
     *
     * 注意：reset 后 Manager 仍然可用，只是数据清空
     */
    reset?(): void;

    /**
     * 释放资源
     *
     * 用途：
     * - 取消事件监听
     * - 释放 Protocol（自动反注册消息）
     * - 销毁对象引用
     * - 清理定时器
     *
     * 调用时机：
     * - 游戏退出
     * - 热更新
     * - Manager 不再使用
     *
     * 注意：release 后 Manager 不应再使用，需要重新 init
     */
    release?(): void;
}
