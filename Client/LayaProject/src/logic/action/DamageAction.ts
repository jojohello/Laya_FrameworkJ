import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { SkillMgr } from "../skill/SkillMgr";
import { DamageExecutor } from "../damage/DamageExecutor";
import {
    DamageType,
    isSupportedDamageFormula,
    normalizeDamageType,
} from "../damage/DamageType";
import { ActionContext } from "./ActionRuntime";
import { ActionType } from "./ActionInfo";
import { registerAction } from "./ActionRegistry";
import { BaseAction } from "./BaseAction";

export class DamageAction extends BaseAction {
    execute(context: ActionContext): number {
        const damageId = this.info.getNumberParam(0);
        if (!damageId || !context.targetId) return 0;
        const hitEffectId = this.info.params.length > 1
            ? Math.max(0, Math.floor(this.info.getNumberParam(1)))
            : undefined;

        const damageInfo = SkillMgr.instance.getDamage(damageId);
        if (!damageInfo) return 0;
        const caster = context.scene.getLiveObject(context.casterId);
        const target = context.scene.getLiveObject(context.targetId);
        if (!caster || !target || target.isDead) return 0;

        const data = damageInfo.data;
        if (!isSupportedDamageFormula(Number(data.FormulaID))) {
            console.error(`[DamageAction] unsupported FormulaID: ${data.FormulaID}, damageId: ${damageId}`);
            return 0;
        }
        DamageExecutor.apply({
            casterId: context.casterId,
            target,
            damage: this.calculateDamage(
                caster,
                data.BaseDamage,
                data.AttackRate,
                context.effectScale || 1
            ),
            damageType: this.info.actionType === ActionType.TrueDamage
                ? DamageType.True
                : normalizeDamageType(data.DamageType),
            elementType: data.ElementType,
            sourceType: "damage",
            sourceId: damageId,
            hitEffectId,
            curTime: context.executeTime,
        });
        return 0;
    }

    private calculateDamage(
        caster: BaseSceneObj,
        baseDamage: number,
        attackRate: number,
        effectScale: number
    ): number {
        const creature = caster as any;
        const attrs = creature.attrs;
        const attack = attrs && typeof attrs.get === "function" ? Number(attrs.get("attack", 0)) : 0;
        const damage = (Number(baseDamage) || 0) + attack * (Number(attackRate) || 0) / 100;
        return Math.max(0, damage * Math.max(0, Number(effectScale) || 0));
    }
}

registerAction(
    [ActionType.Damage, ActionType.TrueDamage, ActionType.Effect],
    DamageAction
);
