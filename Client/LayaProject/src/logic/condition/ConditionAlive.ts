/**
 * 存活条件判断
 * 用于碰撞检测时筛选存活对象
 */
import { BaseCondition } from "./BaseCondition";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";

export class ConditionAlive extends BaseCondition {
    /**
     * 判断目标是否存活
     * @param caster 发起者
     * @param target 目标对象
     * @returns 是否存活
     */
    public isFit(caster: BaseSceneObj, target: BaseSceneObj): boolean {
        if (!target) {
            return false;
        }
        return !target.isDead && !target.isRelease;
    }
}
