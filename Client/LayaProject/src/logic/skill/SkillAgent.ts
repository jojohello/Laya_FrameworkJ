import { BaseAction } from "../action/BaseAction";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { ISceneObjModule } from "../sceneObj/ISceneObjModule";
import { SkillMgr } from "./SkillMgr";
import { SkillCastContext } from "./SkillRuntime";

interface PendingSkillAction {
    castId: number;
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
    private _nextCastId = 0;
    private _activeCastId = 0;
    private _activeSkillId = 0;
    private _activeSkillEndTime = 0;

    reset(_owner: BaseSceneObj, _curTime: number): void {
        this._cooldownEndTimeMap.clear();
        this._pendingActions.length = 0;
        this._nextCastId = 0;
        this._activeCastId = 0;
        this._activeSkillId = 0;
        this._activeSkillEndTime = 0;
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
        this.startCooldown(skillId, levelInfo.cooldownSeconds, curTime);
        const castId = ++this._nextCastId;
        this._activeCastId = castId;
        this._activeSkillId = skillId;
        this._activeSkillEndTime = curTime;

        for (const action of levelInfo.actions) {
            const executeTime = curTime + action.delaySeconds;
            this._activeSkillEndTime = Math.max(this._activeSkillEndTime, executeTime);
            if (action.delaySeconds <= 0) {
                const duration = this.executeAction(
                    owner,
                    action,
                    skillId,
                    skillLevel,
                    targetId,
                    resolvedTargetX,
                    resolvedTargetY,
                    effectScale,
                    executeTime,
                    curTime
                );
                this.extendActiveSkillEndTime(castId, executeTime, duration);
                continue;
            }

            this._pendingActions.push({
                castId,
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
        if (this._activeCastId !== 0) return false;
        const cooldownEndTime = this._cooldownEndTimeMap.get(skillId) || 0;
        return curTime >= cooldownEndTime;
    }

    getCooldownRemainSeconds(skillId: number, curTime: number): number {
        const cooldownEndTime = this._cooldownEndTimeMap.get(skillId) || 0;
        return Math.max(0, cooldownEndTime - curTime);
    }

    clearPendingActions(): void {
        this._pendingActions.length = 0;
        this._activeCastId = 0;
        this._activeSkillId = 0;
        this._activeSkillEndTime = 0;
    }

    isExecuting(): boolean {
        return this._activeCastId !== 0;
    }

    update(owner: BaseSceneObj, curTime: number): void {
        if (owner.isRelease || owner.isDead || !owner.scene) {
            this.clearPendingActions();
            return;
        }

        while (this._pendingActions.length > 0) {
            const pending = this._pendingActions[0];
            if (pending.executeTime > curTime) break;

            this._pendingActions.shift();
            const duration = this.executeAction(
                owner,
                pending.action,
                pending.skillId,
                pending.skillLevel,
                pending.targetId,
                pending.targetX,
                pending.targetY,
                pending.effectScale,
                pending.executeTime,
                curTime
            );
            this.extendActiveSkillEndTime(pending.castId, pending.executeTime, duration);
        }

        if (this._activeCastId !== 0 && curTime >= this._activeSkillEndTime) {
            this.finishActiveSkill(owner, curTime);
        }
    }

    private startCooldown(skillId: number, cooldownSeconds: number, curTime: number): void {
        if (cooldownSeconds <= 0) {
            this._cooldownEndTimeMap.delete(skillId);
            return;
        }

        this._cooldownEndTimeMap.set(skillId, curTime + cooldownSeconds);
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
        executeTime: number,
        curTime: number
    ): number {
        const scene = owner.scene;
        if (!scene || owner.isRelease || owner.isDead) return 0;

        const context: SkillCastContext = {
            scene,
            casterId: owner.getCasterId(),
            skillId,
            skillLevel,
            targetId,
            targetX,
            targetY,
            effectScale,
            curTime,
            executeTime,
        };
        return Math.max(0, action.execute(context));
    }

    private extendActiveSkillEndTime(castId: number, executeTime: number, duration: number): void {
        if (castId !== this._activeCastId || duration <= 0) return;
        this._activeSkillEndTime = Math.max(this._activeSkillEndTime, executeTime + duration);
    }

    private finishActiveSkill(owner: BaseSceneObj, curTime: number): void {
        const skillId = this._activeSkillId;
        this._activeCastId = 0;
        this._activeSkillId = 0;
        this._activeSkillEndTime = 0;

        const skillOwner = owner as BaseSceneObj & {
            finishSkillExecution?: (finishedSkillId: number, finishTime: number) => void;
        };
        skillOwner.finishSkillExecution?.(skillId, curTime);
    }
}
