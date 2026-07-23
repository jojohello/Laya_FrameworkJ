import { BaseAction } from "../action/BaseAction";
import type { CreatureSceneObj } from "../sceneObj/CreatureSceneObj";
import { DamageContext } from "../damage/DamageContext";
import { BuffInfo, BuffStackType } from "../skill/SkillInfo";
export class BuffRuntime {
    private _buffInfo: BuffInfo;
    private _casterId: number;
    private _stack: number;
    private _expireTime: number;
    private _nextTickTime: number = -1;
    private _appliedAddScale: number = 0;
    private _appliedPercentScale: number = 0;
    private _durationOverrideMs = 0;
    private _disposed = false;

    constructor(
        buffInfo: BuffInfo,
        casterId: number,
        target: CreatureSceneObj,
        stack: number,
        curTime: number,
        durationOverrideMs: number = 0
    ) {
        this._buffInfo = buffInfo;
        this._casterId = casterId;
        this._stack = Math.max(1, Math.min(buffInfo.maxStack, stack));
        this._durationOverrideMs = Math.max(0, durationOverrideMs);
        this._expireTime = this.calcExpireTime(curTime);
        this._nextTickTime = buffInfo.tickIntervalMs > 0 ? curTime + buffInfo.tickIntervalMs / 1000 : -1;
        this.applyAttrModifiers(target);
        this.executeActions(target, this._buffInfo.onAddActions, curTime);
    }

    get buffId(): number {
        return this._buffInfo.data.ID;
    }

    refresh(casterId: number, target: CreatureSceneObj, stack: number, curTime: number): void {
        if (this._disposed) return;
        this._casterId = casterId;
        const addStack = Math.max(1, stack);

        if (this._buffInfo.stackType === BuffStackType.Stack) {
            this.setStack(target, Math.min(this._buffInfo.maxStack, this._stack + addStack));
        } else if (this._buffInfo.stackType === BuffStackType.Replace) {
            this.setStack(target, Math.min(this._buffInfo.maxStack, addStack));
        }

        this._expireTime = this.calcExpireTime(curTime);
        if (this._nextTickTime < 0 && this._buffInfo.tickIntervalMs > 0) {
            this._nextTickTime = curTime + this._buffInfo.tickIntervalMs / 1000;
        }
    }

    update(target: CreatureSceneObj, curTime: number): boolean {
        if (this._disposed || target.isRelease || target.isDead || !this.resolveCaster(target)) {
            return false;
        }

        if (this._nextTickTime > 0) {
            while (this._nextTickTime > 0 && this._nextTickTime <= curTime) {
                if (this._buffInfo.onTickActions.length > 0) {
                    this.executeActions(target, this._buffInfo.onTickActions, this._nextTickTime);
                }
                this._nextTickTime += this._buffInfo.tickIntervalMs / 1000;
            }
        }

        return this._expireTime <= 0 || curTime < this._expireTime;
    }

    dispose(target: CreatureSceneObj, curTime: number): void {
        if (this._disposed) return;
        this._disposed = true;
        this.executeActions(target, this._buffInfo.onRemoveActions, curTime);
        this.removeAttrModifiers(target);
    }

    onBeforeDamage(_context: DamageContext): void {
    }

    onAfterDamage(_context: DamageContext): void {
    }

    onBeforeBeDamaged(_context: DamageContext): void {
    }

    onAfterBeDamaged(_context: DamageContext): void {
    }

    private setStack(target: CreatureSceneObj, stack: number): void {
        if (this._stack === stack) return;
        this.removeAttrModifiers(target);
        this._stack = stack;
        this.applyAttrModifiers(target);
    }

    private applyAttrModifiers(target: CreatureSceneObj): void {
        this._appliedAddScale = this._stack;
        this._appliedPercentScale = this._stack;

        for (const modifier of this._buffInfo.attrAdds) {
            target.attrs.addAdd(modifier.attr, modifier.value * this._appliedAddScale);
        }

        for (const modifier of this._buffInfo.attrPercents) {
            target.attrs.addPercent(modifier.attr, modifier.value * this._appliedPercentScale);
        }
    }

    private removeAttrModifiers(target: CreatureSceneObj): void {
        if (this._appliedAddScale <= 0 && this._appliedPercentScale <= 0) return;

        for (const modifier of this._buffInfo.attrAdds) {
            target.attrs.addAdd(modifier.attr, -modifier.value * this._appliedAddScale);
        }

        for (const modifier of this._buffInfo.attrPercents) {
            target.attrs.addPercent(modifier.attr, -modifier.value * this._appliedPercentScale);
        }

        this._appliedAddScale = 0;
        this._appliedPercentScale = 0;
    }

    private calcExpireTime(curTime: number): number {
        const durationMs = this._durationOverrideMs > 0
            ? this._durationOverrideMs
            : this._buffInfo.durationMs;
        return durationMs > 0 ? curTime + durationMs / 1000 : 0;
    }

    private executeActions(
        target: CreatureSceneObj,
        actions: readonly BaseAction[],
        curTime: number
    ): void {
        const scene = target.scene;
        if (!scene || !this.resolveCaster(target) || actions.length === 0) return;

        for (const action of actions) {
            action.execute({
                scene,
                casterId: this._casterId,
                targetId: target.uid,
                targetX: target.x,
                targetY: target.y,
                effectScale: this._stack,
                curTime,
            });
        }
    }

    private resolveCaster(target: CreatureSceneObj) {
        return target.scene?.getLiveObject(this._casterId) || null;
    }
}
