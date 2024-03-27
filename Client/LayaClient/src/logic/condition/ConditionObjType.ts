
import { SceneObjType } from "../sceneObjs/SceneObjType";
import { BaseCondition } from "./BaseCondition";

export class ConditionObjType extends BaseCondition{
    private _needType:number;
    private _count:number = 0;

    public constructor(needType){
        super();
        this._needType = needType;
    }

    public isFit(caster:any, target:any):boolean {
        if(target == null)
            return false;
            
        return this._needType == target.getObjType();
    }
}