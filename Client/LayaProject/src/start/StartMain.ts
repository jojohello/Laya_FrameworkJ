// jojohello 2023-05-16
// start 文件夹作为微信分包的首包，StartMain.ts 作为首包的入口文件
// 2025-12-11 重构：实现分包加载逻辑

import { LayerMgr } from "./utils/LayerMgr";
import { NetworkContext } from "./network/NetworkContext";
import { LoadingMgr } from "./loading/LoadingMgr";
import { NetworkManager } from "./network/NetworkManager";
import { LoginMgr } from "./login/LoginMgr";
import { Protocol } from "./network/Protocol";
import { MessageDispatcher } from "./network/MessageDispatcher";
import { LoginProtocol } from "./login/LoginProtocol";
import { SystemProtocol } from "./network/SystemProtocol";

/**
 * StartMain - 主包入口
 *
 * 主包职责：
 * - 初始化引擎和基础服务
 * - 显示登录界面
 * - 等待用户登录
 * - 登录成功后加载 Logic 分包
 */
export class StartMain {
    private _logicMain: any | null = null; // LogicMain 类型（分包加载后才有）
    private _loginScene: Laya.Scene | null = null;
    private _systemProtocol: SystemProtocol | null = null;

    /** Loading 进度追踪 */
    private _loadingProgress: number = 0;        // 当前进度 (0-1)
    private _isLoadingComplete: boolean = false; // 是否加载完成
    private _loadingPhase: string = "";          // 当前阶段提示

    constructor() {
        // 空构造
    }

    /**
     * 开启主包流程
     */
    async start() {
        // 1. 初始化引擎相关配置
        this.initEngine();

        // 2. 初始化事件分发器
        (Laya.Browser.window as any)["eventDispatcher"] = new Laya.EventDispatcher();

        // 3. 初始化层级管理器
        LayerMgr.init();

        // 4. 初始化网络上下文（挂载到 window.network）
        const networkContext = new NetworkContext();
        (Laya.Browser.window as any)["network"] = networkContext;

        // 6. 初始化 NetworkManager
        NetworkManager.instance.init();

        Protocol.injectDependencies(MessageDispatcher, NetworkManager.instance);
        (Laya.Browser.window as any).messageDispatcher = MessageDispatcher;

        // 全局系统协议必须在连接建立前注册，确保登录期错误也有处理入口。
        this._systemProtocol = new SystemProtocol();
        this._systemProtocol.init();
        (Laya.Browser.window as any)["systemProtocol"] = this._systemProtocol;

        // 7. 创建并初始化 LoginProtocol
        const loginProtocol = new LoginProtocol();
        loginProtocol.init();

        // 8. 初始化 LoginMgr 并注入 Protocol
        LoginMgr.instance.init();
        LoginMgr.instance.setProtocol(loginProtocol);

        // 9. 挂载 Manager 单例到 window（供 Logic 分包通过 App 访问）
        (Laya.Browser.window as any)["networkManager"] = NetworkManager.instance;
        (Laya.Browser.window as any)["loginMgr"] = LoginMgr.instance;

        // 10. 打开登录界面
        await this.openLoginScene();
    }

    /**
     * 登录成功后调用 - 加载 Logic 分包
     *
     * 此方法由 LoginView 在登录成功后调用
     */
    async onLoginSuccess(): Promise<void> {
        // 重置 Loading 状态
        this._loadingProgress = 0;
        this._isLoadingComplete = false;

        // 注册 LoadingMgr 到 window（供 Logic 分包使用）
        (Laya.Browser.window as any).loadingMgr = LoadingMgr.instance;

        try {
            // 1. 启动 Loading 界面（先显示 Loading，再关闭登录界面）
            LoadingMgr.instance.show({
                onProcess: () => ({
                    progress: this._loadingProgress,
                    text: this._loadingPhase || "正在加载游戏资源..."
                }),
                isEnd: () => this._isLoadingComplete,
                minShowTime: 300
            });

            // 2. Loading 显示后，关闭登录界面
            this.closeLoginScene();

            // 3. 执行加载逻辑（并行执行，更新 progress）
            await this.executeLoadingFlow();

            // 4. 主界面加载并渲染出来后，再允许 Loading 结束。
            await this.enterGame();

            // 5. 设置加载完成标志
            this._isLoadingComplete = true;

        } catch (error) {
            console.error("[StartMain] ❌ 加载 Logic 分包失败:", error);
            LoadingMgr.instance.forceHide();
        }
    }

    /**
     * 执行加载流程（分包加载 → LogicMain → 核心流程 → 主界面）
     */
    private async executeLoadingFlow(): Promise<void> {
        // Phase 1: 加载 Logic 分包 (0% - 40%)
        this._loadingPhase = "加载分包资源...";
        this._loadingProgress = 0.1;
        await this.loadLogicSubpackage();
        this._loadingProgress = 0.4;

        // Phase 2: 初始化 LogicMain (40% - 60%)
        this._loadingPhase = "初始化游戏逻辑...";
        this._loadingProgress = 0.5;
        await this.initLogicMain();
        this._loadingProgress = 0.6;

        // Phase 3: 核心流程 (60% - 80%)
        this._loadingPhase = "连接服务器...";
        this._loadingProgress = 0.7;
        await this.startGameCoreFlow();
        this._loadingProgress = 0.8;

        // Phase 4: 准备进入主界面 (80% - 95%)
        this._loadingPhase = "进入游戏世界...";
        this._loadingProgress = 0.9;
        this._loadingProgress = 0.95;
    }

    // ==================== 初始化方法 ====================

    /**
     * 初始化引擎配置
     */
    private initEngine() {
        Laya.loader.retryNum = 20;
        Laya.loader.retryDelay = 1000;
        Laya.loader.maxLoader = 5;
    }

    // ==================== 分包加载 ====================

    /**
     * 加载 Logic 分包
     */
    private async loadLogicSubpackage(): Promise<void> {
        return new Promise((resolve, reject) => {
            // LayaAir 分包加载 API
            // 注意：Laya.loader.loadPackage 在不同平台有不同的参数重载
            // - 微信小游戏：loadPackage(name, onProgress)
            // - Web 平台：loadPackage(name, remoteUrl, onProgress)

            const onProgress = (progress: any) => {
                // progress 可能是数字（0-1）或对象 { loaded, total }
                let progressValue = 0;

                if (typeof progress === 'number') {
                    progressValue = progress;
                } else if (progress && typeof progress.loaded === 'number' && typeof progress.total === 'number') {
                    progressValue = progress.loaded / progress.total;
                } else {
                    progressValue = 0;
                }

                // 更新 Loading 进度（通过 LoadingMgr）
                this._loadingProgress = 0.1 + progressValue * 0.3; // 10% - 40%
            };

            // 调用 LayaAir 分包加载 API
            Laya.loader.loadPackage("logic", onProgress)
                .then(() => {
                    resolve();
                })
                .catch((error: any) => {
                    console.error("[StartMain] ❌ Logic 分包加载失败:", error);
                    reject(error);
                });
        });
    }

    /**
     * 初始化 LogicMain（动态导入）
     */
    private async initLogicMain(): Promise<void> {
        // 动态导入 LogicMain（Webpack/Rollup 会自动代码分割）
        // 注意：如果 LayaAir 支持 ScriptBundle，这里会自动加载分包中的代码
        const { LogicMain } = await import(
            /* webpackChunkName: "logic" */
            "../logic/LogicMain"
        );

        // 创建 LogicMain 实例
        this._logicMain = new LogicMain();
        await this._logicMain.init();

        // 挂载到 window.logicMain
        (Laya.Browser.window as any)["logicMain"] = this._logicMain;
    }

    /**
     * 启动游戏核心流程（连接 Gateway → 登录）
     */
    private async startGameCoreFlow(): Promise<void> {
        if (!this._logicMain) {
            throw new Error("LogicMain 未初始化");
        }

        // 调用 LogicMain 的核心流程
        await this._logicMain.startCoreFlow();
    }

    // ==================== 场景管理 ====================

    /**
     * 打开登录场景并卸载启动场景
     */
    private async openLoginScene() {
        try {
            // 加载 .ls 场景文件（新UI系统）
            const loginScene = await Laya.Scene.open("startupUI/login/loginView.ls");

            if (loginScene) {
                this._loginScene = loginScene;

                // 将登录场景挂载到Login层
                LayerMgr.setLayer(loginScene, "Login");

                // 等待界面完全显示
                await this.waitForSceneDisplay(loginScene);

                // 卸载启动场景
                this.unloadStartupScene();
            } else {
                throw new Error("无法加载登录场景");
            }

        } catch (error) {
            console.error("[StartMain] 加载登录界面失败:", error);
        }
    }

    private closeLoginScene(): void {
        try {
            Laya.Scene.close("startupUI/login/loginView.ls");

            if (this._loginScene && !this._loginScene.destroyed) {
                this._loginScene.removeSelf();
                this._loginScene.destroy(true);
            }
            this._loginScene = null;
        } catch (error) {
            console.error("[StartMain] 关闭登录界面失败:", error);
        }
    }

    /**
     * 等待场景完全显示
     */
    private waitForSceneDisplay(scene: Laya.Scene): Promise<void> {
        return new Promise((resolve) => {
            // 方法1: 监听DISPLAY事件（推荐）
            const onDisplay = () => {
                scene.off(Laya.Event.DISPLAY, scene, onDisplay);
                // 再等待一帧确保界面完全渲染
                Laya.timer.frameOnce(1, null, resolve);
            };

            // 如果场景已经显示，直接resolve
            if (scene.parent) {
                Laya.timer.frameOnce(1, null, resolve);
            } else {
                // 监听显示事件
                scene.on(Laya.Event.DISPLAY, scene, onDisplay);
            }
        });
    }

    /**
     * 卸载启动场景
     */
    private unloadStartupScene() {
        try {
            // 卸载启动场景
            Laya.Scene.close("assets/StartUp.lh");
            Laya.loader.clearRes("assets/StartUp.lh");

        } catch (error) {
            console.error("[StartMain] 卸载启动场景失败:", error);
        }
    }

    /**
     * 进入游戏主界面。
     * 主界面加载并至少渲染一帧后，Loading 才会关闭。
     */
    private async enterGame(): Promise<void> {
        const sceneMgr = (Laya.Browser.window as any).sceneMgr;
        if (!sceneMgr) {
            throw new Error("SceneMgr 未初始化，无法进入主场景");
        }

        await sceneMgr.switchScene(1); // SceneType.MainScene = 1
        await new Promise<void>((resolve) => {
            Laya.timer.frameOnce(1, null, resolve);
        });
    }
}
