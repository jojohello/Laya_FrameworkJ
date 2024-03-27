import { StateMachine } from "../actorFsm/ActorFsm";
import ActorFsmUtils from "../actorFsm/ActorFsmUtils";
import { CfgMgr } from "../config/CfgMgr";
import { PathFindAgent } from "../potentialPath/PathFindAgent";
import ResManager from "../resTypes/ResManager";
import { BaseScene } from "../scene/BaseScene";
import { BattleScene } from "../scene/BattleScene";
import Attribute from "./Attribute";
import { BaseSceneObj } from "./BaseSceneObj";
import { JumpWordView } from "./JumpWordView";
import { MonsterHudView } from "./MonsterHudView";
import { SceneObjType } from "./SceneObjType";

export class Monster extends BaseSceneObj{
    protected _agent:PathFindAgent = null;
    protected _attr:Attribute = null;

    protected _fsm:StateMachine = null;

    private _hudPosX:number = 0;
    private _hudPosY:number = 0;
    protected _hud:MonsterHudView = null;
    
    public constructor(){
        super();
        this._attr = new Attribute();
    }

    public get fsm():StateMachine{
        return this._fsm;
    }

    public get moveAgent():PathFindAgent{
        return this._agent;
    }

    public getObjType(): number {
        return SceneObjType.Monster;
    }

    protected loadRes(){
        this._model = ResManager.instance.getAltasAnim(this._cfg.model , Laya.Handler.create(this, this.onLoadModel));
    }

    protected onLoadModel(){
        this._model.play();
        let bounds:Laya.Rectangle = this._model.getBounds();

        // 等于将锚点放到动画下方中心位置
        this._transform.setOffsetX(-bounds.width);
        this._transform.setOffsetY(-bounds.height);

        // 显示头顶面板
        // hud
        if(this._hud == null)
            this._hud = new MonsterHudView();
        else
            this._hud.recover();
        this._hud.setTeam(this.team);   // 要先设置阵型，否则血条颜色可能会错
        this._hud.show();
        this._hud.setBloodProcess(this._attr.getAttr("HP") / this._attr.getAttr("maxHP"));
        this._hudPosX = bounds.width;
        this.confirmHudPos();
    }

    protected onInit(uid:number, cfgId:number, scene:BaseScene, team:number, x:number, y:number, angle:number){
        this._cfg = CfgMgr.inst.getCfg("Monster", this._cfgId);
        
        // jojohello test
        this._range = 20;
        this._isDebugPos = true;
        this._isDead = false;

        let battleScene = scene as BattleScene;
        this._agent = battleScene.createMoveAgent(this.x, this.y, 1, this._cfg.speed);
        this._agent.stop();

        if(! this._fsm){
            this._fsm = ActorFsmUtils.createMonsterFsm();
        }
        // jojohello temp
        //this._fsm.setState("Idle", this);
        this._fsm.setState("Move", this);

        this.initAttribute();
    }

    protected onConfirmPos(): void {
        this.confirmHudPos();
    }

    // 释放资源
    public onRelease(scene:BaseScene){
        super.onRelease(scene);

        let battleScene = scene as BattleScene;
        battleScene.removeMoveAgent(this._agent.uid);
        this._agent = null;

        ResManager.instance.recoverRes(this._model);

        if(this._hud){
            this._hud.release();
        }

        this._attr.clear();
    }

    public update(curTime){
        super.update(curTime);

        this._fsm.update(this, curTime);

        if(this._agent != null){
            this._transform.setPos(this._agent.x, this._agent.y);
        }
    }

    protected confirmHudPos():void{
        if(!this._hud)
            return;

        let pos = Laya.Point.create();
        pos.setTo(this._hudPosX, this._hudPosY);
        this._model.localToGlobal(pos);

        this._hud.setPosByGlobal(pos.x, pos.y);
        pos.recover();
    }

    public getDamage(casterId:number, damage:number){
        let curHp = this._attr.getAttr("HP");
        let trueDamage = damage;
        curHp -= damage;

        if(curHp < 0){
            curHp = 0;
            trueDamage = this._attr.getAttr("HP");
        }

        this._attr.setAttr(this._attr.getIndex("HP"), curHp);

        if(this._hud != null)
            this._hud.setBloodProcess(this._attr.getAttr("HP") / this._attr.getAttr("maxHP"));

        if(curHp <= 0){
            this._isDead = true;
            this._fsm.setState("Dead", this);
        }

        // 伤害漂字
        let pos = Laya.Point.create();
        pos.setTo(0, -50);
        this._model.localToGlobal(pos);
        JumpWordView.play(pos.x, pos.y, -trueDamage);
        pos.recover();
    }

    private initAttribute(){
        this._attr.setBaseAttr("maxHP", this._cfg.hp);
        this._attr.setAttr(this._attr.getIndex("HP"), this._cfg.hp);
    }

    public get curState(): string {
        return this._fsm.getCurStateName();
    }

    public run(){
        this._fsm.setState("Move", this);
    }
}