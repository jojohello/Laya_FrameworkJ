/**
 * 空间分割模块（代理模式优化版）
 * 提供场景网格划分功能，减少碰撞检测范围
 * 
 * 设计原则：
 * - 使用 Set 存储网格数据（O(1) 增删性能）
 * - 代理模式：对象主动更新自己的网格位置
 * - 边界对比：O(1) 判断是否需要更新
 * - 不适合动态加载的无限地图
 * - 不适合移动非常快的物体（如子弹）
 * 
 * 使用示例：
 * ```typescript
 * const space = new SpaceSegmentation();
 * space.setMapSize(2000, 2000);
 * 
 * // 对象主动更新（在 update() 中调用）
 * const newBounds = space.calcGridBounds(obj.x, obj.y, obj.range);
 * space.updateObjectHash(obj.uid, obj._lastGridBounds, newBounds);
 * 
 * // 获取范围内的对象 ID
 * const ids = space.getObjInRange(x, y, range);
 * ```
 */
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";

type GridBounds = { lx: number, rx: number, ty: number, by: number };

export class SpaceSegmentation {
    // ========== 配置参数 ==========

    /** 网格缩放比例（每个格子的像素大小 = 1/_scale） */
    public _scale: number = 0.0125;  // 默认 80*80 像素格子

    /** 地图宽度 */
    private _width: number = 0;

    /** 地图高度 */
    private _height: number = 0;

    /** 起始 X 坐标偏移 */
    private _startX: number = 0;

    /** 起始 Y 坐标偏移 */
    private _startY: number = 0;

    /** 最大 X 网格索引 */
    private _maxX: number = 0;

    /** 最大 Y 网格索引 */
    private _maxY: number = 0;

    /** 网格哈希表（hashId -> Set<uid>）使用 Set 提供O(1)增删性能 */
    private _hashMap: Map<number, Set<number>> | null = null;

    /** 是否启用 */
    private _enabled: boolean = true;

    /** 上次更新时间 */
    private _lastUpdateTime: number = -1;

    /** 更新间隔（秒）- 批量更新模式使用 */
    private _delta: number = 0.1;

    /** 是否筛选特定类型对象（代理模式下不再使用） */
    private _filterObjTypes: number[] | null = null;

    // ========== 初始化 ==========

    /**
     * 设置地图尺寸
     * @param width 地图宽度
     * @param height 地图高度
     * @param scale 网格缩放比例（可选）
     */
    public setMapSize(width: number, height: number, scale?: number): void {
        this._width = Math.max(0, width);
        this._height = Math.max(0, height);
        if (scale !== undefined && scale > 0) {
            this._scale = scale;
        }
        this._maxX = Math.max(1, Math.ceil(this._width * this._scale));
        this._maxY = Math.max(1, Math.ceil(this._height * this._scale));

        if (this._hashMap) {
            this.clear();
        } else {
            this._hashMap = new Map();
        }
    }

    /**
     * 设置起始偏移（用于地图滚动）
     * @param x 起始 X
     * @param y 超始 Y
     * @param objDict 对象字典
     */
    public setStartPos(x: number, y: number, objDict: Map<number, BaseSceneObj>): void {
        this._startX = x;
        this._startY = y;
        this.setCollisionMap(objDict);
    }

    /**
     * 设置对象类型筛选
     * @param types 需要加入碰撞表的对象类型数组
     */
    public setFilterObjTypes(types: number[] | null): void {
        this._filterObjTypes = types;
    }

    /**
     * 清空哈希表
     */
    public clear(): void {
        if (this._hashMap) {
            this._hashMap.clear();
        }
    }

    /**
     * 是否启用
     */
    public isEnabled(): boolean {
        return this._enabled && this._hashMap !== null;
    }

    /**
     * 设置启用状态
     */
    public setEnabled(enabled: boolean): void {
        this._enabled = enabled;
    }

    // ========== 代理模式更新（新） ==========

    /**
     * 计算网格边界
     * @param x 中心 X
     * @param y 中心 Y
     * @param range 范围半径
     * @returns 网格边界 { lx, rx, ty, by }
     */
    public calcGridBounds(x: number, y: number, range: number): GridBounds {
        range = this.normalizeRange(range);

        let lx = this.xToHashIndex(x - range);
        let rx = this.xToHashIndex(x + range);
        let ty = this.yToHashIndex(y - range);
        let by = this.yToHashIndex(y + range);

        return this.normalizeBounds({ lx, rx, ty, by });
    }

    /**
     * 更新对象哈希（代理模式核心方法）
     * @param uid 对象唯一 ID
     * @param oldBounds 旧边界（null 表示首次添加）
     * @param newBounds 新边界
     */
    public updateObjectHash(uid: number, oldBounds: GridBounds | null, newBounds: GridBounds): void {
        if (!this._hashMap || !this.isGridReady()) return;

        oldBounds = oldBounds ? this.normalizeBounds(oldBounds) : null;
        newBounds = this.normalizeBounds(newBounds);

        // 从旧网格删除
        if (oldBounds) {
            for (let ix = oldBounds.lx; ix <= oldBounds.rx; ix++) {
                for (let iy = oldBounds.ty; iy <= oldBounds.by; iy++) {
                    const hashId = iy * this._maxX + ix;
                    const hashSet = this._hashMap.get(hashId);
                    if (hashSet) {
                        hashSet.delete(uid);  // O(1) 删除
                    }
                }
            }
        }

        // 向新网格添加
        for (let ix = newBounds.lx; ix <= newBounds.rx; ix++) {
            for (let iy = newBounds.ty; iy <= newBounds.by; iy++) {
                const hashId = iy * this._maxX + ix;

                if (!this._hashMap.has(hashId)) {
                    this._hashMap.set(hashId, new Set());
                }

                this._hashMap.get(hashId)!.add(uid);  // O(1) 添加
            }
        }
    }

    /**
     * 移除对象哈希（对象释放时调用）
     * @param uid 对象唯一 ID
     * @param bounds 对象边界
     */
    public removeObjectHash(uid: number, bounds: GridBounds): void {
        if (!this._hashMap || !this.isGridReady()) return;

        bounds = this.normalizeBounds(bounds);

        for (let ix = bounds.lx; ix <= bounds.rx; ix++) {
            for (let iy = bounds.ty; iy <= bounds.by; iy++) {
                const hashId = iy * this._maxX + ix;
                const hashSet = this._hashMap.get(hashId);
                if (hashSet) {
                    hashSet.delete(uid);  // O(1) 删除
                }
            }
        }
    }

    /**
     * 首次添加对象哈希
     * @param uid 对象唯一 ID
     * @param x 中心 X
     * @param y 中心 Y
     * @param range 范围半径
     */
    public addObjectHash(uid: number, x: number, y: number, range: number): void {
        if (!this._hashMap) return;

        const bounds = this.calcGridBounds(x, y, range);
        this.updateObjectHash(uid, null, bounds);
    }

    // ========== 批量更新（保留兼容） ==========

    /**
     * 批量更新空间分割表（兼容旧模式，不建议使用）
     * @param curTime 当前时间
     * @param objDict 对象字典（uid -> BaseSceneObj）
     * @deprecated 建议使用代理模式 updateObjectHash
     */
    public update(curTime: number, objDict: Map<number, BaseSceneObj>): void {
        if (this._lastUpdateTime > 0 && curTime - this._lastUpdateTime < this._delta) {
            return;
        }

        this._lastUpdateTime = curTime;
        this.setCollisionMap(objDict);
    }

    /**
     * 批量建立空间分割表（兼容旧模式，不建议使用）
     * @param objDict 对象字典
     * @deprecated 建议使用代理模式 updateObjectHash
     */
    public setCollisionMap(objDict: Map<number, BaseSceneObj>): void {
        if (!this._hashMap) {
            this._hashMap = new Map();
        } else {
            this.clear();
        }

        for (const obj of objDict.values()) {
            // 类型筛选
            if (this._filterObjTypes) {
                if (!this._filterObjTypes.includes(obj.getObjType())) {
                    continue;
                }
            }

            if (!obj.hasCollisionBox || obj.range <= 0) {
                continue;
            }

            this.addObjectHash(obj.uid, obj.x, obj.y, obj.range);
        }
    }

    // ========== 坐标转换 ==========

    /**
     * 坐标转哈希 ID
     * @param x X 坐标
     * @param y Y 坐标
     * @returns 哈希 ID（-1 表示超出范围）
     */
    public hash(x: number, y: number): number {
        if (!this.isGridReady()) {
            return -1;
        }

        if (x < this._startX || x > this._startX + this._width ||
            y < this._startY || y > this._startY + this._height) {
            return -1;
        }

        const ix = this.clampGridX(this.xToHashIndex(x));
        const iy = this.clampGridY(this.yToHashIndex(y));
        return iy * this._maxX + ix;
    }

    /**
     * X 坐标转网格索引
     */
    public xToHashIndex(f: number): number {
        return Math.floor((f - this._startX) * this._scale);
    }

    /**
     * Y 坐标转网格索引
     */
    public yToHashIndex(f: number): number {
        return Math.floor((f - this._startY) * this._scale);
    }

    /**
     * 网格索引转世界坐标
     */
    public toWorldPos(index: number): { x: number, y: number } {
        if (!this.isGridReady()) {
            return { x: this._startX, y: this._startY };
        }

        const x = index % this._maxX / this._scale + this._startX;
        const y = Math.floor(index / this._maxX) / this._scale + this._startY;
        return { x, y };
    }

    // ========== 查询 ==========

    /**
     * 获取范围内的对象 ID
     * @param x 中心 X
     * @param y 中心 Y
     * @param range 范围半径
     * @returns 对象 ID 集合
     */
    public getObjInRange(x: number, y: number, range: number, outSet?: Set<number>): Set<number> | null {
        if (!this._hashMap) {
            return null;
        }

        range = this.normalizeRange(range);

        const lx = this.xToHashIndex(x - range);
        const rx = this.xToHashIndex(x + range);
        const ty = this.yToHashIndex(y - range);
        const by = this.yToHashIndex(y + range);

        return this.getObjs(lx, rx, ty, by, outSet);
    }

    /**
     * 获取矩形范围内的对象 ID
     * @param x1 起点 X
     * @param y1 起点 Y
     * @param x2 终点 X
     * @param y2 终点 Y
     * @param range 范围半径
     * @returns 对象 ID 集合
     */
    public getObjInRect(x1: number, y1: number, x2: number, y2: number, range: number, outSet?: Set<number>): Set<number> | null {
        if (!this._hashMap) {
            return null;
        }

        range = this.normalizeRange(range);

        const lx = this.xToHashIndex(Math.min(x1, x2) - range);
        const rx = this.xToHashIndex(Math.max(x1, x2) + range);
        const ty = this.yToHashIndex(Math.min(y1, y2) - range);
        const by = this.yToHashIndex(Math.max(y1, y2) + range);

        return this.getObjs(lx, rx, ty, by, outSet);
    }

    /**
     * 获取网格范围内的对象
     */
    private getObjs(lx: number, rx: number, ty: number, by: number, outSet?: Set<number>): Set<number> {
        const bounds = this.normalizeBounds({ lx, rx, ty, by });
        const retSet = outSet || new Set<number>();
        retSet.clear();

        if (!this._hashMap || !this.isGridReady()) {
            return retSet;
        }

        for (let ix = bounds.lx; ix <= bounds.rx; ix++) {
            for (let iy = bounds.ty; iy <= bounds.by; iy++) {
                const hashId = iy * this._maxX + ix;

                const hashSet = this._hashMap!.get(hashId);
                if (hashSet && hashSet.size > 0) {
                    // Set 遍历
                    for (const uid of hashSet) {
                        retSet.add(uid);
                    }
                }
            }
        }

        return retSet;
    }

    // ========== 工具 ==========

    /**
     * 获取网格大小
     */
    public getGridSize(): number {
        return 1 / this._scale;
    }

    /**
     * 获取哈希表大小
     */
    public getHashMapSize(): number {
        return this._hashMap ? this._hashMap.size : 0;
    }

    private normalizeRange(range: number): number {
        if (!Number.isFinite(range) || range <= 0) {
            return 0;
        }
        return range;
    }

    private normalizeBounds(bounds: GridBounds): GridBounds {
        const lx = Math.min(bounds.lx, bounds.rx);
        const rx = Math.max(bounds.lx, bounds.rx);
        const ty = Math.min(bounds.ty, bounds.by);
        const by = Math.max(bounds.ty, bounds.by);

        return {
            lx: this.clampGridX(lx),
            rx: this.clampGridX(rx),
            ty: this.clampGridY(ty),
            by: this.clampGridY(by),
        };
    }

    private isGridReady(): boolean {
        return this._scale > 0 && this._maxX > 0 && this._maxY > 0;
    }

    private clampGridX(index: number): number {
        if (this._maxX <= 0) return 0;
        if (index < 0) return 0;
        if (index >= this._maxX) return this._maxX - 1;
        return index;
    }

    private clampGridY(index: number): number {
        if (this._maxY <= 0) return 0;
        if (index < 0) return 0;
        if (index >= this._maxY) return this._maxY - 1;
        return index;
    }
}
