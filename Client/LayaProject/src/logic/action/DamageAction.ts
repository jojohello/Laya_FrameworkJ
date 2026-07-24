import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { SkillMgr } from "../skill/SkillMgr";
import { DamageExecutor } from "../damage/DamageExecutor";
import { ActionContext } from "./ActionRuntime";
import { ActionType } from "./ActionInfo";
import { registerAction } from "./ActionRegistry";
import { BaseAction } from "./BaseAction";

export class DamageAction extends BaseAction {
    execute(context: ActionContext): number {
        const damageId = this.info.getNumberParam(0);
        if (!damageId || !context.targetId) return 0;

        const damageInfo = SkillMgr.instance.getDamage(damageId);
        if (!damageInfo) return 0;
        const caster = context.scene.getLiveObject(context.casterId);
        const target = context.scene.getLiveObject(context.targetId);
        if (!caster || !target || target.isDead) return 0;

        const data = damageInfo.data;
        DamageExecutor.apply({
            casterId: context.casterId,
            target,
            damage: this.calculateDamage(
                caster,
                target,
                data.BaseDamage,
                data.AttackRate,
                context.effectScale || 1
            ),
            sourceType: "damage",
            sourceId: damageId,
            curTime: context.executeTime,
        });
        return 0;
    }

    private calculateDamage(
        caster: BaseSceneObj,
        _target: BaseSceneObj,
        baseDamage: number,
        attackRate: number,
        effectScale: number
    ): number {
        const creature = caster as any;
        const attrs = creature.attrs;
        const attack = attrs && typeof attrs.get === "function" ? Number(attrs.get("attack", 0)) : 0;
        const damage = (Number(baseDamage) || 0) + attack * (Number(attackRate) || 0);
        return Math.max(0, Math.ceil(damage * effectScale));
    }
}

registerAction(
    [ActionType.Damage, ActionType.TrueDamage, ActionType.Effect],
    DamageAction
);
