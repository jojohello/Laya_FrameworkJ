import { BaseSceneObj } from "./BaseSceneObj";
import { SceneObjType } from "./SceneObjType";
import { CfgMgr } from "../config/CfgMgr";
import { ActorSkill } from "../skill/ActorSkill";
import { BaseScene } from "../scene/BaseScene";
import MathUtils from "../utils/MathUtils";

export class Tower extends BaseSceneObj{
    private _skills:ActorSkill = null;
    private _loader:laya.net.LoaderManager = null;

    private _normalSkillId:number = -1;
    private _curSkillAgent = null;

    public onInit(uid:number, cfgId:number, scene:BaseScene, team:number, x:number, y:number, angle:number){
        // 初始化技能
        this.initSkill();
    }

    public getObjType(): number {
        return SceneObjType.Tower;
    }

	protected loadRes(): void {
		if(this._model == null){
            this._model = new Laya.Sprite();
        }

        // jojohello to do 以后要注意层次
        Laya.stage.addChild(this._model);
        this._transform.forceUpdate();
        
        this._cfg = CfgMgr.inst.getCfg("Monster", this._cfgId);
        // 暂时炮台就一张图片，没有动画，后面要根据实际情况调整
        this._loader = Laya.loader.load(this._cfg.model, Laya.Handler.create(this, this.onLoadModel));
	}

    protected onLoadModel(){
        this._loader = null;
        //this._transform.turnToAngle(180, BaseScene.curInst.curTime);

        let texture = Laya.loader.getRes(this._cfg.model);
        let image = Laya.Pool.getItemByClass("Laya.Image", Laya.Image);
        image.source = texture;

        this._model.addChild(image);
        image.x = -texture.width * 0.5
        image.y = -texture.height * 0.5;
        image.angle = 0;
        image.scale(1, 1);

        // 画个攻击范围的圆圈，方便测试用的
        if(this._isDebugPos){
            if(! this._debugPosSprite){
                this._debugPosSprite = new Laya.Sprite();
            }
            
            Laya.stage.addChild(this._debugPosSprite);
            this._debugPosSprite.graphics.drawCircle(this.x, this.y, this._tempAttackDis, "#ff0000");
            this._debugPosSprite.graphics.drawRect(this.x, this.y, texture.width, texture.height, "#00ff00");
        }
    }

    // 技能相关 ==========================================================
    protected initSkill(): void{
        let selfCfg = CfgMgr.inst.getCfg("Monster", this._cfgId);
        let skillIds = (selfCfg["skillList"] as string).split("|");
 
        this._skills = new ActorSkill();
        for(let i=0; i<skillIds.length; i++){
            if(skillIds[i] == "")
                continue;
            if(i == 0)
                this._normalSkillId = parseInt(skillIds[i]);
            this._skills.addSkill(parseInt(skillIds[i]), 1);
        }
    }

    protected tryNormalAttack(target:BaseSceneObj, curTime:number){
        if(target == null)
            return;

        if(this._skills == null)
            return;
        
        let targetObj = BaseScene.curInst.getObject(target.uid);
        this._curSkillAgent = this._skills.castSkill(this._normalSkillId, target.uid, 
            targetObj?targetObj.x:this.x, targetObj?targetObj.y:this.y, curTime);
    }
    // ====================================================================

    public update(curTime:number)
    {
        super.update(curTime);

        this._transform.update(curTime);

        this.updataAi(curTime);

        // 这个update应该可以放在状态机上，这里简单写，就放这里
        // 不建议这个update放在ActorSkill里面，不然很容易就写成ActorSkill遍历所有他内部的Agent进行Update，这样消耗太大了
        // 因为一般来说，除了雷云这种自己过一段时间发出攻击的技能，不然同一时间，只会有一个技能在释放状态
        if(this._curSkillAgent){
            this._curSkillAgent.updateSkill(curTime, this);
            if(this._curSkillAgent.isRunning == false)
                this._curSkillAgent = null;
        }
    }

        // 释放资源
    public onRelease(scene:BaseScene) {
        if(this._loader){
            this._loader.cancelLoadByUrl(this._cfg.model);
            this._loader = null;
        }

        if(this._model)
        {
            Laya.Pool.recover("Laya.Image", this._model);
            this._model = null;
        }
    }

    //====================================================================
    // ai计算相关，先简单写
    protected _lastAiTime:number = 0;
    readonly _aiDeltaTime:number = 100;
    readonly _tempAttackDis = 200;
    protected updataAi(curTime:number){
        if(curTime - this._lastAiTime < this._aiDeltaTime)
            return;

        this._lastAiTime = curTime;
        // 搜敌
        let enemyIds = BaseScene.curInst.collision.getObjInRange(this.x, this.y, this._tempAttackDis);
        if(!enemyIds)
            return;
        
        let count = 0;
        let target = null;
        let curTarget = null;
        let minDis = -1;
        let sqrDis = -1;
        enemyIds.forEach((curId)=>{
            if(curId == this._uid)
                return;

            target = BaseScene.curInst.getObject(curId);
            if(!target)
                return;

            if(target.getObjType() != SceneObjType.Monster)
                return;
            
            if(target.isDead())
                return;
            
            count++;
            sqrDis = MathUtils.squareDis(this.x, this.y, target.x, target.y);
            if(sqrDis > this._tempAttackDis * this._tempAttackDis)
                return;
            
            if(minDis == -1 || minDis > sqrDis){
                minDis = sqrDis;
                curId = target.uid;
                curTarget = target;
            }
        });

        if(curTarget)
        {
            if(this._isDebugPos){
                this._debugPosSprite.graphics.clear();
                this._debugPosSprite.graphics.drawLine(this.x, this.y, curTarget.x, curTarget.y, "#0000ff");
            }

            this._transform.turnToDirection(curTarget.x - this.x, curTarget.y - this.y, curTime);
        }else{
            this._transform.turnToAngle(0, curTime);
        }

        if(Math.abs(this._transform.targetAngle - this._transform.angle) < 3){
            this.tryNormalAttack(curTarget, curTime);
        }
    }
}