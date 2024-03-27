import { BattleScene } from "../scene/BattleScene";
import { BaseSceneObj } from "../sceneObjs/BaseSceneObj";
import { BaseAction } from "./BaseAction";

export default class BulletAction extends BaseAction {
    private cfgId:number = -1;
    private damageRate:number = 1;

    public parseParams(paramList:string[], startIndex:number):number {
        this.cfgId = parseInt(paramList[startIndex]);
        startIndex++;

        this.damageRate = parseFloat(paramList[startIndex]);
        startIndex++;

        return startIndex;
    }

    public excute(caster:BaseSceneObj, agent:any, curTime:number): void {
        let newBullet = BattleScene.curInst.addObjectToScene("Bullet", this.cfgId, caster.team, caster.x, caster.y, 0);
        newBullet.initMovement(caster.uid, agent.targetId, agent.targetPos.x, agent.targetPos.y, 0, 0);
    }
}