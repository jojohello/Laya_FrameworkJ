import { BaseSceneObj } from "../sceneObjs/BaseSceneObj";
export abstract class BaseAction{
    protected _delay:number = 0;

    public get delay():number{
        return this._delay;
    }

    public set delay(value:number){
        this._delay = value;
    }

    public parseParams(paramList:string[], startIndex:number):number{
        return startIndex;
    }

    /**
     * 
     * @param caster 
     * @param agent : 执行体，里面至少要有targetId和targetPos两个属性
     * @param curTime 
     */
    public abstract excute(caster:BaseSceneObj, agent:any, curTime:number): void;
}