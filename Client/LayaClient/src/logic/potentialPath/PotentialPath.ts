// jojohello 2023-6-8 势能寻路

import { PathFindAgent } from "./PathFindAgent"

export class PotentialPath {
    private _width:number = 0
    private _height:number = 0
    private _gridSize:number = 0
    private _canWalkMap:boolean[] = null
    private _potentialMap:number[] = null
    private _agentMap:Map<number, PathFindAgent> = new Map<number, PathFindAgent>()

    private _targetPos:Laya.Point = new Laya.Point().setTo(0, 0)

    readonly MAX_POTENTIAL:number = 999999

    constructor (tMap: Laya.TiledMap) {
        this._width = tMap.numColumnsTile;
        this._height = tMap.numRowsTile;
        this._potentialMap = new Array(this._width * this._height);
        this._canWalkMap = new Array(this._width * this._height);
        this._gridSize = tMap.tileWidth;

        // 设置障碍物信息
        let layer = tMap.getLayerByName("collision");
        for(let i = 0; i < this._canWalkMap.length; i++) {
            let pos = this.index2GridPos(i);
            this._canWalkMap[i] = layer.getTileData(pos.x, pos.y) > 0;
            pos.recover();
        }

        // 设置目标点，并且计算势能图
        let tEndPoint = tMap.getLayerObject("object", "endPoint");
        this.setTargetPos(tEndPoint.x, tEndPoint.y);
    }

    public getPotentialValue (gridX:number, gridY:number) : number {
        let index = this.gridPos2Index(gridX, gridY);
        if(index < 0 )
            return this.MAX_POTENTIAL;

        return this._potentialMap[index];
    }

    public getTargetPos() : Laya.Point {
        return Laya.Point.create().setTo(this._targetPos.x, this._targetPos.y);
    }
    
    public get gridSize() : number {
        return this._gridSize
    }

    public pos2GridPos (x:number, y:number) : Laya.Point {
        let gridX = Math.floor(x / this._gridSize)
        let gridY = Math.floor(y / this._gridSize)
        return Laya.Point.create().setTo(gridX, gridY)
    }


    public gridPos2Index(x:number, y:number) : number {
        if(x<0 || x>=this._width || y<0 || y>=this._height)
            return -1;

        return x + y * this._width
    }

    public gridPos2Pos(x:number, y:number) : Laya.Point {
        let posX = x * this._gridSize + this._gridSize / 2
        let posY = y * this._gridSize + this._gridSize / 2
        return Laya.Point.create().setTo(posX, posY)
    }

    public index2GridPos(index:number) : Laya.Point {
        let x = index % this._width
        let y = Math.floor(index / this._width)
        let ret = Laya.Point.create()
        ret.setTo(x, y)
        return ret
    }

    public pos2Index(x:number, y:number) : number {
        let gridX = Math.floor(x / this._gridSize)
        let gridY = Math.floor(y / this._gridSize)
        return this.gridPos2Index(gridX, gridY)
    }

    public addAgent(uid:number, agent:PathFindAgent) {
        this._agentMap.set(uid, agent)
    }

    public removeAgent(uid:number) {
        this._agentMap.delete(uid)
    }
    /**
	* 设置目标点，并且计算出格子势能图
    * @param x 目标点x，浮点型，为世界逻辑坐标
    * @param y 目标点y，浮点型，为世界逻辑坐标
	*/
    public setTargetPos(x:number, y:number) {
        this._targetPos.setTo(x, y)

        for(let i=0; i<this._potentialMap.length; i++){
            this._potentialMap[i] = this.MAX_POTENTIAL;
        }

        let index = this.pos2Index(x, y)
        let curProtenial = 0
        this._potentialMap[index] = curProtenial

        let openStack: Laya.Point[] = []
        let startPoint = Laya.Point.create().setTo(Math.floor(x / this._gridSize), Math.floor(y / this._gridSize)) 
        openStack.push(startPoint)

        let closeMap: Map<number, boolean> = new Map<number, boolean>()

        while(openStack.length > 0) {
            curProtenial++;
            let openCount = openStack.length
            for(; openCount > 0; openCount--) {
                let curPoint = openStack.shift()
                let gridX = curPoint.x
                let gridY = curPoint.y
                let curIndex = this.gridPos2Index(gridX, gridY)
                closeMap.set(curIndex, true)

                for(let i = -1; i<=1; i++)
                    for(let j = -1; j<=1; j++) {
                        if(i == 0 && j == 0) {
                            continue
                        }

                        if(Math.abs(i) == 1 && Math.abs(j) == 1) {
                            continue
                        }

                        let newX = gridX + i
                        let newY = gridY + j

                        if(newX < 0 || newX >= this._width || newY < 0 || newY >= this._height ) 
                            continue;

                        let newIndex = this.gridPos2Index(newX, newY)

                        if(closeMap.has(newIndex)) {
                            continue;
                        }

                        let newPoint = Laya.Point.create().setTo(newX, newY)
                        if(openStack.find((value, index, obj) => {  return value.x == newPoint.x && value.y == newPoint.y })) {
                            newPoint.recover();
                            continue;
                        }

                        if(this._canWalkMap[newIndex]) {
                            this._potentialMap[newIndex] = curProtenial
                            openStack.push(newPoint)
                        }else{
                            this._potentialMap[newIndex] = this.MAX_POTENTIAL;
                            closeMap.set(newIndex, true)
                            newPoint.recover();
                        }
                    }

                curPoint.recover();  
            }
        }

        // // jojohello log
        // for(let i = 0; i < this._potentialMap.length; i++) {
        //     let pos = this.index2GridPos(i)
        //     pos.x = pos.x * this._gridSize + this._gridSize / 2
        //     pos.y = pos.y * this._gridSize + this._gridSize / 2

        //     let value = this._potentialMap[i]

        //     let text = new Laya.Text()
        //     text.color = "#ff0000"
        //     // if(this.canWalkMap[i]) {
        //     //     text.text = "o";
        //     // }else{
        //     //     text.text = "x";
        //     // }
        //     if(value == this.MAX_POTENTIAL) {
        //         text.text = "x";
        //     }else{
        //         text.text = value + "";
        //     }

        //     Laya.stage.addChild(text)
        //     text.pos(pos.x, pos.y)

        //     pos.recover();
        // }       
    }

    public update(curTime)
    {
        for(let agent of this._agentMap.values()) {
            agent.updatePos(curTime, this)
        }
    }
}