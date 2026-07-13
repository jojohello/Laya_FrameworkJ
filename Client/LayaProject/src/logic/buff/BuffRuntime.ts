import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { BaseAction } from "../action/BaseAction";
import type { CreatureSceneObj } from "../sceneObj/CreatureSceneObj";
import { DamageContext } from "../damage/DamageContext";
import { BuffInfo, BuffStackType } from "../skill/SkillInfo";
export class BuffRuntime {
    private _buffInfo: BuffInfo;
    private _caster: BaseSceneObj;
    private _target: CreatureSceneObj;
    private _stack: number;
    private _expireTime: number;
    private _nextTickTime: number = -1;
    private _appliedAddScale: number = 0;
    private _appliedPercentScale: number = 0;
    private _durationOverride: number = 0;

    constructor(
        buffInfo: BuffInfo,
        caster: BaseSceneObj,
        target: CreatureSceneObj,
        stack: number,
        curTime: number,
        durationOverride: number = 0
    ) {
        this._buffInfo = buffInfo;
        this._caster = caster;
        this._target = target;
        this._stack = Math.max(1, Math.min(buffInfo.maxStack, stack));
        this._durationOverride = Math.max(0, durationOverride);
        this._expireTime = this.calcExpireTime(curTime);
        this._nextTickTime = buffInfo.tickIntervalMs > 0 ? curTime + buffInfo.tickIntervalMs : -1;
        this.applyAttrModifiers();
        this.executeActions(this._buffInfo.onAddActions, curTime);
    }

    get buffId(): number {
        return this._buffInfo.data.ID;
    }

    get isExpired(): boolean {
        return this._target.isRelease || this._target.isDead;
    }

    refresh(caster: BaseSceneObj, stack: number, curTime: number): void {
        this._caster = caster;
        const addStack = Math.max(1, stack);

        if (this._buffInfo.stackType === BuffStackType.Stack) {
            this.setStack(Math.min(this._buffInfo.maxStack, this._stack + addStack));
        } else if (this._buffInfo.stackType === BuffStackType.Replace) {
            this.setStack(Math.min(this._buffInfo.maxStack, addStack));
        }

        this._expireTime = this.calcExpireTime(curTime);
        if (this._nextTickTime < 0 && this._buffInfo.tickIntervalMs > 0) {
            this._nextTickTime = curTime + this._buffInfo.tickIntervalMs;
        }
    }

    update(curTime: number): boolean {
        if (this.isExpired) return false;

        if (this._nextTickTime > 0) {
            while (this._nextTickTime > 0 && this._nextTickTime <= curTime) {
                if (this._buffInfo.onTickActions.length > 0) {
                    this.executeActions(this._buffInfo.onTickActions, this._nextTickTime);
                }
                this._nextTickTime += this._buffInfo.tickIntervalMs;
            }
        }

        return this._expireTime <= 0 || curTime < this._expireTime;
    }

    dispose(curTime: number = this.getDefaultTime()): void {
        this.executeActions(this._buffInfo.onRemoveActions, curTime);
        this.removeAttrModifiers();
    }

    onBeforeDamage(_context: DamageContext): void {
    }

    onAfterDamage(_context: DamageContext): void {
    }

    onBeforeBeDamaged(_context: DamageContext): void {
    }

    onAfterBeDamaged(_context: DamageContext): void {
    }

    private setStack(stack: number): void {
        if (this._stack === stack) return;
        this.removeAttrModifiers();
        this._stack = stack;
        this.applyAttrModifiers();
    }

    private applyAttrModifiers(): void {
        this._appliedAddScale = this._stack;
        this._appliedPercentScale = this._stack;

        for (const modifier of this._buffInfo.attrAdds) {
            this._target.attrs.addAdd(modifier.attr, modifier.value * this._appliedAddScale);
        }

        for (const modifier of this._buffInfo.attrPercents) {
            this._target.attrs.addPercent(modifier.attr, modifier.value * this._appliedPercentScale);
        }
    }

    private removeAttrModifiers(): void {
        if (this._appliedAddScale <= 0 && this._appliedPercentScale <= 0) return;

        for (const modifier of this._buffInfo.attrAdds) {
            this._target.attrs.addAdd(modifier.attr, -modifier.value * this._appliedAddScale);
        }

        for (const modifier of this._buffInfo.attrPercents) {
            this._target.attrs.addPercent(modifier.attr, -modifier.value * this._appliedPercentScale);
        }

        this._appliedAddScale = 0;
        this._appliedPercentScale = 0;
    }

    private calcExpireTime(curTime: number): number {
        const duration = this._durationOverride > 0 ? this._durationOverride : this._buffInfo.durationMs;
        return duration > 0 ? curTime + duration : 0;
    }

    private executeActions(actions: readonly BaseAction[], curTime: number): void {
        const scene = this._target.scene;
        if (!scene || actions.length === 0) return;

        for (const action of actions) {
            action.execute({
                scene,
                caster: this._caster,
                targetId: this._target.uid,
                targetX: this._target.x,
                targetY: this._target.y,
                effectScale: this._stack,
                curTime,
            });
        }
    }

    private getDefaultTime(): number {
        return Laya.timer ? Laya.timer.currTimer : 0;
    }
}
