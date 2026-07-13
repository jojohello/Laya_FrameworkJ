import { BaseScene } from "../scene/BaseScene";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";

export interface BulletMovementStartConfig {
    casterId: number;
    targetId?: number;
    targetX: number;
    targetY: number;
    speed: number;
    flyTime: number;
}

export interface BulletMovementResult {
    moved: boolean;
    finished: boolean;
    hitTarget?: BaseSceneObj | null;
    doHitAtEnd?: boolean;
}

export interface BulletMovementHost {
    readonly scene: BaseScene | null;
    readonly x: number;
    readonly y: number;
    getObject(uid: number): BaseSceneObj | null;
    setMovePos(x: number, y: number): void;
    pointTo(x: number, y: number): void;
    turnToDirection(dx: number, dy: number, curTime: number): void;
}

export interface BulletCollisionConfig {
    realtimeCollision: boolean;
    collisionInterval: number;
    repeatCollision: boolean;
    hitInterval: number;
    deduplicateCollision: boolean;
    accumulateHitCount: boolean;
    maxHitCount: number;
    finishOnHit: boolean;
    useTrailCollision: boolean;
    useRangeCollision: boolean;
    sortTrailCollision: boolean;
}

export interface BulletCollisionHost {
    readonly scene: BaseScene | null;
    readonly owner: BaseSceneObj;
    readonly x: number;
    readonly y: number;
    readonly lastX: number;
    readonly lastY: number;
    readonly range: number;
    readonly searchTeam: number;
    canHitTarget(target: BaseSceneObj): boolean;
}
