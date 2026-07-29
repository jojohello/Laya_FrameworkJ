import { ActionContext } from "./ActionRuntime";
import { ActionType } from "./ActionInfo";
import { registerAction } from "./ActionRegistry";
import { BaseAction } from "./BaseAction";

/** Applies a fixed immediate heal; Buff tick cadence remains owned by BuffRuntime. */
export class HealAction extends BaseAction {
    execute(context: ActionContext): number {
        const amount = Math.max(0, this.info.getNumberParam(0));
        if (amount <= 0) {
            console.error(`[HealAction] invalid heal amount: raw=${this.info.raw}`);
            return 0;
        }
        if (!context.targetId) return 0;

        const target = context.scene.getLiveObject(context.targetId) as {
            isDead: boolean;
            heal?: (value: number, curTime: number) => number;
        } | null;
        if (!target || target.isDead) return 0;
        if (typeof target.heal !== "function") {
            console.error(`[HealAction] heal target does not support recovery: targetId=${context.targetId}`);
            return 0;
        }
        const actualHeal = target.heal(amount * Math.max(0, context.effectScale || 0), context.executeTime);
        return 0;
    }
}

registerAction(ActionType.Heal, HealAction);
