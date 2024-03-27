import { BaseScene } from "../scene/BaseScene";
import { BaseState } from "./ActorFsm";

export default class StateDead extends BaseState {
    private _startTime:number = 0;

    public onEnter(owner:any):void {
        this._startTime = BaseScene.curInst.curTime;
    }

    public onUpdate(owner:any, curTime:number): void {
        if(owner.isRelease)
            return;

        let passTime = curTime - this._startTime;
        if(passTime > 1000 ){
            owner.release();
        }
    }
}