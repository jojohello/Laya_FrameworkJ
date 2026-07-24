/**
 * 场景管理器
 * 负责场景切换、Scene 驱动 UI 加载
 * 
 * 设计原则：
 * - 实现 IManager 接口，纳入 ManagerHub 管理
 * - Scene 驱动 UI：切换场景时自动打开对应 UI
 * - 配置表驱动：通过 ConfigMgr 读取 SceneType 配置表
 */
import { IManager } from "../core/IManager";
import { BaseScene } from "./BaseScene";
import { UIManager } from "../ui/UIManager";
import { ConfigMgr } from "../config/ConfigMgr";
import { SceneConfig } from "./SceneConfig";
import { SceneType } from "./SceneType";
import { TransitionReady } from "./TransitionReady";

// 场景类在各文件末尾用 Laya.ClassUtils.regClass 注册运行时查找 key。
// 此处导入仅用于触发模块加载使注册执行，确保 createScene 能按 sceneClass 名取到场景类。
import "../mainScene/MainScene";
import "../battleScene/BattleStageScene";
import "../battleScene/BattleScene";

const DEFAULT_TRANSITION_TIMEOUT_MS = 15000;

/** Structural bridge to the first-package LoadingMgr. */
export interface LoadingService {
    show(options: {
        onProcess: () => { progress: number; text?: string };
        isEnd: () => boolean;
        minShowTime?: number;
    }): Promise<void>;
    forceHide(): Promise<void>;
    isShowing(): boolean;
}

/**
 * 场景实例信息
 */
interface SceneInstance {
    name: string;           // 场景名称（用于日志）
    sceneType: SceneType;   // 场景类型 ID
    scene: BaseScene;       // 场景实例
    config: any;            // 场景配置
    enterParam: any;        // 最近一次进入参数，失败回退时恢复
    uiController: TransitionReady | null;
}

/**
 * 场景管理器
 */
export class SceneMgr implements IManager {
    private static _instance: SceneMgr;

    static get instance(): SceneMgr {
        if (!this._instance) this._instance = new SceneMgr();
        return this._instance;
    }

    private constructor() {}

    /** 当前场景实例 */
    private _curScene: SceneInstance | null = null;

    /** 场景缓存（已关闭但未销毁） */
    private _cachedScenes: Map<SceneType, SceneInstance> = new Map();

    /** 串行化异步切换，避免快速点击让退出、创建和 UI 打开流程交叉。 */
    private _switchQueue: Promise<void> = Promise.resolve();
    private _loadingService: LoadingService | null = null;

    /** 后台经过时间只在 Scene 调度边界测量，不向 gameplay 暴露墙钟。 */
    private _backgroundStartedAt = -1;
    private _pendingBackgroundElapsed = 0;
    private _discardNextTimerDelta = false;

    // ========== IManager 接口实现 ==========

    async init(): Promise<void> {
        Laya.stage.off(Laya.Event.VISIBILITY_CHANGE, this, this.onVisibilityChange);
        Laya.stage.on(Laya.Event.VISIBILITY_CHANGE, this, this.onVisibilityChange);
    }

    update(unscaledDelta: number): void {
        const backgroundElapsed = this._pendingBackgroundElapsed;
        this._pendingBackgroundElapsed = 0;

        // Laya's first delta after visibility recovery may already contain the
        // hidden interval. The measured interval is passed separately exactly once.
        const foregroundDelta = this._discardNextTimerDelta ? 0 : unscaledDelta;
        this._discardNextTimerDelta = false;
        this._curScene?.scene.update(foregroundDelta, backgroundElapsed);
    }

    reset(): void {
        this.resetBackgroundTracking();
        // 关闭当前场景，但不销毁
        if (this._curScene) {
            this._curScene.scene.onExit();
            this._cachedScenes.set(this._curScene.sceneType, this._curScene);
            this._curScene = null;
        }
    }

    release(): void {
        Laya.stage.off(Laya.Event.VISIBILITY_CHANGE, this, this.onVisibilityChange);
        this.resetBackgroundTracking();

        // 销毁所有缓存的场景
        this._cachedScenes.forEach(instance => {
            instance.scene.onDestroy();
        });
        this._cachedScenes.clear();

        // 销毁当前场景
        if (this._curScene) {
            this._curScene.scene.onExit();
            this._curScene.scene.onDestroy();
            this._curScene = null;
        }
    }

    // ========== 核心 API ==========

    /**
     * 获取当前场景
     */
    get curScene(): BaseScene | null {
        return this._curScene ? this._curScene.scene : null;
    }

    /**
     * 获取当前场景名称
     */
    get curSceneName(): string | null {
        return this._curScene ? this._curScene.name : null;
    }

    /** Injects the first-package Loading service without importing Start code. */
    setLoadingService(service: LoadingService | null): void {
        this._loadingService = service;
    }

    /**
     * 切换场景
     * @param sceneType 场景类型（SceneType enum，对应配置表 ID）
     * @param param 传递给场景的参数
     */
    switchScene(sceneType: SceneType, param?: any): Promise<BaseScene | null> {
        return this.enqueueSceneSwitch(sceneType, param, false);
    }

    /**
     * Switches scenes under a top-layer Loading UI and rolls back when the
     * target scene reports a preparation error or cannot become ready in time.
     */
    switchSceneWithLoading(
        sceneType: SceneType,
        param?: any,
        message: string = "加载中"
    ): Promise<BaseScene | null> {
        return this.enqueueSceneSwitch(sceneType, param, true, message);
    }

    private enqueueSceneSwitch(
        sceneType: SceneType,
        param: any,
        showLoading: boolean,
        message: string = "加载中"
    ): Promise<BaseScene | null> {
        const task = this._switchQueue.then(
            () => this.performSceneSwitch(sceneType, param, showLoading, message),
            () => this.performSceneSwitch(sceneType, param, showLoading, message)
        );
        this._switchQueue = task.then(
            () => undefined,
            () => undefined
        );
        return task;
    }

    private async performSceneSwitch(
        sceneType: SceneType,
        param: any,
        showLoading: boolean,
        message: string
    ): Promise<BaseScene | null> {
        if (!showLoading) {
            return this.performSwitchSceneCore(sceneType, param);
        }

        const previousSceneType = this._curScene?.sceneType ?? null;
        const previousEnterParam = this._curScene?.enterParam;
        let loadingProgress = 0.05;
        let loadingText = message;
        let loadingEnded = false;
        let loadingCompletion: Promise<void> | null = null;

        if (this._loadingService) {
            loadingCompletion = this._loadingService.show({
                onProcess: () => ({
                    progress: loadingProgress,
                    text: loadingText,
                }),
                isEnd: () => loadingEnded,
                minShowTime: 300,
            }).catch(error => {
                console.error("[SceneMgr] Failed to start unified Loading:", error);
            });
        } else {
            console.error("[SceneMgr] Loading service is not injected");
        }

        let scene: BaseScene | null = null;
        try {
            loadingProgress = 0.15;
            loadingText = `${message}：正在切换场景`;
            scene = await this.performSwitchSceneCore(sceneType, param);
            loadingProgress = scene ? 0.8 : 0.4;
            loadingText = scene
                ? `${message}：正在准备界面`
                : `${message}：正在恢复`;
            const uiController = this._curScene?.scene === scene
                ? this._curScene.uiController
                : null;
            if (scene && !await this.waitForTransitionReady(scene, uiController, DEFAULT_TRANSITION_TIMEOUT_MS)) {
                const reason = scene.transitionError || uiController?.transitionError ||
                    `timeout ${DEFAULT_TRANSITION_TIMEOUT_MS}ms`;
                console.error(`[SceneMgr] 目标场景准备失败: ${SceneType[sceneType]}, reason=${reason}`);
                scene = null;
            }

            if (!scene &&
                previousSceneType !== null &&
                previousSceneType !== sceneType &&
                this._curScene?.sceneType !== previousSceneType) {
                console.warn(`[SceneMgr] 回退到上一场景: ${SceneType[previousSceneType]}`);
                await this.performSwitchSceneCore(previousSceneType, previousEnterParam);
            }
            loadingProgress = 1;
            return scene;
        } finally {
            loadingEnded = true;
            if (loadingCompletion) {
                await loadingCompletion;
            }
        }
    }

    private async performSwitchSceneCore(sceneType: SceneType, param?: any): Promise<BaseScene | null> {
        const sceneName = SceneType[sceneType];
        console.log(`[SceneMgr] 开始切换场景: from=${this.curSceneName || "none"}, to=${sceneName || sceneType}, id=${sceneType}`);

        // 1. 从 ConfigMgr 获取 SceneType 配置
        const config = this.getSceneConfig(sceneType);
        if (!config) {
            console.error(`[SceneMgr] 场景配置不存在: ID=${sceneType}`);
            return null;
        }
        console.log(`[SceneMgr] 场景配置: class=${config.sceneClass}, map=${config.map || "none"}, prefab=${config.stagePrefab || "none"}, ui=${config.uiName || "none"}`);

        // 2. 检查是否是当前场景
        if (this._curScene && this._curScene.sceneType === sceneType) {
            return this._curScene.scene;
        }

        // 3. 退出当前场景
        if (this._curScene) {
            await this.exitCurScene(config.uiName || "");
        }

        // 4. 尝试从缓存恢复
        let cachedInstance = this._cachedScenes.get(sceneType);
        if (cachedInstance) {
            this._cachedScenes.delete(sceneType);
            this._curScene = cachedInstance;
            this._curScene.config = config;
            this._curScene.scene.setSceneConfig(config);
            this._curScene.enterParam = param;
            this._curScene.scene.onEnter(param);
            
            // 打开关联 UI
            this._curScene.uiController = await this.openSceneUI(config, param);
            console.log(`[SceneMgr] 场景切换完成（缓存）: ${sceneName}`);
            return this._curScene.scene;
        }

        // 5. 创建新场景
        try {
            const scene = await this.createScene(sceneName, config);
            if (!scene) {
                console.error(`[SceneMgr] 创建场景失败: ${sceneName}`);
                return null;
            }

            this._curScene = {
                name: sceneName,
                sceneType: sceneType,
                scene: scene,
                config: config,
                enterParam: param,
                uiController: null,
            };

            // 6. 进入场景
            scene.setSceneConfig(config);
            scene.onEnter(param);

            // 7. 打开关联 UI
            this._curScene.uiController = await this.openSceneUI(config, param);
            console.log(`[SceneMgr] 场景切换完成: ${sceneName}`);
            return scene;
        } catch (error) {
            console.error(`[SceneMgr] 切换场景异常: ${sceneName}`, error);
            return null;
        }
    }

    private waitForTransitionReady(
        scene: BaseScene,
        uiController: TransitionReady | null,
        timeoutMs: number
    ): Promise<boolean> {
        if (this.hasTransitionError(scene, uiController)) return Promise.resolve(false);
        if (this.areTransitionParticipantsReady(scene, uiController)) return Promise.resolve(true);

        const startedAt = this.getMonotonicMilliseconds();
        return new Promise<boolean>(resolve => {
            const check = (): void => {
                if (this._curScene?.scene !== scene || this.hasTransitionError(scene, uiController)) {
                    resolve(false);
                    return;
                }
                if (this.areTransitionParticipantsReady(scene, uiController)) {
                    resolve(true);
                    return;
                }
                if (this.getMonotonicMilliseconds() - startedAt >= timeoutMs) {
                    resolve(false);
                    return;
                }
                Laya.timer.frameOnce(1, this, check);
            };
            check();
        });
    }

    private areTransitionParticipantsReady(
        scene: TransitionReady,
        uiController: TransitionReady | null
    ): boolean {
        return scene.isTransitionReady && (!uiController || uiController.isTransitionReady);
    }

    private hasTransitionError(
        scene: TransitionReady,
        uiController: TransitionReady | null
    ): boolean {
        return !!scene.transitionError || !!uiController?.transitionError;
    }

    /**
     * 退出当前场景
     * @param preserveUIName 新旧场景共用的 UI；共用时保留实例，只刷新场景模式
     */
    private async exitCurScene(preserveUIName: string = ""): Promise<void> {
        if (!this._curScene) return;

        const current = this._curScene;

        // 关闭关联 UI
        const uiName = current.config.uiName;
        if (uiName && uiName !== preserveUIName) {
            UIManager.instance.close(uiName);
        }

        // 调用场景退出方法
        current.scene.onExit();

        // 根据配置决定是否缓存
        if (current.config.cache) {
            this._cachedScenes.set(current.sceneType, current);
        } else {
            // 销毁场景
            current.scene.onDestroy();
        }

        this._curScene = null;
    }

    /**
     * 创建场景实例
     */
    private async createScene(name: string, config: any): Promise<BaseScene | null> {
        // 根据配置中的场景类名创建实例
        const sceneClass = config.sceneClass;
        if (!sceneClass) {
            console.error(`[SceneMgr] 场景配置缺少 sceneClass: ${name}`);
            return null;
        }

        // 通过 Laya.ClassUtils 获取场景类（场景类用 @regClass 装饰器在模块加载时注册）
        const SceneConstructor = Laya.ClassUtils.getClass(sceneClass);
        if (!SceneConstructor) {
            console.error(`[SceneMgr] 场景类未注册: ${sceneClass}`);
            return null;
        }

        try {
            const scene = new SceneConstructor();
            return scene as BaseScene;
        } catch (error) {
            console.error(`[SceneMgr] 创建场景实例失败: ${sceneClass}`, error);
            return null;
        }
    }

    /**
     * 打开场景关联的 UI
     */
    private async openSceneUI(config: any, param?: any): Promise<TransitionReady | null> {
        const uiName = config.uiName;
        if (!uiName) {
            return null;
        }

        const controller = await UIManager.instance.open(uiName, {
            ...(param || {}),
            fromScene: this._curScene?.name,
            scene: this._curScene?.scene,
            switchScene: (sceneType: SceneType, sceneParam?: any) => this.switchScene(sceneType, sceneParam),
        });
        return this.asTransitionReady(controller);
    }

    private asTransitionReady(controller: any): TransitionReady | null {
        if (!controller ||
            typeof controller.isTransitionReady !== "boolean" ||
            typeof controller.transitionError !== "string") {
            return null;
        }
        return controller as TransitionReady;
    }

    /**
     * 检查场景是否已打开
     */
    isSceneOpened(sceneType: SceneType): boolean {
        return this._curScene?.sceneType === sceneType;
    }

    /**
     * 获取缓存的场景数量
     */
    get cachedSceneCount(): number {
        return this._cachedScenes.size;
    }

    // ========== 配置读取辅助方法 ==========

    /**
     * 从 ConfigMgr 读取场景配置
     * @param sceneType 场景类型（SceneType enum，对应配置表 ID）
     * @returns 场景配置对象，如果未找到返回 null
     */
    private getSceneConfig(sceneType: SceneType): SceneConfig | null {
        const config = ConfigMgr.instance.getConfig<any>("SceneType", sceneType);
        if (!config) {
            console.warn(`[SceneMgr] 未找到场景配置: ID=${sceneType}`);
            return null;
        }

        // 转换为 SceneConfig 格式
        // cache 默认为 true（除非配置表中明确设置为 0）
        const sceneConfig = {
            sceneClass: config.sceneClass,
            map: config.map || "",
            mapType: config.mapType || "",
            stagePrefab: config.stagePrefab || "",
            mapWidth: config.mapWidth,
            mapHeight: config.mapHeight,
            tileWidth: config.tileWidth,
            tileHeight: config.tileHeight,
            enableLinear: config.enableLinear,
            limitRange: config.limitRange,
            uiName: config.uiName,
            cache: config.cache === undefined ? true : config.cache === 1,
            desc: config.desc || ""
        };
        return sceneConfig;
    }

    private onVisibilityChange(): void {
        const now = this.getMonotonicSeconds();
        if (!Laya.stage.isVisibility) {
            if (this._backgroundStartedAt < 0) {
                this._backgroundStartedAt = now;
            }
            return;
        }

        if (this._backgroundStartedAt < 0) return;
        this._pendingBackgroundElapsed += Math.max(0, now - this._backgroundStartedAt);
        this._backgroundStartedAt = -1;
        this._discardNextTimerDelta = true;
    }

    private resetBackgroundTracking(): void {
        this._backgroundStartedAt = -1;
        this._pendingBackgroundElapsed = 0;
        this._discardNextTimerDelta = false;
    }

    private getMonotonicSeconds(): number {
        const performanceApi = Laya.Browser.window?.performance;
        return performanceApi && typeof performanceApi.now === "function"
            ? performanceApi.now() / 1000
            : Date.now() / 1000;
    }

    private getMonotonicMilliseconds(): number {
        const performanceApi = Laya.Browser.window?.performance;
        return performanceApi && typeof performanceApi.now === "function"
            ? performanceApi.now()
            : Date.now();
    }
}
