/**
 * 场景对象基类
 * 所有场景内对象的基础类（怪物、塔、子弹等）
 * 
 * 设计原则：
 * - 简化版，不依赖 TiledMap
 * - 使用 Transform2D 管理位置和角度
 * - 支持对象池复用（Laya.Pool）
 * - 与 BaseScene 配合管理对象生命周期
 */
import { BaseScene } from "../scene/BaseScene";
import { SpaceSegmentation } from "../scene/SpaceSegmentation";
import { SceneLayerType } from "../scene/SceneLayerType";
import { ISceneObjModule } from "./ISceneObjModule";
import { Transform2D } from "./Transform2D";

/**
 * 场景对象基类
 */
export abstract class BaseSceneObj {
    // ========== 基础属性 ==========

    /** 唯一 ID */
    protected _uid: number = 0;

    /** 配置 ID */
    protected _cfgId: number = 0;

    /** 是否已释放 */
    protected _isRelease: boolean = false;

    /** 是否允许进入对象池复用，默认复用 */
    protected _cacheable: boolean = true;

    /** 队伍 ID（-1无队伍，0怪物方，1/2对立队伍） */
    protected _teamId: number = 0;

    /** 所属场景 */
    protected _scene: BaseScene | null = null;

    /** 是否死亡 */
    protected _isDead: boolean = false;

    // ========== 显示与变换 ==========

    /** 显示对象 */
    protected _model: Laya.Sprite | null = null;

    /** 默认显示层 */
    protected _displayLayerType: SceneLayerType = SceneLayerType.Object;

    /** 显示高度偏移 */
    protected _zOffset: number = 0;

    /** 2D 变换 */
    protected _transform: Transform2D;

    /** 功能模块列表，模块跟随 SceneObject 一起缓存 */
    protected _modules: ISceneObjModule[] = [];

    /** 碰撞范围 */
    protected _range: number = 0;

    /** 是否带有碰撞盒；只有带碰撞盒的对象才进入空间切割表 */
    protected _hasCollisionBox: boolean = false;

    /** 空间分割管理器引用 */
    protected _spaceManager: SpaceSegmentation | null = null;

    /** 上次的网格边界 */
    protected _lastGridBounds: { lx: number, rx: number, ty: number, by: number } | null = null;

    constructor() {
        this._transform = new Transform2D();
    }

    // ========== 初始化与销毁 ==========

    /**
     * 初始化场景对象
     * @param uid 唯一 ID
     * @param cfgId 配置 ID
     * @param scene 所属场景
     * @param team 队伍 ID
     * @param x 初始 X 坐标
     * @param y 初始 Y 坐标
     * @param angle 初始角度
     */
    init(uid: number, cfgId: number, scene: BaseScene, team: number, x: number, y: number, angle: number): void {
        this.reset();
        this._isRelease = false;
        this._isDead = false;
        this._uid = uid;
        this._cfgId = cfgId;
        this._teamId = team;
        this._scene = scene;

        // 对象池复用时，重置空间哈希状态
        this._lastGridBounds = null;
        this._spaceManager = scene.getSpaceManager(team);
        this._hasCollisionBox = false;
        this._zOffset = 0;

        // 设置初始位置和角度
        this._transform.setPos(x, y);
        this._transform.setAngle(angle);
        this._transform.forceUpdate();

        // 子类初始化
        this.onInit(uid, cfgId, scene, team, x, y, angle);

        // 加载资源
        this.loadRes();

        // 首次进入场景，更新空间哈希
        this.updateSpaceHash();
        this.callModuleOwnerInit();
    }

    /**
     * 新一轮生命周期开始前重置状态。
     * 对象池复用时必须先 reset 再 init。
     */
    reset(): void {
        this._isRelease = false;
        this._isDead = false;
        this._uid = 0;
        this._cfgId = 0;
        this._teamId = 0;
        this._scene = null;
        this._spaceManager = null;
        this._lastGridBounds = null;
        this._hasCollisionBox = false;
        this._range = 0;
        this._zOffset = 0;
        this._transform.setPos(0, 0);
        this._transform.setAngle(0);
        this._transform.forceUpdate();

        for (const module of this._modules) {
            module.reset();
        }
    }

    /**
     * 子类初始化（可选重写）
     */
    protected onInit(uid: number, cfgId: number, scene: BaseScene, team: number, x: number, y: number, angle: number): void {
        // 子类实现
    }

    /**
     * 加载并显示资源（必须重写）
     */
    protected abstract loadRes(): void;

    /**
     * 获取对象类型（必须重写）
     */
    abstract getObjType(): number;

    /**
     * 释放对象（标记为待删除）
     */
    release(): void {
        if (this._isRelease) return;
        this._isRelease = true;
        this._hasCollisionBox = false;

        // 立即从空间管理器删除
        if (this._spaceManager && this._lastGridBounds) {
            this._spaceManager.removeObjectHash(this._uid, this._lastGridBounds);
            this._lastGridBounds = null;
        }
    }

    /**
     * 对象回收到缓存池前清理（由场景调用）。
     * @param scene 所属场景
     */
    onRecycle(scene: BaseScene): void {
        this.recycleSpaceHash();

        for (const module of this._modules) {
            module.onRecycle();
        }

        if (this._model) {
            this._model.visible = false;
            this._model.removeSelf();
        }

        this.clearRuntimeRefs();
    }

    /**
     * 对象彻底销毁（不进入对象池）。
     * @param scene 所属场景
     */
    onDispose(scene: BaseScene): void {
        this.recycleSpaceHash();

        for (const module of this._modules) {
            if (module.onDetach) {
                module.onDetach(this);
            }
            module.onDispose();
        }

        if (this._model) {
            this._model.removeSelf();
            this._model.destroy();
            this._model = null;
        }

        this.clearRuntimeRefs();
    }

    /**
     * 兼容旧接口：后续代码应改用 onRecycle/onDispose。
     */
    onRelease(scene: BaseScene): void {
        this.onRecycle(scene);
    }

    // ========== 更新循环 ==========

    /**
     * 每帧更新
     * @param curTime 当前时间
     */
    update(curTime: number): void {
        if (this._isRelease) return;

        // 更新变换
        this._transform.update(curTime);

        // 静止对象跳过空间 hash 计算，强制刷新路径仍会直接调用 updateSpaceHash()。
        if (this._transform.getIsPosChange() || this._lastGridBounds) {
            this.updateSpaceHash();
        }

        // 子类更新
        this.callModuleOwnerUpdate(curTime);
        this.onUpdate(curTime);
    }

    /**
     * 延迟更新（位置确认）
     * @param curTime 当前时间
     */
    lateUpdate(curTime: number): void {
        if (this._isRelease) return;

        // 确认位置（将 Transform 应用到显示对象）
        this.confirmPos();
        
        // 子类延迟更新
        this.callModuleOwnerLateUpdate(curTime);
        this.onLateUpdate(curTime);
    }

    /**
     * 固定间隔更新
     * @param curTime 当前时间
     */
    fixedUpdate(curTime: number): void {
        if (this._isRelease) return;

        this.callModuleOwnerFixedUpdate(curTime);
        this.onFixedUpdate(curTime);
    }

    /**
     * 子类每帧更新（可选重写）
     */
    protected onUpdate(curTime: number): void {}

    /**
     * 子类延迟更新（可选重写）
     */
    protected onLateUpdate(curTime: number): void {}

    /**
     * 子类固定间隔更新（可选重写）
     */
    protected onFixedUpdate(curTime: number): void {}

    // ========== 位置管理 ==========

    /**
     * 确认位置（将 Transform 应用到显示对象）
     * 简化版：直接使用屏幕坐标，不依赖 TiledMap
     */
    protected confirmPos(): void {
        if (!this._model) return;

        // 位置变化
        if (this._transform.getIsPosChange()) {
            this._model.pos(
                this._transform.x + this._transform.getOffsetX(),
                this._transform.y + this._transform.getOffsetY() + this._zOffset
            );
            this._transform.resetPosChange();
            this.onConfirmPos();
            this.callModuleOwnerConfirmPos();
        }

        // 角度变化
        if (this._transform.getIsAngleChange()) {
            this._model.rotation = this._transform.angle;
            this._transform.resetAngleChange();
        }
    }

    /**
     * 位置确认后的回调（可选重写）
     */
    protected onConfirmPos(): void {}

    // ========== 工具方法 ==========

    /** 获取唯一 ID */
    get uid(): number { return this._uid; }

    get configId(): number { return this._cfgId; }

    /** 获取是否已释放 */
    get isRelease(): boolean { return this._isRelease; }

    /** 获取是否允许缓存复用 */
    get cacheable(): boolean { return this._cacheable; }

    /** 获取是否死亡 */
    get isDead(): boolean { return this._isDead; }

    /** 获取队伍 ID */
    get team(): number { return this._teamId; }

    /** 获取所属场景 */
    get scene(): BaseScene | null { return this._scene; }

    /** 获取显示对象 */
    get model(): Laya.Sprite | null { return this._model; }

    /** 获取 X 坐标 */
    get x(): number { return this._transform.x; }

    /** 获取 Y 坐标 */
    get y(): number { return this._transform.y; }

    /** 获取角度 */
    get angle(): number { return this._transform.angle; }

    /** 获取碰撞范围 */
    get range(): number { return this._range; }

    /** 获取显示高度偏移 */
    get zOffset(): number { return this._zOffset; }

    /** 是否参与碰撞空间切割 */
    get hasCollisionBox(): boolean { return this._hasCollisionBox; }

    /** 获取位置 */
    getPos(): Laya.Point {
        return this._transform.getPos();
    }

    /** 设置位置 */
    setPos(x: number, y: number): void {
        this._transform.setPos(x, y);
    }

    /** 设置角度 */
    setAngle(angle: number): void {
        this._transform.setAngle(angle);
    }

    /** 设置是否允许缓存复用 */
    setCacheable(value: boolean): void {
        this._cacheable = value;
    }

    /** 设置默认显示层 */
    setDisplayLayer(layerType: SceneLayerType): void {
        this._displayLayerType = layerType;
        if (this._model) {
            this.addModelToScene(this._model, layerType);
        }
    }

    /** 设置显示高度偏移 */
    setZOffset(value: number): void {
        if (this._zOffset === value) return;
        this._zOffset = value;
        this._transform.forceUpdate();
    }

    /** 设置碰撞范围 */
    setRange(range: number): void {
        this._range = range;
        if (this._hasCollisionBox) {
            this.setCollisionBoxEnabled(range > 0);
        }
    }

    /** 设置碰撞盒半径，并让对象参与空间切割 */
    setCollisionBox(range: number): void {
        this._range = range;
        this.setCollisionBoxEnabled(range > 0);
    }

    /** 设置是否参与空间切割；关闭时会立即从空间表移除 */
    setCollisionBoxEnabled(enabled: boolean): void {
        this._hasCollisionBox = enabled;

        if (!enabled) {
            if (this._spaceManager && this._lastGridBounds) {
                this._spaceManager.removeObjectHash(this._uid, this._lastGridBounds);
                this._lastGridBounds = null;
            }
            return;
        }

        this.updateSpaceHash();
    }

    // ========== 碰撞与伤害 ==========

    /**
     * 碰撞回调
     */
    onCollision(): void {}

    /**
     * 受到伤害
     * @param casterId 造成伤害的对象 ID
     * @param damage 伤害值
     */
    getDamage(casterId: number, damage: number): void {}

    /**
     * 获取造成伤害者 ID（子弹等对象可能需要重写）
     */
    getCasterId(): number {
        return this._uid;
    }

    /**
     * 获取类名（用于对象池）
     */
    getClassName(): string {
        return this.constructor.name;
    }

    /**
     * 将显示对象挂到场景层级。
     */
    protected addModelToScene(model: Laya.Sprite, layerType: SceneLayerType = this._displayLayerType): void {
        this._model = model;
        model.visible = true;
        const layer = this._scene ? this._scene.getSafeLayer(layerType) : null;
        if (!this._scene || !layer) {
            console.error(`[${this.constructor.name}] addModelToScene failed: missing scene or layer. uid=${this._uid}, layerType=${layerType}`);
            model.visible = false;
            model.removeSelf();
            return;
        }

        layer.addChild(model);
        this._transform.forceUpdate();
    }

    /**
     * 添加跟随对象一起缓存的功能模块。
     */
    addModule(module: ISceneObjModule): void {
        if (this._modules.indexOf(module) !== -1) return;
        this._modules.push(module);
        if (module.onAttach) {
            module.onAttach(this);
        }
    }

    /**
     * 获取指定类型的功能模块。
     */
    getModule<T extends ISceneObjModule>(moduleClass: new (...args: any[]) => T): T | null {
        for (const module of this._modules) {
            if (module instanceof moduleClass) {
                return module;
            }
        }

        return null;
    }

    /**
     * 是否拥有指定类型的功能模块。
     */
    hasModule<T extends ISceneObjModule>(moduleClass: new (...args: any[]) => T): boolean {
        return this.getModule(moduleClass) !== null;
    }

    /**
     * 移除指定类型的功能模块，并执行彻底清理。
     */
    removeModule<T extends ISceneObjModule>(moduleClass: new (...args: any[]) => T): T | null {
        for (let i = 0; i < this._modules.length; i++) {
            const module = this._modules[i];
            if (module instanceof moduleClass) {
                this._modules.splice(i, 1);
                if (module.onDetach) {
                    module.onDetach(this);
                }
                module.onDispose();
                return module;
            }
        }

        return null;
    }

    private recycleSpaceHash(): void {
        if (this._spaceManager && this._lastGridBounds) {
            this._spaceManager.removeObjectHash(this._uid, this._lastGridBounds);
            this._lastGridBounds = null;
        }
    }

    private clearRuntimeRefs(): void {
        this._isRelease = true;
        this._isDead = true;
        this._uid = 0;
        this._cfgId = 0;
        this._teamId = 0;
        this._scene = null;
        this._spaceManager = null;
        this._hasCollisionBox = false;
        this._range = 0;
        this._zOffset = 0;
    }

    private callModuleOwnerInit(): void {
        for (const module of this._modules) {
            if (module.onOwnerInit) {
                module.onOwnerInit(this);
            }
        }
    }

    private callModuleOwnerUpdate(curTime: number): void {
        for (const module of this._modules) {
            if (module.onOwnerUpdate) {
                module.onOwnerUpdate(this, curTime);
            }
        }
    }

    private callModuleOwnerLateUpdate(curTime: number): void {
        for (const module of this._modules) {
            if (module.onOwnerLateUpdate) {
                module.onOwnerLateUpdate(this, curTime);
            }
        }
    }

    private callModuleOwnerFixedUpdate(curTime: number): void {
        for (const module of this._modules) {
            if (module.onOwnerFixedUpdate) {
                module.onOwnerFixedUpdate(this, curTime);
            }
        }
    }

    private callModuleOwnerConfirmPos(): void {
        for (const module of this._modules) {
            if (module.onOwnerConfirmPos) {
                module.onOwnerConfirmPos(this);
            }
        }
    }

    // ========== 空间哈希（代理模式） ==========

    /**
     * 更新空间哈希（代理模式核心方法）
     * 在每帧 update() 中调用
     */
    protected updateSpaceHash(): void {
        if (!this._spaceManager || !this._spaceManager.isEnabled()) {
            return;
        }

        if (!this._hasCollisionBox || this._range <= 0) {
            if (this._lastGridBounds) {
                this._spaceManager.removeObjectHash(this._uid, this._lastGridBounds);
                this._lastGridBounds = null;
            }
            return;
        }

        // 计算新的网格边界
        const newBounds = this._spaceManager.calcGridBounds(this.x, this.y, this._range);

        // 边界对比（O(1) 固定比较）
        if (this._lastGridBounds) {
            if (newBounds.lx === this._lastGridBounds.lx &&
                newBounds.rx === this._lastGridBounds.rx &&
                newBounds.ty === this._lastGridBounds.ty &&
                newBounds.by === this._lastGridBounds.by) {
                return;  // 边界未变，无需更新
            }
        }

        // 边界变化，更新管理器
        this._spaceManager.updateObjectHash(this._uid, this._lastGridBounds, newBounds);
        this._lastGridBounds = newBounds;
    }

    /**
     * 获取上次网格边界（用于调试）
     */
    getLastGridBounds(): { lx: number, rx: number, ty: number, by: number } | null {
        return this._lastGridBounds;
    }

    /**
     * 强制刷新空间哈希。
     * 场景空间参数变化后需要调用，避免旧边界相同而跳过重建。
     */
    refreshSpaceHash(): void {
        this._lastGridBounds = null;
        this.updateSpaceHash();
    }

    /**
     * 重新绑定空间分割管理器。
     * 场景缓存恢复或空间表兜底重建后调用。
     */
    rebindSpaceManager(scene: BaseScene): void {
        this._scene = scene;
        this._lastGridBounds = null;
        this._spaceManager = scene.getSpaceManager(this._teamId);
        this.updateSpaceHash();
    }
}
