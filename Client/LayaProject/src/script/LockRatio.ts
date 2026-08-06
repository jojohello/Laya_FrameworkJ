const { regClass } = Laya;

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
        this.owner?.off(Laya.Event.LOADED, this, this._onTextureLoaded);
    }

    onDestroy(): void {
        Laya.stage.off(Laya.Event.RESIZE, this, this._onScreenResize);
        this.owner?.off(Laya.Event.LOADED, this, this._onTextureLoaded);
    }

    // 公共接口也使用_开头
    public _refreshSize(): void {
        this._adjustImageSize();
    }

    public _setOriginalSize(width: number, height: number): void {
        this._originalWidth = width;
        this._originalHeight = height;
        this._adjustImageSize();
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
    }

    private _cacheOriginalSize(): void {
        this._originalWidth = this.owner.width || 0;
        this._originalHeight = this.owner.height || 0;

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
        }
    }

    private _onScreenResize(): void {
        this._adjustImageSize();
    }

    private _adjustImageSize(): void {
        if (!this._isInitialized || this._originalWidth <= 0 || this._originalHeight <= 0) {
            return;
        }

        const container = this.owner.parent as Laya.Sprite | null;
        // Stage RESIZE can be dispatched before a serialized root has finished
        // resolving its edge anchors, so never let a stale parent size shrink the target.
        const targetWidth = Math.max(container?.width || 0, Laya.stage.width);
        const targetHeight = Math.max(container?.height || 0, Laya.stage.height);
        const scaleRatio = Math.max(
            targetWidth / this._originalWidth,
            targetHeight / this._originalHeight,
        );
        const newWidth = this._originalWidth * scaleRatio;
        const newHeight = this._originalHeight * scaleRatio;

        // Painted backgrounds must cover the viewport without non-uniform stretch.
        // Overflow is cropped symmetrically; focal art therefore stays in the center safe area.
        this.owner.size(newWidth, newHeight);
        this.owner.pos((targetWidth - newWidth) * 0.5, (targetHeight - newHeight) * 0.5);
    }
}
