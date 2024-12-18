// 提供场景切分功能，减少范围内碰撞之类计算的次数
// 要根据游戏类型，不一定要使用
// 不适合动态加载的无限地图

import { SceneObjType } from "../sceneObjs/SceneObjType";

export default class SpaceSegmentation {
    public _scale: number = 0.0125;  // 相当于每个格子为80*80像素宽度，要根据游戏适当调整
    private _width: number;
    private _height: number;
    private _startX: number = 0;
    private _startY: number = 0;
    private _maxX: number;
    private _maxY: number;
    private _hashMap: Map<number, number[]> = null;
    private _lastUpdateTime: number = -1;
    private _delta: number = 0.1;   // 0.1秒更新一次,不是每帧更新，因此对于移动非常块的物体，比如子弹，不适用

    private _isDebug: boolean = true;
    private _debugSprite: Laya.Sprite = null;

    public setMapSize(width: number, height: number, _scale?: number) {
        this._width = width;
        this._height = height;
        this._scale = _scale || this._scale;
        this._maxX = Math.ceil(width * this._scale);
        this._maxY = Math.ceil(height * this._scale);

        if (this._hashMap) {
            this.clear();
        }else{
            this._hashMap = new Map<number, number[]>();
        }
    }

    /** 改变左上角起始偏移值，改变后要马上重新做一次值重置 */
    public setStartPos(x: number, y: number, objDict: Map<number, any>) {
        this._startX = x;
        this._startY = y;

        this.setCollisionMap(objDict);
    }

    public hash(x: number, y: number): number {
        if (x < 0 || x > this._width || y < 0 || y > this._height) {
            return -1;
        }

        return Math.ceil(x * this._scale) + Math.ceil(y * this._scale) * this._maxX;
    }

    // 这个表的重置，是有可能性能消耗最大的地方，以后是有可能需要优化的
    public clear() {
        this._hashMap.clear();
    }

    public update(curTime: number, objDict: Map<number, any>) {
        if (this._lastUpdateTime > 0 && curTime - this._lastUpdateTime < this._delta) {
            return;
        }

        this._lastUpdateTime = curTime;
        this.setCollisionMap(objDict);
    }

    // jojohello to do 要筛选，部分物体不需要加入到碰撞表中
     /** 建立场景物体空间切割的树，在1000个格子500个物体的情况下，建立此数据大概需要4ms，消耗比较大，要谨慎控制 */
    public setCollisionMap(objDict: Map<number, any>) {
        if (!this._hashMap) {
            this._hashMap = new Map<number, number[]>();
        } else {
            this.clear();
        }

        for (const obj of objDict.values()) {
            // 这里属于游戏特色代码，后面想想不要放这里
            if(obj.getObjType() != SceneObjType.Monster){
                continue;
            }

            this.setCollision(obj.x, obj.y, obj.getRange(), obj.uid);
        }

        // if(this._isDebug){
        //     if(!this._debugSprite){
        //         this._debugSprite = new Laya.Sprite();
        //         Laya.stage.addChild(this._debugSprite);
        //     }

        //     this._debugSprite.graphics.clear();
        //     let x, y = 0;
        //     let w = 1 / this._scale;

            
        //     for(const key of this._hashMap.keys()){
        //         x = key % this._maxX - 1;
        //         if(x < 0)
        //             x += this._maxX;

        //         y = Math.floor(key / this._maxX) - 1;

        //         this._debugSprite.graphics.drawRect(x * w, y * w, w, w, "#000088");
        //     }
        // }
    }

    private setCollision(x: number, y: number, range: number, id: number) {
        let lx, rx, ty, by;
        lx = this.xToHashIndex(x - range);
        rx = this.xToHashIndex(x + range);
        ty = this.yToHashIndex(y - range);
        by = this.yToHashIndex(y + range);
        lx = lx < 0 ? 0 : lx;
        rx = rx > this._maxX ? this._maxX : rx;
        ty = ty < 0 ? 0 : ty;
        by = by > this._maxY ? this._maxY : by;

        for (let ix = lx; ix <= rx; ix++) {
            for (let iy = ty; iy <= by; iy++) {
                const hashId = iy * this._maxX + ix;

                if (!this._hashMap.has(hashId)) {
                    this._hashMap.set(hashId, []);
                }

                this._hashMap.get(hashId).push(id);
            }
        }
    }

    public xToHashIndex(f:number):number{
        return Math.floor((f - this._startX) * this._scale);
    }

    public yToHashIndex(f: number): number { 
        return Math.floor((f - this._startY) * this._scale);
    }

    public toWorldPos(index:number){
        let x = index % this._maxX / this._scale + this._startX;
        let y = Math.floor(index / this._maxX) / this._scale + this._startY;
    }

    public getObjInRange(x: number, y: number, range: number): Set<number> {
        if (!this._hashMap) {
            return null;
        }
        
        let lx, rx, ty, by;
        lx = this.xToHashIndex(x - range);
        rx = this.xToHashIndex(x + range)
        ty = this.yToHashIndex(y - range);
        by = this.yToHashIndex(y + range);

        // if(retSet.size > 0)
        // {
        //     console.error("jojohello getObjInRange retSet.size = " + retSet.size);
        // }

        // if(this._isDebug){
        //     if(!this._debugSprite){
        //         this._debugSprite = new Laya.Sprite();
        //         Laya.stage.addChild(this._debugSprite);
        //     }

        //     this._debugSprite.graphics.clear();
        //     this._debugSprite.graphics.drawRect((lx - 1)/this._scale, (ty - 1)/this._scale, (rx - lx + 1)/this._scale, (by - ty + 1)/this._scale, "#000088");
        //     this._debugSprite.graphics.drawCircle(x, y, range, "#008800");
        // }

        return this.getObjs(lx, rx, ty, by);
    }

    public getObjInRect(x1:number, y1:number, x2:number, y2:number, range: number): Set<number> {
        if (!this._hashMap) {
            return null;
        }

        let lx, rx, ty, by;
        lx = this.xToHashIndex(Math.min(x1, x2) - range);
        rx = this.xToHashIndex(Math.max(x1, x2) + range)
        ty = this.yToHashIndex(Math.min(y1, y2) - range);
        by = this.yToHashIndex(Math.max(y1, y2) + range);
        return this.getObjs(lx, rx, ty, by);
    }

    private getObjs(lx, rx, ty, by): Set<number> {
        lx = lx < 0 ? 0 : lx;
        rx = rx > this._maxX ? this._maxX : rx;
        ty = ty < 0 ? 0 : ty;
        by = by > this._maxY ? this._maxY : by;

        let retSet = new Set<number>();
        let hashId = lx;

        for (let ix = lx; ix <= rx; ix++) {
            for (let iy = ty; iy <= by; iy++) {
                hashId = iy * this._maxX + ix;

                const itemList = this._hashMap.get(hashId);
                if (itemList && itemList.length > 0) {
                    for (let i = 0; i < itemList.length; i++) {
                        retSet.add(itemList[i]);
                    }
                }
            }
        }

        return retSet;
    }
}