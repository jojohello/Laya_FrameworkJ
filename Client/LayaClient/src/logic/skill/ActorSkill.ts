//cby_todo 对象池没实现，reset没有实现
import { SkillAgent } from "./SkillAgent"
import SkillUtils  from "./SkillUtils"

export class ActorSkill{
    private _skillDict: Map<number, SkillAgent> = new Map();

    public constructor() { }
    
    public addSkill(baseId: number, level: number):void {
        let config = SkillUtils.getCfgByBaseId(baseId, level);

        let oldSkillAgent:SkillAgent = this._skillDict.get(baseId);
        if (oldSkillAgent != undefined) {
            let oldLevel: number = oldSkillAgent.getSkillLevel();
            let newLevel: number = config["Level"];

            if (newLevel > oldLevel) {
                oldSkillAgent.initialize(config);
                return;
            }
        }

        let newSkillAgent = new SkillAgent(config);//cby_todo 对象池实现后从对象池拿
        this._skillDict.set(baseId, newSkillAgent);
    }

    public deleteSkill(baseId: number): void{
        if (this._skillDict.get(baseId) == undefined) {
            return;
        }

        let SkillAgent = this._skillDict.get(baseId);
        //jojohello to do 对象池实现后回收skillAgent，暂时直接删除

        this._skillDict.delete(baseId);
    }

    public getSkillAgent(baseId: number): SkillAgent{
        return this._skillDict.get(baseId);
    }

    public castSkill(baseId: number, targetId: number, x:number, y:number, curTime:number): SkillAgent{
        let skillAgent = this._skillDict.get(baseId);
        if (skillAgent == undefined) {
            return null;
        }

        if(skillAgent.isReady(curTime) == false){
            return null;
        }

        skillAgent.castSkill(targetId, x, y, curTime);

        return skillAgent
    }

    public clear(): void{
        //jojohello to do 对象池实现后回收skillAgent，暂时直接删除

        this._skillDict.clear();
    }
}