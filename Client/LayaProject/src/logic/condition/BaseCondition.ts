/**
 * 条件基类
 * 提供碰撞检测的条件筛选机制
 * 
 * 设计原则：
 * - 抽象基类，定义 isFit 方法
 * - 支持组合条件（AND/OR）
 * - 用于筛选碰撞目标
 * 
 * 使用示例：
 * ```typescript
 * // 创建条件组
 * const condition = new AndConditionGroup();
 * condition.add(new ConditionEnemy());
 * condition.add(new ConditionAlive());
 * 
 * // 判断是否满足条件
 * if (condition.isFit(bullet, target)) {
 *     // 碰撞处理
 * }
 * ```
 */
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";

/**
 * 条件抽象基类
 */
export abstract class BaseCondition {
    /**
     * 判断目标是否满足条件
     * @param caster 发起者（如子弹）
     * @param target 目标对象
     * @returns 是否满足条件
     */
    public abstract isFit(caster: BaseSceneObj, target: BaseSceneObj): boolean;
}

/**
 * AND 条件组（所有条件都满足才返回 true）
 */
export class AndConditionGroup extends BaseCondition {
    private _conditions: BaseCondition[] = [];
    private _count: number = 0;

    /**
     * 添加条件
     */
    public add(condition: BaseCondition): void {
        this._conditions.push(condition);
        this._count = this._conditions.length;
    }

    /**
     * 判断是否满足所有条件
     */
    public isFit(caster: BaseSceneObj, target: BaseSceneObj): boolean {
        for (let i = 0; i < this._count; i++) {
            if (!this._conditions[i].isFit(caster, target)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 清空条件
     */
    public clear(): void {
        this._conditions.length = 0;
        this._count = 0;
    }
}

/**
 * OR 条件组（任一条件满足就返回 true）
 */
export class OrConditionGroup extends BaseCondition {
    private _conditions: BaseCondition[] = [];
    private _count: number = 0;

    /**
     * 添加条件
     */
    public add(condition: BaseCondition): void {
        this._conditions.push(condition);
        this._count = this._conditions.length;
    }

    /**
     * 判断是否满足任一条件
     */
    public isFit(caster: BaseSceneObj, target: BaseSceneObj): boolean {
        for (let i = 0; i < this._count; i++) {
            if (this._conditions[i].isFit(caster, target)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 清空条件
     */
    public clear(): void {
        this._conditions.length = 0;
        this._count = 0;
    }
}

/**
 * 条件代理（默认 AND 组合）
 */
export class ConditionAgent extends BaseCondition {
    private _conditions: BaseCondition[] = [];
    private _count: number = 0;

    /**
     * 添加条件
     */
    public addCondition(condition: BaseCondition): void {
        this._conditions.push(condition);
        this._count = this._conditions.length;
    }

    /**
     * 判断是否满足所有条件
     */
    public isFit(caster: BaseSceneObj, target: BaseSceneObj): boolean {
        for (let i = 0; i < this._count; i++) {
            if (!this._conditions[i].isFit(caster, target)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 清空条件
     */
    public clear(): void {
        this._conditions.length = 0;
        this._count = 0;
    }
}
