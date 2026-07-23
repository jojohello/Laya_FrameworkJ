/**
 * 2D 变换组件
 * 管理场景对象的位置、角度、方向等
 * 
 * 功能：
 * - 位置管理 (x, y)
 * - 角度管理 (angle)
 * - 方向向量 (forward)
 * - 转动动画 (turnToAngle)
 * - 变化检测 (isPosChange, isAngleChange)
 */
export class Transform2D {
    // ========== 属性 ==========

    /** 位置 */
    private _pos: Laya.Point;

    /** 前方向 */
    private _forward: Laya.Point;

    /** 角度（度） */
    private _angle: number = 0;

    /** X 坐标偏移 */
    private _offsetX: number = 0;

    /** Y 坐标偏移 */
    private _offsetY: number = 0;

    /** 转动速度（度/秒） */
    private _angleSpeed: number = 90;

    /** 位置是否变化 */
    private _isPosChange: boolean = true;

    /** 角度是否变化 */
    private _isAngleChange: boolean = true;

    // ========== 转动动画 ==========

    /** 是否正在转动 */
    private _isTurning: boolean = false;

    /** 目标角度 */
    private _targetAngle: number = 0;

    /** 转动方向（左1，右-1） */
    private _turnLeft: number = 1;

    /** 起始角度 */
    private _startAngle: number = 0;

    /** 转动角度差 */
    private _deltaAngle: number = 0;

    /** 开始转动时间 */
    private _startTurnTime: number = 0;

    /** 上次更新时间 */
    private _lastUpdateTime: number = -1;

    /** 固定更新间隔 */
    private static readonly deltaTime: number = 0.033;

    constructor() {
        this._pos = Laya.Point.create();
        this._pos.setTo(0, 0);
        this._forward = Laya.Point.create();
        this._forward.setTo(1, 0);
    }

    // ========== 更新 ==========

    /**
     * 每帧更新
     * @param curTime 当前时间
     */
    update(curTime: number): void {
        if (curTime - this._lastUpdateTime < Transform2D.deltaTime) {
            return;
        }

        // 更新转动动画
        this.updateAngleTween(curTime);

        this._lastUpdateTime = curTime;
    }

    /**
     * 更新转动动画
     */
    private updateAngleTween(curTime: number): void {
        if (!this._isTurning) return;

        let changeAngle = (curTime - this._startTurnTime) * this._angleSpeed;
        if (changeAngle < 0) return;

        if (changeAngle >= this._deltaAngle) {
            changeAngle = this._deltaAngle;
            this._isTurning = false;
        }

        const newAngle = this._startAngle + this._turnLeft * changeAngle;
        this.setAngle(newAngle);
    }

    /**
     * 设置目标角度（缓慢转动）
     * @param targetAngle 目标角度
     * @param curTime 当前时间
     */
    turnToAngle(targetAngle: number, curTime?: number): void {
        targetAngle = Math.floor(targetAngle + 0.5);
        targetAngle = targetAngle % 360;

        if (this._targetAngle === targetAngle && this._isTurning) return;
        if (this._angle === targetAngle && !this._isTurning) return;

        this._targetAngle = targetAngle;
        this._turnLeft = 1;
        this._startAngle = this._angle;
        this._deltaAngle = this._targetAngle - this._startAngle;

        // 计算转动方向
        if (this._deltaAngle < -180) {
            this._deltaAngle = 360 + this._deltaAngle;
        } else if (this._deltaAngle < 0) {
            this._deltaAngle = Math.abs(this._deltaAngle);
            this._turnLeft = -1;
        } else if (this._deltaAngle > 180) {
            this._deltaAngle = 360 - this._deltaAngle;
            this._turnLeft = -1;
        }

        this._startTurnTime = curTime || 0;
        this._isTurning = true;
    }

    /**
     * 朝向指定方向
     * @param x 方向 X
     * @param y 方向 Y
     * @param curTime 当前时间
     */
    turnToDirection(x: number, y: number, curTime?: number): void {
        if (this.squareLen(x, y) < 0.00001) return;
        const targetAngle = this.deg(Math.atan2(y, x));
        this.turnToAngle(targetAngle, curTime);
    }

    // ========== 设置 ==========

    /**
     * 设置位置
     */
    setPos(x: number, y: number): void {
        if (Math.abs(this._pos.x - x) > 0.0001 || Math.abs(this._pos.y - y) > 0.0001) {
            this._pos.setTo(x, y);
            this._isPosChange = true;
        }
    }

    /**
     * 设置角度
     */
    setAngle(angle: number): void {
        angle = Math.floor(angle + 0.5);
        angle = angle % 360;

        if (this._angle !== angle) {
            this._angle = angle;
            this._forward.x = this.cos(angle);
            this._forward.y = this.sin(angle);
            this._isAngleChange = true;
        }
    }

    /**
     * 设置方向向量
     */
    setDir(v: Laya.Point): void {
        if (this.squareLen(v.x, v.y) < 0.00001) return;
        const angle = this.deg(Math.atan2(v.y, v.x));
        this.setAngle(angle);
    }

    /**
     * 指向目标点
     */
    pointTo(x: number, y: number): void {
        const dir = Laya.Point.create();
        dir.setTo(x - this._pos.x, y - this._pos.y);
        this.setDir(dir);
        dir.recover();
    }

    /**
     * 设置 X 偏移
     */
    setOffsetX(offsetX: number): void {
        if (this._offsetX !== offsetX) {
            this._offsetX = offsetX;
            this._isPosChange = true;
        }
    }

    /**
     * 设置 Y 偏移
     */
    setOffsetY(offsetY: number): void {
        if (this._offsetY !== offsetY) {
            this._offsetY = offsetY;
            this._isPosChange = true;
        }
    }

    /**
     * 设置转动速度
     */
    setAngleSpeed(angleSpeed: number): void {
        this._angleSpeed = angleSpeed;
    }

    /**
     * 重置位置变化标记
     */
    resetPosChange(): void {
        this._isPosChange = false;
    }

    /**
     * 重置角度变化标记
     */
    resetAngleChange(): void {
        this._isAngleChange = false;
    }

    /**
     * 强制更新标记
     */
    forceUpdate(): void {
        this._isAngleChange = true;
        this._isPosChange = true;
    }

    // ========== 获取 ==========

    /** 获取位置 */
    getPos(): Laya.Point {
        const ret = Laya.Point.create();
        ret.setTo(this._pos.x, this._pos.y);
        return ret;
    }

    /** 获取角度 */
    getAngle(): number {
        return this._angle;
    }

    /** 获取前方向 */
    getForward(): Laya.Point {
        const ret = Laya.Point.create();
        ret.setTo(this._forward.x, this._forward.y);
        return ret;
    }

    /** 获取 X 坐标 */
    get x(): number {
        return this._pos.x;
    }

    /** 获取 Y 坐标 */
    get y(): number {
        return this._pos.y;
    }

    /** 获取 X 坐标偏移 */
    getOffsetX(): number {
        return this._offsetX;
    }

    /** 获取 Y 坐标偏移 */
    getOffsetY(): number {
        return this._offsetY;
    }

    /** 获取位置是否变化 */
    getIsPosChange(): boolean {
        return this._isPosChange;
    }

    /** 获取角度是否变化 */
    getIsAngleChange(): boolean {
        return this._isAngleChange;
    }

    /** 获取目标角度 */
    get targetAngle(): number {
        return this._targetAngle;
    }

    /** 获取角度 */
    get angle(): number {
        return this._angle;
    }

    // ========== 数学工具 ==========

    /**
     * 计算向量长度平方
     */
    private squareLen(x: number, y: number): number {
        return x * x + y * y;
    }

    /**
     * 弧度转角度
     */
    private deg(rad: number): number {
        return rad * 180 / Math.PI;
    }

    /**
     * 角度转弧度
     */
    private rad(deg: number): number {
        return deg * Math.PI / 180;
    }

    /**
     * cos（角度输入）
     */
    private cos(angle: number): number {
        return Math.cos(this.rad(angle));
    }

    /**
     * sin（角度输入）
     */
    private sin(angle: number): number {
        return Math.sin(this.rad(angle));
    }
}
