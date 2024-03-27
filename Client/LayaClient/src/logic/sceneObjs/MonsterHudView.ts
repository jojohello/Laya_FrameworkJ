import { BaseScene } from "../scene/BaseScene";
import { BattleScene } from "../scene/BattleScene";
import { BaseView } from "../UICore/BaseView";

export class MonsterHudView extends BaseView{
    private _team:number = 0;
    private _process:number = 1;

    public getPackageName(): string{
        return "SceneObj";
    }

    public getViewName(): string{
        if(this._team == (BaseScene.curInst as BattleScene).selfTeam)
            return "selfBlood";
        else
            return "enemyBlood";
    }

    public onShown(): void{
        this.setBloodProcess(this._process);
        this.setPosByGlobal(this._x, this._y);
    }

    public setTeam(team:number){
        this._team = team;
    }

    public setBloodProcess(rate:number){
        this._process = rate;
        if(this._view){
            this._view.blood.fillAmount = rate;
        }
    }
}