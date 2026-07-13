import { BaseScene } from "../scene/BaseScene";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";

export interface ActionContext {
    scene: BaseScene;
    caster: BaseSceneObj;
    skillId?: number;
    skillLevel?: number;
    targetId?: number;
    targetX?: number;
    targetY?: number;
    effectScale?: number;
    curTime: number;
}
