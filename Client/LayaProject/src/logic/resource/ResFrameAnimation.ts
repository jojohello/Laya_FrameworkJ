import { ResBase } from "./ResBase";

export interface FrameAnimationAction {
    name: string;
    startFrameIndex: number;
    endFrameIndex: number;
    /** One complete playback duration in scene logic seconds. */
    duration: number;
}

export type FrameAnimationChangedHandler = (
    baseTexture: Laya.Texture,
    maskTexture: Laya.Texture | null,
    frameIndex: number
) => void;

/** A pooled Laya.Animation backed by one atlas resource. */
export class ResFrameAnimation extends ResBase {
    private _animation: Laya.Animation | null = null;
    private readonly _actions = new Map<string, FrameAnimationAction>();
    private readonly _actionFrameUrls = new Map<string, string[]>();
    private readonly _actionMaskFrameUrls = new Map<string, string[]>();
    private _frameUrls: string[] = [];
    private _maskFrameUrls: string[] = [];
    private _currentAction: FrameAnimationAction | null = null;
    private _currentFrameUrls: string[] = [];
    private _currentMaskFrameUrls: string[] = [];
    private _currentFrameIndex = 0;
    private _actionStartTime = 0;
    private _isLoop = false;
    private _isPlaying = false;
    private _frameChanged: FrameAnimationChangedHandler | null = null;

    async buildRes(): Promise<void> {
        if (!this._animation) {
            this._animation = new Laya.Animation();
            this._animation.name = "CharacterFrameAnimation";
        }
        this._animation.visible = true;
        this._node = this._animation;
        this.initTransform();
    }

    configure(
        actions: readonly FrameAnimationAction[],
        frameUrls: readonly string[],
        maskFrameUrls: readonly string[]
    ): boolean {
        this._actions.clear();
        this._actionFrameUrls.clear();
        this._actionMaskFrameUrls.clear();
        this._frameUrls = [...frameUrls];
        this._maskFrameUrls = [...maskFrameUrls];

        for (const action of actions) {
            if (
                !action.name ||
                !Number.isInteger(action.startFrameIndex) ||
                !Number.isInteger(action.endFrameIndex) ||
                action.startFrameIndex < 0 ||
                action.endFrameIndex < action.startFrameIndex ||
                action.endFrameIndex >= this._frameUrls.length ||
                action.duration <= 0 ||
                this._actions.has(action.name)
            ) {
                console.error(`[ResFrameAnimation] Invalid action config: atlas=${this._url}, action=${action.name}`);
                this._actions.clear();
                this._actionFrameUrls.clear();
                this._actionMaskFrameUrls.clear();
                return false;
            }

            for (let index = action.startFrameIndex; index <= action.endFrameIndex; index++) {
                if (!this._frameUrls[index]) {
                    console.error(`[ResFrameAnimation] Missing logical base frame URL: atlas=${this._url}, index=${index}`);
                    this._actions.clear();
                    this._actionFrameUrls.clear();
                    this._actionMaskFrameUrls.clear();
                    return false;
                }
            }
            this._actions.set(action.name, action);
            this._actionFrameUrls.set(
                action.name,
                this._frameUrls.slice(action.startFrameIndex, action.endFrameIndex + 1)
            );
            this._actionMaskFrameUrls.set(
                action.name,
                this._maskFrameUrls.slice(action.startFrameIndex, action.endFrameIndex + 1)
            );
        }
        return this._actions.size > 0;
    }

    setFrameChangedHandler(handler: FrameAnimationChangedHandler | null): void {
        this._frameChanged = handler;
        this.applyCurrentFrame(true);
    }

    /**
     * Starts an action on the unified scene clock.
     * @returns One playback duration in seconds, or -1 when playback cannot start.
     */
    play(
        name: string,
        startTime: number,
        curTime: number,
        loop: boolean = false,
        force = false
    ): number {
        const animation = this._animation;
        const action = this._actions.get(name);
        const frameUrls = this._actionFrameUrls.get(name);
        const maskFrameUrls = this._actionMaskFrameUrls.get(name);
        if (!animation || !action || !frameUrls || !maskFrameUrls) return -1;
        if (!force && this._currentAction === action && this._isLoop === loop && this._isPlaying) {
            return action.duration;
        }

        const missingUrl = frameUrls.find(url => !Laya.loader.getRes(url));
        const missingMaskUrl = maskFrameUrls.find(url => !Laya.loader.getRes(url));
        if (missingUrl || missingMaskUrl) {
            console.error(`[ResFrameAnimation] Atlas subtexture is not cached: atlas=${this._url}, frame=${missingUrl || missingMaskUrl}`);
            return -1;
        }

        this._currentAction = action;
        this._currentFrameUrls = frameUrls;
        this._currentMaskFrameUrls = maskFrameUrls;
        this._currentFrameIndex = 0;
        this._actionStartTime = startTime;
        this._isLoop = loop;
        this._isPlaying = true;
        animation.images = frameUrls;
        this.seek(curTime, true);
        return action.duration;
    }

    /** 由所属 Entity 的 update 使用统一场景逻辑时间驱动。 */
    update(curTime: number): void {
        const action = this._currentAction;
        if (!this._isPlaying || !action) return;
        this.seek(curTime);
    }

    stop(): void {
        this._isPlaying = false;
        this._actionStartTime = 0;
        this._animation?.stop();
    }

    onRecycle(): void {
        this.stop();
        this._actions.clear();
        this._actionFrameUrls.clear();
        this._actionMaskFrameUrls.clear();
        this._frameUrls.length = 0;
        this._maskFrameUrls.length = 0;
        this._currentAction = null;
        this._currentFrameUrls.length = 0;
        this._currentMaskFrameUrls.length = 0;
        this._currentFrameIndex = 0;
        this._actionStartTime = 0;
        this._isLoop = false;
        this._frameChanged = null;
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

    private seek(curTime: number, force: boolean = false): void {
        const action = this._currentAction;
        if (!action) return;

        const frameCount = this._currentFrameUrls.length;
        const elapsed = Math.max(0, curTime - this._actionStartTime);
        let progress = elapsed;
        if (this._isLoop) {
            progress %= action.duration;
        } else if (elapsed >= action.duration) {
            progress = action.duration;
            this._isPlaying = false;
        }

        const nextIndex = progress >= action.duration
            ? frameCount - 1
            : Math.min(frameCount - 1, Math.floor(progress / action.duration * frameCount));
        if (!force && nextIndex === this._currentFrameIndex) return;
        this._currentFrameIndex = nextIndex;
        this.applyCurrentFrame(force);
    }

    private applyCurrentFrame(force: boolean = false): void {
        const animation = this._animation;
        const action = this._currentAction;
        if (!animation || !action) return;

        const index = this._currentFrameIndex;
        if (!force && animation.index === index) return;
        const baseTexture = Laya.loader.getRes(this._currentFrameUrls[index]) as Laya.Texture;
        if (!baseTexture) return;
        const maskUrl = this._currentMaskFrameUrls[index];
        const maskTexture = maskUrl ? Laya.loader.getRes(maskUrl) as Laya.Texture : null;
        animation.gotoAndStop(index);
        this._frameChanged?.(baseTexture, maskTexture, index);
    }

}
