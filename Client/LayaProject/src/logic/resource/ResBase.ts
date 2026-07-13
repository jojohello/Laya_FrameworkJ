/**
 * 资源抽象基类
 * 所有资源类型都应继承此类
 */
export abstract class ResBase {
    protected _url: string;
    protected _x: number = 0;
    protected _y: number = 0;
    protected _scaleX: number = 1;
    protected _scaleY: number = 1;
    protected _node: Laya.Node | null = null;

    constructor(url: string) {
        this._url = url;
    }

    get url(): string {
        return this._url;
    }

    get node(): Laya.Node | null {
        return this._node;
    }

    /**
     * 构建资源（加载并实例化）
     * 子类必须实现此方法
     */
    abstract buildRes(): Promise<void>;

    /**
     * 回收到对象池（不销毁，只是隐藏）
     * 子类必须实现此方法
     */
    abstract onRecycle(): void;

    /**
     * 彻底销毁资源
     * 子类必须实现此方法
     */
    abstract onDispose(): void;

    /**
     * 设置父节点
     */
    setParent(parent: Laya.Node): void {
        if (this._node) {
            parent.addChild(this._node);
        }
    }

    /**
     * 设置位置
     */
    pos(x: number, y: number): void {
        this._x = x;
        this._y = y;
        if (this._node) {
            // 使用 Sprite 的 pos 方法（Node 没有 pos 方法）
            const sprite = this._node as Laya.Sprite;
            if (sprite && typeof sprite.pos === 'function') {
                sprite.pos(x, y);
            }
        }
    }

    /**
     * 设置缩放
     */
    setScale(x: number, y: number): void {
        this._scaleX = x;
        this._scaleY = y;
        if (this._node) {
            (this._node as any).scale(x, y);
        }
    }

    /**
     * 初始化变换（在 buildRes 后调用）
     */
    protected initTransform(): void {
        if (this._node) {
            // 使用 Sprite 的 pos 方法
            const sprite = this._node as Laya.Sprite;
            if (sprite && typeof sprite.pos === 'function') {
                sprite.pos(this._x, this._y);
            }
            if (typeof (sprite as any).scale === 'function') {
                (sprite as any).scale(this._scaleX, this._scaleY);
            }
        }
    }
}
