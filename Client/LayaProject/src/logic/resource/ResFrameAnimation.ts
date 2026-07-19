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
    private _lastFrameIndex = -1;
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
        this._lastFrameIndex = -1;
        this.updateFrameTexture();
    }

    setActionCompleteHandler(handler: FrameAnimationActionCompleteHandler | null): void {
        this._actionComplete = handler;
    }

    play(name: string, loop?: boolean, force = false): boolean {
        const animation = this._animation;
        const action = this._actions.get(name);
        if (!animation || !action) return false;
        if (!force && this._currentAction === action && animation.isPlaying) return true;

        const missingUrl = action.frameUrls.find(url => !Laya.loader.getRes(url));
        if (missingUrl) {
            console.error(`[ResFrameAnimation] Atlas subtexture is not cached: atlas=${this._url}, frame=${missingUrl}`);
            return false;
        }

        this.stopMonitoring();
        this._currentAction = action;
        this._lastFrameIndex = -1;
        animation.images = action.frameUrls;
        animation.interval = Math.max(1, action.interval);
        animation.play(0, loop ?? action.loop);
        animation.on(Laya.Event.COMPLETE, this, this.onComplete);
        Laya.timer.frameLoop(1, this, this.updateFrameTexture);
        this.updateFrameTexture();
        return true;
    }

    stop(): void {
        this._animation?.stop();
        this.stopMonitoring();
    }

    onRecycle(): void {
        this.stop();
        this._actions.clear();
        this._currentAction = null;
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

    private updateFrameTexture(): void {
        const animation = this._animation;
        const action = this._currentAction;
        if (!animation || !action || animation.index === this._lastFrameIndex) return;

        const index = animation.index;
        const baseTexture = Laya.loader.getRes(action.frameUrls[index]) as Laya.Texture;
        if (!baseTexture) return;
        const maskUrl = action.maskFrameUrls[index];
        const maskTexture = maskUrl ? Laya.loader.getRes(maskUrl) as Laya.Texture : null;
        this._lastFrameIndex = index;
        this._frameChanged?.(baseTexture, maskTexture, index);
    }

    private onComplete(): void {
        const action = this._currentAction;
        if (!action || action.loop) return;
        if (this._actionComplete) {
            this._actionComplete(action.name);
        } else if (action.nextAction) {
            this.play(action.nextAction, undefined, true);
        }
    }

    private stopMonitoring(): void {
        Laya.timer.clear(this, this.updateFrameTexture);
        this._animation?.off(Laya.Event.COMPLETE, this, this.onComplete);
    }
}
