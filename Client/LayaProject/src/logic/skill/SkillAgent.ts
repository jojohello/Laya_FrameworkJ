import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { ISceneObjModule } from "../sceneObj/ISceneObjModule";
import { SkillMgr } from "./SkillMgr";
import { SkillCastContext } from "./SkillRuntime";
import { BaseAction } from "../action/BaseAction";

interface PendingSkillAction {
    executeTime: number;
    action: BaseAction;
    context: SkillCastContext;
}

export class SkillAgent implements ISceneObjModule {
    private _owner: BaseSceneObj | null = null;
    private readonly _cooldownEndTimeMap: Map<number, number> = new Map();
    private readonly _pendingActions: PendingSkillAction[] = [];

    onAttach(owner: BaseSceneObj): void {
        this._owner = owner;
    }

    onDetach(_owner: BaseSceneObj): void {
        this._owner = null;
    }

    reset(): void {
        this._cooldownEndTimeMap.clear();
        this._pendingActions.length = 0;
    }

    onOwnerFixedUpdate(_owner: BaseSceneObj, _curTime: number): void {
        // Skill CD and action delays are milliseconds; SceneObj fixed time is seconds.
        this.update(this.getDefaultTime());
    }

    onRecycle(): void {
        this.reset();
    }

    onDispose(): void {
        this.reset();
        this._owner = null;
    }

    castSkill(
        skillId: number,
        skillLevel: number,
        targetId: number = 0,
        targetX?: number,
        targetY?: number,
        effectScale: number = 1,
        curTime: number = this.getDefaultTime()
    ): boolean {
        const owner = this._owner;
        if (!owner || !owner.scene || owner.isRelease || owner.isDead) return false;

        const levelInfo = SkillMgr.instance.getSkillLevel(skillId, skillLevel);
        if (!levelInfo || levelInfo.actions.length === 0) return false;
        if (!this.canCast(skillId, curTime)) return false;

        const context: SkillCastContext = {
            scene: owner.scene,
            caster: owner,
            skillId,
            skillLevel,
            targetId,
            targetX: targetX !== undefined ? targetX : owner.x,
            targetY: targetY !== undefined ? targetY : owner.y,
            effectScale,
            curTime,
        };

        this.startCooldown(skillId, Number(levelInfo.data.CD) || 0, curTime);

        for (const action of levelInfo.actions) {
            if (action.delayMs <= 0) {
                this.executeAction(action, context, curTime);
                continue;
            }

            this._pendingActions.push({
                executeTime: curTime + action.delayMs,
                action,
                context: { ...context },
            });
        }

        if (this._pendingActions.length > 1) {
            this._pendingActions.sort((a, b) => a.executeTime - b.executeTime);
        }

        return true;
    }

    canCast(skillId: number, curTime: number = this.getDefaultTime()): boolean {
        const cooldownEndTime = this._cooldownEndTimeMap.get(skillId) || 0;
        return curTime >= cooldownEndTime;
    }

    getCooldownRemain(skillId: number, curTime: number = this.getDefaultTime()): number {
        const cooldownEndTime = this._cooldownEndTimeMap.get(skillId) || 0;
        return Math.max(0, cooldownEndTime - curTime);
    }

    clearPendingActions(): void {
        this._pendingActions.length = 0;
    }

    update(curTime: number): void {
        if (!this._owner || this._owner.isRelease || this._owner.isDead) {
            this._pendingActions.length = 0;
            return;
        }

        while (this._pendingActions.length > 0) {
            const pending = this._pendingActions[0];
            if (pending.executeTime > curTime) return;

            this._pendingActions.shift();
            this.executeAction(pending.action, pending.context, curTime);
        }
    }

    private startCooldown(skillId: number, cdMs: number, curTime: number): void {
        if (cdMs <= 0) {
            this._cooldownEndTimeMap.delete(skillId);
            return;
        }

        this._cooldownEndTimeMap.set(skillId, curTime + cdMs);
    }

    private executeAction(action: BaseAction, context: SkillCastContext, curTime: number): void {
        const owner = this._owner;
        if (!owner || !owner.scene || owner.isRelease || owner.isDead) return;

        action.execute({
            ...context,
            scene: owner.scene,
            caster: owner,
            curTime,
        });
    }

    private getDefaultTime(): number {
        return Laya.timer ? Laya.timer.currTimer : 0;
    }
}
