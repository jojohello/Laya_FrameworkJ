import { MathUtils } from "../utils/MathUtils";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { BulletCollisionConfig, BulletCollisionHost } from "./BulletPolicyTypes";

export interface IBulletCollisionPolicy {
    reset(): void;
    configure(config: Partial<BulletCollisionConfig>): void;
    shouldCheck(host: BulletCollisionHost, curTime: number, moved: boolean): boolean;
    collectHitIds(host: BulletCollisionHost, curTime: number, out: number[]): void;
    recordHit(target: BaseSceneObj, curTime: number): void;
    shouldFinishAfterHit(): boolean;
}

export class DefaultBulletCollisionPolicy implements IBulletCollisionPolicy {
    private _config: BulletCollisionConfig = this.createDefaultConfig();
    private _lastCollisionTime: number = -1;
    private _hitCount: number = 0;
    private readonly _hitIds: Set<number> = new Set();
    private readonly _hitTimeMap: Map<number, number> = new Map();
    private readonly _collisionIds: number[] = [];

    reset(): void {
        this._config = this.createDefaultConfig();
        this._lastCollisionTime = -1;
        this._hitCount = 0;
        this._hitIds.clear();
        this._hitTimeMap.clear();
        this._collisionIds.length = 0;
    }

    configure(config: Partial<BulletCollisionConfig>): void {
        this._config = { ...this._config, ...config };
        this._config.collisionInterval = Math.max(0, this._config.collisionInterval);
        this._config.hitInterval = Math.max(0, this._config.hitInterval);
        this._config.maxHitCount = Math.max(1, this._config.maxHitCount);
    }

    shouldCheck(host: BulletCollisionHost, curTime: number, moved: boolean): boolean {
        if (!host.scene || host.range <= 0) return false;

        if (this._config.collisionInterval > 0) {
            if (this._lastCollisionTime >= 0 && curTime - this._lastCollisionTime < this._config.collisionInterval) {
                return false;
            }
            this._lastCollisionTime = curTime;
            return true;
        }

        return this._config.realtimeCollision && moved;
    }

    collectHitIds(host: BulletCollisionHost, curTime: number, out: number[]): void {
        out.length = 0;
        this._collisionIds.length = 0;

        if (this._config.useTrailCollision) {
            this.collectTrailHits(host);
        } else if (this._config.useRangeCollision) {
            this.collectRangeHits(host);
        }

        for (const uid of this._collisionIds) {
            const target = host.scene ? host.scene.getLiveObject(uid) : null;
            if (!target || !this.canHitByRule(target.uid, curTime)) continue;
            out.push(target.uid);
        }
    }

    recordHit(target: BaseSceneObj, curTime: number): void {
        if (this._config.deduplicateCollision) {
            this._hitIds.add(target.uid);
        }
        if (this._config.repeatCollision) {
            this._hitTimeMap.set(target.uid, curTime);
        }
        if (this._config.accumulateHitCount) {
            this._hitCount++;
        }
    }

    shouldFinishAfterHit(): boolean {
        if (!this._config.finishOnHit || !this._config.accumulateHitCount) return false;
        return this._hitCount >= this._config.maxHitCount;
    }

    private collectTrailHits(host: BulletCollisionHost): void {
        if (!host.scene) return;
        const owner = host.scene.getLiveObject(host.ownerId);
        if (!owner) return;

        host.scene.getTrailCollision(
            owner,
            host.lastX,
            host.lastY,
            host.x,
            host.y,
            host.range,
            (_master, target) => host.canHitTarget(target),
            host.searchTeam,
            this._collisionIds,
            this._config.sortTrailCollision
        );
    }

    private collectRangeHits(host: BulletCollisionHost): void {
        if (!host.scene) return;

        const idsSet = host.scene.getObjInRangeByTeam(host.searchTeam, host.x, host.y, host.range);
        if (!idsSet || idsSet.size === 0) return;

        idsSet.forEach(uid => {
            if (!host.scene || uid === host.ownerId) return;
            const target = host.scene.getLiveObject(uid);
            if (!target || !target.hasCollisionBox || target.range <= 0) return;
            if (!host.canHitTarget(target)) return;

            const hitRange = host.range + target.range;
            if (MathUtils.squareDis(host.x, host.y, target.x, target.y) <= hitRange * hitRange) {
                this._collisionIds.push(uid);
            }
        });
    }

    private canHitByRule(uid: number, curTime: number): boolean {
        if (this._config.repeatCollision) {
            const interval = this._config.hitInterval > 0 ? this._config.hitInterval : this._config.collisionInterval;
            const lastHitTime = this._hitTimeMap.get(uid);
            return interval <= 0 || lastHitTime === undefined || curTime - lastHitTime >= interval;
        }

        return !this._config.deduplicateCollision || !this._hitIds.has(uid);
    }

    private createDefaultConfig(): BulletCollisionConfig {
        return {
            realtimeCollision: true,
            collisionInterval: 0,
            repeatCollision: false,
            hitInterval: 0,
            deduplicateCollision: true,
            accumulateHitCount: true,
            maxHitCount: 1,
            finishOnHit: true,
            useTrailCollision: true,
            useRangeCollision: false,
            sortTrailCollision: true,
        };
    }
}
