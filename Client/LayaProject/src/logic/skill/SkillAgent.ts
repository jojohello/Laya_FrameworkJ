import { BaseAction } from "../action/BaseAction";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { ISceneObjModule } from "../sceneObj/ISceneObjModule";
import { SkillMgr } from "./SkillMgr";
import { SkillCastContext } from "./SkillRuntime";

interface PendingSkillAction {
    executeTime: number;
    action: BaseAction;
    skillId: number;
    skillLevel: number;
    targetId: number;
    targetX: number;
    targetY: number;
    effectScale: number;
}

export class SkillAgent implements ISceneObjModule {
    private readonly _cooldownEndTimeMap: Map<number, number> = new Map();
    private readonly _pendingActions: PendingSkillAction[] = [];

    reset(_owner: BaseSceneObj, _curTime: number): void {
        this._cooldownEndTimeMap.clear();
        this._pendingActions.length = 0;
    }

    onOwnerLogicUpdate(
        owner: BaseSceneObj,
        _logicDt: number,
        curTime: number,
        _tick: number
    ): void {
        this.update(owner, curTime);
    }

    onRecycle(owner: BaseSceneObj, curTime: number): void {
        this.reset(owner, curTime);
    }

    onDispose(owner: BaseSceneObj, curTime: number): void {
        this.reset(owner, curTime);
    }

    castSkill(
        owner: BaseSceneObj,
        skillId: number,
        skillLevel: number,
        curTime: number,
        targetId: number = 0,
        targetX?: number,
        targetY?: number,
        effectScale: number = 1
    ): boolean {
        if (!owner.scene || owner.isRelease || owner.isDead) return false;

        const levelInfo = SkillMgr.instance.getSkillLevel(skillId, skillLevel);
        if (!levelInfo || levelInfo.actions.length === 0) return false;
        if (!this.canCast(skillId, curTime)) return false;

        const resolvedTargetX = targetX !== undefined ? targetX : owner.x;
        const resolvedTargetY = targetY !== undefined ? targetY : owner.y;
        this.startCooldown(skillId, Number(levelInfo.data.CD) || 0, curTime);

        for (const action of levelInfo.actions) {
            const executeTime = curTime + action.delayMs / 1000;
            if (action.delayMs <= 0) {
                this.executeAction(
                    owner,
                    action,
                    skillId,
                    skillLevel,
                    targetId,
                    resolvedTargetX,
                    resolvedTargetY,
                    effectScale,
                    executeTime
                );
                continue;
            }

            this._pendingActions.push({
                executeTime,
                action,
                skillId,
                skillLevel,
                targetId,
                targetX: resolvedTargetX,
                targetY: resolvedTargetY,
                effectScale,
            });
        }

        if (this._pendingActions.length > 1) {
            this._pendingActions.sort((a, b) => a.executeTime - b.executeTime);
        }

        return true;
    }

    canCast(skillId: number, curTime: number): boolean {
        const cooldownEndTime = this._cooldownEndTimeMap.get(skillId) || 0;
        return curTime >= cooldownEndTime;
    }

    getCooldownRemain(skillId: number, curTime: number): number {
        const cooldownEndTime = this._cooldownEndTimeMap.get(skillId) || 0;
        return Math.max(0, cooldownEndTime - curTime) * 1000;
    }

    clearPendingActions(): void {
        this._pendingActions.length = 0;
    }

    update(owner: BaseSceneObj, curTime: number): void {
        if (owner.isRelease || owner.isDead || !owner.scene) {
            this._pendingActions.length = 0;
            return;
        }

        while (this._pendingActions.length > 0) {
            const pending = this._pendingActions[0];
            if (pending.executeTime > curTime) return;

            this._pendingActions.shift();
            this.executeAction(
                owner,
                pending.action,
                pending.skillId,
                pending.skillLevel,
                pending.targetId,
                pending.targetX,
                pending.targetY,
                pending.effectScale,
                pending.executeTime
            );
        }
    }

    private startCooldown(skillId: number, cdMs: number, curTime: number): void {
        if (cdMs <= 0) {
            this._cooldownEndTimeMap.delete(skillId);
            return;
        }

        this._cooldownEndTimeMap.set(skillId, curTime + cdMs / 1000);
    }

    private executeAction(
        owner: BaseSceneObj,
        action: BaseAction,
        skillId: number,
        skillLevel: number,
        targetId: number,
        targetX: number,
        targetY: number,
        effectScale: number,
        executeTime: number
    ): void {
        const scene = owner.scene;
        if (!scene || owner.isRelease || owner.isDead) return;

        const context: SkillCastContext = {
            scene,
            casterId: owner.getCasterId(),
            skillId,
            skillLevel,
            targetId,
            targetX,
            targetY,
            effectScale,
            curTime: executeTime,
        };
        action.execute(context);
    }
}
