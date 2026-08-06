import { LoadingView } from "./LoadingView";
import { LayerMgr } from "../utils/LayerMgr";
import { ScreenAdapter } from "../screen/ScreenAdapter";

export interface LoadingProcessInfo {
    /** Current progress in [0, 1]. */
    progress: number;
    /** Current phase text. */
    text?: string;
}

export interface LoadingOptions {
    /** Supplied by the caller. LoadingMgr evaluates it once per frame. */
    onProcess: () => LoadingProcessInfo;
    /** Supplied by the caller. true means the caller's work is complete. */
    isEnd: () => boolean;
    /** Prevents a very short task from flashing the Loading view. */
    minShowTime?: number;
}

interface LoadingState {
    readonly id: number;
    readonly options: LoadingOptions;
    readonly startTime: number;
    readonly completion: Promise<void>;
    readonly resolve: () => void;
    isEnding: boolean;
    lastProcess: LoadingProcessInfo;
}

/**
 * First-package Loading service.
 *
 * LoadingMgr owns only display, per-frame refresh and closing. The caller owns
 * progress calculation and the completion condition through LoadingOptions.
 */
export class LoadingMgr {
    private static _instance: LoadingMgr;

    static get instance(): LoadingMgr {
        if (!this._instance) this._instance = new LoadingMgr();
        return this._instance;
    }

    private readonly LOADING_VIEW_PATH = "startupUI/loading/loadingView.ls";
    private readonly DEFAULT_MIN_SHOW_TIME = 300;

    private _nextStateId = 1;
    private _state: LoadingState | null = null;
    private _loadingView: LoadingView | null = null;
    private _fallbackOverlay: Laya.Sprite | null = null;

    private constructor() {}

    /**
     * Starts one Loading session.
     * The returned Promise resolves after the Loading view has fully closed.
     */
    show(options: LoadingOptions): Promise<void> {
        if (this._state) {
            const error = new Error("[LoadingMgr] A Loading session is already active");
            console.error(error.message);
            return Promise.reject(error);
        }

        let resolveCompletion!: () => void;
        const completion = new Promise<void>(resolve => {
            resolveCompletion = resolve;
        });
        const state: LoadingState = {
            id: this._nextStateId++,
            options,
            startTime: Laya.Browser.now(),
            completion,
            resolve: resolveCompletion,
            isEnding: false,
            lastProcess: { progress: 0 },
        };

        this._state = state;
        this.stopUpdateLoop();
        Laya.timer.frameLoop(1, this, this.update);
        this.update();
        if (this._state === state) {
            void this.showLoadingUI(state);
        }
        return completion;
    }

    /** Closes the active session regardless of the caller's isEnd result. */
    forceHide(): Promise<void> {
        const state = this._state;
        return state ? this.endLoading(state) : Promise.resolve();
    }

    updateTip(tip: string): void {
        if (!this._state) return;
        this._state.lastProcess = {
            ...this._state.lastProcess,
            text: tip,
        };
        this._loadingView?.updateTip(tip);
    }

    isShowing(): boolean {
        return this._state !== null;
    }

    getProgress(): number {
        return this._state?.lastProcess.progress ?? 0;
    }

    private async showLoadingUI(state: LoadingState): Promise<void> {
        try {
            const scene = await Laya.Scene.open(this.LOADING_VIEW_PATH) as LoadingView;
            if (!this.isCurrentState(state)) {
                this.destroyStaleView(scene);
                return;
            }

            this._loadingView = scene;
            ScreenAdapter.instance.bind(scene);
            LayerMgr.setLayer(scene, "Top");
            this.applyProcessToView(state.lastProcess);
        } catch (error) {
            if (!this.isCurrentState(state)) return;
            console.error("[LoadingMgr] Failed to load Loading view:", error);
            this.createFallbackUI();
        }
    }

    private update(): void {
        const state = this._state;
        if (!state || state.isEnding) {
            this.stopUpdateLoop();
            return;
        }

        try {
            const process = state.options.onProcess() || { progress: 0 };
            state.lastProcess = {
                progress: this.clampProgress(process.progress),
                text: process.text,
            };
            this.applyProcessToView(state.lastProcess);

            const elapsed = Laya.Browser.now() - state.startTime;
            const minShowTime = state.options.minShowTime ?? this.DEFAULT_MIN_SHOW_TIME;
            if (elapsed >= minShowTime && state.options.isEnd()) {
                void this.endLoading(state);
            }
        } catch (error) {
            console.error("[LoadingMgr] Loading callback failed:", error);
            void this.endLoading(state);
        }
    }

    private applyProcessToView(process: LoadingProcessInfo): void {
        this._loadingView?.updateProgress(process.progress, process.text);
    }

    private async endLoading(state: LoadingState): Promise<void> {
        if (!this.isCurrentState(state)) return state.completion;
        if (state.isEnding) return state.completion;

        state.isEnding = true;
        this.stopUpdateLoop();
        await this.hideLoadingUI();

        if (this._state === state) {
            this._state = null;
        }
        state.resolve();
        return state.completion;
    }

    private async hideLoadingUI(): Promise<void> {
        const view = this._loadingView;
        this._loadingView = null;
        if (view && !view.destroyed) {
            await view.onLoadComplete();
        }

        const overlay = this._fallbackOverlay;
        this._fallbackOverlay = null;
        if (overlay && !overlay.destroyed) {
            overlay.destroy();
        }
    }

    private createFallbackUI(): void {
        if (this._fallbackOverlay && !this._fallbackOverlay.destroyed) return;

        const overlay = new Laya.Sprite();
        overlay.name = "LoadingOverlay";
        overlay.graphics.drawRect(
            0,
            0,
            Laya.stage.width,
            Laya.stage.height,
            "#000000",
            null,
            0.7
        );
        overlay.mouseEnabled = true;
        this._fallbackOverlay = overlay;
        LayerMgr.setLayer(overlay, "Top");
    }

    private destroyStaleView(view: LoadingView | null): void {
        if (!view || view.destroyed) return;
        view.removeSelf();
        view.destroy(true);
    }

    private isCurrentState(state: LoadingState): boolean {
        return this._state === state && !state.isEnding;
    }

    private clampProgress(value: number): number {
        if (!Number.isFinite(value)) return 0;
        return Math.max(0, Math.min(1, value));
    }

    private stopUpdateLoop(): void {
        Laya.timer.clear(this, this.update);
    }
}
