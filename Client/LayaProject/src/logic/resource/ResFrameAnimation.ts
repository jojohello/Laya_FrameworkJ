import { ResBase } from "./ResBase";

export interface FrameAnimationAction {
    name: string;
    frameUrls: string[];
    maskFrameUrls: string[];
    interval: number;
    loop: boolean;
    nextAction?: string;
}

export type FrameAnimationChangedHandler = (
    baseTexture: Laya.Texture,
    maskTexture: Laya.Texture | null,
    frameIndex: number
) => void;

export type FrameAnimationActionCompleteHandler = (actionName: string) => void;

/** A pooled Laya.Animation backed by one atlas resource. */
export class ResFrameAnimation extends ResBase {
    private _animation: Laya.Animation | null = null;
    private readonly _actions = new Map<string, FrameAnimationAction>();
    private _currentAction: FrameAnimationAction | null = null;
    private _currentFrameIndex = 0;
    private _elapsedMs = 0;
    private _isPlaying = false;
    private _frameChanged: FrameAnimationChangedHandler | null = null;
    private _actionComplete: FrameAnimationActionCompleteHandler | null = null;

    async buildRes(): Promise<void> {
        if (!this._animation) {
            this._animation = new Laya.Animation();
            this._animation.name = "CharacterFrameAnimation";
        }
        this._animation.visible = true;
        this._node = this._animation;
        this.initTransform();
    }

    configure(actions: readonly FrameAnimationAction[]): void {
        this._actions.clear();
        for (const action of actions) this._actions.set(action.name, action);
    }

    setFrameChangedHandler(handler: FrameAnimationChangedHandler | null): void {
        this._frameChanged = handler;
        this.applyCurrentFrame(true);
    }

    setActionCompleteHandler(handler: FrameAnimationActionCompleteHandler | null): void {
        this._actionComplete = handler;
    }

    play(name: string, loop?: boolean, force = false): boolean {
        const animation = this._animation;
        const action = this._actions.get(name);
        if (!animation || !action) return false;
        if (!force && this._currentAction === action && this._isPlaying) return true;

        const missingUrl = action.frameUrls.find(url => !Laya.loader.getRes(url));
        if (missingUrl) {
            console.error(`[ResFrameAnimation] Atlas subtexture is not cached: atlas=${this._url}, frame=${missingUrl}`);
            return false;
        }

        this._currentAction = action;
        this._currentFrameIndex = 0;
        this._elapsedMs = 0;
        this._isPlaying = true;
        animation.images = action.frameUrls;
        if (loop !== undefined && loop !== action.loop) {
            this._currentAction = { ...action, loop };
        }
        this.applyCurrentFrame(true);
        return true;
    }

    /** 由所属 Entity 的 update 使用场景游戏时间驱动。 */
    update(dt: number): void {
        const action = this._currentAction;
        if (!this._isPlaying || !action || action.frameUrls.length === 0 || dt <= 0) return;

        const interval = Math.max(1, action.interval);
        this._elapsedMs += dt * 1000;

        while (this._elapsedMs >= interval && this._isPlaying && this._currentAction === action) {
            this._elapsedMs -= interval;
            if (this._currentFrameIndex < action.frameUrls.length - 1) {
                this._currentFrameIndex++;
                this.applyCurrentFrame();
            } else if (action.loop) {
                this._currentFrameIndex = 0;
                this.applyCurrentFrame();
            } else {
                this._isPlaying = false;
                this.onComplete(action);
            }
        }
    }

    stop(): void {
        this._isPlaying = false;
        this._elapsedMs = 0;
        this._animation?.stop();
    }

    onRecycle(): void {
        this.stop();
        this._actions.clear();
        this._currentAction = null;
        this._currentFrameIndex = 0;
        this._elapsedMs = 0;
        this._frameChanged = null;
        this._actionComplete = null;
        if (this._animation) {
            this._animation.material = null;
            this._animation.visible = false;
            this._animation.removeSelf();
        }
    }

    onDispose(): void {
        this.onRecycle();
        this._animation?.destroy();
        this._animation = null;
        this._node = null;
    }

    get animation(): Laya.Animation | null {
        return this._animation;
    }

    private applyCurrentFrame(force: boolean = false): void {
        const animation = this._animation;
        const action = this._currentAction;
        if (!animation || !action) return;

        const index = this._currentFrameIndex;
        if (!force && animation.index === index) return;
        const baseTexture = Laya.loader.getRes(action.frameUrls[index]) as Laya.Texture;
        if (!baseTexture) return;
        const maskUrl = action.maskFrameUrls[index];
        const maskTexture = maskUrl ? Laya.loader.getRes(maskUrl) as Laya.Texture : null;
        animation.gotoAndStop(index);
        this._frameChanged?.(baseTexture, maskTexture, index);
    }

    private onComplete(action: FrameAnimationAction): void {
        if (this._actionComplete) {
            this._actionComplete(action.name);
        } else if (action.nextAction) {
            this.play(action.nextAction, undefined, true);
        }
    }
}
