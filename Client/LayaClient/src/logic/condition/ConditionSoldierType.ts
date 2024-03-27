
import { SceneObjType } from "../sceneObjs/SceneObjType";
import { BaseCondition } from "./BaseCondition";

export class ConditionSoldierType extends BaseCondition{
    private _needType:number;

    public constructor(needType:number){
        super();
        this._needType = needType;
    }

    public isFit(caster:any, target:any):boolean {
        if(target == null)
            return false;
        return this._needType = target.getSoldierType();
    }
}