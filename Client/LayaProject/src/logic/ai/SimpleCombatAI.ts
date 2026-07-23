import { AIAgent, AIRuntime, DEFAULT_AI_THINK_INTERVAL_SECONDS } from "./AIAgent";
import { BActionNode, BConditionNode, BSelectorNode, BSequenceNode } from "../behaviorTree/BehaviorNodes";
import type { CharacterSceneObj } from "../sceneObj/CharacterSceneObj";
import { SkillMgr } from "../skill/SkillMgr";

export const AI_MOVE_STOP_TOLERANCE = 10;

export interface CharacterAIRuntime extends AIRuntime {
    targetUid: number;
    selectedSkillId: number;
    selectedSkillRange: number;
}

function getRuntime(owner: CharacterSceneObj): CharacterAIRuntime {
    let runtime = owner.aiRuntime;
    if (!runtime) {
        runtime = {
            stopped: false,
            nextThinkTime: 0,
            targetUid: 0,
            selectedSkillId: 0,
            selectedSkillRange: 0,
        };
        owner.aiRuntime = runtime;
    }
    runtime.targetUid ||= 0;
    runtime.selectedSkillId ||= 0;
    runtime.selectedSkillRange ||= 0;
    return runtime;
}

function getTarget(owner: CharacterSceneObj) {
    const runtime = getRuntime(owner);
    const target = runtime.targetUid ? owner.scene?.getObject(runtime.targetUid) : null;
    if (!target || target.isRelease || target.isDead
        || target.team === owner.team || target.getObjType() !== owner.getObjType()) {
        runtime.targetUid = 0;
        return null;
    }
    return target;
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
            getRuntime(owner).targetUid = target?.uid || 0;
            return !!target;
        });
    }
}

class SelectReadySkillNode extends BActionNode<CharacterSceneObj> {
    constructor() {
        super((owner, curTime) => {
            const runtime = getRuntime(owner);
            runtime.selectedSkillId = 0;
            runtime.selectedSkillRange = 0;
            for (const skillId of owner.skillIds) {
                const skill = SkillMgr.instance.getSkillLevel(skillId, 1);
                if (!skill || !owner.canCastSkill(skillId, curTime)) continue;
                runtime.selectedSkillId = skillId;
                runtime.selectedSkillRange = Math.max(0, Number(skill.data.CastRange) || 0);
                return true;
            }
            return false;
        });
    }
}

class IsSelectedSkillInRangeNode extends BConditionNode<CharacterSceneObj> {
    constructor() {
        super((owner, curTime) => {
            const target = getTarget(owner);
            if (!target) return false;
            const runtime = getRuntime(owner);
            const dx = target.x - owner.x;
            const dy = target.y - owner.y;
            return dx * dx + dy * dy <= runtime.selectedSkillRange * runtime.selectedSkillRange;
        });
    }
}

class CastSelectedSkillNode extends BActionNode<CharacterSceneObj> {
    constructor() {
        super((owner, curTime) => {
            const target = getTarget(owner);
            const runtime = getRuntime(owner);
            return !!target && runtime.selectedSkillId > 0
                && owner.attack(runtime.selectedSkillId, curTime, target.uid, target.x, target.y, 1);
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

            const runtime = getRuntime(owner);
            let desiredRange = runtime.selectedSkillRange > 0
                ? runtime.selectedSkillRange
                : Number.POSITIVE_INFINITY;
            if (!Number.isFinite(desiredRange)) {
                for (const skillId of owner.skillIds) {
                    const skill = SkillMgr.instance.getSkillLevel(skillId, 1);
                    if (!skill) continue;
                    desiredRange = Math.min(desiredRange, Math.max(0, Number(skill.data.CastRange) || 0));
                }
            }
            if (!Number.isFinite(desiredRange)) return false;
            return owner.runTo(
                target.x,
                target.y,
                curTime,
                Math.max(0, desiredRange - AI_MOVE_STOP_TOLERANCE)
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
            .addChild(fightTarget)
            .addChild(new EnterIdleNode());
    }
}

export const SimpleCombatTree = new SimpleCombatBehaviorNode();
export const SimpleCombatAIAgent = new AIAgent(SimpleCombatTree, DEFAULT_AI_THINK_INTERVAL_SECONDS);
