import Point = Laya.Point;
import MathUtils  from "../utils/MathUtils";

export default class Transform2D {
    private _pos: Point;
    private _forward: Point;
    private _angle: number; //绕y轴
    private _offsetX: number;
    private _offsetY: number;
    private _angleSpeed: number; //每秒转动速度
    private _isPosChange: boolean;
    private _isAngleChange: boolean;
    private _isTurning: boolean;
    private _lastUpdateTime: number;
    private _targetAngle: number;
    private _turnLeft: number;
    private _startAngle: number;
    private _deltaAngle: number;
    private _startTurnTime: number;

    private static readonly deltaTime: number = 0.033;

    constructor() {
        this._pos = Laya.Point.create();
        this._pos.setTo(0, 0);
        this._forward = Laya.Point.create();
        this._forward.setTo(1, 0);
        this._angle = 0;
        this._offsetX = 0;
        this._offsetY = 0;
        this._angleSpeed = 90;
        this._isPosChange = true;
        this._isAngleChange = true;
        this._isTurning = false;
        this._lastUpdateTime = -1;
    }

    public get angle(): number {
        return this._angle;
    }

    public get targetAngle(): number {
        return this._targetAngle;
    }

    // Update -------------------------------
    public update(curTime: number): void {
        if (curTime - this._lastUpdateTime < Transform2D.deltaTime) {
            return;
        }

        this.updateAngleTween(curTime);

        this._lastUpdateTime = curTime;
    }

    // 物体缓慢转动，每秒转动angleSpeed
    private updateAngleTween(curTime: number): void {
        if (this._isTurning == false) {
            return;
        }

        let changeAngle: number = (curTime - this._startTurnTime) * this._angleSpeed * 0.001;
        if (changeAngle < 0) {
            return;
        }

        if (changeAngle >= this._deltaAngle) {
            changeAngle = this._deltaAngle;
            this._isTurning = false;
        }

        let newAngle: number = this._startAngle + this._turnLeft * changeAngle;

        this.setAngle(newAngle);
    }

    // 设置物体缓慢转动
    public turnToAngle(targetAngle: number, curTime?: number): void {
        targetAngle = Math.floor(targetAngle + 0.5);
        targetAngle = targetAngle % 360;

        if (this._targetAngle == targetAngle && this._isTurning == true) {
            return;
        }

        if (this._angle == targetAngle && this._isTurning == false) {
            return;
        }

        //确定转动角度 转动方向(左1右-1)
        this._targetAngle = targetAngle;
        this._turnLeft = 1;
        this._startAngle = this._angle;
        this._deltaAngle = this._targetAngle - this._startAngle;

        if (this._deltaAngle < -180) {
            this._deltaAngle = 360 + this._deltaAngle;
        } else if (this._deltaAngle < 0) {
            this._deltaAngle = Math.abs(this._deltaAngle);
            this._turnLeft = -1;
        } else if (this._deltaAngle > 180) {
            this._deltaAngle = 360 - this._deltaAngle;
            this._turnLeft = -1;
        }

        this._startTurnTime = curTime;
        this._isTurning = true;
    }

    // 仅angle平面缓慢转动
    public turnToDirection(x:number, y:number, curTime?: number): void {
        if (MathUtils.squareLen(x, y) < 0.00001) {
            return;
        }

        let targetAngle: number = MathUtils.deg(Math.atan2(y, x));
        this.turnToAngle(targetAngle, curTime);
    }

    // Set ----------------------------------
    public setPos(x:number, y:number)
    {
        if (Math.abs(this._pos.x - x) > 0.0001 || Math.abs(this._pos.y - y) > 0.0001) {
            this._pos.setTo(x, y);
            this._isPosChange = true;
        }
    }

    public setAngle(angle: number): void {
        //四舍五入
        angle = Math.floor(angle + 0.5);
        angle = angle % 360;

        if (this._angle != angle) {
            this._angle = angle;
            this._forward.x = MathUtils.cos(angle);
            this._forward.y = MathUtils.sin(angle);

            this._isAngleChange = true;
        }
    }

    public setDir(v: Point): void {
        let x: number = v.x;
        let y: number = v.y;

        if (MathUtils.squareLen(x, y) < 0.00001) {
            return;
        }

        let angle: number = MathUtils.deg(Math.atan2(y, x));
        this.setAngle(angle);
    }

    public pointTo(x: number, y: number): void {
        let dir: Point = Point.create();
        dir.setTo(x - this._pos.x, y - this._pos.y);
        this.setDir(dir);
        dir.recover();
    }

    public setOffsetX(offsetX: number): void {
        if (this._offsetX != offsetX) {
            this._offsetX = offsetX;
            this._isPosChange = true;
        }
    }

    public setOffsetY(offsetY: number): void {
        if (this._offsetY != offsetY) {
            this._offsetY = offsetY;
            this._isPosChange = true;
        }
    }

    public setAngleSpeed(angleSpeed: number): void {
        this._angleSpeed = angleSpeed;
    }

    public resetPosChange(): void {
        this._isPosChange = false;
    }

    public resetAngleChange(): void {
        this._isAngleChange = false;
    }

    // Get ----------------------------------
    public getPos(): Point {
        let ret = Point.create();
        ret.setTo(this._pos.x, this._pos.y);
        return ret;
    }

    public getAngle(): number {
        return this._angle;
    }

    public getForward(): Point {
        let ret = Point.create();
        ret.setTo(this._forward.x, this._forward.y);
        return ret;
    }

    public getOffsetX(): number {
        return this._offsetX;
    }

    public getOffsetY(): number {
        return this._offsetY;
    }

    public getIsPosChange(): boolean {
        return this._isPosChange;
    }

    public getIsAngleChange(): boolean {
        return this._isAngleChange;
    }

    public get x(): number {
        return this._pos.x;
    }

    public get y(): number {
        return this._pos.y;
    }

    public forceUpdate(): void {
        this._isAngleChange = true;
        this._isPosChange = true;
    }
}
