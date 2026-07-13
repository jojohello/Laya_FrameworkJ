/**
 * 加载状态枚举
 */
export enum LoadState {
    UNLOAD = 0,   // 未加载
    LOADING = 1,  // 加载中
    LOADED = 2    // 已加载
}

/**
 * 资源引用计数信息（复杂数据类）
 * 规则：可包含复杂类型
 */
export class ResourceInfo {
    refCount: number = 0;           // 引用计数
    lastUseTime: number = 0;        // 最后使用时间（毫秒）
    loadState: LoadState = LoadState.UNLOAD; // 加载状态
}
