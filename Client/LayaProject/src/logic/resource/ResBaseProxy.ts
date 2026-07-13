/**
 * 资源代理抽象基类
 * 
 * Proxy 模式：将不同资源类型的加载/清理逻辑分离到专门的 Proxy 子类
 * 
 * 职责：
 * 1. load - 加载资源（不同类型有不同的加载方式）
 * 2. onLoadComplete - 加载完成后的处理（如注册帧动画）
 * 3. clearRes - 清理资源（不同类型有不同的清理方式）
 * 4. buildRes - 构建资源实例（从模板创建）
 * 
 * 设计参考：参考项目 resTypes/ResBaseProxy.ts
 */

/**
 * 资源代理抽象基类
 * 所有资源类型的 Proxy 都应继承此类
 */
export abstract class ResBaseProxy {
    /**
     * 获取 Proxy 单例（子类必须实现）
     */
    public static get instance(): ResBaseProxy {
        throw new Error("Subclass must implement static get instance()");
    }

    /**
     * 加载资源
     * @param url 资源路径
     * @returns Promise<boolean> 加载是否成功
     */
    public async load(url: string): Promise<boolean> {
        // 默认实现：使用 Laya.loader.load
        try {
            await Laya.loader.load(url);
            this.onLoadComplete(url);
            return true;
        } catch (error) {
            console.error(`[ResBaseProxy] Load failed: ${url}`, error);
            this.onLoadError(url);
            return false;
        }
    }

    /**
     * 加载完成后的处理
     * 子类可重写此方法，执行特定逻辑（如注册帧动画）
     * @param url 资源路径
     */
    public onLoadComplete(url: string): void {
        // 默认空实现，子类可重写
    }

    /**
     * 加载失败的处理
     * @param url 资源路径
     */
    public onLoadError(url: string): void {
        console.error(`[ResBaseProxy] Load error: ${url}`);
    }

    /**
     * 清理资源
     * @param url 资源路径
     */
    public clearRes(url: string): void {
        // 默认实现：使用 Laya.loader.clearRes
        Laya.loader.clearRes(url);
    }

    /**
     * 检查资源是否已加载
     * @param url 资源路径
     */
    public isLoaded(url: string): boolean {
        return Laya.loader.getRes(url) != null;
    }

    /**
     * 获取资源引用计数（调试用）
     * @param url 资源路径
     */
    public getRefCount(url: string): number {
        // Laya 3.x 没有内置引用计数，这里返回缓存状态
        const res = Laya.loader.getRes(url);
        return res ? 1 : 0;
    }
}

/**
 * 默认资源代理
 * 用于普通图片、预制体等标准资源
 */
export class DefaultResProxy extends ResBaseProxy {
    private static _instance: DefaultResProxy;

    public static get instance(): DefaultResProxy {
        if (!this._instance) {
            this._instance = new DefaultResProxy();
        }
        return this._instance;
    }
}
