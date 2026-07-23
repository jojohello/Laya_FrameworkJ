import { ActionContext } from "./ActionRuntime";
import { BaseAction } from "./BaseAction";

export class BuffAction extends BaseAction {
    execute(context: ActionContext): number {
        const buffId = this.info.getNumberParam(0);
        if (!buffId || !context.targetId) return 0;

        const target = context.scene.getLiveObject(context.targetId) as any;
        if (!target || target.isDead || typeof target.addBuff !== "function") return 0;

        const stack = Math.max(1, this.info.getNumberParam(1, 1));
        const durationOverrideMs = Math.max(0, this.info.getNumberParam(2, 0));

        target.addBuff(
            buffId,
            context.casterId,
            context.executeTime,
            stack,
            durationOverrideMs
        );
        return 0;
    }
}
