/**
 * 数学工具类
 * 提供向量计算、距离计算、碰撞检测等数学方法
 * 
 * 功能：
 * - 基础计算：deg, squareLen, squareDis, distance, lerp
 * - 三角函数缓存：sin, cos（减少重复计算）
 * - 碰撞检测：直线碰撞（子弹轨迹）
 * - 工具方法：random, vectorDiv, cross2D, dot
 */
export class MathUtils {
    // ========== 基础计算 ==========

    /**
     * 弧度转角度
     */
    public static deg(radian: number): number {
        return radian * 180 / Math.PI;
    }

    /**
     * 角度转弧度
     */
    public static rad(deg: number): number {
        return deg * Math.PI / 180;
    }

    /**
     * 向量长度平方
     */
    public static squareLen(x: number, y: number): number {
        return x * x + y * y;
    }

    /**
     * 平方距离
     */
    public static squareDis(x1: number, y1: number, x2: number, y2: number): number {
        return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    }

    /**
     * 距离
     */
    public static distance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(this.squareDis(x1, y1, x2, y2));
    }

    /**
     * 线性插值
     */
    public static lerp(a: number, b: number, rate: number): number {
        return a + (b - a) * rate;
    }

    /**
     * 获取随机整数 [min, max]
     */
    public static random(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // ========== 向量计算 ==========

    /**
     * 向量除法（规避 div = 0）
     */
    public static vectorDiv(x: number, y: number, div: number): [number, number] {
        if (div > 1e-5 || div < -1e-5) {
            return [x / div, y / div];
        }
        return [0, 0];
    }

    /**
     * 二维叉积（返回与原向量垂直的新向量）
     */
    public static cross2D(x: number, y: number): [number, number] {
        const top = 1;
        return [y * top, -x * top];
    }

    /**
     * 点积
     */
    public static dot(x1: number, y1: number, x2: number, y2: number): number {
        return x1 * x2 + y1 * y2;
    }

    // ========== 三角函数缓存 ==========

    private static sinCache: Map<number, number> = new Map();
    private static cosCache: Map<number, number> = new Map();

    /**
     * sin（角度输入，使用缓存）
     */
    public static sin(a: number): number {
        const d = Math.floor(a + 0.5);
        if (!this.sinCache.has(d)) {
            this.sinCache.set(d, Math.sin(d * Math.PI / 180));
        }
        return this.sinCache.get(d)!;
    }

    /**
     * cos（角度输入，使用缓存）
     */
    public static cos(a: number): number {
        const d = Math.floor(a + 0.5);
        if (!this.cosCache.has(d)) {
            this.cosCache.set(d, Math.cos(d * Math.PI / 180));
        }
        return this.cosCache.get(d)!;
    }

    /**
     * 清空三角函数缓存（可选）
     */
    public static clearCache(): void {
        this.sinCache.clear();
        this.cosCache.clear();
    }

    // ========== 直线碰撞检测（子弹轨迹） ==========

    private static _needSearchLine: boolean = false;

    private static _A_X: number = 0;
    private static _A_Y: number = 0;
    private static _B_X: number = 0;
    private static _B_Y: number = 0;
    private static _C_X: number = 0;
    private static _C_Y: number = 0;
    private static _AB_X: number = 0;
    private static _AB_Y: number = 0;
    private static _BC_X: number = 0;
    private static _BC_Y: number = 0;

    private static dotABAB: number = 0;
    private static dotBCBC: number = 0;

    /**
     * 直线碰撞检测准备
     * 用于检测子弹轨迹上的碰撞
     * 
     * @param sx 起点 X
     * @param sy 起点 Y
     * @param ex 终点 X
     * @param ey 终点 Y
     * @param range 碰撞范围（子弹宽度的一半）
     */
    public static collisionTrailBatchReady(sx: number, sy: number, ex: number, ey: number, range: number): void {
        let fx = ex - sx;
        let fy = ey - sy;
        let len = this.squareLen(fx, fy);

        this._needSearchLine = true;
        if (len < 1) {
            this._needSearchLine = false;
            return;
        }

        len = Math.sqrt(len);
        [fx, fy] = this.vectorDiv(fx, fy, len);
        const [rightX, rightY] = this.cross2D(fx, fy);

        // 构建碰撞检测矩形（子弹轨迹）
        this._A_X = sx + rightX * range;
        this._A_Y = sy + rightY * range;
        this._B_X = sx + rightX * -range;
        this._B_Y = sy + rightY * -range;
        this._C_X = this._B_X + fx * len;
        this._C_Y = this._B_Y + fy * len;

        this._AB_X = this._B_X - this._A_X;
        this._AB_Y = this._B_Y - this._A_Y;
        this._BC_X = this._C_X - this._B_X;
        this._BC_Y = this._C_Y - this._B_Y;

        this.dotABAB = this.squareLen(this._AB_X, this._AB_Y);
        this.dotBCBC = this.squareLen(this._BC_X, this._BC_Y);
    }

    /**
     * 直线碰撞检测（批量）
     * 用于检测目标是否在子弹轨迹上
     * 
     * @param ex 终点 X
     * @param ey 终点 Y
     * @param range 碰撞范围（子弹）
     * @param objX 目标 X
     * @param objY 目标 Y
     * @param objRange 目标碰撞范围
     * @returns 是否碰撞
     */
    public static collisionTrailBatch(ex: number, ey: number, range: number, objX: number, objY: number, objRange: number): boolean {
        let isAdd = false;

        // 直线碰撞检测
        if (this._needSearchLine) {
            const _AM_X = objX - this._A_X;
            const _AM_Y = objY - this._A_Y;
            const _BM_X = objX - this._B_X;
            const _BM_Y = objY - this._B_Y;

            const dotABAM = this.dot(this._AB_X, this._AB_Y, _AM_X, _AM_Y);
            const dotBCBM = this.dot(this._BC_X, this._BC_Y, _BM_X, _BM_Y);

            let squareX = 0;
            let squareY = 0;

            if (dotABAM < 0) {
                squareX = dotABAM * dotABAM / this.dotABAB;
            } else if (dotABAM > this.dotABAB) {
                squareX = dotABAM * dotABAM / this.dotABAB - 2 * dotABAM + this.dotABAB;
            } else {
                squareX = 0;
            }

            if (dotBCBM < 0) {
                squareY = dotBCBM * dotBCBM / this.dotBCBC;
            } else if (dotBCBM > this.dotBCBC) {
                squareY = dotBCBM * dotBCBM / this.dotBCBC - 2 * dotBCBM + this.dotBCBC;
            } else {
                squareY = 0;
            }

            if (squareX + squareY <= objRange * objRange) {
                isAdd = true;
            }
        }

        // 终点圆形碰撞检测（兜底）
        if (!isAdd) {
            const dx = objX - ex;
            const dy = objY - ey;

            if (this.squareLen(dx, dy) <= (range + objRange) * (range + objRange)) {
                isAdd = true;
            }
        }

        return isAdd;
    }

    // ========== 圆形碰撞检测 ==========

    /**
     * 圆形碰撞检测
     * 
     * @param x1 圆心1 X
     * @param y1 圆心1 Y
     * @param r1 半径1
     * @param x2 圆心2 X
     * @param y2 圆心2 Y
     * @param r2 半径2
     * @returns 是否碰撞
     */
    public static circleCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    }

    /**
     * 圆形碰撞检测（平方距离版本，避免 sqrt）
     */
    public static circleCollisionSquare(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
        const sqrDis = this.squareDis(x1, y1, x2, y2);
        const sqrRange = (r1 + r2) * (r1 + r2);
        return sqrDis <= sqrRange;
    }
}
