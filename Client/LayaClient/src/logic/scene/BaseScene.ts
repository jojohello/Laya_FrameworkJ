import { BaseMap } from "./BaseMap";
import SceneTime from "./SceneTime";
import { BaseSceneObj } from "../sceneObjs/BaseSceneObj";
import IDFactory from "../utils/IDFactory";
import MyCacher from "../utils/MyCacher";
import SceneCollision from "./SceneCollision";

export interface ObjType{
    monster: 1,
    tower: 2,
    bullet: 3,
}

export class BaseScene{
    private static _Inst:BaseScene = null;
    public static get curInst():BaseScene{
        return BaseScene._Inst;
    }

    public static set curInst(value:BaseScene){
        BaseScene._Inst = value;
    }

    public mapInst:BaseMap = null;
    protected _isMapReady:boolean = false;

    protected _sceneTime:SceneTime = new SceneTime();
    protected fiexdTime:number = 0.1;
    protected lastUpdateTime:number = 0;

    protected _collision:SceneCollision = null;
    
    protected objMap:Map<number, BaseSceneObj> = new Map<number, BaseSceneObj>();
    protected delIdList:number[] = []; 
    protected typeMap:Map<number, number[]> = new Map<number, number[]>();  // 根据类型进行分类，方便后续场景查询的

    static _mapLayer:Laya.Sprite = null;
    static _playerLayer:Laya.Sprite = null;

    public static get MapLayer():Laya.Sprite{
        if  (!BaseScene._mapLayer)
        {
            BaseScene._mapLayer = Laya.stage.getChildByName("mapNode") as Laya.Sprite;
            BaseScene._mapLayer.zOrder = 1; // 通过zOrder来控制显示层级
        }

        return BaseScene._mapLayer;
    }

    public static get PlayerLayer():Laya.Sprite{
        if  (!BaseScene._playerLayer)
        {
            BaseScene._playerLayer = Laya.stage.getChildByName("playerNode") as Laya.Sprite;
            BaseScene._playerLayer.zOrder = 2; // 通过zOrder来控制显示层级
        }

        return BaseScene._playerLayer;
    }



    constructor(){
        this._sceneTime.start();
        Laya.timer.frameLoop(1, this, this.onFrameLoop);
    }

    protected loadMap(mapPath, handle:()=>void){
        this.mapInst = new BaseMap();
        this.mapInst.loadMapRes(mapPath, ()=>{this._isMapReady = true; handle();});
    }

    public get FixedTime():number{
        return this.fiexdTime;
    }

    public set FixedTime(value:number){
        this.fiexdTime = value;
    }

    public get collision():SceneCollision{
        return this._collision;
    }

    public get curTime(){
        return this._sceneTime.curTime();
    }

    protected onFrameLoop():void{
        if(this.isReady() == false)
            return;
        
        let curTime = this._sceneTime.curTime();

        // 用来计算一般逻辑
        this.onUpdate(curTime);
        
        // 一般用来最后确定对像的位置等
        this.onLateUpdate(curTime);

        // 固定时间间隔的update，可以用来进行ai思考，也可以用来记录一些状态信息，形成帧同步，用于战斗回放等
        if(curTime - this.lastUpdateTime > this.fiexdTime)
        {
            this.onFixedUpdate(curTime);
            this.lastUpdateTime = curTime;
        }
    }

    protected isReady():boolean{
        if (!this._isMapReady)
            return false;

        return true;
    }

    protected onUpdate(curTime:number):void{
        for (const obj of this.objMap.values()) {
            if(obj.isRelease)
                this.delIdList.push(obj.uid)
            else
                obj.update(curTime);
        }
    }

    protected onLateUpdate(curTime:number):void{
        for (const obj of this.objMap.values()) {
            if(!obj.isRelease)
                obj.lateUpdate(curTime);
        }
        
        this.deleteObjectFromScene();
    }

    protected onFixedUpdate(curTime:number):void{
        for (const obj of this.objMap.values()) {
            
            obj.fixedUpdate(curTime);
        }
    }

    private tempDelTypeDict:Map<number, boolean> = new Map<number, boolean>();
    protected deleteObjectFromScene(): void {
        if (this.delIdList.length === 0) {
            return;
        }

        let delObj: any = null;
        this.tempDelTypeDict.clear();
        for (const uId of this.delIdList) {
            delObj = this.objMap.get(uId);
            if (delObj !== null && delObj !== undefined) {
                this.tempDelTypeDict.set(delObj.getObjType(), true);
                MyCacher.recycleObj(delObj);
                delObj.onRelease(this);
                this.objMap.delete(uId);
            }
        }
        
        let typeIdList: number[] | null = null;
        for (const objType of this.tempDelTypeDict.keys()) {
            typeIdList = this.typeMap.get(objType);
            const count: number = typeIdList.length;
            let index: number = 0;
            for (let i = 0; i < count; i++) {
                if (this.objMap[typeIdList[index]] === null || this.objMap[typeIdList[index]] === undefined) {
                    typeIdList.splice(index, 1);
                    index--;
                }
                index++;
            }
        }

        this.delIdList.length = 0;
        delObj = null;
        typeIdList = null;
    }

    public addObjectToScene(className: string, cfgId: number, team:number, x:number, y:number, angle: number): any {
        const newId: number = IDFactory.GetID();
        
        const newObj = MyCacher.getObj(className);
        newObj.init(newId, cfgId, this, team, x, y, angle);
        
        this.objMap.set(newId, newObj);
        const objType = newObj.getObjType();
        if (this.typeMap[objType] === null || this.typeMap[objType] === undefined) {
            this.typeMap.set(objType, []);
        }

        this.typeMap.get(objType).push(newId);

        return newObj;
    }
        
    public deleteObject(uId: number): void {
        let obj = this.objMap.get(uId);
        if(obj){
            obj.release();
        }
    }
    
    public getObject(uId: number): BaseSceneObj | null {
        return this.objMap.get(uId) || null;
    }
    
    public getObjectCountOfObjType(objType: number): number{
        if (this.typeMap.has(objType)) {
            return this.typeMap.get(objType).length;
        }

        return 0;
    }

    public getTypeUIDs(objType: number): number[] | null {
        if (this.typeMap.has(objType)) {
            return this.typeMap.get(objType);
        }

        return null;
    }
}