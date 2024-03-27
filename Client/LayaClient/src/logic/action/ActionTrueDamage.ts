import { BaseScene } from "../scene/BaseScene";
import { BaseSceneObj } from "../sceneObjs/BaseSceneObj";
import { BaseAction } from "./BaseAction";

export default class TrueDamageAction extends BaseAction {
    private _damage:number = 0;
    public parseParams(paramList:string[], startIndex:number):number {
        this._damage = parseFloat(paramList[startIndex]);
        startIndex++;
        return startIndex;
    }


    public excute(caster:BaseSceneObj, agent:any, curTime:number): void {
        let target = BaseScene.curInst.getObject(agent.targetId);
        if(target && target.isDead() == false){
            target.getDamage(caster.getCasterId(), this._damage);
        }
    }
}