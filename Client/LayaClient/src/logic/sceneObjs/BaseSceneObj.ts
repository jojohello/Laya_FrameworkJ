import { BaseScene } from "../scene/BaseScene";
import { BattleScene } from "../scene/BattleScene";
import SceneMgr from "../scene/SceneMgr";
import Transform2D  from "./Transform2D";
import Point = Laya.Point;

export abstract class BaseSceneObj{
    protected _uid:number = 0;  // 唯一id
    protected _cfgId:number = 0;  // 配置id
    protected _cfg:any = null;  // 配置数据
    protected _isRelease:boolean = false;  // 是否已经释放了
    protected _teamId:number = 0;  // 队伍id, -1无队伍，0怪物方，两边都攻击，1/2 两个对立队伍
    protected _isDead:boolean = false;  // 是否死亡

    protected _model: any = null;  // 显示对象
    protected _transform: Transform2D = new Transform2D();  // 坐标变换对象
    protected _range: number = 0;

    protected _isDebugPos = false;  // 是否显在对像下面显示一个圈圈
    protected _debugPosSprite: Laya.Sprite = null;  // 显示坐标的圈圈 

    public constructor(){

    }

    public get uid():number{
        return this._uid;
    }

    public get isRelease():boolean{
        return this._isRelease;
    }

    public init(uid:number, cfgId:number, scene:BaseScene, team:number, x:number, y:number, angle:number){
        this._isRelease = false;
        this._uid = uid;
        this._cfgId = cfgId;
        
        this._transform.setPos(x, y);
        this._transform.setAngle(angle);
        this._transform.forceUpdate();

        this._teamId = team;

        this.onInit(uid, cfgId, scene, team, x, y, angle);
        this.loadRes();
    }



    public abstract getObjType():number;  // 这个必须重构

    public update(curTime) {
        
    };

    public lateUpdate(curTime) {
        this.confirmPos();
    };

    public fixedUpdate(curTime):void {};

    // 加载并显示资源
    protected abstract  loadRes():void;

    // 外部继承实现，这样的写法使为了保证init动作，在loadRes之前
    protected onInit(uid:number, cfgId:number, scene:BaseScene, team:number, x:number, y:number, angle:number):void
    {

    }
    
    // 最终将Transform中的坐标，设置到对应的显示资源上
    // 每个游戏的坐标变换都不大一样，所以每个游戏都必须修改这个函数
    protected confirmPos():void {
        if(this._model == null) 
            return;

        if(this._transform.getIsPosChange()) {
            let pos = this._transform.getPos();

            // 每个游戏的这段逻辑都不大一样，现在的游戏这个逻辑跟TileMap绑定在一起了
            let tMap = BattleScene.curInst.mapInst.getTiledMap();
            let rect = BattleScene.curInst.mapInst.getTileMapViewRect();

            let screenPoint = Laya.Point.create();
            screenPoint.x = rect.x + (pos.x + this._transform.getOffsetX()) * tMap.scale;
            screenPoint.y = rect.y + (pos.y + this._transform.getOffsetY()) * tMap.scale;

            let newPos = Laya.stage.localToGlobal(screenPoint);            
            this._model.pos(newPos.x, newPos.y);

            pos.recover();
            screenPoint.recover();
            this._transform.resetPosChange();
            
            this.onConfirmPos();

            if(this._isDebugPos && this._range > 0){
                if(this._debugPosSprite == null){
                    this._debugPosSprite = new Laya.Sprite();
                    Laya.stage.addChild(this._debugPosSprite);
                }

                this._debugPosSprite.graphics.clear();
                this._debugPosSprite.graphics.drawCircle(this._transform.x, this._transform.y, this._range, "#008800");
            }
        }

        if(this._transform.getIsAngleChange()) {
            this._model.rotation = this._transform.getAngle();
            this._transform.resetAngleChange();
        }
    }

    // 释放资源
    public onRelease(scene:BaseScene) {
        if(this._debugPosSprite){
            this._debugPosSprite.graphics.clear();
        }
    }

    public getPos():Point {
        return this._transform.getPos();
    }

    public getRange(): number{
        return this._range;
    }

    public getUid(): number{
        return this._uid;
    }

    public onCollision(): void{
        
    }

    public get x(): number{
        return this._transform.x;
    }

    public get y(): number{
        return this._transform.y;
    }

    public get team(): number{
        return this._teamId;
    }

    // 把自己放到场景的缓冲区中
    public release(): void{
        this._isRelease = true;
    }

    public isDead():boolean{
        return this._isDead;
    }

    public getDamage(casterId:number, damage:number){
        
    }

    public getCasterId():number{
        return this._uid;   // 一般来说，自己的uid就是CasterId，但是对于子弹来说，子弹的casterId是发射者的uid
    }

    protected onConfirmPos():void{}
}