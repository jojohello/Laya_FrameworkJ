import { BaseCondition } from "./BaseCondition";

export class ConditionEnemy extends BaseCondition{
    public isFit(caster:any, target:any):boolean {
        if(target == null)
            return false;
        return caster.team != target.team
    }
}