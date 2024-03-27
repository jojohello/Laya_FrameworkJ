import { BaseState } from "./ActorFsm";

export default class StateAttack extends BaseState {
    public onUpdate(owner:any, curTime:number): void {
        if(!owner.curSkillAgent || !owner.curSkillAgent.isRunning){
            owner.fsm.setState("Idle", owner);
            return
        }
        
        owner.curSkillAgent.updateSkill(curTime, owner);
    }
}