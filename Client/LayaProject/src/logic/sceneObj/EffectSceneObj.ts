import { BaseScene } from "../scene/BaseScene";
import { SceneLayerType } from "../scene/SceneLayerType";
import { ConfigMgr } from "../config/ConfigMgr";
import { ResourceMgr } from "../resource/ResourceMgr";
import { FrameAnimationAction, ResFrameAnimation } from "../resource/ResFrameAnimation";
import { CombatEffectConfigData } from "./CombatEffectConfigData";
import { DisplaySceneObj } from "./DisplaySceneObj";
import { SceneObjType } from "./SceneObjType";

const { regClass } = Laya;

export interface EffectFrameAnimationOptions {
    atlasPath: string;
    frameCount?: number;
    framePrefix?: string;
    durationMs?: number;
    displayScale?: number;
}

export const DEFAULT_HIT_EFFECT_ID = 1001;
export const DEFAULT_HEAL_EFFECT_ID = 1002;

/**
 * Pooled, display-only effect object. It does not enter collision space.
 */
@regClass()
export class EffectSceneObj extends DisplaySceneObj {
    protected _displayLayerType: SceneLayerType = SceneLayerType.Effect;
    protected _startTime: number = -1;
    protected _duration: number = 0;
    private _frameAnimation: ResFrameAnimation | null = null;
    private _frameLoadToken: number = 0;

    getObjType(): number {
        return SceneObjType.Effect;
    }

    protected onInit(uid: number, cfgId: number, scene: BaseScene, team: number, x: number, y: number, angle: number): void {
        this._startTime = -1;
        this._duration = 0;
        this._frameLoadToken++;
        this.setCollisionBoxEnabled(false);
    }

    setDuration(durationMs: number): void {
        this._duration = Math.max(0, durationMs) / 1000;
    }

    /** Starts one non-looping atlas animation on the scene clock. */
    setFrameAnimation(options: EffectFrameAnimationOptions, curTime: number): void {
        const atlasPath = options.atlasPath?.trim() || "";
        const token = ++this._frameLoadToken;
        this.releaseFrameAnimation();
        this._startTime = -1;
        this._duration = 0;

        if (!atlasPath) {
            this.release();
            return;
        }

        void this.loadFrameAnimation(atlasPath, options, curTime, token);
    }

    /** Creates a short-lived combat effect from value snapshots, never a target reference. */
    static playCombatEffect(
        scene: BaseScene,
        effectId: number,
        team: number,
        x: number,
        y: number,
        curTime: number
    ): void {
        const config = ConfigMgr.instance.getConfig<CombatEffectConfigData>("CombatEffect", effectId);
        if (!config || !config.resource) {
            console.warn(`[EffectSceneObj] Combat effect config is missing: effectId=${effectId}`);
            return;
        }
        const effect = scene.addObjectToScene("EffectSceneObj", 0, team, x, y, 0) as EffectSceneObj | null;
        if (!effect) return;
        effect.setFrameAnimation({
            atlasPath: config.resource,
            durationMs: config.durationMs,
            displayScale: config.displayScale,
            frameCount: config.frameCount,
        }, curTime);
    }

    static getPreloadAtlasPaths(): readonly string[] {
        return [...new Set(
            ConfigMgr.instance
                .getAll<CombatEffectConfigData>("CombatEffect")
                .map(config => config.resource)
                .filter(path => !!path)
        )];
    }

    onRecycle(scene: BaseScene): void {
        this._frameLoadToken++;
        this.releaseFrameAnimation();
        super.onRecycle(scene);
    }

    onDispose(scene: BaseScene): void {
        this._frameLoadToken++;
        this.releaseFrameAnimation();
        super.onDispose(scene);
    }

    protected onLogicUpdate(_logicDt: number, curTime: number, _tick: number): void {
        this._frameAnimation?.update(curTime);
        if (this._duration <= 0 || this._startTime < 0) return;
        if (curTime - this._startTime >= this._duration) {
            this.release();
        }
    }

    private async loadFrameAnimation(
        atlasPath: string,
        options: EffectFrameAnimationOptions,
        curTime: number,
        token: number
    ): Promise<void> {
        let animation: ResFrameAnimation;
        try {
            animation = await ResourceMgr.instance.load(atlasPath, ResFrameAnimation);
        } catch (error) {
            if (token === this._frameLoadToken && !this.isRelease) {
                console.error(`[EffectSceneObj] Failed to load effect atlas: ${atlasPath}`, error);
                this.release();
            }
            return;
        }

        if (token !== this._frameLoadToken || this.isRelease || !this._model) {
            ResourceMgr.instance.recoverRes(animation);
            return;
        }

        const frameCount = Math.max(1, Math.floor(options.frameCount ?? 6));
        const frameRoot = atlasPath.replace(/\.atlas$/i, "") + "/";
        const framePrefix = options.framePrefix?.trim() || "frame_";
        const frameUrls = Array.from(
            { length: frameCount },
            (_value, index) => `${frameRoot}${framePrefix}${String(index).padStart(2, "0")}.png`
        );
        const missingFrame = frameUrls.find(url => !Laya.loader.getRes(url));
        if (missingFrame) {
            console.error(`[EffectSceneObj] Effect frame is not cached: atlas=${atlasPath}, frame=${missingFrame}`);
            ResourceMgr.instance.recoverRes(animation);
            this.release();
            return;
        }

        const duration = Math.max(1, Number(options.durationMs ?? 360)) / 1000;
        const action: FrameAnimationAction = {
            name: "play",
            startFrameIndex: 0,
            endFrameIndex: frameCount - 1,
            duration,
        };
        if (!animation.configure([action], frameUrls, [])) {
            ResourceMgr.instance.recoverRes(animation);
            this.release();
            return;
        }

        const node = animation.animation;
        if (!node) {
            ResourceMgr.instance.recoverRes(animation);
            this.release();
            return;
        }
        const scale = Math.max(0.01, Number(options.displayScale ?? 1));
        node.stop();
        node.pivot(32, 64);
        node.scale(scale, scale);
        animation.setParent(this._model);
        this._frameAnimation = animation;
        this._startTime = curTime;
        this._duration = duration;
        if (animation.play("play", curTime, curTime, false, true) < 0) {
            this.releaseFrameAnimation();
            this.release();
        }
    }

    private releaseFrameAnimation(): void {
        if (!this._frameAnimation) return;
        ResourceMgr.instance.recoverRes(this._frameAnimation);
        this._frameAnimation = null;
    }
}
