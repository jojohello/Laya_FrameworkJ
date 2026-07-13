const { regClass, property } = Laya;

@regClass()
export class LockRatio extends Laya.Script {
    declare owner: Laya.GImage;

    // 所有成员变量使用_开头
    private _originalWidth: number = 0;
    private _originalHeight: number = 0;
    private _isInitialized: boolean = false;

    onAwake(): void {
        this._initComponent();
    }

    onEnable(): void {
        if (!this._isInitialized) {
            console.warn("LockRatio: 组件未正确初始化");
            return;
        }
        Laya.stage.on(Laya.Event.RESIZE, this, this._onScreenResize);
        this._adjustImageSize();
    }

    onDisable(): void {
        Laya.stage.off(Laya.Event.RESIZE, this, this._onScreenResize);
    }

    onDestroy(): void {
        Laya.stage.off(Laya.Event.RESIZE, this, this._onScreenResize);
    }

    // 公共接口也使用_开头
    public _refreshSize(): void {
        this._cacheOriginalSize();
        this._adjustImageSize();
    }

    public _setOriginalSize(width: number, height: number): void {
        this._originalWidth = width;
        this._originalHeight = height;
        this._adjustImageSize();
        console.log(`LockRatio: 设置原始尺寸 ${width}x${height}`);
    }

    public _getOriginalSize(): { width: number, height: number } {
        return {
            width: this._originalWidth,
            height: this._originalHeight
        };
    }

    // 私有方法
    private _initComponent(): void {
        if (!(this.owner instanceof Laya.GImage)) {
            console.error("LockRatio: 必须挂载在Image节点上");
            return;
        }

        this._cacheOriginalSize();
        this._isInitialized = true;
        console.log(`LockRatio: 初始化完成 ${this._originalWidth}x${this._originalHeight}`);
    }

    private _cacheOriginalSize(): void {
        // 优先使用当前设置的宽高
        this._originalWidth = this.owner.width || 0;
        this._originalHeight = this.owner.height || 0;

        console.log(`jojohello log LockRatio: 缓存原始尺寸 ${this._originalWidth}x${this._originalHeight}`);

        // 备选方案：从纹理获取
        if (this._originalWidth === 0 || this._originalHeight === 0) {
            this._handleTextureSize();
        }
    }

    private _handleTextureSize(): void {
        if (this.owner.texture) {
            this._originalWidth = this.owner.texture.width;
            this._originalHeight = this.owner.texture.height;
        } else {
            // 等待纹理加载
            this.owner.on(Laya.Event.LOADED, this, this._onTextureLoaded);
        }
    }

    private _onTextureLoaded(): void {
        if (this.owner.texture) {
            this._originalWidth = this.owner.texture.width;
            this._originalHeight = this.owner.texture.height;
            this._adjustImageSize();
            console.log(`LockRatio: 纹理加载完成 ${this._originalWidth}x${this._originalHeight}`);
        }
    }

    private _onScreenResize(): void {
        this._adjustImageSize();
    }

    private _adjustImageSize(): void {
        if (!this._isInitialized || this._originalWidth <= 0 || this._originalHeight <= 0) {
            return;
        }

        const screenWidth = Laya.stage.width;
        const scaleRatio = screenWidth / this._originalWidth;
        const newHeight = this._originalHeight * scaleRatio;

        this.owner.width = screenWidth;
        this.owner.height = newHeight;

        console.log(`LockRatio: 缩放至 ${screenWidth}x${newHeight.toFixed(1)} (${scaleRatio.toFixed(3)}x)`);
    }
}
