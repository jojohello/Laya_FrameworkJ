import { ActionContext } from "../action/ActionRuntime";
import { BaseScene } from "../scene/BaseScene";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";

export interface SkillCastContext extends ActionContext {
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
