import { IManager } from "../core/IManager";
import { UIConfigTable } from "./UIConfigTable";
import { ResourceMgr } from "../resource/ResourceMgr";

/**
 * UI 实例信息
 */
interface UIInstance {
    name: string;           // UI 名称
    config: any;            // UI 配置（纯对象）
    scene: Laya.Scene;      // 场景节点
    script: any;            // 脚本组件（实现 IUIView 接口）
}

/**
 * UI 管理器
 * 职责：
 * 1. UI 加载、显示、关闭
 * 2. 层级管理（5 层）
 * 3. 单例管理（同一 UI 只能打开一个）
 * 4. 互斥管理（打开时自动关闭冲突 UI）
 * 5. 资源管理（委托给 ResourceMgr）
 */
export class UIManager implements IManager {
    private static _instance: UIManager;

    static get instance(): UIManager {
        if (!this._instance) this._instance = new UIManager();
        return this._instance;
    }

    private constructor() { }

    /** 已打开的 UI 实例缓存（name -> UIInstance） */
    private _openedUIs: Map<string, UIInstance> = new Map();

    /** 缓存的 UI 实例（已关闭但未销毁，name -> UIInstance） */
    private _cachedUIs: Map<string, UIInstance> = new Map();

    // ========== IManager 生命周期 ==========

    async init(): Promise<void> {
        this.createLayers();
    }

    update(_dt: number): void {
    }

    reset(): void {
        this.closeAll();
    }

    release(): void {
        this.closeAll();
        this._openedUIs.clear();
        this._cachedUIs.clear();
    }

    // ========== 层级管理 ==========

    private createLayers(): void {
        // GRoot 是 UI 容器，不应以整屏矩形拦截场景点击；子控件仍保留命中能力。
        if (Laya.GRoot.inst) {
            (Laya.GRoot.inst as any).mouseThrough = true;
        }
        if (!Laya.GRoot.inst) {
            console.error("[UIManager] GRoot 未初始化，无法挂载 UI");
        }
    }

    // ========== 核心 API ==========

    /**
     * 打开 UI
     * @param name UI 名称（在 UIConfigTable 中注册的）
     * @param param 传递给 onOpened 的参数
     * @returns UI 脚本实例
     */
    public async open(name: string, param?: any): Promise<any> {
        // 1. 获取配置
        let config = UIConfigTable[name];
        if (!config) {
            console.error(`[UIManager] UI config not found: ${name}`);
            return null;
        }

        // 2. 单例检查：如果是单例且已打开，直接返回
        if (config.singleton) {
            let existing = this._openedUIs.get(name);
            if (existing) {
                // 刷新参数
                this.callOnOpened(existing.script, param);
                return existing.script;
            }
        }

        // 3. 互斥处理：关闭冲突的 UI
        if (config.mutex && config.mutex.length > 0) {
            config.mutex.forEach((mutexName: string) => {
                this.close(mutexName);
            });
        }

        // 4. 尝试从缓存中恢复
        let cachedInstance = this._cachedUIs.get(name);
        if (cachedInstance && !cachedInstance.scene.destroyed) {
            this._cachedUIs.delete(name);
            if (!this.showUI(cachedInstance, param)) {
                return null;
            }
            return cachedInstance.script;
        }

        // 5. 加载资源
        try {
            await ResourceMgr.instance.loadContent(config.path);
        } catch (err) {
            console.error(`[UIManager] Failed to load UI resource: ${config.path}`, err);
            return null;
        }

        // 6. 实例化 Scene
        let sceneNode = await this.createScene(config.path);
        if (!sceneNode) {
            console.error(`[UIManager] Failed to create Scene: ${config.path}`);
            ResourceMgr.instance.releaseRef(config.path);
            return null;
        }

        // 7. 获取脚本组件（假设 Runtime Class 已通过 IDE 绑定）
        let uiScript: any = null;
        if (config.runtimeClass) {
            uiScript = sceneNode.getComponent(config.runtimeClass);
        }

        // 如果没有指定 runtimeClass，尝试获取任意 Script
        if (!uiScript) {
            let scripts = sceneNode.getComponents(Laya.Script);
            if (scripts && scripts.length > 0) {
                uiScript = scripts[0];  // 取第一个脚本
            }
        }

        if (!uiScript) {
            uiScript = sceneNode;  // 新 UI 的 runtime 通常绑定在 Scene 根节点上。
        }

        // 8. 创建 UIInstance
        let instance: UIInstance = {
            name: name,
            config: config,
            scene: sceneNode,
            script: uiScript
        };

        // 9. 显示 UI
        if (!this.showUI(instance, param)) {
            ResourceMgr.instance.releaseRef(config.path);
            sceneNode.destroy();
            return null;
        }

        return uiScript;
    }

    /**
     * 关闭 UI
     * @param name UI 名称
     */
    public close(name: string): void {
        let instance = this._openedUIs.get(name);
        if (!instance) {
            return;  // 未打开，忽略
        }

        // 从已打开列表中移除
        this._openedUIs.delete(name);

        // 调用 onClosed
        this.callOnClosed(instance.script);

        // 播放退出动画
        this.playExitAnimation(instance.script, () => {
            // 从舞台移除
            instance.scene.removeSelf();

            // 释放资源引用计数
            ResourceMgr.instance.releaseRef(instance.config.path);

            // 根据 autoDestroy 决定是否销毁
            if (instance.config.autoDestroy) {
                instance.scene.destroy();
            } else {
                // 缓存起来
                this._cachedUIs.set(name, instance);
            }
        });
    }

    /**
     * 关闭所有 UI
     */
    public closeAll(): void {
        let names = Array.from(this._openedUIs.keys());
        names.forEach(name => this.close(name));

        // 清理缓存
        this._cachedUIs.forEach(instance => {
            ResourceMgr.instance.releaseRef(instance.config.path);
            instance.scene.destroy();
        });
        this._cachedUIs.clear();
    }

    /**
     * 检查 UI 是否已打开
     */
    public isOpened(name: string): boolean {
        return this._openedUIs.has(name);
    }

    /**
     * 获取已打开的 UI 脚本实例
     */
    public getUI(name: string): any {
        let instance = this._openedUIs.get(name);
        return instance ? instance.script : null;
    }

    // ========== 内部方法 ==========

    /**
     * 创建 Scene 实例
     */
    private async createScene(path: string): Promise<Laya.Scene | null> {
        // 方式 1：直接通过 Laya.Scene.load（推荐）
        if (path.endsWith(".ls")) {
            return new Promise<Laya.Scene>((resolve) => {
                Laya.Scene.load(path, Laya.Handler.create(this, (scene: Laya.Scene) => {
                    resolve(scene);
                }));
            });
        }

        // 方式 2：通过 Laya.loader.getRes 后手动创建
        let res = Laya.loader.getRes(path);
        if (!res) {
            return null;
        }

        if (res instanceof Laya.Prefab) {
            return res.create() as Laya.Scene;
        } else if (res.create) {
            return res.create();
        } else {
            // 直接返回资源
            return res as Laya.Scene;
        }
    }

    /**
     * 显示 UI
     */
    private showUI(instance: UIInstance, param: any): boolean {
        let scene = instance.scene;
        let config = instance.config;

        const uiRoot = Laya.GRoot.inst;
        if (!uiRoot) {
            console.error("[UIManager] GRoot 未初始化，无法挂载 UI");
            return false;
        }

        if (typeof config.zOrder === "number") {
            scene.zOrder = config.zOrder;
        } else {
            console.error(`[UIManager] UI zOrder not found: ${instance.name}`);
            return false;
        }

        // UI 直接挂到 GRoot，同 zOrder 下后添加的 UI 会覆盖先添加的 UI。
        uiRoot.addChild(scene);

        // 允许特定 UI 的根节点在空白区域穿透鼠标事件。
        // 子控件仍保留自己的命中能力，适用于 MainUI 这类跨场景壳层。
        if (config.mouseThrough !== undefined) {
            (scene as any).mouseThrough = config.mouseThrough;
        }

        // 加入已打开列表
        this._openedUIs.set(instance.name, instance);

        // 播放进入动画（只有配置显式开启才播放，避免全屏主界面误触发动画）
        if (config.enterAnim === true) {
            this.playEnterAnimation(instance.script);
        }

        // 调用 onOpened
        this.callOnOpened(instance.script, param);

        return true;
    }

    /**
     * 调用脚本的 onOpened 方法
     */
    private callOnOpened(script: any, param?: any): void {
        if (script && typeof script.onOpened === "function") {
            script.onOpened(param);
        }
    }

    /**
     * 调用脚本的 onClosed 方法
     */
    private callOnClosed(script: any): void {
        if (script && typeof script.onClosed === "function") {
            script.onClosed();
        }
    }

    /**
     * 播放进入动画
     */
    private playEnterAnimation(script: any): void {
        if (script && typeof script.playEnterAnimation === "function") {
            script.playEnterAnimation();
        }
    }

    /**
     * 播放退出动画
     */
    private playExitAnimation(script: any, complete: Function): void {
        if (script && typeof script.playExitAnimation === "function") {
            script.playExitAnimation(complete);
        } else {
            complete();
        }
    }
}
