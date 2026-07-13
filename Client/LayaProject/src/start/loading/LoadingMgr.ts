/**
 * Loading 管理器
 * 负责显示 Loading 界面，通过 process/isEnd 函数参数控制进度
 *
 * 设计原则：
 * - 放在首包（Start），Logic 分包加载时可用
 * - 调用者实现 process() 和 isEnd()，LoadingMgr 负责显示和控制
 * - 通过 window.loadingMgr 暴露给 Logic 分包使用
 *
 * 使用方式：
 * loadingMgr.show({
 *     onProcess: () => ({ progress: loadedCount / totalCount, text: "加载资源" }),
 *     isEnd: () => loadedCount >= totalCount    // 返回是否结束
 * });
 */

import { LoadingView } from "./LoadingView";
import { LayerMgr } from "../utils/LayerMgr";

/**
 * Loading 配置参数
 */
export interface LoadingOptions {
    /** 进度计算函数，返回 0-1 的进度值和显示文本 */
    onProcess: () => LoadingProcessInfo;
    /** 结束判断函数，返回 true 表示加载完成 */
    isEnd: () => boolean;
    /** 最小显示时间（毫秒，避免闪烁） */
    minShowTime?: number;
}

/**
 * Loading 进度信息
 */
export interface LoadingProcessInfo {
    /** 进度值，0-1 */
    progress: number;
    /** 显示文本 */
    text?: string;
}

/**
 * Loading 状态
 */
interface LoadingState {
    options: LoadingOptions;
    startTime: number;
    isShowing: boolean;
    isEnding: boolean;
    resolve: (() => void) | null;
}

/**
 * Loading 管理器（单例）
 */
export class LoadingMgr {
    private static _instance: LoadingMgr;

    static get instance(): LoadingMgr {
        if (!this._instance) this._instance = new LoadingMgr();
        return this._instance;
    }

    private constructor() {}

    /** Loading 状态 */
    private _state: LoadingState | null = null;

    /** Loading UI 实例 */
    private _loadingView: LoadingView | null = null;

    /** Loading 资源路径 */
    private readonly LOADING_VIEW_PATH = "startupUI/loading/loadingView.ls";

    /** 默认最小显示时间 */
    private readonly DEFAULT_MIN_SHOW_TIME = 300;

    // ========== 公开方法 ==========

    /**
     * 显示 Loading 界面
     * @param options Loading 配置
     */
    show(options: LoadingOptions): void {
        if (this._state?.isShowing) {
            console.warn("[LoadingMgr] Loading already showing");
            return;
        }

        // 初始化状态
        this._state = {
            options,
            startTime: Laya.Browser.now(),
            isShowing: true,
            isEnding: false,
            resolve: null,
        };

        this.showLoadingUI();
    }

    /**
     * 强制关闭 Loading（用于异常情况）
     */
    forceHide(): void {
        if (!this._state?.isShowing) return;

        this.endLoading();
    }

    /**
     * 更新提示文本
     * @param tip 新的提示文本
     */
    updateTip(tip: string): void {
        if (this._loadingView) {
            this._loadingView.updateTip(tip);
        }
    }

    // ========== 内部方法 ==========

    /**
     * 加载并显示 Loading UI
     */
    private async showLoadingUI(): Promise<void> {
        try {
            // 使用 Laya.Scene.open 打开场景（返回场景实例）
            const scene = await Laya.Scene.open(this.LOADING_VIEW_PATH) as LoadingView;
            
            if (scene) {
                this._loadingView = scene;
                
                // 使用 LayerMgr 设置层级为 Top（最顶层）
                LayerMgr.setLayer(scene, "Top");
            } else {
                console.warn("[LoadingMgr] Loading UI 创建失败，使用备用方案");
                this.createFallbackUI();
            }
        } catch (error) {
            console.error("[LoadingMgr] 加载 Loading UI 失败:", error);
            this.createFallbackUI();
        } finally {
            this.update();
            this.startUpdateLoop();
        }
    }

    /**
     * 创建备用 UI（当资源加载失败时）
     */
    private createFallbackUI(): void {
        // 简单的备用 UI
        this._loadingView = null;
        
        // 创建简单的遮罩层
        const overlay = new Laya.Sprite();
        overlay.name = "LoadingOverlay";
        overlay.graphics.drawRect(0, 0, Laya.stage.width, Laya.stage.height, "#000000", null, 0.7);
        Laya.stage.addChild(overlay);
        
    }

    /**
     * 启动更新循环
     */
    private startUpdateLoop(): void {
        Laya.timer.frameLoop(1, this, this.update);
    }

    /**
     * 更新循环（每帧调用）
     */
    private update(): void {
        if (!this._state?.isShowing) {
            this.stopUpdateLoop();
            return;
        }

        const { onProcess, isEnd, minShowTime } = this._state.options;

        // 获取当前进度
        const processInfo = onProcess();
        const progress = processInfo ? processInfo.progress : 0;
        const text = processInfo ? processInfo.text : undefined;
        this.updateProgressUI(progress, text);

        // 判断是否结束
        const elapsed = Laya.Browser.now() - this._state.startTime;
        const minTime = minShowTime ?? this.DEFAULT_MIN_SHOW_TIME;
        const canEnd = elapsed >= minTime && isEnd();

        if (canEnd) {
            this.endLoading();
        }
    }

    /**
     * 更新进度 UI
     * @param progress 进度值 (0-1)
     */
    private updateProgressUI(progress: number, text?: string): void {
        if (this._loadingView) {
            this._loadingView.updateProgress(progress, text);
        }
    }

    /**
     * 结束 Loading
     */
    private async endLoading(): Promise<void> {
        if (!this._state || this._state.isEnding) return;
        this._state.isEnding = true;

        // 停止更新循环
        this.stopUpdateLoop();

        // 关闭 UI
        await this.hideLoadingUI();

        // resolve Promise
        if (this._state.resolve) {
            this._state.resolve();
        }

        // 清理状态
        this._state.isShowing = false;
        this._state.resolve = null;
        this._state = null;
    }

    /**
     * 停止更新循环
     */
    private stopUpdateLoop(): void {
        Laya.timer.clear(this, this.update);
    }

    /**
     * 隐藏 Loading UI
     */
    private async hideLoadingUI(): Promise<void> {
        if (this._loadingView) {
            await this._loadingView.onLoadComplete();
            this._loadingView = null;
        } else {
            // 清理备用 UI
            const overlay = Laya.stage.getChildByName("LoadingOverlay");
            if (overlay) {
                overlay.destroy();
            }
        }
    }

    // ========== 状态查询 ==========

    /** 是否正在显示 */
    isShowing(): boolean {
        return this._state?.isShowing ?? false;
    }

    /** 当前进度 */
    getProgress(): number {
        if (!this._state?.isShowing) return 0;
        return this._state.options.onProcess().progress;
    }
}
