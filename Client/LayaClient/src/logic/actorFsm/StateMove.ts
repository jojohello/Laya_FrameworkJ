import { BaseScene } from "../scene/BaseScene";
import { BaseState } from "./ActorFsm";

export default class StateMove extends BaseState {
    public onEnter(owner:any):void {
        if(owner.moveAgent.isWorking)
            return;

        owner.moveAgent.start(BaseScene.curInst.curTime);
        // 动画播放
    };

    public onUpdate(owner:any, curTime:number): void {
        // if(owner.moveAgent.arrived){
        //     owner.fsm.setState("Idle", owner);
        //     return;
        // }
    }
	
	public onExit(owner:any): void {
        owner.moveAgent.stop();
    };
}