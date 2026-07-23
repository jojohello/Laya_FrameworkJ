import { MathUtils } from "../utils/MathUtils";
import { BulletMovementHost, BulletMovementResult, BulletMovementStartConfig } from "./BulletPolicyTypes";

export interface IBulletMovementPolicy {
    reset(): void;
    start(host: BulletMovementHost, config: BulletMovementStartConfig, curTime: number): void;
    update(host: BulletMovementHost, curTime: number): BulletMovementResult;
}

export class NullBulletMovementPolicy implements IBulletMovementPolicy {
    reset(): void {
    }

    start(_host: BulletMovementHost, _config: BulletMovementStartConfig, _curTime: number): void {
    }

    update(_host: BulletMovementHost, _curTime: number): BulletMovementResult {
        return { moved: false, finished: false };
    }
}

export class LineBulletMovementPolicy implements IBulletMovementPolicy {
    private _startTime: number = -1;
    private _startX: number = 0;
    private _startY: number = 0;
    private _endX: number = 0;
    private _endY: number = 0;
    private _flyTime: number = 0;

    reset(): void {
        this._startTime = -1;
        this._startX = 0;
        this._startY = 0;
        this._endX = 0;
        this._endY = 0;
        this._flyTime = 0;
    }

    start(host: BulletMovementHost, config: BulletMovementStartConfig, curTime: number): void {
        this._startTime = curTime;
        this._startX = host.x;
        this._startY = host.y;
        this._endX = config.targetX;
        this._endY = config.targetY;

        if (config.flyTime > 0) {
            this._flyTime = config.flyTime;
        } else {
            const distance = MathUtils.distance(host.x, host.y, config.targetX, config.targetY);
            this._flyTime = config.speed > 0 ? distance / config.speed : 0;
        }

        host.pointTo(this._endX, this._endY);
    }

    update(host: BulletMovementHost, curTime: number): BulletMovementResult {
        if (this._flyTime <= 0) {
            return { moved: false, finished: true, doHitAtEnd: true };
        }

        const rate = Math.min((curTime - this._startTime) / this._flyTime, 1);
        host.setMovePos(
            MathUtils.lerp(this._startX, this._endX, rate),
            MathUtils.lerp(this._startY, this._endY, rate)
        );
        return { moved: true, finished: rate >= 1 };
    }
}

export class TraceBulletMovementPolicy implements IBulletMovementPolicy {
    private _targetId: number = 0;
    private _speed: number = 0;
    private _flyTime: number = -1;
    private _startTime: number = -1;
    private _lastUpdateTime: number = -1;
    private _startX: number = 0;
    private _startY: number = 0;

    reset(): void {
        this._targetId = 0;
        this._speed = 0;
        this._flyTime = -1;
        this._startTime = -1;
        this._lastUpdateTime = -1;
        this._startX = 0;
        this._startY = 0;
    }

    start(host: BulletMovementHost, config: BulletMovementStartConfig, curTime: number): void {
        this._targetId = config.targetId || 0;
        this._speed = config.speed;
        this._flyTime = config.flyTime;
        this._startTime = curTime;
        this._lastUpdateTime = curTime;
        this._startX = host.x;
        this._startY = host.y;
    }

    update(host: BulletMovementHost, curTime: number): BulletMovementResult {
        const target = host.getObject(this._targetId);
        if (!target || target.isRelease) {
            return { moved: false, finished: true };
        }

        if (this._flyTime > 0) {
            const rate = Math.min((curTime - this._startTime) / this._flyTime, 1);
            host.setMovePos(
                MathUtils.lerp(this._startX, target.x, rate),
                MathUtils.lerp(this._startY, target.y, rate)
            );
            return { moved: true, finished: rate >= 1, hitTarget: rate >= 1 ? target : null };
        }

        const deltaTime = Math.max(0, curTime - this._lastUpdateTime);
        const distance = this._speed * deltaTime;
        if (distance < 0.5 && deltaTime < 0.1) {
            return { moved: false, finished: false };
        }

        this._lastUpdateTime = curTime;
        const dx = target.x - host.x;
        const dy = target.y - host.y;
        const sqrLen = MathUtils.squareLen(dx, dy);
        if (sqrLen <= distance * distance) {
            host.setMovePos(target.x, target.y);
            return { moved: false, finished: true, hitTarget: target };
        }

        const len = Math.sqrt(sqrLen);
        host.setMovePos(host.x + dx / len * distance, host.y + dy / len * distance);
        host.turnToDirection(dx, dy, curTime);
        return { moved: true, finished: false };
    }
}
