import { ActionContext } from "./ActionRuntime";
import { BaseAction } from "./BaseAction";

interface ActionAnimationOwner {
    playActionAnimation(name: string, startTime: number, curTime: number): number;
}

/** Plays a config-selected caster animation and reports its planned duration. */
export class AnimationAction extends BaseAction {
    execute(context: ActionContext): number {
        const actionName = this.info.getStringParam(0).trim();
        if (!actionName) return 0;

        const caster = context.scene.getLiveObject(context.casterId) as unknown as Partial<ActionAnimationOwner> | null;
        if (!caster || typeof caster.playActionAnimation !== "function") return 0;

        return Math.max(
            0,
            caster.playActionAnimation(actionName, context.executeTime, context.curTime)
        );
    }
}
