/**
 * UI 视图接口
 * 约定所有 UI 类应该实现的方法
 * 
 * 注意：
 * - 不是强制继承，而是作为约定和类型提示
 * - 事件注册/注销请使用 Laya.Script 标准生命周期：
 *   - onEnable() 中注册事件
 *   - onDisable() 中注销事件
 */
export interface IUIView {
    /**
     * UI 打开时调用（由 UIManager 调用，在显示完成后）
     * @param param 打开参数，由 UIManager.open(name, param) 传入
     */
    onOpened?(param?: any): void;

    /**
     * UI 关闭时调用（由 UIManager 调用，在移除前）
     */
    onClosed?(): void;

    /**
     * 播放进入动画
     * @param complete 动画完成回调
     */
    playEnterAnimation?(complete?: Function): void;

    /**
     * 播放退出动画
     * @param complete 动画完成回调
     */
    playExitAnimation?(complete?: Function): void;
}
