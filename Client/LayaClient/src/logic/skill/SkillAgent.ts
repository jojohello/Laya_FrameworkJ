//cby_todo 对象池没实现，reset没有实现

import { BaseSceneObj } from "../sceneObjs/BaseSceneObj";
import { BaseAction } from "../action/BaseAction";


export class SkillAgent{
    private _id: number;
    private _baseId: number;
    private _level: number;
    private _cd: number;
    private _actionList: BaseAction[];

    private _lastCastTime: number;
    private _isRunning: boolean;
    private _index: number;

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
    public constructor(config: Map<string, any>) {
        this.initialize(config);
    }

    public initialize(config: Map<string, any>):void {
        this._id = config["ID"];
        this._baseId = config["BaseID"];
        this._level = config["Level"];
        this._cd = config["CD"] * 1000;
        this._actionList = config["Action"];

        this._lastCastTime = 0;
        this._isRunning = false;
        this._index = 0;

    }

    private stop() :void{
        this._isRunning = false;
        this._index = 0;
    }

    public isReady(curTime: number):boolean {
        let isCD = this._lastCastTime + this._cd > curTime;
        return !(this._isRunning || isCD);
    }

    public castSkill(targetId:number, x:number, y:number, curTime: number):void {
        this._isRunning = true;
        this._lastCastTime = curTime;
        this._targetId = targetId;
        this._targetPos.setTo(x, y);
    }

    public get isRunning() :boolean{
        return this._isRunning;
    }

    public updateSkill(curTime: number, caster: BaseSceneObj) {
        let deltaTime:number = curTime - this._lastCastTime;

        let count: number = this._actionList.length;
        let action:BaseAction = null;
        for (let i = this._index; i < count; i++){
            action = this._actionList[i];
            if (deltaTime >= action.delay) {
                action.excute(caster, this, curTime);
                this._index++;
            }
            else {
                break;
            }
        }

        if (this._index >= count) {
            this.stop();
        }
    }

    public getSkillLevel(): number{
        return this._level;
    }
}