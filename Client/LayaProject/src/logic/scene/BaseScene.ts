/**
 * 场景基类
 * 所有游戏场景的基础类，定义场景生命周期
 * 
 * 设计原则：
 * - 不包含 TiledMap（简化版）
 * - 使用 SceneTime 管理时间
 * - 与 SceneMgr 配合管理场景切换
 */
import { SceneTime } from "./SceneTime";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { SpaceSegmentation } from "./SpaceSegmentation";
import IDFactory from "../utils/IDFactory";
import { SceneLayerNames, SceneLayerType } from "./SceneLayerType";
import { SceneCamera2D } from "./SceneCamera2D";
import { MathUtils } from "../utils/MathUtils";
import { BaseSceneMap } from "../map/BaseSceneMap";
import { SceneMapFactory } from "../map/SceneMapFactory";
import { inferSceneMapType, SceneMapConfig } from "../map/SceneMapTypes";

/**
 * 场景基类
 */
export class BaseScene {
    /** 场景时间管理 */
    protected _sceneTime: SceneTime;

    /** 场景是否已就绪 */
    protected _isReady: boolean = false;

    /** 场景配置，由 SceneMgr 注入 */
    protected _sceneConfig: any = null;

    /** 当前场景地图 */
    protected _map: BaseSceneMap | null = null;

    /** 地图异步加载令牌，避免退出后旧回调污染新场景 */
    protected _mapLoadToken: number = 0;

    /** 场景是否已经完成过首次进入 */
    protected _hasEntered: boolean = false;

    /** 缓存场景再次进入时是否重建空间索引 */
    protected _rebuildSpaceOnResume: boolean = true;

    /** 固定更新间隔（秒） */
    protected _fixedTime: number = 0.1;

    /** 上次固定更新时间 */
    protected _lastFixedTime: number = 0;

    // ========== 场景对象管理 ==========

    /** 场景对象映射（uid -> BaseSceneObj） */
    protected _objMap: Map<number, BaseSceneObj> = new Map();

    /** 待删除对象 ID 列表 */
    protected _delIdList: number[] = [];

    /** 待删除对象 ID 集合，避免重复入队 */
    protected _delIdSet: Set<number> = new Set();

    /** 按类型分类的对象 ID 映射（objType -> uid[]） */
    protected _typeMap: Map<number, number[]> = new Map();

    /** 空间分割管理器 */
    protected _spaceManager: SpaceSegmentation | null = null;

    /** 按队伍拆分的空间切割管理器（team -> SpaceSegmentation） */
    protected _teamSpaceManagers: Map<number, SpaceSegmentation> = new Map();

    /** 空间切割地图配置 */
    protected _spaceMapWidth: number = 2000;
    protected _spaceMapHeight: number = 2000;
    protected _spaceMapScale: number | undefined = undefined;

    /** 场景显示根节点 */
    protected _layerRoot: Laya.Sprite | null = null;

    /** 标准场景层级 */
    protected _layers: Map<SceneLayerType, Laya.Sprite> = new Map();

    /** 场景 2D 相机 */
    protected _camera: SceneCamera2D | null = null;

    constructor() {
        this._sceneTime = new SceneTime();
    }

    // ========== 场景生命周期 ==========

    /**
     * 场景进入
     * @param param 场景参数
     */
    onEnter(param?: any): void {
        // 首次进入创建空间分割；缓存恢复默认按当前对象表重建，避免旧 hash 残留。
        if (!this._hasEntered) {
            this.initSpaceManagers();
            this._hasEntered = true;
        } else if (this._rebuildSpaceOnResume) {
            this.rebuildSpaceManagers();
        } else {
            this.ensureSpaceManagersForResume();
        }
        this.createSceneLayers();
        this.createSceneCamera();
        this.setSceneLayersVisible(true);
        if (this._camera) {
            this._camera.setActive(true);
        }

        this._sceneTime.start();
        this.loadSceneMap();
    }

    /**
     * 场景退出
     */
    onExit(): void {
        this._isReady = false;
        this._sceneTime.stop();
        this.setSceneLayersVisible(false);
        if (this._camera) {
            this._camera.setActive(false);
        }
        this._mapLoadToken++;
    }

    /**
     * 场景销毁
     */
    onDestroy(): void {
        this._isReady = false;
        this._sceneTime.stop();

        // 销毁空间分割管理器
        if (this._spaceManager) {
            this._spaceManager.clear();
            this._spaceManager.setEnabled(false);
        }
        this._teamSpaceManagers.forEach(spaceManager => {
            spaceManager.clear();
            spaceManager.setEnabled(false);
        });
        this._teamSpaceManagers.clear();
        this._spaceManager = null;

        // 销毁所有场景对象
        this.clearAllObjects();
        this._objMap.clear();
        this._typeMap.clear();
        this._delIdList.length = 0;
        this._delIdSet.clear();
        this._hasEntered = false;
        this.releaseSceneMap();
        this.destroySceneCamera();
        this.destroySceneLayers();
    }

    // ========== 更新循环 ==========

    /**
     * 每帧更新（由 SceneMgr 调用）
     * @param dt 时间间隔（秒）
     */
    update(dt: number): void {
        if (!this._isReady) return;

        const curTime = this._sceneTime.curTime();

        // 每帧更新
        this.onUpdate(curTime, dt);

        // 延迟更新
        this.onLateUpdate(curTime);
        if (this._camera) {
            this._camera.update();
            this.updateSceneMapViewPort();
        }

        // 固定间隔更新（用于 AI 思考、帧同步等）
        if (curTime - this._lastFixedTime > this._fixedTime) {
            this.onFixedUpdate(curTime);
            this._lastFixedTime = curTime;
        }
    }

    /**
     * 每帧更新逻辑
     * @param curTime 当前时间
     * @param dt 时间间隔
     */
    protected onUpdate(curTime: number, dt: number): void {
        // 更新所有场景对象
        for (const obj of this._objMap.values()) {
            if (obj.isRelease) {
                this.addDeleteId(obj.uid);
            } else {
                obj.update(curTime);
            }
        }
    }

    /**
     * 延迟更新（用于位置确认等）
     * @param curTime 当前时间
     */
    protected onLateUpdate(curTime: number): void {
        // 延迟更新所有场景对象
        for (const obj of this._objMap.values()) {
            if (!obj.isRelease) {
                obj.lateUpdate(curTime);
            }
        }

        // 清理已释放的对象
        this.deleteObjectFromScene();
    }

    /**
     * 固定间隔更新（用于 AI 思考、帧同步）
     * @param curTime 当前时间
     */
    protected onFixedUpdate(curTime: number): void {
        // 固定间隔更新所有场景对象
        for (const obj of this._objMap.values()) {
            if (!obj.isRelease) {
                obj.fixedUpdate(curTime);
            }
        }
    }

    // ========== 工具方法 ==========

    /**
     * 获取当前时间
     */
    get curTime(): number {
        return this._sceneTime.curTime();
    }

    /**
     * 获取场景是否就绪
     */
    get isReady(): boolean {
        return this._isReady;
    }

    /**
     * 设置场景配置。SceneMgr 创建或恢复场景时注入。
     */
    setSceneConfig(config: any): void {
        this._sceneConfig = config;
    }

    /**
     * 设置固定更新间隔
     */
    setFixedTime(value: number): void {
        this._fixedTime = value;
    }

    // ========== 场景对象管理 API ==========

    /**
     * 创建场景对象
     * @param className 对象类名（需要通过 @regClass 注册）
     * @param cfgId 配置 ID
     * @param team 队伍 ID
     * @param x 初始 X 坐标
     * @param y 初始 Y 坐标
     * @param angle 初始角度
     * @returns 创建的对象实例
     */
    addObjectToScene(className: string, cfgId: number, team: number, x: number, y: number, angle: number): BaseSceneObj | null {
        // 生成唯一 ID
        const newId = IDFactory.GetID();

        // 从对象池获取或创建新实例
        let newObj: BaseSceneObj | null = null;

        // 尝试通过 ClassUtils 获取
        const ObjClass = Laya.ClassUtils.getClass(className) as any;
        if (ObjClass) {
            newObj = Laya.Pool.getItemByClass(className, ObjClass) as BaseSceneObj;
            if (!newObj) {
                newObj = new ObjClass() as BaseSceneObj;
            }
        }

        if (!newObj) {
            console.error(`[BaseScene] 无法创建场景对象: ${className}`);
            return null;
        }

        // 初始化对象
        newObj.init(newId, cfgId, this, team, x, y, angle);

        // 添加到映射
        this._objMap.set(newId, newObj);

        // 添加到类型映射
        const objType = newObj.getObjType();
        if (!this._typeMap.has(objType)) {
            this._typeMap.set(objType, []);
        }
        this._typeMap.get(objType)!.push(newId);

        return newObj;
    }

    /**
     * 删除场景对象
     * @param uid 对象唯一 ID
     */
    deleteObject(uid: number): void {
        const obj = this._objMap.get(uid);
        if (obj) {
            obj.release();
        }
    }

    /**
     * 获取场景对象
     * @param uid 对象唯一 ID
     */
    getObject(uid: number): BaseSceneObj | null {
        return this._objMap.get(uid) || null;
    }

    /**
     * 获取指定类型的对象数量
     * @param objType 对象类型
     */
    getObjectCount(objType: number): number {
        const ids = this._typeMap.get(objType);
        return ids ? ids.length : 0;
    }

    /**
     * 获取指定类型的所有对象 ID
     * @param objType 对象类型
     */
    getTypeUIDs(objType: number): number[] | null {
        return this._typeMap.get(objType) || null;
    }

    private addDeleteId(uid: number): void {
        if (uid <= 0 || this._delIdSet.has(uid)) return;
        this._delIdSet.add(uid);
        this._delIdList.push(uid);
    }

    /**
     * 清理已释放的对象
     */
    protected deleteObjectFromScene(): void {
        if (this._delIdList.length === 0) return;

        for (const uid of this._delIdList) {
            const obj = this._objMap.get(uid);
            if (obj) {
                // 从类型映射中移除
                const objType = obj.getObjType();
                const typeList = this._typeMap.get(objType);
                if (typeList) {
                    const index = typeList.indexOf(uid);
                    if (index !== -1) {
                        typeList.splice(index, 1);
                    }
                }

                // 根据对象策略决定回池或销毁
                const className = obj.getClassName();
                if (obj.cacheable) {
                    obj.onRecycle(this);
                    Laya.Pool.recover(className, obj);
                } else {
                    obj.onDispose(this);
                }

                // 从对象映射中移除
                this._objMap.delete(uid);
            }
        }

        this._delIdList.length = 0;
        this._delIdSet.clear();
    }

    /**
     * 清空所有对象
     */
    clearAllObjects(): void {
        for (const obj of this._objMap.values()) {
            const className = obj.getClassName();
            if (obj.cacheable) {
                obj.onRecycle(this);
                Laya.Pool.recover(className, obj);
            } else {
                obj.onDispose(this);
            }
        }
        this._objMap.clear();
        this._typeMap.clear();
        this._delIdList.length = 0;
        this._delIdSet.clear();
    }

    /**
     * 获取场景对象总数
     */
    get objectCount(): number {
        return this._objMap.size;
    }

    /**
     * 获取场景显示根节点
     */
    get layerRoot(): Laya.Sprite | null {
        return this._layerRoot;
    }

    /**
     * 获取场景相机
     */
    get camera(): SceneCamera2D | null {
        return this._camera;
    }

    /**
     * 获取当前场景地图。
     */
    get map(): BaseSceneMap | null {
        return this._map;
    }

    /**
     * 设置缓存场景恢复时的空间索引策略。
     * 默认 true：从当前对象表重建；false：尽量保留原空间表。
     */
    setRebuildSpaceOnResume(value: boolean): void {
        this._rebuildSpaceOnResume = value;
    }

    /**
     * 获取场景层级
     */
    getLayer(layerType: SceneLayerType): Laya.Sprite | null {
        return this._layers.get(layerType) || null;
    }

    /**
     * 获取场景层级，不存在时返回对象层。
     */
    getSafeLayer(layerType: SceneLayerType): Laya.Sprite | null {
        return this.getLayer(layerType) || this.getLayer(SceneLayerType.Object) || this._layerRoot;
    }

    /**
     * 获取空间分割管理器
     */
    getSpaceManager(team?: number): SpaceSegmentation | null {
        if (team === undefined || team === null) {
            return this._spaceManager;
        }

        let spaceManager = this._teamSpaceManagers.get(team);
        if (!spaceManager) {
            spaceManager = this.createSpaceManager();
            this._teamSpaceManagers.set(team, spaceManager);
        }

        return spaceManager;
    }

    /**
     * 设置空间分割地图大小
     */
    setSpaceMapSize(width: number, height: number, scale?: number): void {
        this._spaceMapWidth = width;
        this._spaceMapHeight = height;
        this._spaceMapScale = scale;

        if (this._spaceManager) {
            this._spaceManager.setMapSize(width, height, scale);
        }

        this._teamSpaceManagers.forEach(spaceManager => {
            spaceManager.setMapSize(width, height, scale);
        });

        for (const obj of this._objMap.values()) {
            obj.refreshSpaceHash();
        }

        if (this._camera) {
            this._camera.setBounds(0, Math.max(0, width - Laya.stage.width), 0, Math.max(0, height - Laya.stage.height));
        }
    }

    /**
     * 获取指定队伍范围内的对象 ID。
     */
    getObjInRangeByTeam(team: number, x: number, y: number, range: number, outSet?: Set<number>): Set<number> | null {
        const spaceManager = this.getSpaceManager(team);
        return spaceManager ? spaceManager.getObjInRange(x, y, range, outSet) : null;
    }

    /**
     * 获取指定队伍矩形范围内的对象 ID。
     */
    getObjInRectByTeam(team: number, x1: number, y1: number, x2: number, y2: number, range: number, outSet?: Set<number>): Set<number> | null {
        const spaceManager = this.getSpaceManager(team);
        return spaceManager ? spaceManager.getObjInRect(x1, y1, x2, y2, range, outSet) : null;
    }

    /**
     * 获取一段轨迹上的碰撞对象 ID。
     */
    getTrailCollision(
        master: BaseSceneObj,
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        range: number,
        filter?: (master: BaseSceneObj, target: BaseSceneObj) => boolean,
        searchTeam?: number,
        outList: number[] = [],
        sortResult: boolean = true
    ): number[] {
        outList.length = 0;

        const idsSet = this.getObjInRectByTeam(searchTeam ?? master.team, startX, startY, endX, endY, range);
        if (!idsSet || idsSet.size === 0) {
            return outList;
        }

        MathUtils.collisionTrailBatchReady(startX, startY, endX, endY, range);

        idsSet.forEach(uid => {
            if (uid === master.uid) return;

            const obj = this._objMap.get(uid);
            if (!obj || obj.isRelease || !obj.hasCollisionBox || obj.range <= 0) return;
            if (filter && !filter(master, obj)) return;

            if (MathUtils.collisionTrailBatch(endX, endY, range, obj.x, obj.y, obj.range)) {
                outList.push(uid);
            }
        });

        if (sortResult && outList.length > 1) {
            outList.sort((aid, bid) => {
                const a = this._objMap.get(aid);
                const b = this._objMap.get(bid);
                if (!a || !b) return 0;
                return MathUtils.squareDis(a.x, a.y, startX, startY) - MathUtils.squareDis(b.x, b.y, startX, startY);
            });
        }

        return outList;
    }

    get teamSpaceManagerCount(): number {
        return this._teamSpaceManagers.size;
    }

    private createSpaceManager(): SpaceSegmentation {
        const spaceManager = new SpaceSegmentation();
        spaceManager.setMapSize(this._spaceMapWidth, this._spaceMapHeight, this._spaceMapScale);
        return spaceManager;
    }

    private loadSceneMap(): void {
        const mapConfig = this.createSceneMapConfig();
        if (!mapConfig) {
            console.warn(`[${this.constructor.name}] No map config, scene ready without map`);
            this._isReady = true;
            this.refreshCameraBounds();
            return;
        }

        const mapLayer = this.getSafeLayer(SceneLayerType.Ground);
        if (!mapLayer) {
            console.error(`[${this.constructor.name}] Map layer not found, skip map load: ${mapConfig.path}`);
            this._isReady = true;
            return;
        }

        this._isReady = false;
        this.releaseSceneMap();
        const token = ++this._mapLoadToken;

        const sceneMap = SceneMapFactory.create(mapConfig);
        this._map = sceneMap;

        sceneMap.load(mapLayer).then(() => {
            if (token !== this._mapLoadToken || this._map !== sceneMap) {
                sceneMap.release();
                return;
            }

            this.onSceneMapLoaded(sceneMap);
        }).catch(error => {
            if (token !== this._mapLoadToken) return;
            console.error(`[${this.constructor.name}] Failed to load scene map: ${mapConfig.path}`, error);
            this.releaseSceneMap();
            this._isReady = true;
        });
    }

    private createSceneMapConfig(): SceneMapConfig | null {
        const config = this._sceneConfig;
        if (!config) return null;

        const rawPath = config.map || config.mapPath || config.respath || "";
        const path = typeof rawPath === "string" ? rawPath.trim() : "";
        if (!path) return null;

        return {
            type: inferSceneMapType(path, config.mapType),
            path,
            width: this.toPositiveNumber(config.mapWidth),
            height: this.toPositiveNumber(config.mapHeight),
            tileWidth: this.toPositiveNumber(config.tileWidth),
            tileHeight: this.toPositiveNumber(config.tileHeight),
            enableLinear: config.enableLinear === 1 || config.enableLinear === true,
            limitRange: config.limitRange === 1 || config.limitRange === true,
        };
    }

    private onSceneMapLoaded(sceneMap: BaseSceneMap): void {
        const width = sceneMap.width || this._spaceMapWidth;
        const height = sceneMap.height || this._spaceMapHeight;
        this.setSpaceMapSize(width, height, this._spaceMapScale);
        this.refreshCameraBounds();
        this.updateSceneMapViewPort();
        this._isReady = true;
    }

    private releaseSceneMap(): void {
        this._mapLoadToken++;
        if (this._map) {
            this._map.release();
            this._map = null;
        }
    }

    private updateSceneMapViewPort(): void {
        if (!this._map || !this._camera) return;
        this._map.updateViewPort(this._camera.x, this._camera.y, Laya.stage.width, Laya.stage.height);
    }

    private refreshCameraBounds(): void {
        if (!this._camera) return;
        this._camera.setBounds(0, Math.max(0, this._spaceMapWidth - Laya.stage.width), 0, Math.max(0, this._spaceMapHeight - Laya.stage.height));
    }

    private toPositiveNumber(value: any): number | undefined {
        const num = Number(value);
        return isFinite(num) && num > 0 ? num : undefined;
    }

    private initSpaceManagers(): void {
        this._teamSpaceManagers.clear();
        this._spaceManager = this.createSpaceManager();
    }

    private ensureSpaceManagersForResume(): void {
        if (this._spaceManager && this._spaceManager.isEnabled()) {
            return;
        }

        this.rebuildSpaceManagers();
    }

    private rebuildSpaceManagers(): void {
        if (this._spaceManager) {
            this._spaceManager.clear();
            this._spaceManager.setEnabled(false);
        }
        this._teamSpaceManagers.forEach(spaceManager => {
            spaceManager.clear();
            spaceManager.setEnabled(false);
        });
        this._teamSpaceManagers.clear();
        this._spaceManager = this.createSpaceManager();

        for (const obj of this._objMap.values()) {
            if (!obj.isRelease) {
                obj.rebindSpaceManager(this);
            }
        }
    }

    private createSceneLayers(): void {
        if (this._layerRoot) return;

        const layerMgr = (Laya.Browser.window as any).LayerMgr;
        const sceneLayer = layerMgr?.layers?.Scene as Laya.Sprite | undefined;
        if (!layerMgr?.layers || !sceneLayer) {
            console.error(`[${this.constructor.name}] Scene layers not found, cannot bind scene layers`);
            return;
        }

        this._layerRoot = sceneLayer;

        this._layers.clear();
        const layerTypes: SceneLayerType[] = [
            SceneLayerType.Background,
            SceneLayerType.Ground,
            SceneLayerType.Object,
            SceneLayerType.Bullet,
            SceneLayerType.Effect,
            SceneLayerType.Hud,
            SceneLayerType.Debug,
        ];

        for (const layerType of layerTypes) {
            const layerName = SceneLayerNames[layerType];
            const layer = layerMgr.layers[layerName] as Laya.Sprite | undefined;
            if (!layer) {
                console.error(`[${this.constructor.name}] Scene layer not found: ${layerName}`);
                continue;
            }
            const logicLayer = this.getOrCreateLogicLayer(layer, layerType);
            this._layers.set(layerType, logicLayer);
        }
    }

    private getOrCreateLogicLayer(parent: Laya.Sprite, layerType: SceneLayerType): Laya.Sprite {
        const layerName = `SceneLayer_${SceneLayerType[layerType]}`;
        let layer = parent.getChildByName(layerName) as Laya.Sprite;
        if (!layer) {
            layer = new Laya.Sprite();
            layer.name = layerName;
            layer.zOrder = layerType;
            layer.width = Laya.stage.width;
            layer.height = Laya.stage.height;
            parent.addChild(layer);
        }
        layer.visible = true;
        layer.zOrder = layerType;
        return layer;
    }

    private destroySceneLayers(): void {
        this.setSceneLayersVisible(false);
        this._layers.clear();
        this._layerRoot = null;
    }

    private setSceneLayersVisible(visible: boolean): void {
        this._layers.forEach(layer => {
            layer.visible = visible;
        });
    }

    private createSceneCamera(): void {
        if (!this._layerRoot || this._camera) return;
        this._camera = new SceneCamera2D(this._layerRoot);
        this._camera.setBounds(0, Math.max(0, this._spaceMapWidth - Laya.stage.width), 0, Math.max(0, this._spaceMapHeight - Laya.stage.height));
        this._camera.enableDrag(true, false);
    }

    private destroySceneCamera(): void {
        if (!this._camera) return;
        this._camera.release();
        this._camera = null;
    }
}
