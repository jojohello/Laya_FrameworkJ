/**
 * 对象类型条件判断
 * 用于碰撞检测时筛选特定类型的对象
 */
import { BaseCondition } from "./BaseCondition";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";

export class ConditionObjType extends BaseCondition {
    private _objType: number;

    /**
     * 构造函数
     * @param objType 需要筛选的对象类型
     */
    constructor(objType: number) {
        super();
        this._objType = objType;
    }

    /**
     * 判断目标是否为指定类型
     * @param caster 发起者
     * @param target 目标对象
     * @returns 是否为指定类型
     */
    public isFit(caster: BaseSceneObj, target: BaseSceneObj): boolean {
        if (!target) {
            return false;
        }
        return target.getObjType() === this._objType;
    }

    /**
     * 设置对象类型
     */
    public setObjType(objType: number): void {
        this._objType = objType;
    }
}
