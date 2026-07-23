import { BaseScene } from "../scene/BaseScene";

export interface ActionContext {
    scene: BaseScene;
    casterId: number;
    skillId?: number;
    skillLevel?: number;
    targetId?: number;
    targetX?: number;
    targetY?: number;
    effectScale?: number;
    /** Current unified scene logic time. */
    curTime: number;
    /** The action's configured trigger time on the same scene clock. */
    executeTime: number;
}
