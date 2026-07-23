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
    curTime: number;
}
