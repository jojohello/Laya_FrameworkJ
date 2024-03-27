import { CfgMgr } from "../config/CfgMgr";
import { BaseSceneObj } from "./BaseSceneObj";
import { BaseScene } from "../scene/BaseScene";
import { SceneObjType } from "./SceneObjType";
import Point = Laya.Point;
import MathUtils from "../utils/MathUtils";
import { BattleScene } from "../scene/BattleScene";
import { BaseCondition } from "../condition/BaseCondition";
import { ConditionEnemy } from "../condition/ConditionEnemy";
import { ConditionObjType } from "../condition/ConditionObjType";
import { ConditionAlive } from "../condition/ConditionAlive";
import ActionUtils from "../action/ActionUtils";
import ResManager from "../resTypes/ResManager";

const BulletMoveType = {
    Line:1,
    Trace:2,
}

export class Bullet extends BaseSceneObj{
    protected _startTime: number = 0;
    protected _lastUpdateTime: number = -1;
    protected _startPos: Point = Laya.Point.create();
    protected _endPos: Point = Laya.Point.create();
    protected _lastPos: Point = Laya.Point.create();
    protected _startYOffset: number = 0;   // 实际碰撞还是用地平面的位置来计算的，但是飞行表现还是要考虑高度的
    protected _endYOffset: number = 0;     
    protected _curYOffset: number = 0;

    protected _casterId: number;
    protected _moveType: number;
    protected _flyTime: number;     // 子弹飞行时间
    private _speed: number;         // 飞行速度
    private _needCheckCollision: boolean;

    private _painSprite: Laya.Sprite = null;    // 临时用来画子弹的sprite

    private _collisionContions: BaseCondition[] = [];
    private _collisionIDsSet: Set<number> = new Set<number>();

    // 给Action用的必然参数
    protected _targetId :number;
    protected _targetPos :Laya.Point = new Laya.Point();

    public get targetId():number {
        return this._targetId;
    }

    public get targetPos():Laya.Point {
        return this._targetPos;
    }
    // ---------------------------------------------------------------

    public getObjType(): number {
        return SceneObjType.Bullet;
    }

    protected onInit(uid:number, cfgId:number, scene:BaseScene, team:number, x:number, y:number, angle:number): void {
        this._startPos.setTo(x, y);
        this._lastPos.setTo(x, y);
        this._range = 10;

        this._cfg = CfgMgr.inst.getCfg("Bullet", cfgId);

        this._speed = this._cfg.Speed;
        this._needCheckCollision = this._cfg.CheckCollis;

        switch(this._cfg.MoveType) {
            case "Line":
                this._moveType = BulletMoveType.Line;
                break;
            case "Trace":
                this._moveType = BulletMoveType.Trace;
                break;
            default:
                console.error("Error bullet move type : " + this._cfg.MoveType);
                break;
        }

        this._startTime = -1;
        this._lastUpdateTime = -1;

        // 先写死碰撞的条件，后面可以根据配置来
        if(this._collisionContions.length <= 0){
            this._collisionContions.push(new ConditionEnemy());
            this._collisionContions.push(new ConditionAlive());
            this._collisionContions.push(new ConditionObjType(SceneObjType.Monster));
        }
        
        this._collisionIDsSet.clear();
    }

    protected loadRes():void{
        // 现在没有资源，先随便画个圆
        if(!this._painSprite){
            this._painSprite = new Laya.Sprite();
        }

        Laya.stage.addChild(this._painSprite);

        this._model = ResManager.instance.getTimelineAnim("effect/base_fly_fire.ani", Laya.Handler.create(this, this.onResLoaded));
        this._model.play("ani1", true, true);
    }

    private onResLoaded():void {
        this._model.setScale(0.3, 0.3);
    }

    public update(curTime:number):void {
        if(this._isRelease)
            return;

        super.update(curTime);

        //初始化 _lastUpdate
        if (this._lastUpdateTime < 0) {
            this._startTime = curTime;
            this._lastUpdateTime = curTime;
        }else {
            let ret = this.updateMovement(curTime);

            if(ret && this._needCheckCollision)
                this.collision(curTime);
        }

        // 飞行时间到了，
        if(this._flyTime > 0 && curTime - this._startTime > this._flyTime){
            this.finish(false);
        }

        // 画圈
        this._painSprite.graphics.clear();
        this._painSprite.graphics.drawCircle(this.x, this.y + this._curYOffset, this._range, "#555555");
    }

    private _collisionIdList:number[] = [];
    private collision(curTime: number): void{
        this._collisionIdList.length = 0;

        let startPoint = this._transform.getPos();
        let sx = startPoint.x;
        let sy = startPoint.y;
        let endPoint = this._lastPos;
        let ex = endPoint.x;
        let ey = endPoint.y;

        let collisionIdList = (BaseScene.curInst as BattleScene).GetTrailCollision(this, ex, ey, sx, sy, this._range, this._collisionContions);
        for(let i = 0; i < collisionIdList.length; i++){
            if(this._collisionIDsSet.has(collisionIdList[i]))
                continue;

            this._collisionIdList.push(collisionIdList[i]);
        }

        if(this._collisionIdList.length <= 0){
            return;
        }

        let targetObj = null;
        for(let i = 0; i< this._collisionIdList.length; i++){
            let targetId = collisionIdList[i];
            targetObj = BaseScene.curInst.getObject(targetId);
            if (!targetObj) {
                continue;
            }

            let targetPos = targetObj.getPos();
            this.doHitAction({["targetId"]:targetId, ["targetPos"]:targetPos});
            targetPos.recover();

            this._collisionIDsSet.add(this._collisionIdList[i]);
            if(this._collisionIDsSet.size > this._cfg.PenetrateCount){
                this.finish(false);
                targetObj = null;
                return;
            }
        }
        targetObj = null;
    }

    public onRelease(scene: BaseScene): void {
        super.onRelease(scene);

        if(this._painSprite){
            this._painSprite.graphics.clear();
        }

        if(this._model){
            ResManager.instance.recoverRes(this._model);
            this._model = null;
        }
    }

    // 运动相关计算 --------------------------------------------------
    // 下面的运动情况如果过于复杂，可以使用面向对像，变成多个子类，子类只要负责实现initMovment以及updateMovement即可
    public initMovement(casterId:number, tarageId:number, targetX:number, targetY:number, startYOffset:number, endYOffset:number) {
        this._casterId = casterId;
        this._targetId = tarageId;
        this._endPos.setTo(targetX, targetY);
        this._startYOffset = startYOffset;
        this._endYOffset = endYOffset;
        this._curYOffset = startYOffset;

        // 所有直线飞行，都转换成时间计算
        if(this._cfg.IsTimeLimit){
            this._flyTime = this._cfg.LimitTime * 1000;

            // 直线限时飞行，用时间计算出最终的目标地点
            if(this._moveType == BulletMoveType.Line){
                let deltaX = this._endPos.x - this.x;
                let deltaY = this._endPos.y - this.y;

                let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                deltaX = deltaX / distance * this._speed * this._flyTime * 0.001;
                deltaY = deltaY / distance * this._speed * this._flyTime * 0.001;

                this._endPos.setTo(this.x + deltaX, this.y + deltaY);

                this._transform.pointTo(this._endPos.x, this._endPos.y);
            }
        }else if(this._moveType == BulletMoveType.Line){
            let distance = MathUtils.distance(this.x, this.y, this._endPos.x, this._endPos.y);
            this._flyTime = distance / this._speed * 1000;
            
            if(this._flyTime < 15){
                if(this._cfg.CheckCollis){
                    this.collision(BaseScene.curInst.curTime);
                }

                this.finish(false);
            }else{
                this._transform.pointTo(this._endPos.x, this._endPos.y);
            }
        }else {
            this._flyTime = -1;
        }
    }

    protected updateMovement(curTime:number):boolean {
        switch(this._moveType) {
            case BulletMoveType.Line:
                let rate = Math.min((curTime - this._startTime) / this._flyTime, 1);
                let x = MathUtils.lerp(this._startPos.x, this._endPos.x, rate);
                let y = MathUtils.lerp(this._startPos.y, this._endPos.y, rate);
                this._curYOffset = MathUtils.lerp(this._startYOffset, this._endYOffset, rate);

                this._lastPos.setTo(this.x, this.y);
                this._transform.setPos(x, y);
                break;
            case BulletMoveType.Trace:
                let target = BattleScene.curInst.getObject(this._targetId);
                if(! target){   // 目标已经消失
                    this.finish(false); 
                    return false;
                }
                
                // if(this._debugPosSprite == null){
                //     this._debugPosSprite = new Laya.Sprite();
                //     Laya.stage.addChild(this._debugPosSprite);
                // }
                // this._debugPosSprite.graphics.clear();
                // this._debugPosSprite.graphics.drawLine(this._startPos.x, this._startPos.y, target.x, target.y, "#0000ff");


                // 限定时间的,使用插值运算
                if(this._flyTime > 0){
                    let rate = Math.min((curTime - this._startTime) / this._flyTime, 1);

                    let x = MathUtils.lerp(this._startPos.x, target.x, rate);
                    let y = MathUtils.lerp(this._startPos.y, target.y, rate);
                    
                    this._lastPos.setTo(this.x, this.y);
                    this._transform.setPos(x, y);
                }else{  // 使用速度计算
                    let deltaTime = curTime - this._lastUpdateTime;
                    let distance = this._speed * (curTime - this._lastUpdateTime) * 0.001;
                    if(distance < 1 && deltaTime < 100){ // 时间间隔果断，或者移动距离太小，跳过运算 
                        return false;
                    }

                    this._lastUpdateTime = curTime;

                    let dirPoint = Laya.Point.create();
                    dirPoint.setTo(target.x - this.x, target.y - this.y);
                    if(MathUtils.squareLen(dirPoint.x, dirPoint.y) <= distance * distance) // 追上目标了
                    {
                        this._transform.setPos(target.x, target.y);
                        this.finish(true);
                        return true;
                    }

                    let dirLen = Math.sqrt(dirPoint.x * dirPoint.x + dirPoint.y * dirPoint.y);
                    this._transform.setPos(this.x + dirPoint.x / dirLen * distance, this.y + dirPoint.y / dirLen * distance);
                    this._transform.setDir(dirPoint);

                    dirPoint.recover();
                }
                break;
        }

        return true;
    }
    // ---------------------------------------------------------------

    // 使用Action相关 -----------------------------------------------
    protected doHitAction(targetInfo?:{}):void {
        this._targetPos.setTo(this.x, this.y);
        Bullet.prebuildActions(this._cfg);

        let actionList = this._cfg["HitActions"];
        let curTime = BaseScene.curInst.curTime
        for(let i=0; i<actionList.length; i++){
            actionList[i].excute(this, targetInfo?targetInfo:this, curTime);
        }
    }

    private static prebuildActions(config:any): void{
        if (config["prased"])
            return;

        let actionList = config["HitAction"];

        config["HitActions"] = ActionUtils.parseActions(actionList, false);
        config["prased"] = true;
    }
    // ---------------------------------------------------------------
    protected finish(needAction:boolean):void {
        if(this._isRelease)
            return;

        if(needAction){
            this.doHitAction();
        }
        
        this.release();
    }
}