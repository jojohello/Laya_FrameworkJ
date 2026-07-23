import { IManager } from "../core/IManager";
import { ResBase } from "./ResBase";
import { ResourceInfo, LoadState } from "./ResourceInfo";
import { ResBaseProxy, DefaultResProxy } from "./ResBaseProxy";

/**
 * 资源管理器
 * 职责：
 * 1. 资源加载（引用计数）
 * 2. 对象池管理（延迟销毁）
 * 3. 资源实例化
 * 4. 自动释放（分帧处理）
 * 5. Proxy 模式支持（加载/清理逻辑分离）
 */
export class ResourceMgr implements IManager {
    private static _instance: ResourceMgr;

    static get instance(): ResourceMgr {
        if (!this._instance) this._instance = new ResourceMgr();
        return this._instance;
    }

    private constructor() { }

    // ========== 配置 ==========
    private _cacheDurationMs: number = 30000;  // 缓存时间（毫秒）- 默认30秒
    private _poolLimit: number = 3;     // 对象池上限

    // ========== 数据结构 ==========
    private _refInfoDict: Map<string, ResourceInfo> = new Map();      // 引用计数信息
    private _cacheResDict: Map<string, ResBase[]> = new Map();        // 对象池
    private _loadingResDict: Map<string, ResBase[]> = new Map();      // 加载中的资源队列
    private _proxyDict: Map<string, ResBaseProxy> = new Map();        // URL 对应的 Proxy

    // ========== 生命周期 ==========

    async init(): Promise<void> {
    }

    update(dt: number): void {
        this.checkAndReleaseRes();
    }

    reset(): void {
        this.releaseAll();
    }

    release(): void {
        this.releaseAll();
    }

    // ========== 通用资源接口 (用于 UI/Scene 等非 ResBase 资源) ==========

    /**
     * 增加引用计数
     */
    public addRef(url: string): void {
        this.addRefCounter(url);
    }

    /**
     * 减少引用计数
     */
    public releaseRef(url: string): void {
        this.subRefCounter(url);
    }

    /**
     * 加载通用资源 (单纯的 Laya.loader.load + 引用计数)
     */
    public async loadContent(url: string): Promise<any> {
        this.addRef(url);

        // 如果已经在加载或是已加载
        let info = this._refInfoDict.get(url);
        if (info && info.loadState === LoadState.LOADED) {
            return Laya.loader.getRes(url);
        }

        // 简单处理：直接 await load
        await Laya.loader.load(url);

        // 标记为 Loaded
        if (info) info.loadState = LoadState.LOADED;

        return Laya.loader.getRes(url);
    }

    // ========== 核心 API ==========

    /**
     * 加载资源（支持 Proxy 模式）
     * @param url 资源路径
     * @param resClass 资源类（如 ResImage）
     * @param proxy 资源代理（可选，默认使用 DefaultResProxy）
     * @returns 资源实例
     */
    async load<T extends ResBase>(
        url: string,
        resClass: new (url: string) => T,
        proxy: ResBaseProxy = DefaultResProxy.instance
    ): Promise<T> {
        this.addRefCounter(url);

        // 存储 Proxy（用于后续清理）
        this._proxyDict.set(url, proxy);

        // 1. 尝试从对象池获取
        let cacheList = this._cacheResDict.get(url);
        if (cacheList && cacheList.length > 0) {
            // 更新最后使用时间
            this.updateResTime(url);

            let res = cacheList.pop() as T;
            await res.buildRes();
            this.initTransform(res);
            return res;
        }

        // 2. 创建新实例
        let res = new resClass(url);
        let info = this._refInfoDict.get(url)!;

        // 3. 检查加载状态
        if (info.loadState === LoadState.UNLOAD) {
            // 首次加载 - 委托给 Proxy
            info.loadState = LoadState.LOADING;
            this._loadingResDict.set(url, [res]);

            try {
                // 使用 Proxy 加载（不同类型有不同加载方式）
                const success = await proxy.load(url);
                if (!success) {
                    throw new Error(`Proxy load failed: ${url}`);
                }
                info.loadState = LoadState.LOADED;
                await this.onLoadComplete(url);
            } catch (error) {
                console.error(`[ResourceMgr] 加载失败: ${url}`, error);
                info.loadState = LoadState.UNLOAD;
                this._loadingResDict.delete(url);
                throw error;
            }
        } else if (info.loadState === LoadState.LOADING) {
            // 加载中，加入等待队列
            this._loadingResDict.get(url)!.push(res);
            // 等待加载完成
            await this.waitForLoad(url);
        } else {
            // 已加载，直接构建
            await res.buildRes();
            this.initTransform(res);
        }

        return res;
    }

    /**
     * 回收资源（引用计数 -1）
     * @param res 资源实例
     */
    recoverRes(res: ResBase): void {
        if (!res) return;

        let cacheList = this._cacheResDict.get(res.url);
        if (!cacheList) {
            cacheList = [];
            this._cacheResDict.set(res.url, cacheList);
        }

        // 更新最后使用时间
        this.updateResTime(res.url);

        // 对象池上限控制
        if (cacheList.length >= this._poolLimit) {
            res.onDispose();
            this.subRefCounter(res.url);
            return;
        }

        this.subRefCounter(res.url);
        res.onRecycle();
        cacheList.push(res);
    }

    /**
     * 获取引用信息（调试用）
     */
    getRefInfo(url: string): ResourceInfo | null {
        return this._refInfoDict.get(url) || null;
    }

    /**
     * 获取对象池缓存数量（调试用）
     */
    getCacheCount(url: string): number {
        const cacheList = this._cacheResDict.get(url);
        return cacheList ? cacheList.length : 0;
    }

    /**
     * 配置缓存时间
     */
    setCacheDurationMs(durationMs: number): void {
        this._cacheDurationMs = durationMs;
    }

    /**
     * 配置对象池上限
     */
    setPoolLimit(limit: number): void {
        this._poolLimit = limit;
    }

    // ========== 内部方法 ==========

    private addRefCounter(url: string): void {
        let info = this._refInfoDict.get(url);
        if (!info) {
            info = new ResourceInfo();
            info.lastUseWallClockMs = Date.now();  // 首次创建时初始化
            this._refInfoDict.set(url, info);
        }
        info.refCount++;
        // 加载时不更新时间（只有回收时才更新）
    }

    private subRefCounter(url: string): void {
        let info = this._refInfoDict.get(url);
        if (info) {
            info.refCount--;
            // 只有 refCount 变为 0 时才更新时间（进入缓存计时）
            if (info.refCount === 0) {
                info.lastUseWallClockMs = Date.now();
            }
        }
    }

    // 更新资源的最后使用时间（保持活跃）
    private updateResTime(url: string): void {
        let info = this._refInfoDict.get(url);
        if (info) {
            info.lastUseWallClockMs = Date.now();
        }
    }

    private async onLoadComplete(url: string): Promise<void> {
        let resList = this._loadingResDict.get(url);
        if (resList) {
            for (let res of resList) {
                await res.buildRes();
                this.initTransform(res);
            }
            this._loadingResDict.delete(url);
        }
    }

    private async waitForLoad(url: string): Promise<void> {
        return new Promise((resolve) => {
            let checkInterval = setInterval(() => {
                let info = this._refInfoDict.get(url);
                if (info && info.loadState === LoadState.LOADED) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
        });
    }

    private initTransform(res: ResBase): void {
        // 延迟一帧，避免一些初始化问题
        Laya.timer.frameOnce(1, this, () => {
            (res as any).initTransform?.();
        });
    }

    /**
     * 检查并释放资源（分帧处理）
     */
    private checkAndReleaseRes(): void {
        const wallClockNowMs = Date.now();
        let urlsToDelete: string[] = [];
        let clearedCache = false;
        let clearedRes = false;

        // 遍历所有资源信息
        for (let [url, info] of this._refInfoDict) {
            // 只有 refCount=0 的资源才检查缓存过期
            if (info.refCount !== 0) {
                continue;
            }
            
            // 1. 检查缓存是否过期 (批量清理)
            // 逻辑: 如果 (当前时间 - 上次活跃时间 > 30s) -> 清空该资源的全部缓存
            if (wallClockNowMs - info.lastUseWallClockMs > this._cacheDurationMs) {
                let cacheList = this._cacheResDict.get(url);
                if (cacheList && cacheList.length > 0) {
                    // 销毁所有缓存
                    for (let res of cacheList) {
                        res.onDispose(); // ResBase 实例
                    }
                    // 清空列表
                    cacheList.length = 0;
                    this._cacheResDict.delete(url);
                    clearedCache = true;
                }
            }

            // 2. 检查是否可以彻底卸载
            // 逻辑: 引用计数=0 且 Cache数量=0
            let cacheList = this._cacheResDict.get(url);
            let cacheCount = cacheList ? cacheList.length : 0;

            if (info.refCount === 0 && cacheCount === 0) {
                // 只有当加载完成后才卸载
                if (info.loadState === LoadState.LOADED) {
                    // 使用 Proxy 清理（不同类型有不同清理方式）
                    const proxy = this._proxyDict.get(url);
                    if (proxy) {
                        proxy.clearRes(url);
                    } else {
                        Laya.loader.clearRes(url);
                    }
                    urlsToDelete.push(url);
                    clearedRes = true;

                    if (this._cacheResDict.has(url)) {
                        this._cacheResDict.delete(url);
                    }
                }

                // 分帧处理
                if (Laya.stage && Laya.stage.getTimeFromFrameStart() > 32) {
                    break;
                }
            }
        }

        // 删除引用信息
        for (let url of urlsToDelete) {
            this._refInfoDict.delete(url);
        }

    }

    /**
     * 释放所有资源
     */
    private releaseAll(): void {
        // 销毁所有对象池中的实例
        for (let [url, cacheList] of this._cacheResDict) {
            for (let item of cacheList) {
                item.onDispose();
            }
            // 使用 Proxy 清理
            const proxy = this._proxyDict.get(url);
            if (proxy) {
                proxy.clearRes(url);
            } else {
                Laya.loader.clearRes(url);
            }
        }

        this._cacheResDict.clear();
        this._refInfoDict.clear();
        this._loadingResDict.clear();
        this._proxyDict.clear();
    }
}
