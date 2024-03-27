import { BaseCondition } from "./BaseCondition";

export class ConditionAlive extends BaseCondition{
    public isFit(caster:any, target:any):boolean {
        if(target == null)
            return false;

        if(target["isDead"] == null)
            return false;

        return target.isDead() == false;
    }
}