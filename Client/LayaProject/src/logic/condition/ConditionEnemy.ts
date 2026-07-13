/**
 * 敌方条件判断
 * 用于碰撞检测时筛选敌方对象
 */
import { BaseCondition } from "./BaseCondition";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";

export class ConditionEnemy extends BaseCondition {
    /**
     * 判断目标是否为敌方
     * @param caster 发起者
     * @param target 目标对象
     * @returns 是否为敌方（队伍不同）
     */
    public isFit(caster: BaseSceneObj, target: BaseSceneObj): boolean {
        if (!target) {
            return false;
        }
        // 队伍不同即为敌方
        return caster.team !== target.team;
    }
}
