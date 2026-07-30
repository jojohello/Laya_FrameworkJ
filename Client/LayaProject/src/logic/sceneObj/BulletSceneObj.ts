import { BaseScene } from "../scene/BaseScene";
import { SceneLayerType } from "../scene/SceneLayerType";
import { BaseAction } from "../action/BaseAction";
import { BaseSceneObj } from "./BaseSceneObj";
import { DefaultBulletCollisionPolicy, IBulletCollisionPolicy } from "../bullet/BulletCollisionPolicy";
import {
    IBulletMovementPolicy,
    LineBulletMovementPolicy,
    NullBulletMovementPolicy,
    TraceBulletMovementPolicy,
} from "../bullet/BulletMovementPolicy";
import { BulletCollisionHost, BulletMovementStartConfig } from "../bullet/BulletPolicyTypes";
import { DisplaySceneObj } from "./DisplaySceneObj";
import { SceneObjType } from "./SceneObjType";
import { ResourceMgr } from "../resource/ResourceMgr";

const { regClass } = Laya;

export enum BulletMoveType {
    Line = 1,
    Trace = 2,
}

export interface BulletCollisionOptions {
    realtimeCollision?: boolean;
    collisionInterval?: number;
    repeatCollision?: boolean;
    hitInterval?: number;
    deduplicateCollision?: boolean;
    accumulateHitCount?: boolean;
    maxHitCount?: number;
    finishOnHit?: boolean;
    useTrailCollision?: boolean;
    useRangeCollision?: boolean;
    sortTrailCollision?: boolean;
}

/**
 * Visual-only frame animation settings for a projectile.
 * The default resource convention is `frame_00.png` through `frame_05.png`
 * below the atlas path's sibling directory.
 */
export interface BulletFrameAnimationOptions {
    atlasPath: string;
    framePrefix?: string;
    frameCount?: number;
    intervalMs?: number;
    displaySize?: number;
}

/**
 * Basic bullet object with line/trace movement and trail collision.
 */
@regClass()
export class BulletSceneObj extends DisplaySceneObj {
    protected _displayLayerType: SceneLayerType = SceneLayerType.Bullet;

    protected _moveType: BulletMoveType = BulletMoveType.Line;
    protected _casterId: number = 0;
    protected _targetId: number = 0;
    protected _searchTeam: number = 0;
    protected _damage: number = 0;
    protected _speed: number = 400;
    protected _flyTime: number = -1;
    protected _startTime: number = -1;
    protected _lastUpdateTime: number = -1;
    protected _penetrateCount: number = 0;
    protected _startPos: Laya.Point = Laya.Point.create();
    protected _endPos: Laya.Point = Laya.Point.create();
    protected _lastPos: Laya.Point = Laya.Point.create();
    protected _movementPolicy: IBulletMovementPolicy = new NullBulletMovementPolicy();
    protected _movementConfig: BulletMovementStartConfig | null = null;
    protected _movementStarted: boolean = false;
    protected _movementFinishPending: boolean = false;
    protected _movementFinishDoHitAtEnd: boolean = false;
    protected _collisionPolicy: IBulletCollisionPolicy = new DefaultBulletCollisionPolicy();
    protected readonly _hitTargetIds: number[] = [];
    protected _hitEffectScale: number = 1;
    protected _hitActions: readonly BaseAction[] = [];
    private _visualAnimation: Laya.Animation | null = null;
    private _visualAtlasPath: string = "";
    private _visualLoadToken: number = 0;

    getObjType(): number {
        return SceneObjType.Bullet;
    }

    protected onInit(uid: number, cfgId: number, scene: BaseScene, team: number, x: number, y: number, angle: number): void {
        this._casterId = 0;
        this._targetId = 0;
        this._searchTeam = team;
        this._damage = 0;
        this._speed = 400;
        this._flyTime = -1;
        this._startTime = -1;
        this._lastUpdateTime = -1;
        this._penetrateCount = 0;
        this.resetCollisionPolicy();
        this._hitTargetIds.length = 0;
        this._startPos.setTo(x, y);
        this._lastPos.setTo(x, y);
        this._endPos.setTo(x, y);
        this._movementPolicy.reset();
        this._movementPolicy = new NullBulletMovementPolicy();
        this._movementConfig = null;
        this._movementStarted = false;
        this._movementFinishPending = false;
        this._movementFinishDoHitAtEnd = false;
        this._hitEffectScale = 1;
        this._hitActions = [];
        this.clearVisualAnimation();
        // 子弹自身只发起轨迹查询，不进入队伍空间索引成为其他子弹的命中候选。
        this.setRange(8);
    }

    protected loadRes(): void {
        super.loadRes();
        if (this._model) {
            this._model.graphics.clear();
            this._model.graphics.drawCircle(0, 0, 5, "#f5c542");
        }
    }

    /**
     * Plays every configured atlas frame from start to finish in a loop.
     * Collision size remains independent from the visual display size.
     */
    setVisualFrameAnimation(options: BulletFrameAnimationOptions): void {
        const atlasPath = options.atlasPath?.trim() || "";
        this.releaseVisualAtlas();
        this.clearVisualAnimation();
        this._visualAtlasPath = atlasPath;
        const token = ++this._visualLoadToken;

        if (!atlasPath) {
            this.drawFallbackVisual();
            return;
        }

        const framePrefix = options.framePrefix?.trim() || "frame_";
        const frameCount = Math.max(1, Math.floor(options.frameCount ?? 6));
        const intervalMs = Math.max(1, Math.floor(options.intervalMs ?? 90));
        const displaySize = Math.max(1, Number(options.displaySize ?? 50));
        void this.loadVisualFrameAnimation(
            atlasPath,
            framePrefix,
            frameCount,
            intervalMs,
            displaySize,
            token
        );
    }

    /** Uses the standard six-frame, 90ms and 50px projectile visual defaults. */
    setVisualResource(atlasPath: string): void {
        this.setVisualFrameAnimation({ atlasPath });
    }

    initLineMovement(
        casterId: number,
        targetX: number,
        targetY: number,
        speed: number,
        damage: number,
        searchTeam: number,
        penetrateCount: number = 0
    ): void {
        this._moveType = BulletMoveType.Line;
        this._casterId = casterId;
        this._targetId = 0;
        this._speed = speed;
        this._damage = damage;
        this._searchTeam = searchTeam;
        this._penetrateCount = penetrateCount;
        this.resetCollisionPolicy();
        this._collisionPolicy.configure({
            maxHitCount: Math.max(1, penetrateCount + 1),
            useTrailCollision: true,
            useRangeCollision: false,
        });
        this._startPos.setTo(this.x, this.y);
        this._lastPos.setTo(this.x, this.y);
        this._endPos.setTo(targetX, targetY);
        this._movementPolicy = new LineBulletMovementPolicy();
        this._movementConfig = {
            casterId,
            targetX,
            targetY,
            speed,
            flyTime: -1,
        };
        this._movementStarted = false;
    }

    initTraceMovement(
        casterId: number,
        targetId: number,
        speed: number,
        damage: number,
        searchTeam: number,
        flyTimeSeconds: number = -1
    ): void {
        this._moveType = BulletMoveType.Trace;
        this._casterId = casterId;
        this._targetId = targetId;
        this._speed = speed;
        this._damage = damage;
        this._searchTeam = searchTeam;
        this._flyTime = flyTimeSeconds;
        this.resetCollisionPolicy();
        this._collisionPolicy.configure({
            useTrailCollision: false,
            useRangeCollision: false,
        });
        this._startPos.setTo(this.x, this.y);
        this._lastPos.setTo(this.x, this.y);
        this._movementPolicy = new TraceBulletMovementPolicy();
        this._movementConfig = {
            casterId,
            targetId,
            targetX: this.x,
            targetY: this.y,
            speed,
            flyTime: flyTimeSeconds,
        };
        this._movementStarted = false;
    }

    configureCollision(options: BulletCollisionOptions): void {
        this._collisionPolicy.configure(options);
    }

    setHitActions(actions: readonly BaseAction[], effectScale: number = 1): void {
        this._hitActions = actions || [];
        this._hitEffectScale = Number(effectScale) || 1;
    }

    onRecycle(scene: BaseScene): void {
        this.releaseVisualAtlas();
        this.clearVisualAnimation();
        super.onRecycle(scene);
    }

    onDispose(scene: BaseScene): void {
        this.releaseVisualAtlas();
        this.clearVisualAnimation(true);
        super.onDispose(scene);
    }

    getCasterId(): number {
        return this._casterId || this.uid;
    }

    protected onLogicUpdate(_logicDt: number, curTime: number, _tick: number): void {
        const caster = this._casterId > 0 ? this._scene?.getLiveObject(this._casterId) : null;
        if (this._casterId <= 0 || !caster) {
            this.release();
            return;
        }

        if (!this._movementStarted) {
            this.startMovementPolicy(curTime);
            return;
        }

        const moved = this.updateMovement(curTime);
        this._lastUpdateTime = curTime;
        if (!this.isRelease && this.shouldUpdateCollision(curTime, moved)) {
            this.updateCollision(curTime);
        }

        if (this.isRelease) return;
        if (this._movementFinishPending) {
            this.finish(this._movementFinishDoHitAtEnd);
        }
    }

    protected updateMovement(curTime: number): boolean {
        this._movementFinishPending = false;
        this._movementFinishDoHitAtEnd = false;
        this._lastPos.setTo(this.x, this.y);
        const result = this._movementPolicy.update(this, curTime);

        if (result.hitTarget) {
            this.tryHitTarget(result.hitTarget, curTime);
        }

        if (result.finished) {
            this._movementFinishPending = true;
            this._movementFinishDoHitAtEnd = !!result.doHitAtEnd;
        }

        return result.moved;
    }

    protected resetCollisionPolicy(): void {
        this._collisionPolicy.reset();
    }

    protected shouldUpdateCollision(curTime: number, moved: boolean): boolean {
        return this._collisionPolicy.shouldCheck(this.getCollisionHost(), curTime, moved);
    }

    protected updateCollision(curTime: number): void {
        this._collisionPolicy.collectHitIds(this.getCollisionHost(), curTime, this._hitTargetIds);
        try {
            for (const targetId of this._hitTargetIds) {
                const target = this._scene?.getLiveObject(targetId);
                if (!target) continue;
                if (this.tryHitTarget(target, curTime) && this.shouldFinishAfterHit()) {
                    this.finish(false);
                    return;
                }
            }
        } finally {
            this._hitTargetIds.length = 0;
        }
    }

    protected tryHitTarget(target: BaseSceneObj, curTime: number): boolean {
        if (!this.canHitTarget(this, target)) return false;

        this._collisionPolicy.recordHit(target, curTime);
        this.onHit(target, curTime);
        return true;
    }

    protected shouldFinishAfterHit(): boolean {
        return this._collisionPolicy.shouldFinishAfterHit();
    }

    protected canHitTarget = (master: BaseSceneObj, target: BaseSceneObj): boolean => {
        return !target.isRelease
            && !target.isDead
            && target.getObjType() !== SceneObjType.Bullet
            && target.team !== master.team;
    };

    protected onHit(target: BaseSceneObj, curTime: number): void {
        if (!this._scene) return;
        const casterId = this.getCasterId();
        const caster = this._scene.getLiveObject(casterId);
        if (!caster) return;

        if (this._hitActions.length > 0) {
            for (const action of this._hitActions) {
                action.execute({
                    scene: this._scene,
                    casterId,
                    targetId: target.uid,
                    targetX: target.x,
                    targetY: target.y,
                    effectScale: this._hitEffectScale,
                    curTime,
                    executeTime: curTime,
                });
            }
            return;
        }

        if (this._damage > 0) {
            target.getDamage(casterId, this._damage, curTime);
        }
    }

    protected finish(doHitAtEnd: boolean): void {
        if (this.isRelease) return;
        if (doHitAtEnd) {
            this.updateCollision(this._lastUpdateTime);
        }
        this.release();
    }

    private getCollisionHost(): BulletCollisionHost {
        return {
            scene: this._scene,
            ownerId: this.uid,
            x: this.x,
            y: this.y,
            lastX: this._lastPos.x,
            lastY: this._lastPos.y,
            range: this._range,
            searchTeam: this._searchTeam,
            canHitTarget: (target: BaseSceneObj) => this.canHitTarget(this, target),
        };
    }

    private startMovementPolicy(curTime: number): void {
        this._startTime = curTime;
        this._lastUpdateTime = curTime;
        this._movementStarted = true;
        if (this._movementConfig) {
            this._movementPolicy.start(this, this._movementConfig, curTime);
        }
    }

    private async loadVisualFrameAnimation(
        atlasPath: string,
        framePrefix: string,
        frameCount: number,
        intervalMs: number,
        displaySize: number,
        token: number
    ): Promise<void> {
        try {
            await ResourceMgr.instance.loadContent(atlasPath);
        } catch (error) {
            if (token === this._visualLoadToken) {
                console.error(`[BulletSceneObj] Failed to load visual atlas: ${atlasPath}`, error);
                this.drawFallbackVisual();
            }
            return;
        }

        if (token !== this._visualLoadToken || this.isRelease || !this._model) {
            return;
        }

        const frameRoot = atlasPath.replace(/\.atlas$/i, "") + "/";
        const frameUrls = Array.from(
            { length: frameCount },
            (_value, index) => `${frameRoot}${framePrefix}${String(index).padStart(2, "0")}.png`
        );
        const missingFrame = frameUrls.find(url => !Laya.loader.getRes(url));
        if (missingFrame) {
            console.error(`[BulletSceneObj] Visual frame is not cached: atlas=${atlasPath}, frame=${missingFrame}`);
            ResourceMgr.instance.releaseRef(atlasPath);
            this._visualAtlasPath = "";
            this.drawFallbackVisual();
            return;
        }

        const animation = this._visualAnimation || new Laya.Animation();
        animation.stop();
        animation.images = frameUrls;
        animation.interval = intervalMs;
        const scale = displaySize / 48;
        animation.scale(scale, scale);
        animation.pos(-displaySize * 0.5, -displaySize * 0.5);
        animation.play(0, true);
        this._model.graphics.clear();
        this._model.addChild(animation);
        this._visualAnimation = animation;
    }

    private releaseVisualAtlas(): void {
        if (!this._visualAtlasPath) return;
        ResourceMgr.instance.releaseRef(this._visualAtlasPath);
        this._visualAtlasPath = "";
        this._visualLoadToken++;
    }

    private clearVisualAnimation(destroy: boolean = false): void {
        if (!this._visualAnimation) return;
        this._visualAnimation.stop();
        this._visualAnimation.removeSelf();
        if (destroy) {
            this._visualAnimation.destroy();
            this._visualAnimation = null;
        }
    }

    private drawFallbackVisual(): void {
        if (!this._model) return;
        this._model.graphics.clear();
        this._model.graphics.drawCircle(0, 0, 5, "#f5c542");
    }

    getLiveObject(uid: number): BaseSceneObj | null {
        return this._scene ? this._scene.getLiveObject(uid) : null;
    }

    setMovePos(x: number, y: number): void {
        this._transform.setPos(x, y);
    }

    pointTo(x: number, y: number): void {
        this._transform.pointTo(x, y);
    }

    turnToDirection(dx: number, dy: number, curTime: number): void {
        this._transform.turnToDirection(dx, dy, curTime);
    }
}
