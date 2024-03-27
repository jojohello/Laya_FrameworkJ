// jojohello 2023-6-13 使用代理的方式，方便更换寻路算法
// 如果使用agent，物品在场景种的位置完全依靠agent来，不能自己计算

import MathUtils from "../utils/MathUtils"
import { PotentialPath } from "./PotentialPath"

export class PathFindAgent{
    private _uid:number = 0
    private _x:number = 0
    private _y:number = 0
    private _speed:number = 0
    private _radius:number = 1  // 半径，用来计算碰撞
    private _lastUpdateTime:number = 0
    private _team:number = 0
    private _isWorking: boolean

    public constructor(uid:number, x:number, y:number, radius:number = 1, speed:number, team:number = -1) {
        this._uid = uid;
        this._x = x;
        this._y = y;
        this._radius;
        this._speed = speed;
        this._team = team;
    }

    public get isWorking () {
        return this._isWorking;
    }

    public start(curTime:number) {
        this._isWorking = true;
        this._lastUpdateTime = curTime
    }

    public stop() {
        this._isWorking = false;
    }

    public setSpeed(speed:number) {
        this._speed = speed
    }

    public get uid():number {
        return this._uid
    }

    public get x():number {
        return this._x
    }

    public get y():number {
        return this._y
    }

    public getPos():Laya.Point {
        return Laya.Point.create().setTo(this._x, this._y)
    }

    /**
	* 强制设置位置，用来做传送、击退等外部改变物体位置的功能
    * @param x 目标点x，浮点型，为世界逻辑坐标
    * @param y 目标点y，浮点型，为世界逻辑坐标
	*/
    public setPos(x:number, y:number) {
        this._x = x
        this._y = y
    }

    public updatePos(curTime:number, pathFinder:PotentialPath) {
        if(this.isWorking == false)
            return;

        // 如果不同阵型要对冲，或者有不同的重点，可以改变这个getTargetPos接口来实现
        let targetPos = pathFinder.getTargetPos()
        if(Math.abs(this._x - targetPos.x) < 0.01 && Math.abs(this._y - targetPos.y) < 0.01) {
            targetPos.recover()
            return;
        }
        
        let deltaTime = curTime - this._lastUpdateTime
        
        let moveDistance = this._speed * deltaTime * 0.001
        if(moveDistance < 0.1)
            return;

        this._lastUpdateTime = curTime

        if(moveDistance > pathFinder.gridSize * 0.5){
            moveDistance = pathFinder.gridSize * 0.5
        }

        if (MathUtils.squareLen(this._x - targetPos.x, this._y - targetPos.y) < moveDistance * moveDistance) {
            this._x = targetPos.x
            this._y = targetPos.y
            targetPos.recover()
            return;
        }

        let dir = Laya.Point.create().setTo(0, 0)
        let gridPos = pathFinder.pos2GridPos(this._x, this._y)
        let targetGridPos = pathFinder.pos2GridPos(targetPos.x, targetPos.y)
        if(gridPos.x == targetGridPos.x && gridPos.y == targetGridPos.y) {
            dir.setTo(targetPos.x - this._x, targetPos.y - this._y)
            dir.normalize()   
        }else{
            let minP = 999999
            for(let i = -1; i<=1; i++)
                for(let j = -1; j<=1; j++) {
                    if(i == 0 && j == 0)
                        continue;

                    let p = pathFinder.getPotentialValue(gridPos.x + i, gridPos.y + j)
                    if(p < minP) {
                        minP = p
                        dir.setTo(i, j)
                    }
                }

            if(dir.x == 0 && dir.y == 0) {
                gridPos.recover()
                targetGridPos.recover()
                targetPos.recover()
                dir.recover()
                return;
            }

            let dirTargetPos = pathFinder.gridPos2Pos(gridPos.x + dir.x, gridPos.y + dir.y)
            dir.setTo(dirTargetPos.x - this._x, dirTargetPos.y - this._y)
            dir.normalize()

        }
        
        targetGridPos.recover()
        gridPos.recover()
        targetPos.recover()
        
        this._x = this._x + dir.x * moveDistance
        this._y = this._y + dir.y * moveDistance

        dir.recover()
    }
}