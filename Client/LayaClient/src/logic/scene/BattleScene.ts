import { BaseScene } from "./BaseScene";
import {CfgMgr} from "../config/CfgMgr";
import { MonsterCreater } from "../sceneObjs/MonsterCreater";
import { Monster } from "../sceneObjs/Monster";
import { PotentialPath } from "../potentialPath/PotentialPath";
import { PathFindAgent } from "../potentialPath/PathFindAgent";
import IDFactory from "../utils/IDFactory";
import { BaseSceneObj } from "../sceneObjs/BaseSceneObj";
import MathUtils from "../utils/MathUtils";
import Point = Laya.Point;
import { Tower } from "../sceneObjs/Tower";
import ActionUtils from "../action/ActionUtils";
import SpaceSegmentation from "./SpaceSegmentation";
import { Bullet } from "../sceneObjs/Bullet";
import { BaseCondition } from "../condition/BaseCondition";

export class BattleScene extends BaseScene{
    private _cfg:any = null;

    private _mapLayer:Laya.Node = null;
    private _floorLayer:Laya.Node = null;
    private _playerLayer:Laya.Node = null;

    private _startPos:Laya.Point = null;
    private _endPos:Laya.Point = null;

    // 场景里面的功能模块
    private _monsterCreator:MonsterCreater = null;
    private _pathFinder:PotentialPath = null;
    private _selfTeam = 1;

    constructor(cfgId:number){
        super();

        ActionUtils.registerActions();

        // jojohello 2023-6-7 注册需要写在这里，否则对应的类在编译的时候，就不会被编译到js中，因为没有在外部被引用过
        Laya.ClassUtils.regClass("Monster", Monster);
        Laya.ClassUtils.regClass("MonsterCreater", MonsterCreater);
        Laya.ClassUtils.regClass("Tower", Tower);
        Laya.ClassUtils.regClass("Bullet", Bullet);

        this._cfg = CfgMgr.inst.getCfg("BattleMap", cfgId);

        if(!this._cfg)
        {
            console.error("BattleScene.constructor() error, cfg is null", cfgId);
        }

        BaseScene.curInst = this;
        
        // jojhello 2023/05/24 这里是否想一下，是否可以模仿onStart机制，而不是使用一个回调函数
        this.loadMap(this._cfg.respath, ()=>{ this.afterMapLoaded(); });
    }

    private afterMapLoaded(){
        let tMap = this.mapInst.getTiledMap();
        let rect = this.mapInst.getTileMapViewRect();

        // 暂时写死
        this.selfTeam = 1;

        // 根据炮位创建炮台
        // 炮台的排位数要约定俗成
        for(let i=1; i<=1; i++)
        {
            let tObj = tMap.getLayerObject("object", "tower_" + i);
            if(!tObj){
                continue;
            }

            this.addObjectToScene("Tower", 1, 1, tObj.x, tObj.y, 0);
        }

        // 建立怪创建器
        let tStartPoint = tMap.getLayerObject("object", "startPoint");
        this._monsterCreator = this.addObjectToScene("MonsterCreater", 1, 2, tStartPoint.x, tStartPoint.y, 0) as MonsterCreater;
        this._monsterCreator.start(this._sceneTime.curTime());
        
        // 创建终点
        let tEndPoint = tMap.getLayerObject("object", "endPoint");
        this._endPos = Laya.Point.create();
        this._endPos.x = tEndPoint.x;
        this._endPos.y = tEndPoint.y;

        this._pathFinder = new PotentialPath(tMap);

        this._collision = new SpaceSegmentation()
        this._collision.setMapSize(this.mapInst.getWidth(), this.mapInst.getHeight());
    }

    public get MapLayer():Laya.Node{
        if  (!this._mapLayer)
        {
            this._mapLayer = Laya.stage.getChildByName("mapNode");
        }

        return this._mapLayer;
    }

    public get FloorLayer():Laya.Node{
        if  (!this._floorLayer)
        {
            this._floorLayer = Laya.stage.getChildByName("floorNode");
        }

        return this._floorLayer;
    }

    public get PlayerLayer():Laya.Node{
        if  (!this._playerLayer)
        {
            this._playerLayer = Laya.stage.getChildByName("playerNode");
        }

        return this._playerLayer;
    }

    public get selfTeam(){
        return this._selfTeam;
    }

    public set selfTeam(value){
        this._selfTeam = value;
    }

    // 逻辑坐标转换为舞台坐标
    public logic2Stage(p:Laya.Point):Laya.Point{
        let ret = Laya.Point.create();
        ret.x = p.x * 32;
        ret.y = p.y * 32;
        
        return ret;
    }

    public createMoveAgent(x:number, y:number, radius:number, speed:number):PathFindAgent{
        // jojohello to do 使用cache
        let agent = new PathFindAgent(IDFactory.GetID(), x, y, radius, speed);
        this._pathFinder.addAgent(agent.uid, agent);

        return agent;
    }

    public removeMoveAgent(uid:number):void{
        this._pathFinder.removeAgent(uid);
    }

    private _lastPosCalTime:number = 0;
    private _posCalDelta:number = 33;
    protected onUpdate(curTime:number):void{
        super.onUpdate(curTime);

        if(this._monsterCreator)
        {
            this._monsterCreator.update(curTime);
        }

        if(curTime - this._lastPosCalTime > this._posCalDelta)
        {
            this._lastPosCalTime = curTime;
            this._pathFinder.update(curTime);
        }

        this.collision.update(curTime, this.objMap);
    }

    private _collision_ret_ID_List:number[] = [];
    public GetTrailCollision(master: BaseSceneObj, startX: number, startY: number, endX: number, endY: number, range: number, conditions?:BaseCondition[]):number[] {
        this._collision_ret_ID_List.length = 0;

        //先从空间切分中，获得附近要检测的物品，减少运算量
        let idsSet = this._collision.getObjInRect(startX, startY, endX, endY, range);
        if(idsSet == null || idsSet.size == 0){
            idsSet = null;
            return this._collision_ret_ID_List;
        }

        MathUtils.collisionTrailBatchReady(startX, startY, endX, endY, range);

        let obj = null;
        idsSet.forEach((uid) => {
            obj = this.objMap.get(uid);
            if(conditions != null && conditions.length > 0){
                let isSatisfy = true;
                for(let i = 0; i< conditions.length; i++){
                    if(!conditions[i].isFit(master, obj)){
                        return;
                    }
                }
            }
           
            let objPos: Point = obj.getPos();
            let objX: number = objPos.x;
            let objY: number = objPos.y;
            let objRange: number = obj.getRange();
            
            if (MathUtils.collisionTrailBatch(endX, endY, range, objX, objY, objRange)) {
                this._collision_ret_ID_List.push(uid);
            }

            objPos.recover();
        });

        obj = null;

        //按物品距离从小到大排序
        this._collision_ret_ID_List.sort((aid, bid) => {
            let a:Point = this.objMap.get(aid).getPos();
            let ax: number = a.x; let ay: number = a.y;
            a.recover();

            let b: Point = this.objMap.get(bid).getPos();
            let bx: number = b.x; let by: number = b.y;
            b.recover();

            return MathUtils.squareDis(ax, ay, startX, startY) - MathUtils.squareDis(bx, by, startX, startY);
        });

        return this._collision_ret_ID_List;
    }
}