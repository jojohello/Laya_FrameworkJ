import { AIAgent, DEFAULT_AI_THINK_INTERVAL_SECONDS } from "./AIAgent";
import { BActionNode, BConditionNode, BSelectorNode, BSequenceNode } from "../behaviorTree/BehaviorNodes";
import type { CharacterSceneObj } from "../sceneObj/CharacterSceneObj";
import { SkillMgr } from "../skill/SkillMgr";
import {
    getTargetCenterMoveStopRange,
    isTargetInCastRange,
    SkillTargetType,
} from "../skill/SkillInfo";

export const AI_ATTACK_ARRIVAL_INSET = 5;

function getTarget(owner: CharacterSceneObj) {
    const target = owner.aiTargetUid ? owner.scene?.getLiveObject(owner.aiTargetUid) : null;
    if (!target || target.isDead
        || target.team === owner.team || target.getObjType() !== owner.getObjType()) {
        owner.aiTargetUid = 0;
        return null;
    }
    return target;
}

function getSelectedTarget(owner: CharacterSceneObj) {
    const targetUid = owner.aiSelectedTargetUid;
    return targetUid ? owner.scene?.getLiveObject(targetUid) || null : null;
}

export class IsRunningNode extends BConditionNode<CharacterSceneObj> {
    constructor() { super(owner => owner.isRunning); }
}

export class HasReachedTargetNode extends BConditionNode<CharacterSceneObj> {
    constructor() { super(owner => owner.hasReachedRunTarget()); }
}

export class IsExecutingSkillNode extends BConditionNode<CharacterSceneObj> {
    constructor() { super(owner => owner.isExecutingSkill); }
}

export class IsIdleNode extends BConditionNode<CharacterSceneObj> {
    constructor() { super(owner => owner.isIdle); }
}

class EnsureNearestTargetNode extends BActionNode<CharacterSceneObj> {
    constructor() {
        super((owner, curTime) => {
            if (getTarget(owner)) return true;
            const target = owner.scene?.findNearestEnemy(owner) || null;
            owner.aiTargetUid = target?.uid || 0;
            return !!target;
        });
    }
}

/** Priest-only priority branch: heal a nearby injured ally before choosing an enemy action. */
class TryPriestSupportNode extends BActionNode<CharacterSceneObj> {
    constructor() {
        super((owner, curTime) => {
            if (owner.soldierType !== "priest" || !owner.scene) return false;

            for (const skillId of owner.skillIds) {
                const skill = SkillMgr.instance.getSkillLevel(skillId, 1);
                if (!skill || skill.data.TargetType !== SkillTargetType.Ally || !owner.canCastSkill(skillId, curTime)) {
                    continue;
                }
                const target = owner.scene.findNearestDamagedAlly(owner);
                if (!target) return false;

                const range = Math.max(0, Number(skill.data.CastRange) || 0);
                if (isTargetInCastRange(
                    owner.x,
                    owner.y,
                    target.x,
                    target.y,
                    range,
                    target.range
                )) {
                    return owner.attack(skillId, curTime, target.uid, target.x, target.y, 1);
                }
                const stopDistance = getTargetCenterMoveStopRange(
                    range,
                    target.range,
                    AI_ATTACK_ARRIVAL_INSET
                );
                return owner.runTo(
                    target.x,
                    target.y,
                    curTime,
                    stopDistance
                );
            }
            return false;
        });
    }
}

class SelectReadySkillNode extends BActionNode<CharacterSceneObj> {
    constructor() {
        super((owner, curTime) => {
            owner.aiSelectedSkillId = 0;
            owner.aiSelectedSkillRange = 0;
            owner.aiSelectedTargetUid = 0;
            for (const skillId of owner.skillIds) {
                const skill = SkillMgr.instance.getSkillLevel(skillId, 1);
                if (!skill || !owner.canCastSkill(skillId, curTime)) continue;
                const target = skill.data.TargetType === SkillTargetType.Ally
                    ? owner.scene?.findNearestDamagedAlly(owner) || null
                    : getTarget(owner) || owner.scene?.findNearestEnemy(owner) || null;
                if (!target) continue;
                owner.aiSelectedSkillId = skillId;
                owner.aiSelectedSkillRange = Math.max(0, Number(skill.data.CastRange) || 0);
                owner.aiSelectedTargetUid = target.uid;
                return true;
            }
            return false;
        });
    }
}

class IsSelectedSkillInRangeNode extends BConditionNode<CharacterSceneObj> {
    constructor() {
        super((owner, curTime) => {
            const target = getSelectedTarget(owner);
            if (!target) return false;
            return isTargetInCastRange(
                owner.x,
                owner.y,
                target.x,
                target.y,
                owner.aiSelectedSkillRange,
                target.range
            );
        });
    }
}

class CastSelectedSkillNode extends BActionNode<CharacterSceneObj> {
    constructor() {
        super((owner, curTime) => {
            const target = getSelectedTarget(owner);
            return !!target && owner.aiSelectedSkillId > 0
                && owner.attack(owner.aiSelectedSkillId, curTime, target.uid, target.x, target.y, 1);
        });
    }
}

/** Reusable composite: select the first ready skill, validate range, then cast it. */
export class TryUseSkillNode extends BSequenceNode<CharacterSceneObj> {
    constructor() {
        super();
        this.addChild(new SelectReadySkillNode())
            .addChild(new IsSelectedSkillInRangeNode())
            .addChild(new CastSelectedSkillNode());
    }
}

class ApproachTargetNode extends BActionNode<CharacterSceneObj> {
    constructor() {
        super((owner, curTime) => {
            const target = getTarget(owner);
            if (!target) return false;

            let desiredRange = owner.aiSelectedSkillRange > 0
                ? owner.aiSelectedSkillRange
                : Number.POSITIVE_INFINITY;
            if (!Number.isFinite(desiredRange)) {
                for (const skillId of owner.skillIds) {
                    const skill = SkillMgr.instance.getSkillLevel(skillId, 1);
                    if (!skill) continue;
                    desiredRange = Math.min(desiredRange, Math.max(0, Number(skill.data.CastRange) || 0));
                }
            }
            if (!Number.isFinite(desiredRange)) return false;
            const stopDistance = getTargetCenterMoveStopRange(
                desiredRange,
                target.range,
                AI_ATTACK_ARRIVAL_INSET
            );
            return owner.runTo(
                target.x,
                target.y,
                curTime,
                stopDistance
            );
        });
    }
}

class EnterIdleNode extends BActionNode<CharacterSceneObj> {
    constructor() {
        super((owner, curTime) => {
            owner.changeState("Idle", curTime);
            return true;
        });
    }
}

/** One shared stateless tree for every character using the simple combat behavior. */
export class SimpleCombatBehaviorNode extends BSelectorNode<CharacterSceneObj> {
    constructor() {
        super();

        const fightTarget = new BSequenceNode<CharacterSceneObj>();
        const actOnTarget = new BSelectorNode<CharacterSceneObj>();
        actOnTarget.addChild(new TryUseSkillNode()).addChild(new ApproachTargetNode());
        fightTarget.addChild(new EnsureNearestTargetNode()).addChild(actOnTarget);

        this.addChild(new IsExecutingSkillNode())
            .addChild(new TryPriestSupportNode())
            .addChild(fightTarget)
            .addChild(new EnterIdleNode());
    }
}

export const SimpleCombatTree = new SimpleCombatBehaviorNode();
export const SimpleCombatAIAgent = new AIAgent(SimpleCombatTree, DEFAULT_AI_THINK_INTERVAL_SECONDS);
