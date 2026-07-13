import { ActionContext } from "./ActionRuntime";
import { BaseAction } from "./BaseAction";

export class BuffAction extends BaseAction {
    execute(context: ActionContext): void {
        const buffId = this.info.getNumberParam(0);
        if (!buffId || !context.targetId) return;

        const target = context.scene.getObject(context.targetId) as any;
        if (!target || target.isRelease || target.isDead || typeof target.addBuff !== "function") return;

        const stack = Math.max(1, this.info.getNumberParam(1, 1));
        const durationOverride = Math.max(0, this.info.getNumberParam(2, 0));

        target.addBuff(
            buffId,
            context.caster,
            stack,
            durationOverride,
            context.curTime
        );
    }
}
