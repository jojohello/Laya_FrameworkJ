import { BaseSceneObj } from "../sceneObjs/BaseSceneObj";
import { BaseAction } from "./BaseAction";

export default class DamageAction extends BaseAction {

    public parseParams(paramList:string[], startIndex:number):number {
        return startIndex;
    }


    public excute(caster:BaseSceneObj, agent:any, curTime:number): void {

    }
}