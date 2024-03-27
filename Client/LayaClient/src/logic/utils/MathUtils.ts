 export default class MathUtils{
    
    
    public static deg(radian: number): number {
        return radian * 180 / Math.PI;
    }

    public static squareLen(x:number, y:number) : number{
        return x * x + y * y;
    }
    
    //向量除数，规避div = 0
    public static vectorDiv(x: number, y: number, div:number): [number, number]{
        if (div > 1e-5 || div < -1e-5) {
            return [x / div, y / div];
        }
        return [0, 0];
    }
    
    //二维叉积（新向量，与原向量垂直，非标量）
    public static cross2D(x1: number, y1: number): [number, number] {
        let top = 1;// top = {-1,1}
        return [y1 * top, -x1 * top];
    }
    
    //点积
    public static dot(x1: number, y1: number, x2: number, y2: number) {
         return x1 * x2 + y1 * y2;
    }
     
    //平方距离
    public static squareDis(x1: number, y1: number, x2: number, y2: number) {
        return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    }
    
    public static distance(x1: number, y1: number, x2: number, y2: number) {
        return Math.sqrt(this.squareDis(x1, y1, x2, y2));
    }

    public static lerp(a:number, b:number, rate:number){
        return a + (b - a) * rate;
    }
     
    private static sinCache:Map<number, number> = new Map<number, number>();
    public static sin(a):number{
	    if (this.sinCache.has(a) == false) {
            this.sinCache.set(a, Math.sin(Math.sin(a)));
        }

	    return this.sinCache.get[a]
    }

    private static cosCache:Map<number, number> = new Map<number, number>();
    public static cos(a):number{
        if (this.cosCache.has(a) == false) {
            this.cosCache.set(a, Math.cos(Math.cos(a)));
        }

        return this.cosCache.get[a]
    }

    /** 获取随机数 */
     public static random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min)
     

     // 直线碰撞检测
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

     public static collisionTrailBatchReady(sx: number, sy: number, ex: number, ey: number, range: number):void {
         let fx:number = ex - sx;
         let fy:number = ey - sy;
         let len: number = this.squareLen(fx, fy);

         this._needSearchLine = true;
         if (len < 1) {
             this._needSearchLine = false;
         }

         if (this._needSearchLine) {
             len = Math.sqrt(len);
             [fx, fy] = this.vectorDiv(fx, fy, len);
             let [rightX, rightY] = this.cross2D(fx, fy);

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
     }
     
     public static collisionTrailBatch(ex: number, ey: number, range: number, objX: number, objY: number, objRange: number): boolean{
         let isAdd: boolean = false;

         if (this._needSearchLine) {
             let _AM_X: number = objX - this._A_X;
             let _AM_Y: number = objY - this._A_Y;
             let _BM_X: number = objX - this._B_X;
             let _BM_Y: number = objY - this._B_Y;

             let dotABAM: number = this.dot(this._AB_X, this._AB_Y, _AM_X, _AM_Y);
             let dotBCBM: number = this.dot(this._BC_X, this._BC_Y, _BM_X, _BM_Y);

             let squareX: number = 0;
             let squareY: number = 0;

             if (dotABAM < 0) {
                 squareX = dotABAM * dotABAM / this.dotABAB;
             }
             else if (dotABAM > this.dotABAB) {
                squareX = dotABAM * dotABAM / this.dotABAB - 2 * dotABAM + this.dotABAB;
             }
             else {
                 squareX = 0;
             }

             if (dotBCBM < 0) {
                 squareY = dotBCBM * dotBCBM / this.dotBCBC;
             }
             else if (dotBCBM > this.dotBCBC) {
                squareY = dotBCBM * dotBCBM / this.dotBCBC - 2 * dotBCBM + this.dotBCBC;
             }
             else {
                 squareY = 0;
             }

             if (squareX + squareY <= objRange * objRange) {
                 isAdd = true;
             }
         }

         if (!isAdd) {
             let dx: number = objX - ex;
             let dy: number = objY - ey;

             if (this.squareLen(dx, dy) <= (range + objRange) * (range + objRange)) {
                 isAdd = true;
             }
         }

         return isAdd;
     }
 }